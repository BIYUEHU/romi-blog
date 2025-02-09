use crate::entity::{romi_comments, romi_users};
use crate::guards::admin::AdminUser;
use crate::guards::auth::AuthUser;
use crate::guards::client_info::ClientInfo;
use crate::models::comment::{ReqCommentData, ResCommentData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use futures::future::try_join_all;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, TryIntoModel};
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
) -> ApiResult<ResCommentData> {
    l_info!(
        logger,
        "Creating new comment: pid={}, uid={}",
        comment.pid,
        auth_user.id
    );
    let db = conn.into_inner();

    let ClientInfo { ip, user_agent } = client_info;

    let result = romi_comments::ActiveModel {
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
    .save(db)
    .await
    .context("Failed to create comment")?;

    let model = result.try_into_model().context("Model conversion failed")?;

    let user = romi_users::Entity::find_by_id(model.uid)
        .one(db)
        .await
        .context("Failed to fetch user for comment")?
        .ok_or_else(|| ApiError::not_found("User not found"))?;

    api_ok(ResCommentData {
        cid: model.cid,
        pid: model.pid,
        uid: model.uid,
        username: user.username,
        created: model.created,
        text: model.text,
        user_url: user.url,
    })
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

    romi_comments::Entity::delete_by_id(id)
        .exec(db)
        .await
        .with_context(|| format!("Failed to delete comment {}", id))?;

    api_ok(())
}
