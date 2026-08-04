use axum::{
  Json, Router,
  extract::{Path, State},
  routing::{delete, get, post},
};
use roga::*;

use crate::{
  app::RomiState,
  guards::admin::AdminUser,
  models::meta::{ReqMetaData, ResMetaData},
  service::meta,
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/", get(list))
    .route("/", post(create))
    .route("/{id}", get(fetch))
    .route("/{id}", delete(remove))
}

async fn list(
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResMetaData>> {
  match meta::list(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list metas: {}", e);
      Err(ApiError::internal("Failed to list metas"))
    }
  }
}

async fn fetch(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResMetaData> {
  match meta::get(conn, id).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "Meta {} not found", id);
        Err(ApiError::not_found("Meta not found"))
      } else {
        l_error!(logger, "Failed to get meta {}: {}", id, e);
        Err(ApiError::internal("Failed to get meta"))
      }
    }
  }
}

async fn create(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqMetaData>,
) -> ApiResult {
  match meta::create(conn, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created meta {} ({}) by admin {} ({})",
        result.mid,
        result.name,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      if e.to_string().contains("already exists") {
        l_warn!(logger, "Meta name already exists");
        Err(ApiError::bad_request("Meta name already exists"))
      } else {
        l_error!(logger, "Failed to create meta: {}", e);
        Err(ApiError::internal("Failed to create meta"))
      }
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match meta::remove(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Deleted meta {} by admin {} ({})", id, admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete meta {}: {}", id, e);
      Err(ApiError::internal("Failed to delete meta"))
    }
  }
}
