use std::{env, process::Command};

use anyhow::Context;
use axum::{
  Json, Router,
  extract::State,
  routing::{get, put},
};
use fetcher::playlist::SongInfo;
use roga::{l_error, l_info};
use sea_orm::{
  ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter,
};
use sysinfo::System;
use tokio::try_join;

use crate::{
  app::RomiState,
  entity::{
    romi_comments, romi_hitokotos, romi_metas, romi_news, romi_news_comments, romi_posts,
    romi_seimgs, romi_settings, romi_users,
  },
  guards::admin::AdminUser,
  models::info::{ResDashboardData, ResMusicData, ResProjectData, ResSettingsData},
  service::music::{MusicCache, get_music_cache},
  utils::{
    api::{ApiError, ApiResult, api_ok},
    cache::{get_projects_cache, get_settings_cache, update_settings_cache},
  },
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/dashboard", get(fetch_dashboard))
    .route("/settings", get(fetch_settings))
    .route("/settings", put(update_settings))
    .route("/projects", get(fetch_projects))
    .route("/music", get(fetch_music))
}

async fn fetch_dashboard(
  _admin_user: AdminUser,
  State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<ResDashboardData> {
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
    romi_posts::Entity::find().count(conn),
    romi_metas::Entity::find().filter(romi_metas::Column::IsCategory.eq("1")).count(conn),
    romi_metas::Entity::find().filter(romi_metas::Column::IsCategory.ne("1")).count(conn),
    romi_comments::Entity::find().count(conn),
    romi_news_comments::Entity::find().count(conn),
    romi_users::Entity::find().count(conn),
    romi_hitokotos::Entity::find().count(conn),
    romi_seimgs::Entity::find().count(conn),
    romi_news::Entity::find().count(conn),
  )
  .context("Failed to fetch dashboard counts")?;

  api_ok(ResDashboardData {
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
      .map(|output| String::from_utf8(output.stdout).ok().unwrap_or("".into()))
      .unwrap_or("".into()),
  })
}

async fn fetch_settings(
  State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<ResSettingsData> {
  api_ok(get_settings_cache(conn).await.context("Failed to fetch site settings")?)
}

async fn update_settings(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
  Json(settings): Json<ResSettingsData>,
) -> ApiResult {
  let model = romi_settings::Entity::find().one(conn).await.context("Failed to fetch settings")?;
  if let Some(model) = model {
    let settings2 = settings.clone();

    let mut active_model = model.into_active_model();
    active_model.site_title = ActiveValue::Set(settings.site_title);
    active_model.site_description = ActiveValue::Set(settings.site_description);
    active_model.site_keywords = ActiveValue::Set(settings.site_keywords);
    active_model.site_name = ActiveValue::Set(settings.site_name);
    active_model.site_favicon = ActiveValue::Set(settings.site_favicon);
    active_model.site_logo = ActiveValue::Set(settings.site_logo);
    active_model.header_background = ActiveValue::Set(settings.header_background);
    active_model.home_avatar = ActiveValue::Set(settings.home_avatar);
    active_model.home_title = ActiveValue::Set(settings.home_title);
    active_model.home_subtitle = ActiveValue::Set(settings.home_subtitle);
    active_model.home_links = ActiveValue::Set(
      serde_json::to_value(settings.home_links).context("Failed to serialize home_links")?,
    );
    active_model.independent_pages = ActiveValue::Set(
      serde_json::to_value(settings.independent_pages)
        .context("Failed to serialize independent_pages")?,
    );
    active_model.links =
      ActiveValue::Set(serde_json::to_value(settings.links).context("Failed to serialize links")?);

    romi_settings::Entity::update(active_model)
      .exec(conn)
      .await
      .context("Failed to update settings")?;
    update_settings_cache(settings2).await;

    l_info!(logger, "Updated settings by admin {} ({})", admin_user.id, admin_user.username);
    api_ok(())
  } else {
    l_error!(
      logger,
      "A error when updating settings by admin {} ({})",
      admin_user.id,
      admin_user.username
    );
    Err(ApiError::internal("Settings table has no settings data"))
  }
}

async fn fetch_projects() -> ApiResult<Vec<ResProjectData>> {
  api_ok(get_projects_cache().await.context("Failed to fetch projects data")?)
}

async fn fetch_music() -> ApiResult<Vec<ResMusicData>> {
  api_ok(get_music_cache().await.context("Failed to fetch music data").map(
    |MusicCache { data, .. }| {
      data
        .into_iter()
        .map(|SongInfo { name, artist, url, cover, lrc }| ResMusicData {
          name,
          artist,
          url,
          cover,
          lrc,
        })
        .collect()
    },
  )?)
}
