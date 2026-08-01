use std::{env, process::Command};

use anyhow::Context;
use axum::{
  Json, Router,
  extract::{Query, State},
  routing::{get, post, put},
};
use roga::{l_error, l_info, l_warn};
use sea_orm::{
  ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder,
  QuerySelect,
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
  models::info::{
    ReqContactForm, ReqSearchQuery, ReqTestMail, ResDashboardData, ResMusicData, ResProjectData,
    ResSearchResultItem, ResSettingsData, ResSmtpSettings,
  },
  service::music::get_music_cache,
  tools::markdown::summary_markdown,
  utils::{
    api::{ApiError, ApiResult, api_ok},
    cache::{
      get_projects_cache, get_settings_cache, get_smtp_settings_cache, update_settings_cache,
    },
  },
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/dashboard", get(fetch_dashboard))
    .route("/settings", get(fetch_settings))
    .route("/settings", put(update_settings))
    .route("/smtp", get(fetch_smtp_settings))
    .route("/smtp", put(update_smtp_settings))
    .route("/smtp/test", post(test_smtp))
    .route("/projects", get(fetch_projects))
    .route("/music", get(fetch_music))
    .route("/search", get(search_posts))
    .route("/contact", post(send_contact_email))
}

async fn fetch_dashboard(
  _admin_user: AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
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
  .map_err(|e| {
    l_error!(logger, "Failed to fetch dashboard counts: {}", e);
    e
  })
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
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResSettingsData> {
  get_settings_cache(conn)
    .await
    .map_err(|e| {
      l_error!(logger, "Failed to fetch settings: {}", e);
      ApiError::internal(e.to_string())
    })
    .and_then(api_ok)
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
    active_model.site_url = ActiveValue::Set(settings.site_url);
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

async fn fetch_projects(
  State(RomiState { ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResProjectData>> {
  get_projects_cache()
    .await
    .map_err(|e| {
      l_error!(logger, "Failed to fetch projects: {}", e);
      ApiError::internal(e.to_string())
    })
    .and_then(api_ok)
}
async fn fetch_music(
  State(RomiState { ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResMusicData>> {
  get_music_cache()
    .await
    .map_err(|e| {
      l_error!(logger, "Failed to fetch music: {}", e);
      ApiError::internal(e.to_string())
    })
    .and_then(|cache| {
      api_ok(
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
    })
}
async fn search_posts(
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Query(params): Query<ReqSearchQuery>,
) -> ApiResult<Vec<ResSearchResultItem>> {
  let q = params.q.trim();
  if q.is_empty() {
    return api_ok(vec![]);
  }

  let page = params.page.max(1);
  let per_page = params.per_page.clamp(1, 50);
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
    .all(conn)
    .await
    .map_err(|e| {
      l_error!(logger, "Failed to search posts: {}", e);
      ApiError::internal(e.to_string())
    })?;
  let items = posts
    .into_iter()
    .map(|post| ResSearchResultItem {
      pid: post.pid,
      str_id: post.str_id,
      title: post.title,
      modified: post.modified,
      summary: summary_markdown(&post.text, 200),
    })
    .collect();

  api_ok(items)
}

async fn send_contact_email(
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(form): Json<ReqContactForm>,
) -> ApiResult {
  if form.name.is_empty() || form.email.is_empty() || form.message.is_empty() {
    l_warn!(logger, "Contact email failed: missing fields");
    return Err(ApiError::bad_request("All fields are required"));
  }
  let subject = format!("[Contact] {} <{}>", form.name, form.email);
  let body = format!("Name: {}\nEmail: {}\nMessage:\n{}", form.name, form.email, form.message);

  crate::service::email::send_email(conn, &form.email, &subject, &body).await.map_err(|e| {
    l_error!(logger, "Contact email failed: {}", e);
    ApiError::internal(e.to_string())
  })?;
  api_ok(())
}

async fn test_smtp(
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(payload): Json<ReqTestMail>,
) -> ApiResult {
  if payload.to.is_empty() || payload.content.is_empty() {
    l_warn!(logger, "Test SMTP failed: missing to or content");
    return Err(ApiError::bad_request("To and content are required"));
  }

  let subject = if payload.subject.is_empty() { "SMTP Test" } else { &payload.subject };

  crate::service::email::send_email(conn, &payload.to, subject, &payload.content).await.map_err(
    |e| {
      l_error!(logger, "Test SMTP failed: {}", e);
      ApiError::internal(e.to_string())
    },
  )?;

  api_ok(())
}
async fn fetch_smtp_settings(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResSmtpSettings> {
  get_smtp_settings_cache(conn)
    .await
    .map_err(|e| {
      l_error!(logger, "Failed to fetch smtp settings: {}", e);
      ApiError::internal(e.to_string())
    })
    .and_then(api_ok)
}
async fn update_smtp_settings(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
  Json(settings): Json<ResSmtpSettings>,
) -> ApiResult {
  let model = romi_settings::Entity::find()
    .one(conn)
    .await
    .map_err(|e| {
      l_error!(logger, "Failed to fetch settings: {}", e);
      ApiError::internal(e.to_string())
    })?
    .ok_or_else(|| {
      l_error!(logger, "Settings table has no settings data");
      ApiError::internal("Settings table has no settings data")
    })?;

  let mut active_model = model.into_active_model();
  active_model.smtp_host = ActiveValue::Set(settings.smtp_host);
  active_model.smtp_port = ActiveValue::Set(settings.smtp_port);
  active_model.smtp_username = ActiveValue::Set(settings.smtp_username);
  active_model.smtp_password = ActiveValue::Set(settings.smtp_password);
  active_model.smtp_email = ActiveValue::Set(settings.smtp_email);

  romi_settings::Entity::update(active_model).exec(conn).await.map_err(|e| {
    l_error!(logger, "Failed to update smtp settings: {}", e);
    ApiError::internal(e.to_string())
  })?;

  l_info!(logger, "Updated smtp settings by admin {} ({})", admin_user.id, admin_user.username);
  api_ok(())
}
