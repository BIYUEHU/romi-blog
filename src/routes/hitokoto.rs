use axum::{
  Json, Router,
  extract::{Path, State},
  routing::{delete, get, post, put},
};
use roga::*;

use crate::{
  app::RomiState,
  guards::admin::AdminUser,
  models::hitokoto::{ReqHitokotoData, ResHitokotoData},
  service::hitokoto,
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/", get(get_random))
    .route("/", post(create))
    .route("/public", get(list_public))
    .route("/all", get(list_all))
    .route("/{uuid}", get(get_by_uuid))
    .route("/like/{uuid}", put(like))
    .route("/{uuid}", put(update))
    .route("/{uuid}", delete(remove))
}

async fn get_random(
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<ResHitokotoData> {
  match hitokoto::get_random(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to get hitokoto: {:#}", e);
      Err(ApiError::internal("Failed to get hitokoto"))
    }
  }
}

async fn get_by_uuid(
  Path(uuid): Path<String>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResHitokotoData> {
  match hitokoto::get_by_uuid(conn, uuid.clone()).await {
    Ok(data) => api_ok(data),
    Err(_) => {
      l_warn!(logger, "Hitokoto {} not found", uuid);
      Err(ApiError::not_found("Hitokoto not found"))
    }
  }
}

async fn list_public(
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResHitokotoData>> {
  match hitokoto::list_public(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list public hitokotos: {:#}", e);
      Err(ApiError::internal("Failed to list public hitokotos"))
    }
  }
}

async fn list_all(
  _admin_user: AdminUser,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResHitokotoData>> {
  match hitokoto::list_all(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list hitokotos: {:#}", e);
      Err(ApiError::internal("Failed to list hitokotos"))
    }
  }
}

async fn create(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqHitokotoData>,
) -> ApiResult {
  let msg = data.msg.clone();
  match hitokoto::create(conn, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created hitokoto {} by admin {} ({})",
        result.id,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      if e.to_string().contains("already exists") {
        l_warn!(logger, "Duplicate hitokoto msg: {}", msg);
        Err(ApiError::bad_request("Hitokoto msg already exists"))
      } else {
        l_error!(logger, "Failed to create hitokoto: {:#}", e);
        Err(ApiError::internal("Failed to create hitokoto"))
      }
    }
  }
}

async fn update(
  AdminUser(admin_user): AdminUser,
  Path(uuid): Path<String>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqHitokotoData>,
) -> ApiResult {
  match hitokoto::update(conn, uuid.clone(), data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Updated hitokoto {} by admin {} ({})",
        result.id,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(_) => {
      l_warn!(logger, "Hitokoto {} not found", uuid);
      Err(ApiError::not_found("Hitokoto not found"))
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(uuid): Path<String>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match hitokoto::remove(conn, uuid.clone()).await {
    Ok(_) => {
      l_info!(
        logger,
        "Deleted hitokoto {} by admin {} ({})",
        uuid,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete hitokoto {}: {:#}", uuid, e);
      Err(ApiError::internal("Failed to delete hitokoto"))
    }
  }
}

async fn like(
  Path(uuid): Path<String>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match hitokoto::like(conn, uuid.clone()).await {
    Ok(_) => {
      l_info!(logger, "Liked hitokoto {}", uuid);
      api_ok(())
    }
    Err(_) => {
      l_warn!(logger, "Hitokoto {} not found", uuid);
      Err(ApiError::not_found("Hitokoto not found"))
    }
  }
}
