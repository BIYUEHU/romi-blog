use axum::{
  Json, Router,
  extract::{Path, State},
  routing::{delete, get, post, put},
};
use roga::*;

use crate::{
  app::RomiState,
  guards::{
    admin::AdminUser,
    auth::{Access, AccessLevel},
  },
  models::news::{ReqNewsData, ResNewsData},
  service::news,
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/", get(list))
    .route("/", post(create))
    .route("/{id}", get(fetch))
    .route("/{id}", put(update))
    .route("/{id}", delete(remove))
    .route("/like/{id}", put(like))
    .route("/view/{id}", put(view))
}

async fn list(
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
  access: Access,
) -> ApiResult<Vec<ResNewsData>> {
  let is_admin = access.level == AccessLevel::Admin;
  match news::list(conn, is_admin).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list news: {}", e);
      Err(ApiError::internal("Failed to list news"))
    }
  }
}

async fn fetch(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  access: Access,
) -> ApiResult<ResNewsData> {
  let is_admin = access.level == AccessLevel::Admin;
  match news::get(conn, id, is_admin).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      if e.to_string().contains("not found") || e.to_string().contains("private") {
        l_warn!(logger, "News {} not found or private", id);
        Err(ApiError::not_found("News not found"))
      } else {
        l_error!(logger, "Failed to get news {}: {}", id, e);
        Err(ApiError::internal("Failed to get news"))
      }
    }
  }
}

async fn create(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqNewsData>,
) -> ApiResult {
  match news::create(conn, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created news {} by admin {} ({})",
        result.nid,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to create news: {}", e);
      Err(ApiError::internal("Failed to create news"))
    }
  }
}

async fn update(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqNewsData>,
) -> ApiResult {
  match news::update(conn, id, data).await {
    Ok(_) => {
      l_info!(logger, "Updated news {} by admin {} ({})", id, admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "News {} not found", id);
        Err(ApiError::not_found("News not found"))
      } else {
        l_error!(logger, "Failed to update news {}: {}", id, e);
        Err(ApiError::internal("Failed to update news"))
      }
    }
  }
}

async fn like(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match news::like(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Liked news {}", id);
      api_ok(())
    }
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "News {} not found", id);
        Err(ApiError::not_found("News not found"))
      } else {
        l_error!(logger, "Failed to like news {}: {}", id, e);
        Err(ApiError::internal("Failed to like news"))
      }
    }
  }
}

async fn view(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match news::view(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Viewed news {}", id);
      api_ok(())
    }
    Err(e) => {
      if e.to_string().contains("not found") {
        l_warn!(logger, "News {} not found", id);
        Err(ApiError::not_found("News not found"))
      } else {
        l_error!(logger, "Failed to view news {}: {}", id, e);
        Err(ApiError::internal("Failed to view news"))
      }
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match news::remove(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Deleted news {} by admin {} ({})", id, admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete news {}: {}", id, e);
      Err(ApiError::internal("Failed to delete news"))
    }
  }
}
