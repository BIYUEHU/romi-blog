use axum::{
  Json, Router,
  extract::{Path, State},
  routing::{delete, get, post, put},
};
use roga::*;

use crate::{
  app::RomiState,
  guards::{admin::AdminUser, auth::Access},
  models::post::{
    ReqDecryptPostData, ReqPostData, ResDecryptPostData, ResPostData, ResPostSingleData,
  },
  service::post::{self, PostError},
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/", get(list))
    .route("/", post(create))
    .route("/str_id/{str_id}", get(get_by_str_id))
    .route("/{id}", get(fetch))
    .route("/{id}", put(update))
    .route("/like/{id}", put(like))
    .route("/view/{id}", put(view))
    .route("/{id}", delete(remove))
    .route("/decrypt/{id}", post(decrypt))
}

async fn list(
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
  access: Access,
) -> ApiResult<Vec<ResPostData>> {
  match post::list(conn, access.level).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list posts: {:#}", e);
      Err(ApiError::internal("Failed to list posts"))
    }
  }
}

async fn fetch(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  access: Access,
) -> ApiResult<ResPostSingleData> {
  match post::get_by_id(conn, id, access.level).await {
    Ok(data) => api_ok(data),
    Err(e) if e.downcast_ref::<PostError>().is_some() => {
      l_warn!(logger, "Post {} not found", id);
      Err(ApiError::not_found("Post not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to get post {}: {:#}", id, e);
      Err(ApiError::internal("Failed to get post"))
    }
  }
}

async fn get_by_str_id(
  Path(str_id): Path<String>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  access: Access,
) -> ApiResult<ResPostSingleData> {
  match post::get_by_str_id(conn, str_id.clone(), access.level).await {
    Ok(data) => api_ok(data),
    Err(e) if e.downcast_ref::<PostError>().is_some() => {
      l_warn!(logger, "Post with str_id {} not found", str_id);
      Err(ApiError::not_found("Post not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to get post by str_id {}: {:#}", str_id, e);
      Err(ApiError::internal("Failed to get post"))
    }
  }
}

async fn create(
  AdminUser(admin_user): AdminUser,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqPostData>,
) -> ApiResult {
  match post::create(conn, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created post {} ({}) by admin {} ({})",
        result.pid,
        result.title,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to create post: {:#}", e);
      Err(ApiError::internal("Failed to create post"))
    }
  }
}

async fn update(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqPostData>,
) -> ApiResult {
  match post::update(conn, id, data).await {
    Ok(_) => {
      l_info!(logger, "Updated post {} by admin {} ({})", id, admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) if e.downcast_ref::<PostError>().is_some() => {
      l_warn!(logger, "Post {} not found", id);
      Err(ApiError::not_found("Post not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to update post {}: {:#}", id, e);
      Err(ApiError::internal("Failed to update post"))
    }
  }
}

async fn like(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match post::like(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Liked post {}", id);
      api_ok(())
    }
    Err(e) if e.downcast_ref::<PostError>().is_some() => {
      l_warn!(logger, "Post {} not found", id);
      Err(ApiError::not_found("Post not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to like post {}: {:#}", id, e);
      Err(ApiError::internal("Failed to like post"))
    }
  }
}

async fn view(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match post::view(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Viewed post {}", id);
      api_ok(())
    }
    Err(e) if e.downcast_ref::<PostError>().is_some() => {
      l_warn!(logger, "Post {} not found", id);
      Err(ApiError::not_found("Post not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to view post {}: {:#}", id, e);
      Err(ApiError::internal("Failed to view post"))
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match post::remove(conn, id).await {
    Ok(_) => {
      l_info!(logger, "Deleted post {} by admin {} ({})", id, admin_user.id, admin_user.username);
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to delete post {}: {:#}", id, e);
      Err(ApiError::internal("Failed to delete post"))
    }
  }
}

async fn decrypt(
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqDecryptPostData>,
) -> ApiResult<ResDecryptPostData> {
  match post::decrypt(conn, id, data.password).await {
    Ok(result) => api_ok(result),
    Err(e) if matches!(e.downcast_ref::<PostError>(), Some(PostError::NotPasswordProtected)) => {
      l_warn!(logger, "Post {} is not password protected", id);
      Err(ApiError::bad_request("Post is not password protected"))
    }
    Err(e) if matches!(e.downcast_ref::<PostError>(), Some(PostError::IncorrectPassword)) => {
      l_warn!(logger, "Incorrect password for post {}", id);
      Err(ApiError::unauthorized("Incorrect password"))
    }
    Err(e) if matches!(e.downcast_ref::<PostError>(), Some(PostError::NotFound)) => {
      l_warn!(logger, "Post {} not found", id);
      Err(ApiError::not_found("Post not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to decrypt post {}: {:#}", id, e);
      Err(ApiError::internal("Failed to decrypt post"))
    }
  }
}
