use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post},
};
use futures::future::try_join_all;
use migration::Expr;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, TransactionTrait,
    TryIntoModel,
};

use crate::{
    app::AppState,
    entity::{romi_comments, romi_posts, romi_users},
    guards::{admin::AdminUser, auth::AuthUser, client_info::ClientInfo},
    models::comment::{ReqCommentData, ResCommentData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/post/{pid}", get(fetch_by_post))
        .route("/", post(create))
        .route("/{id}", delete(remove))
}

// TODO
async fn fetch_all(
    _admin_user: AdminUser,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
) -> ApiResult<Vec<ResCommentData>> {
    try_join_all(
        romi_comments::Entity::find()
            .all(conn)
            .await
            .context("Failed to fetch comments")?
            .iter()
            .map(|comment| async {
                let user = romi_users::Entity::find_by_id(comment.clone().uid)
                    .one(conn)
                    .await
                    .with_context(|| format!("User {} not found for comment", comment.uid))?;

                user.map(|user| ResCommentData {
                    cid: comment.cid,
                    pid: comment.pid,
                    uid: comment.uid,
                    username: user.username,
                    created: comment.created,
                    text: comment.clone().text,
                    user_url: user.url,
                })
                .ok_or_else(|| {
                    l_warn!(logger, "User not found for comment {}", comment.cid);
                    ApiError::not_found("User not found")
                })
            }),
    )
    .await
    .map(api_ok)?
}

// TODO
async fn fetch_by_post(
    Path(pid): Path<u32>,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
) -> ApiResult<Vec<ResCommentData>> {
    try_join_all(
        romi_comments::Entity::find()
            .filter(romi_comments::Column::Pid.eq(pid))
            .all(conn)
            .await
            .with_context(|| format!("Failed to fetch comments for post {}", pid))?
            .iter()
            .map(|comment| async {
                let user = romi_users::Entity::find_by_id(comment.uid)
                    .one(conn)
                    .await
                    .with_context(|| format!("Failed to fetch user {} for comment", comment.uid))?;

                user.map(|user| ResCommentData {
                    cid: comment.cid,
                    pid: comment.pid,
                    uid: comment.uid,
                    username: user.username,
                    created: comment.created,
                    text: comment.clone().text,
                    user_url: user.url,
                })
                .ok_or_else(|| {
                    l_warn!(logger, "User not found for comment {}", comment.cid);
                    ApiError::not_found("User not found")
                })
            }),
    )
    .await
    .map(api_ok)?
}

async fn create(
    auth_user: AuthUser,
    client_info: ClientInfo,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
    Json(comment): Json<ReqCommentData>,
) -> ApiResult {
    let txn = conn.begin().await.context("Failed to start transaction")?;

    let ClientInfo { ip, user_agent } = client_info;
    let comment_model = romi_comments::ActiveModel {
        cid: ActiveValue::not_set(),
        pid: ActiveValue::set(comment.pid),
        uid: ActiveValue::set(auth_user.id),
        created: ActiveValue::set(
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()
                as u32,
        ),
        ip: ActiveValue::set(ip),
        ua: ActiveValue::set(user_agent),
        text: ActiveValue::set(comment.text.clone()),
    }
    .save(&txn)
    .await
    .context("Failed to create comment")?;

    romi_posts::Entity::update_many()
        .col_expr(romi_posts::Column::Comments, Expr::col(romi_posts::Column::Comments).add(1))
        .filter(romi_posts::Column::Pid.eq(comment.pid))
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to update post {} comment count", comment.pid))?;

    txn.commit().await.context("Failed to commit transaction")?;

    let result = comment_model.try_into_model().context("Failed to convert model")?;
    l_info!(
        logger,
        "Created comment {} for post {} by user {} ({})",
        result.cid,
        comment.pid,
        auth_user.id,
        auth_user.username
    );

    api_ok(())
}

async fn remove(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
) -> ApiResult {
    let txn = conn.begin().await.context("Failed to start transaction")?;

    let comment = romi_comments::Entity::find_by_id(id)
        .one(&txn)
        .await
        .with_context(|| format!("Failed to fetch comment {}", id))?
        .ok_or_else(|| {
            l_warn!(logger, "Comment {} not found", id);
            ApiError::not_found("Comment not found")
        })?;

    romi_comments::Entity::delete_by_id(id)
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete comment {}", id))?;

    romi_posts::Entity::update_many()
        .col_expr(romi_posts::Column::Comments, Expr::col(romi_posts::Column::Comments).sub(1))
        .filter(romi_posts::Column::Pid.eq(comment.pid))
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to update post {} comment count", comment.pid))?;

    txn.commit().await.context("Failed to commit transaction")?;

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
