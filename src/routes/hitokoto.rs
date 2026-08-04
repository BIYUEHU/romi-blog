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
  models::hitokoto::{ReqHitokoto2Data, ReqHitokotoData, ResHitokoto2Data, ResHitokotoData},
  service::hitokoto,
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/", get(get_random))
    .route("/", post(create))
    .route("/{id}", get(get_by_id))
    .route("/{id}", put(update))
    .route("/{id}", delete(remove))
    .route("/like/{id}", put(like))
    .route("/public", get(list_public))
    .route("/all", get(list_all))
    .route("/new", get(get_random2))
    .route("/new/all", get(list_all2))
    .route("/new", post(create2))
    .route("/new/{uuid}", put(update2))
    .route("/new/{uuid}", delete(remove2))
}

async fn get_random(
  Query(params): Query<HashMap<String, String>>,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<ResHitokotoData> {
  let length = params.get("length").and_then(|s| s.parse().ok());
  match hitokoto::get_random(conn, length).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      if e.to_string().contains("No hitokoto found") {
        l_warn!(logger, "No hitokoto found");
        Err(ApiError::not_found("No hitokoto found"))
      } else {
        l_error!(logger, "Failed to get hitokoto: {}", e);
        Err(ApiError::internal("Failed to get hitokoto"))
      }
    }
  }
}

async fn get_by_id(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResHitokotoData> {
  match hitokoto::get_by_id(conn, id).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "Hitokoto {} not found", id);
        Err(ApiError::not_found(format!("Hitokoto {} not found", id)))
      } else {
        l_error!(logger, "Failed to get hitokoto {}: {}", id, e);
        Err(ApiError::internal("Failed to get hitokoto"))
      }
    }
  }
}

async fn list_public(
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResHitokotoData>> {
  match hitokoto::list_public(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list public hitokotos: {}", e);
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
      l_error!(logger, "Failed to list hitokotos: {}", e);
      Err(ApiError::internal("Failed to list hitokotos"))
    }
  }
}
async fn create(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqHitokotoData>,
) -> ApiResult {
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
      l_error!(logger, "Failed to create hitokoto: {}", e);
      Err(ApiError::internal("Failed to create hitokoto"))
    }
  }
}

async fn update(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqHitokotoData>,
) -> ApiResult {
  match hitokoto::update(conn, id, data).await {
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
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "Hitokoto {} not found", id);
        Err(ApiError::not_found(format!("Hitokoto {} not found", id)))
      } else {
        l_error!(logger, "Failed to update hitokoto {}: {}", id, e);
        Err(ApiError::internal("Failed to update hitokoto"))
      }
    }
  }
}

async fn like(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match hitokoto::like(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Liked hitokoto {}", id);
      api_ok(())
    }
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "Hitokoto {} not found", id);
        Err(ApiError::not_found("Hitokoto not found"))
      } else {
        l_error!(logger, "Failed to like hitokoto {}: {}", id, e);
        Err(ApiError::internal("Failed to like hitokoto"))
      }
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match hitokoto::remove(conn, id).await {
    Ok(_) => {
      l_info!(
        logger,
        "Deleted hitokoto {} by admin {} ({})",
        id,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete hitokoto {}: {}", id, e);
      Err(ApiError::internal("Failed to delete hitokoto"))
    }
  }
}

// hitokoto2
async fn get_random2(
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<ResHitokoto2Data> {
  match hitokoto::get_random2(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      if e.to_string().contains("No hitokoto2 found") {
        l_warn!(logger, "No hitokoto2 found");
        Err(ApiError::not_found("No hitokoto2 found"))
      } else {
        l_error!(logger, "Failed to get hitokoto2: {}", e);
        Err(ApiError::internal("Failed to get hitokoto2"))
      }
    }
  }
}
async fn list_all2(
  _admin_user: AdminUser,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResHitokoto2Data>> {
  match hitokoto::list_all2(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list hitokotos2: {}", e);
      Err(ApiError::internal("Failed to list hitokotos2"))
    }
  }
}
async fn create2(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqHitokoto2Data>,
) -> ApiResult {
  match hitokoto::create2(conn, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created hitokoto2 {} by admin {} ({})",
        result.id,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to create hitokoto2: {}", e);
      Err(ApiError::internal("Failed to create hitokoto2"))
    }
  }
}

async fn update2(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqHitokoto2Data>,
) -> ApiResult {
  match hitokoto::update2(conn, id, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Updated hitokoto2 {} by admin {} ({})",
        result.id,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "Hitokoto2 {} not found", id);
        Err(ApiError::not_found(format!("Hitokoto2 {} not found", id)))
      } else {
        l_error!(logger, "Failed to update hitokoto2 {}: {}", id, e);
        Err(ApiError::internal("Failed to update hitokoto2"))
      }
    }
  }
}

async fn remove2(
  AdminUser(admin_user): AdminUser,
  Path(uuid): Path<String>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match hitokoto::remove2(conn, uuid.clone()).await {
    Ok(_) => {
      l_info!(
        logger,
        "Deleted hitokoto2 {} by admin {} ({})",
        uuid,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete hitokoto2 {}: {}", uuid, e);
      Err(ApiError::internal("Failed to delete hitokoto2"))
    }
  }
}
