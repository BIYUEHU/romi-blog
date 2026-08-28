use axum::{
  Json, Router,
  extract::{Path, Query, State},
  routing::{delete, get, post, put},
};
use roga::{l_error, l_info, l_warn};

use crate::{
  app::RomiState,
  guards::admin::AdminUser,
  models::info::{
    ReqContactForm, ReqIpBlacklistAdd, ReqSearchQuery, ReqTestMail, ResBirthdayReminderConfig,
    ResDashboardData, ResIpBlacklistItem, ResLogEntry, ResLogFile, ResMusicData, ResProjectData,
    ResSearchResultItem, ResSettingsData, ResSmtpSettings,
  },
  service::email::send_email,
  service::info,
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/dashboard", get(get_dashboard))
    .route("/settings", get(get_settings))
    .route("/settings", put(update_settings))
    .route("/smtp", get(get_smtp_settings))
    .route("/smtp", put(update_smtp_settings))
    .route("/smtp/test", post(test_smtp))
    .route("/projects", get(get_projects))
    .route("/music", get(get_music))
    .route("/search", get(search_posts))
    .route("/contact", post(send_contact_email))
    .route("/logs", get(get_logs))
    .route("/logs/{name}", get(get_log))
    .route("/security/blacklist", get(get_ip_blacklist))
    .route("/security/blacklist", post(add_ip_blacklist))
    .route("/security/blacklist/{id}", delete(delete_ip_blacklist))
    .route("/security/birthday-reminder", get(get_birthday_reminder_config))
    .route("/security/birthday-reminder", put(update_birthday_reminder_config))
}

async fn get_dashboard(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResDashboardData> {
  match info::get_dashboard(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to get dashboard: {:#}", e);
      Err(ApiError::internal("Failed to get dashboard"))
    }
  }
}

async fn get_settings(
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResSettingsData> {
  match info::get_settings(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to get settings: {:#}", e);
      Err(ApiError::internal("Failed to get settings"))
    }
  }
}

async fn update_settings(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ResSettingsData>,
) -> ApiResult {
  match info::update_settings(conn, data).await {
    Ok(_) => {
      l_info!(logger, "Updated settings by admin {} ({})", admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to update settings: {:#}", e);
      Err(ApiError::internal("Failed to update settings"))
    }
  }
}

async fn get_projects(
  State(RomiState { ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResProjectData>> {
  match info::get_projects().await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to get projects: {:#}", e);
      Err(ApiError::internal("Failed to get projects"))
    }
  }
}

async fn get_music(
  State(RomiState { ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResMusicData>> {
  match info::get_music().await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to get music: {:#}", e);
      Err(ApiError::internal("Failed to get music"))
    }
  }
}

async fn search_posts(
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Query(params): Query<ReqSearchQuery>,
) -> ApiResult<Vec<ResSearchResultItem>> {
  match info::search_posts(conn, &params.q, params.page, params.per_page).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to search posts: {:#}", e);
      Err(ApiError::internal("Failed to search posts"))
    }
  }
}

async fn send_contact_email(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(form): Json<ReqContactForm>,
) -> ApiResult {
  if form.name.is_empty() || form.email.is_empty() || form.message.is_empty() {
    l_warn!(logger, "Contact email failed: missing fields");
    return Err(ApiError::bad_request("All fields are required"));
  }
  let subject = format!("[Contact] {} <{}>", form.name, form.email);
  let body = format!("Name: {}\nEmail: {}\nMessage:\n{}", form.name, form.email, form.message);

  match send_email(conn, &form.email, &subject, &body).await {
    Ok(_) => api_ok(()),
    Err(e) => {
      l_error!(logger, "Contact email failed: {:#}", e);
      Err(ApiError::internal(e.to_string()))
    }
  }
}

async fn test_smtp(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(payload): Json<ReqTestMail>,
) -> ApiResult {
  if payload.to.is_empty() || payload.content.is_empty() {
    l_warn!(logger, "Test SMTP failed: missing to or content");
    return Err(ApiError::bad_request("To and content are required"));
  }

  let subject = if payload.subject.is_empty() { "SMTP Test" } else { &payload.subject };

  match send_email(conn, &payload.to, subject, &payload.content).await {
    Ok(_) => api_ok(()),
    Err(e) => {
      l_error!(logger, "Test SMTP failed: {:#}", e);
      Err(ApiError::internal(e.to_string()))
    }
  }
}

async fn get_logs(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResLogFile>> {
  match info::list_logs().await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list logs: {:#}", e);
      Err(ApiError::internal("Failed to list logs"))
    }
  }
}

async fn get_log(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, .. }): State<RomiState>,
  Path(name): Path<String>,
) -> ApiResult<Vec<ResLogEntry>> {
  match info::read_log(&name).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to read log {}: {:#}", name, e);
      Err(ApiError::internal("Failed to read log"))
    }
  }
}

async fn get_ip_blacklist(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<Vec<ResIpBlacklistItem>> {
  match info::list_ip_blacklist(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list IP blacklist: {:#}", e);
      Err(ApiError::internal("Failed to list IP blacklist"))
    }
  }
}

async fn add_ip_blacklist(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(payload): Json<ReqIpBlacklistAdd>,
) -> ApiResult {
  if payload.ip.trim().is_empty() {
    return Err(ApiError::bad_request("IP is required"));
  }
  match info::add_ip_blacklist(conn, payload.ip.trim().to_string(), payload.reason).await {
    Ok(_) => {
      l_info!(
        logger,
        "Admin {} ({}) added IP {} to blacklist",
        admin_user.id,
        admin_user.username,
        payload.ip
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to add IP blacklist: {:#}", e);
      Err(ApiError::internal("Failed to add IP blacklist"))
    }
  }
}

async fn delete_ip_blacklist(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  axum::extract::Path(id): axum::extract::Path<u32>,
) -> ApiResult {
  match info::delete_ip_blacklist(conn, id).await {
    Ok(_) => {
      l_info!(
        logger,
        "Admin {} ({}) removed IP blacklist id {}",
        admin_user.id,
        admin_user.username,
        id
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete IP blacklist: {:#}", e);
      Err(ApiError::internal("Failed to delete IP blacklist"))
    }
  }
}

async fn get_birthday_reminder_config(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResBirthdayReminderConfig> {
  match info::get_birthday_reminder_config(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to get birthday reminder config: {:#}", e);
      Err(ApiError::internal("Failed to get birthday reminder config"))
    }
  }
}

async fn update_birthday_reminder_config(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ResBirthdayReminderConfig>,
) -> ApiResult {
  match info::update_birthday_reminder_config(conn, data).await {
    Ok(_) => {
      l_info!(
        logger,
        "Admin {} ({}) updated birthday reminder config",
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to update birthday reminder config: {:#}", e);
      Err(ApiError::internal("Failed to update birthday reminder config"))
    }
  }
}

async fn get_smtp_settings(
  AdminUser(_): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResSmtpSettings> {
  match info::get_smtp_settings(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to get smtp settings: {:#}", e);
      Err(ApiError::internal("Failed to get smtp settings"))
    }
  }
}

async fn update_smtp_settings(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ResSmtpSettings>,
) -> ApiResult {
  match info::update_smtp_settings(conn, data).await {
    Ok(_) => {
      l_info!(logger, "Updated smtp settings by admin {} ({})", admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to update smtp settings: {:#}", e);
      Err(ApiError::internal("Failed to update smtp settings"))
    }
  }
}
