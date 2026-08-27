use std::{collections::HashMap, net::SocketAddr};

use anyhow::{Context, Result};
use http::HeaderMap;
use md5::compute;
use migration::Expr;
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter,
  TransactionTrait, TryIntoModel,
};

use crate::{
  entity::{romi_comments, romi_posts, romi_users},
  models::comment::{ReqCommentData, ResCommentData},
  utils::http::get_req_user_agent,
};

#[derive(Debug, thiserror::Error)]
pub enum CommentError {
  #[error("Comment not found")]
  NotFound,
}

pub async fn list(db: &DatabaseConnection) -> Result<Vec<ResCommentData>> {
  let comments = romi_comments::Entity::find().all(db).await.context("Failed to fetch comments")?;

  if comments.is_empty() {
    return Ok(vec![]);
  }

  let user_ids: Vec<u32> = comments.iter().map(|c| c.uid).collect();
  let users = romi_users::Entity::find()
    .filter(romi_users::Column::Uid.is_in(user_ids))
    .all(db)
    .await
    .context("Failed to fetch users")?;

  let user_map: HashMap<u32, &romi_users::Model> = users.iter().map(|u| (u.uid, u)).collect();

  Ok(
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
          avatar_hash: format!("{:x}", compute(user.email.trim().to_lowercase().as_bytes())),
          status: comment.status,
        })
      })
      .collect(),
  )
}

pub async fn list_by_post(
  db: &DatabaseConnection,
  pid: u32,
  current_uid: Option<u32>,
) -> Result<Vec<ResCommentData>> {
  let comments = romi_comments::Entity::find()
    .filter(romi_comments::Column::Pid.eq(pid))
    .all(db)
    .await
    .with_context(|| format!("Failed to fetch comments for post {}", pid))?;

  if comments.is_empty() {
    return Ok(vec![]);
  }

  let user_ids: Vec<u32> = comments.iter().map(|c| c.uid).collect();
  let users = romi_users::Entity::find()
    .filter(romi_users::Column::Uid.is_in(user_ids))
    .all(db)
    .await
    .context("Failed to fetch users")?;
  let user_map: HashMap<u32, &romi_users::Model> = users.iter().map(|u| (u.uid, u)).collect();

  Ok(
    comments
      .iter()
      .filter_map(|comment| {
        if comment.status == 0
          || (comment.status == 1 && current_uid.map(|uid| uid == comment.uid).unwrap_or(false))
        {
          user_map.get(&comment.uid).map(|user| ResCommentData {
            cid: comment.cid,
            pid: comment.pid,
            uid: comment.uid,
            username: user.username.clone(),
            created: comment.created,
            text: comment.text.clone(),
            user_url: user.url.clone(),
            avatar_hash: format!("{:x}", compute(user.email.trim().to_lowercase().as_bytes())),
            status: comment.status,
          })
        } else {
          None
        }
      })
      .collect(),
  )
}

pub async fn create(
  db: &DatabaseConnection,
  uid: u32,
  is_admin: bool,
  addr: SocketAddr,
  headers: HeaderMap,
  data: ReqCommentData,
) -> Result<romi_comments::Model> {
  let txn = db.begin().await.context("Failed to start transaction")?;

  let comment_model = romi_comments::ActiveModel {
    cid: ActiveValue::not_set(),
    pid: ActiveValue::set(data.pid),
    uid: ActiveValue::set(uid),
    created: ActiveValue::set(
      std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs() as u32,
    ),
    ip: ActiveValue::set(addr.ip().to_string()),
    ua: ActiveValue::set(get_req_user_agent(&headers).unwrap_or_default().to_string()),
    text: ActiveValue::set(data.text.clone()),
    status: ActiveValue::set(if is_admin { 0 } else { 1 }),
  }
  .insert(&txn)
  .await
  .context("Failed to create comment")?;

  romi_posts::Entity::update_many()
    .col_expr(romi_posts::Column::Comments, Expr::col(romi_posts::Column::Comments).add(1))
    .filter(romi_posts::Column::Pid.eq(data.pid))
    .exec(&txn)
    .await
    .with_context(|| format!("Failed to update post {} comment count", data.pid))?;

  txn.commit().await.context("Failed to commit transaction")?;

  let result = comment_model.try_into_model().context("Failed to convert model")?;
  Ok(result)
}

pub async fn update_status(db: &DatabaseConnection, id: u32, status: u8) -> Result<()> {
  let txn = db.begin().await.context("Failed to start transaction")?;

  romi_comments::Entity::update_many()
    .col_expr(romi_comments::Column::Status, Expr::value(status))
    .filter(romi_comments::Column::Cid.eq(id))
    .exec(&txn)
    .await
    .with_context(|| format!("Failed to update comment {}", id))?;

  txn.commit().await.context("Failed to commit transaction")?;
  Ok(())
}

pub async fn remove(db: &DatabaseConnection, id: u32) -> Result<romi_comments::Model> {
  let txn = db.begin().await.context("Failed to start transaction")?;

  let comment = romi_comments::Entity::find_by_id(id)
    .one(&txn)
    .await
    .with_context(|| format!("Failed to fetch comment {}", id))?
    .ok_or(CommentError::NotFound)?;

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
  Ok(comment)
}
