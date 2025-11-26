use std::time::{Duration, SystemTime};

use anyhow::{Context, anyhow};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use tokio::sync::RwLock;

use crate::{
    constant::{GITHUB_USER, HTTP_CLIENT_AGENT, PROJECTS_CACHE_TIMEOUT, SETTINGS_CACHE_TIMEOUT},
    entity::romi_fields,
    models::info::{ResProjectData, ResSettingsData},
};

#[derive(Debug)]
pub struct CacheEntity<T> {
    entry: RwLock<Option<(T, SystemTime)>>,
    ttl: Duration,
}

impl<T> CacheEntity<T>
where
    T: Clone + Send + Sync + 'static,
{
    pub fn new(ttl: Duration) -> Self {
        Self { entry: RwLock::new(None), ttl }
    }

    pub async fn get_or_update<F, Fut>(&self, updater: F) -> Result<T, anyhow::Error>
    where
        F: FnOnce() -> Fut,
        Fut: Future<Output = Result<T, anyhow::Error>>,
    {
        let now = SystemTime::now();

        if let Some((data, expires_at)) = &*self.entry.read().await {
            if now < *expires_at {
                return Ok(data.clone());
            }
        }

        let new_data = updater().await?;
        *self.entry.write().await = Some((new_data.clone(), now + self.ttl));
        Ok(new_data)
    }

    pub async fn update(&self, data: T) {
        let now = SystemTime::now();
        *self.entry.write().await = Some((data, now + self.ttl));
    }
}

#[macro_export]
macro_rules! define_cache {
    ($name:ident, $typ:ty, $ttl:expr) => {
        static $name: once_cell::sync::Lazy<
            std::sync::Arc<crate::utils::cache::CacheEntity<$typ>>,
        > = once_cell::sync::Lazy::new(|| {
            std::sync::Arc::new(crate::utils::cache::CacheEntity::new(
                std::time::Duration::from_secs($ttl),
            ))
        });
    };
}

define_cache!(SETTINGS_CACHE, ResSettingsData, SETTINGS_CACHE_TIMEOUT);

pub async fn get_settings_cache(db: &DatabaseConnection) -> Result<ResSettingsData, anyhow::Error> {
    SETTINGS_CACHE
        .get_or_update(|| async {
            let record = romi_fields::Entity::find()
                .filter(romi_fields::Column::Key.eq("settings"))
                .one(db)
                .await
                .context("Failed to fetch settings")?
                .ok_or_else(|| anyhow!("Settings not found"))?;

            let parsed: ResSettingsData =
                serde_json::from_str(&record.value).context("Failed to parse settings")?;
            Ok(parsed)
        })
        .await
}

define_cache!(PROJECTS_CACHE, Vec<ResProjectData>, PROJECTS_CACHE_TIMEOUT);

pub async fn get_projects_cache() -> Result<Vec<ResProjectData>, anyhow::Error> {
    PROJECTS_CACHE
        .get_or_update(|| async {
            let text = reqwest::Client::new()
                .get(format!("https://api.github.com/users/{}/repos?sort=updated", GITHUB_USER))
                .header("User-Agent", HTTP_CLIENT_AGENT)
                .send()
                .await
                .map_err(|err| anyhow!("Failed to fetch projects: {}", err))?
                .text()
                .await
                .map_err(|err| anyhow!("Failed to parse projects: {}", err))?;

            serde_json::from_str::<Vec<ResProjectData>>(&text)
                .map_err(|err| anyhow!("Failed to parse projects to json: {}", err))
        })
        .await
}
