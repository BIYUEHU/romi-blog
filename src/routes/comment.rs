use std::net::SocketAddr;

use axum::{
  Json, Router,
  extract::{ConnectInfo, Path, State},
  routing::{delete, get, post},
};
use http::HeaderMap;
use roga::*;

use crate::{
  app::RomiState,
  guards::{
    admin::AdminUser,
    auth::{Access, AuthUser},
  },
  models::comment::{ReqCommentData, ResCommentData},
  service::comment::{self, CommentError},
  utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
  Router::new()
    .route("/", get(list))
    .route("/post/{pid}", get(list_by_post))
    .route("/", post(create))
    .route("/{id}", delete(remove))
    .route("/remark/{id}/{status}", post(update_status))
}

async fn list(
  _admin_user: AdminUser,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
) -> ApiResult<Vec<ResCommentData>> {
  match comment::list(conn).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list comments: {:#}", e);
      Err(ApiError::internal("Failed to list comments"))
    }
  }
}

async fn list_by_post(
  Path(pid): Path<u32>,
  State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
  access: Access,
) -> ApiResult<Vec<ResCommentData>> {
  let current_uid = access.user.map(|user| user.id);
  match comment::list_by_post(conn, pid, current_uid).await {
    Ok(data) => api_ok(data),
    Err(e) => {
      l_error!(logger, "Failed to list comments for post {}: {:#}", pid, e);
      Err(ApiError::internal("Failed to list comments"))
    }
  }
}

async fn create(
  auth_user: AuthUser,
  ConnectInfo(addr): ConnectInfo<SocketAddr>,
  headers: HeaderMap,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
  Json(data): Json<ReqCommentData>,
) -> ApiResult {
  match comment::create(conn, auth_user.id, auth_user.is_admin, addr, headers, data).await {
    Ok(result) => {
      l_info!(
        logger,
        "Created comment {} for post {} by user {} ({})",
        result.cid,
        result.pid,
        auth_user.id,
        auth_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to create comment: {:#}", e);
      Err(ApiError::internal("Failed to create comment"))
    }
  }
}

async fn update_status(
  AdminUser(admin_user): AdminUser,
  Path((id, status)): Path<(u32, u8)>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  let status = match status {
    0 => 0,
    1 => 1,
    2 => 2,
    _ => return Err(ApiError::bad_request("Invalid status".to_string())),
  };
  match comment::update_status(conn, id, status).await {
    Ok(_) => {
      l_info!(
        logger,
        "Updated comment {} status to {} by admin {} ({})",
        id,
        status,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) => {
      l_error!(logger, "Failed to update comment {}: {:#}", id, e);
      Err(ApiError::internal("Failed to update comment"))
    }
  }
}

async fn remove(
  AdminUser(admin_user): AdminUser,
  Path(id): Path<u32>,
  State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
  match comment::remove(conn, id).await {
    Ok(comment) => {
      l_info!(
        logger,
        "Deleted comment {} of user {} for post {} by admin {} ({})",
        id,
        comment.uid,
        comment.pid,
        admin_user.id,
        admin_user.username
      );
      api_ok(())
    }
    Err(e) if e.downcast_ref::<CommentError>().is_some() => {
      l_warn!(logger, "Comment {} not found", id);
      Err(ApiError::not_found("Comment not found"))
    }
    Err(e) => {
      l_error!(logger, "Failed to delete comment {}: {:#}", id, e);
      Err(ApiError::internal("Failed to delete comment"))
    }
  }
}
