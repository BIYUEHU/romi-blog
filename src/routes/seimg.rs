use axum::{
  Json, Router,
  extract::{Path, Query, State},
  routing::{delete, get, post, put},
};
use roga::*;
use std::collections::HashMap;

use crate::{
  app::RomiState,
  guards::admin::AdminUser,
  models::seimg::{ReqSeimgData, ResSeimgData},
  service::seimg::{self, SeimgError},
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/", get(list))
    .route("/", post(create))
    .route("/{id}", put(update))
    .route("/{id}", delete(remove))
}

async fn list(
  Query(params): Query<HashMap<String, String>>,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResSeimgData>> {
  let limit = params.get("limit").and_then(|l| l.parse().ok()).unwrap_or(1).clamp(1, 10) as u32;
  let tag = params.get("tag").cloned();
  let r18 = params.get("r18").cloned();

  match seimg::list(conn, limit, tag, r18).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list seimgs: {:#}", e);
      Err(ApiError::internal("Failed to list seimgs"))
    }
  }
}

async fn create(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqSeimgData>,
) -> ApiResult {
  match seimg::create(conn, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created seimg id {} ({}) by admin {} ({})",
        result.id,
        result.title,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to create seimg: {:#}", e);
      Err(ApiError::internal("Failed to create seimg"))
    }
  }
}

async fn update(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqSeimgData>,
) -> ApiResult {
  match seimg::update(conn, id, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Updated seimg {} ({}) by admin {} ({})",
        id,
        result.title,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) if e.downcast_ref::<SeimgError>().is_some() => {
      l_warn!(logger, "Seimg {} not found", id);
      Err(ApiError::not_found(format!("Seimg {} not found", id)))
    }
    Err(e) => {
      l_error!(logger, "Failed to update seimg {}: {:#}", id, e);
      Err(ApiError::internal("Failed to update seimg"))
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match seimg::remove(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Removed seimg {} by admin {} ({})", id, admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to remove seimg {}: {:#}", id, e);
      Err(ApiError::internal("Failed to remove seimg"))
    }
  }
}
