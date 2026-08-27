use axum::{
  Json, Router,
  extract::{Path, State},
  routing::{delete, get, post, put},
};
use roga::*;

use crate::{
  app::RomiState,
  guards::{admin::AdminUser, auth::AuthUser},
  models::user::{
    ReqLoginData, ReqProfileData, ReqRegisterData, ReqUserData, ResLoginData, ResUserData,
  },
  service::user::{self, UserError},
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/login", post(login))
    .route("/register", post(register))
    .route("/", get(list))
    .route("/", post(create))
    .route("/{id}", get(fetch))
    .route("/{id}", put(update))
    .route("/{id}", delete(remove))
    .route("/profile", put(update_profile))
}

async fn login(
  State(RomiState { ref logger, ref conn, ref secret, .. }): State<RomiState>,
  Json(credentials): Json<ReqLoginData>,
) -> ApiResult<ResLoginData> {
  match user::login(conn, credentials, secret).await {
    Ok(data) => api_ok(data),
    Err(e) if matches!(e.downcast_ref::<UserError>(), Some(UserError::InvalidCredentials)) => {
      l_warn!(logger, "Invalid login attempt: {}", e);
      Err(ApiError::unauthorized("Invalid credentials"))
    }
    Err(e) => {
      l_error!(logger, "Login failed: {:#}", e);
      Err(ApiError::internal("Login failed"))
    }
  }
}

async fn list(
  _admin_user: AdminUser,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResUserData>> {
  match user::list(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list users: {:#}", e);
      Err(ApiError::internal("Failed to list users"))
    }
  }
}

async fn fetch(
  _admin_user: AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResUserData> {
  match user::get(conn, id).await {
    Ok(data) => api_ok(data),
    Err(e) if e.downcast_ref::<UserError>().is_some() => {
      l_warn!(logger, "User {} not found", id);
      Err(ApiError::not_found("User not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to get user {}: {:#}", id, e);
      Err(ApiError::internal("Failed to get user"))
    }
  }
}

async fn create(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqUserData>,
) -> ApiResult {
  match user::create(conn, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created user {} ({}) by admin {} ({})",
        result.uid,
        result.username,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) if matches!(e.downcast_ref::<UserError>(), Some(UserError::UsernameOrEmailTaken)) => {
      l_warn!(logger, "User creation failed: {}", e);
      Err(ApiError::bad_request("Username or email already taken"))
    }
    Err(e) => {
      l_error!(logger, "Failed to create user: {:#}", e);
      Err(ApiError::internal("Failed to create user"))
    }
  }
}

async fn register(
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(payload): Json<ReqRegisterData>,
) -> ApiResult {
  match user::register(conn, payload, logger).await {
    Ok(result) => {
      l_info!(logger, "User registered: {} ({})", result.uid, result.username);
      api_ok(())
    }
    Err(e)
      if matches!(
        e.downcast_ref::<UserError>(),
        Some(UserError::UsernameTaken | UserError::EmailTaken | UserError::MissingFields)
      ) =>
    {
      l_warn!(logger, "Registration failed: {}", e);
      Err(ApiError::bad_request(e.to_string()))
    }
    Err(e) => {
      l_error!(logger, "Registration failed: {:#}", e);
      Err(ApiError::internal("Registration failed"))
    }
  }
}

async fn update_profile(
  user: AuthUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(payload): Json<ReqProfileData>,
) -> ApiResult {
  match user::update_profile(conn, user.id, payload, logger).await {
    Ok(_) => {
      l_info!(logger, "Profile updated for user {}", user.id);
      api_ok(())
    }
    Err(e)
      if matches!(
        e.downcast_ref::<UserError>(),
        Some(
          UserError::InvalidOldPassword
            | UserError::EmptyUsername
            | UserError::UsernameTaken
            | UserError::PasswordTooShort
        )
      ) =>
    {
      l_warn!(logger, "Profile update failed: {}", e);
      Err(ApiError::bad_request(e.to_string()))
    }
    Err(e) if matches!(e.downcast_ref::<UserError>(), Some(UserError::NotFound)) => {
      l_warn!(logger, "User {} not found", user.id);
      Err(ApiError::not_found("User not found"))
    }
    Err(e) => {
      l_error!(logger, "Profile update failed: {:#}", e);
      Err(ApiError::internal("Profile update failed"))
    }
  }
}

async fn update(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqUserData>,
) -> ApiResult {
  match user::update(conn, id, data).await {
    Ok(_) => {
      l_info!(logger, "Updated user {} by admin {} ({})", id, admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) if e.downcast_ref::<UserError>().is_some() => {
      l_warn!(logger, "User {} not found", id);
      Err(ApiError::not_found("User not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to update user {}: {:#}", id, e);
      Err(ApiError::internal("Failed to update user"))
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  if admin_user.id == id {
    l_warn!(logger, "Admin {} cannot delete self", admin_user.id);
    return Err(ApiError::forbidden("Cannot delete self"));
  }

  match user::remove(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Deleted user {} by admin {} ({})", id, admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete user {}: {:#}", id, e);
      Err(ApiError::internal("Failed to delete user"))
    }
  }
}
