use anyhow::{Context, Result};
use axum::http::header;
use axum::response::{IntoResponse, Response};
use chrono::{DateTime, Utc};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::entity::{romi_characters, romi_metas, romi_news, romi_posts};
use crate::models::info::ResSettingsData;
use crate::utils::cache::get_settings_cache;

fn format_lastmod(timestamp: u32) -> String {
  DateTime::<Utc>::from_timestamp(timestamp as i64, 0)
    .map(|time| time.format("%Y-%m-%d").to_string())
    .unwrap_or_default()
}

pub async fn generate_sitemap(db: &DatabaseConnection) -> Result<Response> {
  let posts = romi_posts::Entity::find().all(db).await.context("Failed to fetch posts")?;

  let news = romi_news::Entity::find()
    .filter(romi_news::Column::Private.ne("1"))
    .all(db)
    .await
    .context("Failed to fetch news")?;

  let metas = romi_metas::Entity::find().all(db).await.context("Failed to fetch metas")?;

  let settings: ResSettingsData =
    get_settings_cache(db).await.context("Failed to fetch settings")?;

  let characters =
    romi_characters::Entity::find().all(db).await.context("Failed to fetch characters")?;

  let mut urls = String::new();

  for path in [
    "",
    "/post",
    "/archive",
    "/hitokotos",
    "/hitokoto",
    "/news",
    "/char",
    "/project",
    "/anime",
    "/gal",
    "/music",
  ] {
    urls.push_str(&format!("<url><loc>{}{}</loc></url>", settings.site_url, path));
  }
  for page in &settings.independent_pages {
    urls.push_str(&format!("<url><loc>{}/{}</loc></url>", settings.site_url, page.name));
  }
  for character in &characters {
    urls.push_str(&format!("<url><loc>{}/char/{}</loc></url>", settings.site_url, character.name));
  }
  for meta in &metas {
    if meta.is_category == "1" {
      urls.push_str(&format!("<url><loc>{}/category/{}</loc></url>", settings.site_url, meta.name));
    } else {
      urls.push_str(&format!("<url><loc>{}/tag/{}</loc></url>", settings.site_url, meta.name));
    }
  }
  for post in &posts {
    let id = post.str_id.clone().filter(|s| !s.is_empty()).unwrap_or_else(|| post.pid.to_string());
    urls.push_str(&format!(
      "<url><loc>{}/post/{}</loc><lastmod>{}</lastmod></url>",
      settings.site_url,
      id,
      format_lastmod(post.modified)
    ));
  }
  for item in &news {
    urls.push_str(&format!(
      "<url><loc>{}/news/{}</loc><lastmod>{}</lastmod></url>",
      settings.site_url,
      item.nid,
      format_lastmod(item.modified)
    ));
  }

  let xml = format!(
    r#"<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
{}
</urlset>"#,
    urls
  );

  Ok(([(header::CONTENT_TYPE, "application/xml; charset=utf-8")], xml).into_response())
}
