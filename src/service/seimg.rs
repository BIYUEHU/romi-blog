use anyhow::{Context, Result};
use sea_orm::DbBackend;
use sea_orm::Statement;
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait, IntoActiveModel};

use crate::entity::romi_seimgs;
use crate::models::seimg::{ReqSeimgData, ResSeimgData};

pub async fn list(
  db: &DatabaseConnection,
  limit: u32,
  tag: Option<String>,
  r18: Option<String>,
) -> Result<Vec<ResSeimgData>> {
  let mut conditions = Vec::new();

  if let Some(r18_str) = r18 {
    let r18_val = if r18_str == "true" { 1 } else { 0 };
    conditions.push(format!("r18 = {}", r18_val));
  }

  if let Some(tag_str) = tag {
    let tags: Vec<String> =
      tag_str.split('|').filter(|s| !s.trim().is_empty()).map(|s| s.trim().to_string()).collect();

    if !tags.is_empty() {
      let tag_sqls: Vec<String> =
        tags.iter().map(|t| format!("tags LIKE '%{}%'", t.replace('\'', "''"))).collect();
      conditions.push(format!("({})", tag_sqls.join(" OR ")));
    }
  }

  let mut sql = String::from("SELECT * FROM romi_seimgs");

  if !conditions.is_empty() {
    sql.push_str(" WHERE ");
    sql.push_str(&conditions.join(" AND "));
  }

  sql.push_str(&format!(" ORDER BY RAND() LIMIT {}", limit));

  let results = romi_seimgs::Entity::find()
    .from_raw_sql(Statement::from_string(DbBackend::MySql, sql))
    .all(db)
    .await
    .context("Failed to fetch seimgs")?;

  Ok(
    results
      .into_iter()
      .map(|img| ResSeimgData {
        pid: img.pixiv_pid,
        uid: img.pixiv_uid,
        title: img.title,
        author: img.author,
        r18: img.r18 == "1",
        tags: img.tags.unwrap_or_default().split(',').map(str::to_string).collect(),
        width: img.width,
        height: img.height,
        r#type: img.r#type,
        url: img.url,
      })
      .collect(),
  )
}

pub async fn create(db: &DatabaseConnection, data: ReqSeimgData) -> Result<romi_seimgs::Model> {
  let active = romi_seimgs::ActiveModel {
    id: ActiveValue::not_set(),
    pixiv_pid: ActiveValue::set(data.pixiv_pid),
    pixiv_uid: ActiveValue::set(data.pixiv_uid),
    title: ActiveValue::set(data.title),
    author: ActiveValue::set(data.author),
    r18: ActiveValue::set(if data.r18 { 1 } else { 0 }.to_string()),
    tags: ActiveValue::set(Some(data.tags.join(","))),
    width: ActiveValue::set(data.width),
    height: ActiveValue::set(data.height),
    r#type: ActiveValue::set(data.r#type),
    url: ActiveValue::set(data.url),
  };

  active.insert(db).await.context("Failed to create seimg")
}

pub async fn update(
  db: &DatabaseConnection,
  id: u32,
  data: ReqSeimgData,
) -> Result<romi_seimgs::Model> {
  let model = romi_seimgs::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to find seimg")?
    .ok_or_else(|| anyhow::anyhow!("Seimg not found"))?;

  let mut active = model.into_active_model();
  active.title = ActiveValue::set(data.title);
  active.author = ActiveValue::set(data.author);
  active.r18 = ActiveValue::set(if data.r18 { 1 } else { 0 }.to_string());
  active.tags = ActiveValue::set(Some(data.tags.join(",")));
  active.width = ActiveValue::set(data.width);
  active.height = ActiveValue::set(data.height);
  active.r#type = ActiveValue::set(data.r#type);
  active.url = ActiveValue::set(data.url);

  active.update(db).await.context("Failed to update seimg")
}

pub async fn remove(db: &DatabaseConnection, id: u32) -> Result<()> {
  romi_seimgs::Entity::delete_by_id(id).exec(db).await.context("Failed to delete seimg")?;
  Ok(())
}
