use std::time::SystemTime;

use anyhow::Context;
use rocket::time::Duration;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};
use tokio::sync::RwLock;

use crate::entity::romi_fields;
use crate::models::info::ResSettingsData;

pub struct Cache {
    cache: RwLock<Option<ResSettingsData>>,
    last_updated: RwLock<SystemTime>,
}

impl Cache {
    pub fn new() -> Self {
        Self {
            cache: RwLock::new(None),
            last_updated: RwLock::new(SystemTime::now()),
        }
    }

    pub async fn get_settings(
        &self,
        db: &DatabaseConnection,
    ) -> Result<ResSettingsData, anyhow::Error> {
        let cache = self.cache.read().await;
        let last_updated = *self.last_updated.read().await;

        if let Some(settings) = cache.as_ref() {
            if SystemTime::now().duration_since(last_updated)? < Duration::minutes(15) {
                return Ok(settings.clone());
            }
        }

        drop(cache);
        self.update_settings(db).await
    }

    pub async fn update_settings(
        &self,
        db: &DatabaseConnection,
    ) -> Result<ResSettingsData, anyhow::Error> {
        let settings = romi_fields::Entity::find()
            .filter(romi_fields::Column::Key.eq("settings"))
            .one(db)
            .await
            .context("Failed to fetch settings")?
            .ok_or_else(|| anyhow::anyhow!("Settings not found"))?;

        let settings: ResSettingsData =
            serde_json::from_str(&settings.value).context("Failed to parse settings")?;

        // 更新缓存
        *self.cache.write().await = Some(settings.clone());
        *self.last_updated.write().await = SystemTime::now();

        Ok(settings)
    }
}
