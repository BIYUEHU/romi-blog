use axum::{
  Json, Router,
  extract::{Path, State},
  routing::{delete, get, post, put},
};
use roga::*;

use crate::{
  app::RomiState,
  guards::admin::AdminUser,
  models::character::{ReqCharacterData, ResCharacterData},
  service::character,
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/", get(list))
    .route("/", post(create))
    .route("/{id}", get(fetch))
    .route("/{id}", put(update))
    .route("/{id}", delete(remove))
}

async fn list(
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResCharacterData>> {
  match character::list(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list characters: {}", e);
      Err(ApiError::internal("Failed to list characters"))
    }
  }
}

async fn fetch(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResCharacterData> {
  match character::get(conn, id).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "Character {} not found", id);
        Err(ApiError::not_found(format!("Character {} not found", id)))
      } else {
        l_error!(logger, "Failed to get character {}: {}", id, e);
        Err(ApiError::internal("Failed to get character"))
      }
    }
  }
}

async fn create(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqCharacterData>,
) -> ApiResult {
  match character::create(conn, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created character {} ({}) by admin {} ({})",
        result.id,
        result.name,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to create character: {}", e);
      Err(ApiError::internal("Failed to create character"))
    }
  }
}

async fn update(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqCharacterData>,
) -> ApiResult {
  match character::update(conn, id, data).await {
    Ok(_) => {
      l_info!(
        logger,
        "Updated character {} by admin {} ({})",
        id,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "Character {} not found", id);
        Err(ApiError::not_found(format!("Character {} not found", id)))
      } else {
        l_error!(logger, "Failed to update character {}: {}", id, e);
        Err(ApiError::internal("Failed to update character"))
      }
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match character::remove(conn, id).await {
    Ok(_) => {
      l_info!(
        logger,
        "Deleted character {} by admin {} ({})",
        id,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete character {}: {}", id, e);
      Err(ApiError::internal("Failed to delete character"))
    }
  }
}
