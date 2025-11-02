use std::{collections::HashMap, net::SocketAddr};

use anyhow::Context;
use axum::{
    Json, Router,
    extract::{ConnectInfo, Path, State},
    routing::{delete, get, post},
};
use http::HeaderMap;
use migration::Expr;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, TransactionTrait,
    TryIntoModel,
};

use crate::{
    app::RomiState,
    entity::{romi_comments, romi_posts, romi_users},
    guards::{admin::AdminUser, auth::AuthUser},
    models::comment::{ReqCommentData, ResCommentData},
    utils::{
        api::{ApiError, ApiResult, api_ok},
        http::get_req_user_agent,
    },
};

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/post/{pid}", get(fetch_by_post))
        .route("/", post(create))
        .route("/{id}", delete(remove))
}

async fn fetch_all(
    _admin_user: AdminUser,
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<Vec<ResCommentData>> {
    let comments =
        romi_comments::Entity::find().all(conn).await.context("Failed to fetch comments")?;

    if comments.is_empty() {
        return api_ok(vec![]);
    }

    let user_ids: Vec<u32> = comments.iter().map(|c| c.uid).collect();
    let users = romi_users::Entity::find()
        .filter(romi_users::Column::Uid.is_in(user_ids))
        .all(conn)
        .await
        .context("Failed to fetch users")?;

    let user_map: HashMap<u32, &romi_users::Model> = users.iter().map(|u| (u.uid, u)).collect();

    api_ok(
        comments
            .iter()
            .filter_map(|comment| {
                user_map.get(&comment.uid).map(|user| ResCommentData {
                    cid: comment.cid,
                    pid: comment.pid,
                    uid: comment.uid,
                    username: user.username.clone(),
                    created: comment.created,
                    text: comment.text.clone(),
                    user_url: user.url.clone(),
                })
            })
            .collect(),
    )
}

async fn fetch_by_post(
    Path(pid): Path<u32>,
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<Vec<ResCommentData>> {
    let comments = romi_comments::Entity::find()
        .filter(romi_comments::Column::Pid.eq(pid))
        .all(conn)
        .await
        .with_context(|| format!("Failed to fetch comments for post {}", pid))?;

    if comments.is_empty() {
        return api_ok(vec![]);
    }

    let user_ids: Vec<u32> = comments.iter().map(|c| c.uid).collect();
    let users = romi_users::Entity::find()
        .filter(romi_users::Column::Uid.is_in(user_ids))
        .all(conn)
        .await
        .context("Failed to fetch users")?;
    let user_map: HashMap<u32, &romi_users::Model> = users.iter().map(|u| (u.uid, u)).collect();

    api_ok(
        comments
            .iter()
            .filter_map(|comment| {
                user_map.get(&comment.uid).map(|user| ResCommentData {
                    cid: comment.cid,
                    pid: comment.pid,
                    uid: comment.uid,
                    username: user.username.clone(),
                    created: comment.created,
                    text: comment.text.clone(),
                    user_url: user.url.clone(),
                })
            })
            .collect(),
    )
}

async fn create(
    auth_user: AuthUser,
    ConnectInfo(addr): ConnectInfo<SocketAddr>,
    headers: HeaderMap,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(comment): Json<ReqCommentData>,
) -> ApiResult {
    let txn = conn.begin().await.context("Failed to start transaction")?;

    let comment_model = romi_comments::ActiveModel {
        cid: ActiveValue::not_set(),
        pid: ActiveValue::set(comment.pid),
        uid: ActiveValue::set(auth_user.id),
        created: ActiveValue::set(
            std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs()
                as u32,
        ),
        ip: ActiveValue::set(addr.ip().to_string()),
        ua: ActiveValue::set(get_req_user_agent(&headers).unwrap_or_default().to_string()),
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
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
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
