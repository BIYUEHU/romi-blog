use std::time::{Duration, SystemTime};

use anyhow::{Context, anyhow};
use sea_orm::{DatabaseConnection, EntityTrait};
use tokio::sync::RwLock;

use crate::{
  constant::{GITHUB_USER, HTTP_CLIENT_AGENT, PROJECTS_CACHE_TIMEOUT, SETTINGS_CACHE_TIMEOUT},
  entity::romi_settings,
  models::info::{ResProjectData, ResSettingsData, ResSmtpSettings},
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

    if let Some((data, expires_at)) = &*self.entry.read().await
      && now < *expires_at
    {
      return Ok(data.clone());
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
    static $name: once_cell::sync::Lazy<std::sync::Arc<$crate::utils::cache::CacheEntity<$typ>>> =
      once_cell::sync::Lazy::new(|| {
        std::sync::Arc::new($crate::utils::cache::CacheEntity::new(std::time::Duration::from_secs(
          $ttl,
        )))
      });
  };
}

define_cache!(SETTINGS_CACHE, ResSettingsData, SETTINGS_CACHE_TIMEOUT);

pub async fn get_settings_cache(db: &DatabaseConnection) -> Result<ResSettingsData, anyhow::Error> {
  SETTINGS_CACHE
    .get_or_update(|| async {
      let settings = romi_settings::Entity::find()
        .one(db)
        .await
        .context("Failed to fetch settings")?
        .ok_or_else(|| anyhow!("Settings not found"))?;

      Ok(ResSettingsData {
        site_title: settings.site_title,
        site_description: settings.site_description,
        site_keywords: settings.site_keywords,
        site_name: settings.site_name,
        site_favicon: settings.site_favicon,
        site_logo: settings.site_logo,
        site_url: settings.site_url,
        header_background: settings.header_background,
        home_avatar: settings.home_avatar,
        home_title: settings.home_title,
        home_subtitle: settings.home_subtitle,
        home_links: serde_json::from_value(settings.home_links)
          .context("Failed to parse home_links")?,
        independent_pages: serde_json::from_value(settings.independent_pages)
          .context("Failed to parse independent_pages")?,
        links: serde_json::from_value(settings.links).context("Failed to parse links")?,
      })
    })
    .await
}

pub async fn update_settings_cache(data: ResSettingsData) {
  SETTINGS_CACHE.update(data).await;
}

pub async fn get_smtp_settings_cache(
  db: &DatabaseConnection,
) -> Result<ResSmtpSettings, anyhow::Error> {
  let settings = romi_settings::Entity::find()
    .one(db)
    .await
    .context("Failed to fetch settings")?
    .ok_or_else(|| anyhow!("Settings not found"))?;

  Ok(ResSmtpSettings {
    smtp_host: settings.smtp_host,
    smtp_port: settings.smtp_port,
    smtp_username: settings.smtp_username,
    smtp_password: settings.smtp_password,
    admin_email: settings.admin_email,
  })
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
