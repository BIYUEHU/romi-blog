use crate::constant::{PROJECTS_CACHE_TIMEOUT, SETTINGS_CACHE_TIMEOUT};
use crate::entity::romi_fields;
use crate::models::info::{ResProjectData, ResSettingsData};
use anyhow::{anyhow, Context};
use once_cell::sync::Lazy;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use std::time::{Duration, SystemTime};
use tokio::sync::RwLock;

#[derive(Debug)]
pub struct Cache<T> {
    data: RwLock<Option<T>>,
    last_updated: RwLock<SystemTime>,
    ttl: Duration,
}

impl<T> Cache<T>
where
    T: Clone + Send + Sync + 'static,
{
    pub fn new(ttl: Duration) -> Self {
        Self {
            data: RwLock::new(None),
            last_updated: RwLock::new(SystemTime::UNIX_EPOCH),
            ttl,
        }
    }

    pub async fn get_or_update<F, Fut>(&self, updater: F) -> Result<T, anyhow::Error>
    where
        F: FnOnce() -> Fut,
        Fut: std::future::Future<Output = Result<T, anyhow::Error>>,
    {
        let now = SystemTime::now();

        {
            let data_guard = self.data.read().await;
            let last_updated = *self.last_updated.read().await;
            if let Some(data) = data_guard.as_ref() {
                if now.duration_since(last_updated)? < self.ttl {
                    return Ok(data.clone());
                }
            }
        }

        let new_data = updater().await?;
        *self.data.write().await = Some(new_data.clone());
        *self.last_updated.write().await = now;

        Ok(new_data)
    }
}

static SETTINGS_CACHE: Lazy<tokio::sync::OnceCell<Cache<ResSettingsData>>> =
    Lazy::new(tokio::sync::OnceCell::new);

pub async fn get_settings_cache(db: &DatabaseConnection) -> Result<ResSettingsData, anyhow::Error> {
    SETTINGS_CACHE
        .get_or_init(|| async { Cache::new(Duration::from_secs(SETTINGS_CACHE_TIMEOUT)) })
        .await
        .get_or_update(|| async {
            let record = romi_fields::Entity::find()
                .filter(romi_fields::Column::Key.eq("settings"))
                .one(db)
                .await
                .context("Failed to fetch settings")?
                .ok_or_else(|| anyhow::anyhow!("Settings not found"))?;

            let parsed: ResSettingsData =
                serde_json::from_str(&record.value).context("Failed to parse settings")?;

            Ok(parsed)
        })
        .await
}

static PROJECTS_CACHE: Lazy<tokio::sync::OnceCell<Cache<Vec<ResProjectData>>>> =
    Lazy::new(tokio::sync::OnceCell::new);

pub async fn get_projects_cache() -> Result<Vec<ResProjectData>, anyhow::Error> {
    PROJECTS_CACHE
        .get_or_init(|| async { Cache::new(Duration::from_secs(PROJECTS_CACHE_TIMEOUT)) })
        .await
        .get_or_update(|| async {
            serde_json::from_str::<Vec<ResProjectData>>(
                reqwest::Client::new()
                    .get("https://api.github.com/users/BIYUEHU/repos?sort=updated")
                    .header("User-Agent", "RomiChan-App")
                    .send()
                    .await
                    .map_err(|err| anyhow!("Failed to fetch projects: {}", err))?
                    .text()
                    .await
                    .map_err(|err| anyhow!("Failed to parse projects: {}", err))?
                    .as_str(),
            )
            .map_err(|err| anyhow!("Failed to parse projects to json: {}", err))
        })
        .await
}
