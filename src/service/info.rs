use anyhow::{Context, Result};
use sea_orm::{
  ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, PaginatorTrait,
  QueryFilter, QueryOrder, QuerySelect,
};
use std::{env, process::Command};
use sysinfo::System;
use tokio::try_join;

use crate::{
  entity::{
    romi_comments, romi_hitokotos, romi_metas, romi_news, romi_news_comments, romi_posts,
    romi_seimgs, romi_settings, romi_users,
  },
  models::info::{
    ResDashboardData, ResMusicData, ResProjectData, ResSearchResultItem, ResSettingsData,
    ResSmtpSettings,
  },
  service::music::get_music_cache,
  tools::markdown::summary_markdown,
  utils::cache::{
    get_projects_cache, get_settings_cache, get_smtp_settings_cache, update_settings_cache,
  },
};

pub async fn get_dashboard(db: &DatabaseConnection) -> Result<ResDashboardData> {
  let (
    posts_count,
    categories_count,
    tags_count,
    comments_count_1,
    comments_count_2,
    users_count,
    hitokotos_count,
    seimgs_count,
    news_count,
  ) = try_join!(
    romi_posts::Entity::find().count(db),
    romi_metas::Entity::find().filter(romi_metas::Column::IsCategory.eq("1")).count(db),
    romi_metas::Entity::find().filter(romi_metas::Column::IsCategory.ne("1")).count(db),
    romi_comments::Entity::find().count(db),
    romi_news_comments::Entity::find().count(db),
    romi_users::Entity::find().count(db),
    romi_hitokotos::Entity::find().count(db),
    romi_seimgs::Entity::find().count(db),
    romi_news::Entity::find().count(db),
  )
  .context("Failed to fetch dashboard counts")?;

  Ok(ResDashboardData {
    posts_count,
    categories_count,
    tags_count,
    comments_count: comments_count_1 + comments_count_2,
    users_count,
    hitokotos_count,
    seimgs_count,
    news_count,
    version: env!("CARGO_PKG_VERSION").into(),
    os_info: format!(
      "{} {}",
      System::name().unwrap_or_default(),
      System::os_version().unwrap_or_default()
    ),
    home_dir: env::var("HOME").unwrap_or_default(),
    nodejs_version: Command::new("node")
      .arg("-v")
      .output()
      .map(|output| String::from_utf8(output.stdout).ok().unwrap_or_default())
      .unwrap_or_default(),
  })
}

pub async fn get_settings(db: &DatabaseConnection) -> Result<ResSettingsData> {
  get_settings_cache(db).await.context("Failed to fetch settings")
}

pub async fn update_settings(db: &DatabaseConnection, data: ResSettingsData) -> Result<()> {
  let model = romi_settings::Entity::find()
    .one(db)
    .await
    .context("Failed to fetch settings")?
    .ok_or_else(|| anyhow::anyhow!("Settings not found"))?;

  let home_links =
    serde_json::to_value(data.home_links.clone()).context("Failed to serialize home_links")?;
  let independent_pages = serde_json::to_value(data.independent_pages.clone())
    .context("Failed to serialize independent_pages")?;
  let links = serde_json::to_value(data.links.clone()).context("Failed to serialize links")?;

  let mut active = model.into_active_model();
  active.site_title = ActiveValue::Set(data.site_title.clone());
  active.site_description = ActiveValue::Set(data.site_description.clone());
  active.site_keywords = ActiveValue::Set(data.site_keywords.clone());
  active.site_name = ActiveValue::Set(data.site_name.clone());
  active.site_favicon = ActiveValue::Set(data.site_favicon.clone());
  active.site_logo = ActiveValue::Set(data.site_logo.clone());
  active.site_url = ActiveValue::Set(data.site_url.clone());
  active.header_background = ActiveValue::Set(data.header_background.clone());
  active.home_avatar = ActiveValue::Set(data.home_avatar.clone());
  active.home_title = ActiveValue::Set(data.home_title.clone());
  active.home_subtitle = ActiveValue::Set(data.home_subtitle.clone());
  active.home_links = ActiveValue::Set(home_links);
  active.independent_pages = ActiveValue::Set(independent_pages);
  active.links = ActiveValue::Set(links);

  romi_settings::Entity::update(active).exec(db).await.context("Failed to update settings")?;

  update_settings_cache(data).await;
  Ok(())
}

pub async fn get_projects() -> Result<Vec<ResProjectData>> {
  get_projects_cache().await.context("Failed to fetch projects")
}

pub async fn get_music() -> Result<Vec<ResMusicData>> {
  let cache = get_music_cache().await.context("Failed to fetch music")?;
  Ok(
    cache
      .data
      .into_iter()
      .map(|song| ResMusicData {
        name: song.name,
        artist: song.artist,
        url: song.url,
        cover: song.cover,
        lrc: song.lrc,
      })
      .collect(),
  )
}

pub async fn search_posts(
  db: &DatabaseConnection,
  query: &str,
  page: u32,
  per_page: u32,
) -> Result<Vec<ResSearchResultItem>> {
  let q = query.trim();
  if q.is_empty() {
    return Ok(vec![]);
  }

  let page = page.max(1);
  let per_page = per_page.clamp(1, 50);
  let offset = (page - 1) * per_page;

  let posts = romi_posts::Entity::find()
    .filter(romi_posts::Column::Hide.ne("1"))
    .filter(
      romi_posts::Column::Title
        .like(format!("%{}%", q))
        .or(romi_posts::Column::Text.like(format!("%{}%", q))),
    )
    .order_by(romi_posts::Column::Modified, sea_orm::Order::Desc)
    .limit(per_page as u64)
    .offset(offset as u64)
    .all(db)
    .await
    .context("Failed to search posts")?;

  Ok(
    posts
      .into_iter()
      .map(|post| ResSearchResultItem {
        pid: post.pid,
        str_id: post.str_id,
        title: post.title,
        modified: post.modified,
        summary: summary_markdown(&post.text, 200),
      })
      .collect(),
  )
}

pub async fn get_smtp_settings(db: &DatabaseConnection) -> Result<ResSmtpSettings> {
  get_smtp_settings_cache(db).await.context("Failed to fetch smtp settings")
}

pub async fn update_smtp_settings(db: &DatabaseConnection, data: ResSmtpSettings) -> Result<()> {
  let model = romi_settings::Entity::find()
    .one(db)
    .await
    .context("Failed to fetch settings")?
    .ok_or_else(|| anyhow::anyhow!("Settings not found"))?;

  let mut active = model.into_active_model();
  active.smtp_host = ActiveValue::Set(data.smtp_host);
  active.smtp_port = ActiveValue::Set(data.smtp_port);
  active.smtp_username = ActiveValue::Set(data.smtp_username);
  active.smtp_password = ActiveValue::Set(data.smtp_password);
  active.smtp_email = ActiveValue::Set(data.smtp_email);

  romi_settings::Entity::update(active).exec(db).await.context("Failed to update smtp settings")?;
  Ok(())
}
