use anyhow::{Context, Result};
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
  QueryFilter, QueryOrder,
};

use crate::entity::romi_news;
use crate::models::news::{ReqNewsData, ResNewsData};

#[derive(Debug, thiserror::Error)]
pub enum NewsError {
  #[error("News not found")]
  NotFound,
  #[error("News is private")]
  Private,
}

pub async fn list(db: &DatabaseConnection, is_admin: bool) -> Result<Vec<ResNewsData>> {
  let mut query = romi_news::Entity::find();
  if !is_admin {
    query = query.filter(romi_news::Column::Private.eq("0"));
  }

  let news =
    query.order_by_desc(romi_news::Column::Created).all(db).await.context("Failed to list news")?;

  Ok(
    news
      .into_iter()
      .map(|item| ResNewsData {
        id: item.nid,
        created: item.created,
        modified: item.modified,
        text: item.text,
        private: item.private == "1",
        views: item.views,
        likes: item.likes,
        comments: item.comments,
        imgs: item.imgs.map(|s| s.split(',').map(|i| i.to_string()).collect()).unwrap_or_default(),
      })
      .collect(),
  )
}

pub async fn get(db: &DatabaseConnection, id: u32, is_admin: bool) -> Result<ResNewsData> {
  let item = romi_news::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to get news")?
    .ok_or(NewsError::NotFound)?;

  if item.private == "1" && !is_admin {
    return Err(NewsError::Private.into());
  }

  Ok(ResNewsData {
    id: item.nid,
    created: item.created,
    modified: item.modified,
    text: item.text,
    private: item.private == "1",
    views: item.views,
    likes: item.likes,
    comments: item.comments,
    imgs: item.imgs.map(|s| s.split(',').map(|i| i.to_string()).collect()).unwrap_or_default(),
  })
}

pub async fn create(db: &DatabaseConnection, data: ReqNewsData) -> Result<romi_news::Model> {
  let active = romi_news::ActiveModel {
    nid: ActiveValue::not_set(),
    created: ActiveValue::set(data.created),
    modified: ActiveValue::set(data.modified),
    text: ActiveValue::set(data.text),
    private: ActiveValue::set(if data.private { "1" } else { "0" }.to_string()),
    views: ActiveValue::set(0),
    likes: ActiveValue::set(0),
    comments: ActiveValue::set(0),
    imgs: ActiveValue::set(Some(data.imgs.join(","))),
  };

  active.insert(db).await.context("Failed to create news")
}

pub async fn update(db: &DatabaseConnection, id: u32, data: ReqNewsData) -> Result<()> {
  let model = romi_news::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to get news")?
    .ok_or(NewsError::NotFound)?;

  let mut active = model.into_active_model();
  active.created = ActiveValue::set(data.created);
  active.modified = ActiveValue::set(data.modified);
  active.text = ActiveValue::set(data.text);
  active.private = ActiveValue::set(if data.private { "1" } else { "0" }.to_string());
  active.imgs = ActiveValue::set(Some(data.imgs.join(",")));

  active.update(db).await.context("Failed to update news")?;
  Ok(())
}

pub async fn like(db: &DatabaseConnection, id: u32) -> Result<()> {
  let model = romi_news::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to get news")?
    .ok_or(NewsError::NotFound)?;

  let likes = model.likes + 1;
  let mut active = model.into_active_model();
  active.likes = ActiveValue::set(likes);

  active.update(db).await.context("Failed to like news")?;
  Ok(())
}

pub async fn view(db: &DatabaseConnection, id: u32) -> Result<()> {
  let model = romi_news::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to get news")?
    .ok_or(NewsError::NotFound)?;

  let views = model.views + 1;
  let mut active = model.into_active_model();
  active.views = ActiveValue::set(views);

  active.update(db).await.context("Failed to view news")?;
  Ok(())
}

pub async fn remove(db: &DatabaseConnection, id: u32) -> Result<()> {
  romi_news::Entity::delete_by_id(id).exec(db).await.context("Failed to remove news")?;
  Ok(())
}
