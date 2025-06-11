use crate::entity::{romi_comments, romi_posts, romi_users};
use crate::guards::admin::AdminUser;
use crate::guards::auth::AuthUser;
use crate::guards::client_info::ClientInfo;
use crate::models::comment::{ReqCommentData, ResCommentData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::service::pool::Db;
use anyhow::Context;
use futures::future::try_join_all;
use migration::Expr;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, TransactionTrait,
};
use sea_orm_rocket::Connection;

#[get("/")]
pub async fn fetch_all(
    _admin_user: AdminUser,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResCommentData>> {
    l_info!(logger, "Fetching all comments");
    let db = conn.into_inner();
    try_join_all(
        romi_comments::Entity::find()
            .all(db)
            .await
            .context("Failed to fetch comments")?
            .iter()
            .map(|comment| async {
                let user = romi_users::Entity::find_by_id(comment.clone().uid)
                    .one(db)
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
                .ok_or_else(|| ApiError::not_found("User not found"))
            }),
    )
    .await
    .map(api_ok)?
}

#[get("/<pid>")]
pub async fn fetch_by_post(
    pid: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResCommentData>> {
    l_info!(logger, "Fetching comments for post {}", pid);
    let db = conn.into_inner();

    futures::future::try_join_all(
        romi_comments::Entity::find()
            .filter(romi_comments::Column::Pid.eq(pid))
            .all(db)
            .await
            .with_context(|| format!("Failed to fetch comments for post {}", pid))?
            .iter()
            .map(|comment| async {
                let user = romi_users::Entity::find_by_id(comment.uid)
                    .one(db)
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
                .ok_or_else(|| ApiError::not_found("User not found"))
            }),
    )
    .await
    .map(api_ok)?
}

#[post("/", data = "<comment>")]
pub async fn create(
    auth_user: AuthUser,
    client_info: ClientInfo,
    comment: Json<ReqCommentData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<()> {
    l_info!(
        logger,
        "Creating new comment: pid={}, uid={}",
        comment.pid,
        auth_user.id
    );
    let db = conn.into_inner();

    let txn = db.begin().await.context("Failed to start transaction")?;

    let ClientInfo { ip, user_agent } = client_info;
    romi_comments::ActiveModel {
        cid: ActiveValue::not_set(),
        pid: ActiveValue::set(comment.pid),
        uid: ActiveValue::set(auth_user.id),
        created: ActiveValue::set(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_secs() as u32,
        ),
        ip: ActiveValue::set(ip),
        ua: ActiveValue::set(user_agent),
        text: ActiveValue::set(comment.text.clone()),
    }
    .save(&txn)
    .await
    .context("Failed to create comment")?;

    romi_posts::Entity::update_many()
        .col_expr(
            romi_posts::Column::Comments,
            Expr::col(romi_posts::Column::Comments).add(1),
        )
        .filter(romi_posts::Column::Pid.eq(comment.pid))
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to update post {} comment count", comment.pid))?;

    txn.commit().await.context("Failed to commit transaction")?;

    romi_users::Entity::find_by_id(auth_user.id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch user {}", auth_user.id))?
        .ok_or_else(|| ApiError::not_found("User not found"))?;

    api_ok(())
}

#[delete("/<id>")]
pub async fn delete(
    _admin_user: AdminUser,
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<()> {
    l_info!(logger, "Deleting comment: id={}", id);
    let db = conn.into_inner();

    let txn = db.begin().await.context("Failed to start transaction")?;

    let comment = romi_comments::Entity::find_by_id(id)
        .one(&txn)
        .await
        .with_context(|| format!("Failed to fetch comment {}", id))?
        .ok_or_else(|| ApiError::not_found("Comment not found"))?;

    romi_comments::Entity::delete_by_id(id)
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete comment {}", id))?;

    romi_posts::Entity::update_many()
        .col_expr(
            romi_posts::Column::Comments,
            Expr::col(romi_posts::Column::Comments).sub(1),
        )
        .filter(romi_posts::Column::Pid.eq(comment.pid))
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to update post {} comment count", comment.pid))?;

    txn.commit().await.context("Failed to commit transaction")?;
    api_ok(())
}
