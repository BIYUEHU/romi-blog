use anyhow::{Context, Result};
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DbBackend, EntityTrait,
  IntoActiveModel, QueryFilter, Statement,
};

use crate::entity::romi_hitokotos;
use crate::models::hitokoto::{ReqHitokotoData, ResHitokotoData};

pub async fn get_random(conn: &DatabaseConnection) -> Result<ResHitokotoData> {
  let model = romi_hitokotos::Entity::find()
    .from_raw_sql(Statement::from_sql_and_values(
      DbBackend::MySql,
      "SELECT * FROM romi_hitokotos ORDER BY RAND() limit 1",
      [],
    ))
    .one(conn)
    .await
    .context("Failed to fetch hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("No hitokoto found"))?;

  Ok(to_res(model))
}

pub async fn get_by_uuid(conn: &DatabaseConnection, uuid: String) -> Result<ResHitokotoData> {
  let model = romi_hitokotos::Entity::find()
    .filter(romi_hitokotos::Column::Uuid.eq(uuid))
    .one(conn)
    .await
    .context("Failed to fetch hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto not found"))?;

  Ok(to_res(model))
}

pub async fn list_public(conn: &DatabaseConnection) -> Result<Vec<ResHitokotoData>> {
  let models = romi_hitokotos::Entity::find()
    .filter(romi_hitokotos::Column::Public.eq("1"))
    .all(conn)
    .await
    .context("Failed to list hitokotos")?;

  Ok(models.into_iter().map(to_res).collect())
}

pub async fn list_all(conn: &DatabaseConnection) -> Result<Vec<ResHitokotoData>> {
  let models =
    romi_hitokotos::Entity::find().all(conn).await.context("Failed to list hitokotos")?;
  Ok(models.into_iter().map(to_res).collect())
}

pub async fn create(
  conn: &DatabaseConnection,
  data: ReqHitokotoData,
) -> Result<romi_hitokotos::Model> {
  let exists = romi_hitokotos::Entity::find()
    .filter(romi_hitokotos::Column::Msg.eq(&data.msg))
    .one(conn)
    .await
    .context("Failed to check duplicate hitokoto")?
    .is_some();
  if exists {
    anyhow::bail!("Hitokoto msg already exists");
  }

  let active = romi_hitokotos::ActiveModel {
    id: ActiveValue::not_set(),
    uuid: ActiveValue::set(uuid::Uuid::new_v4().to_string()),
    msg: ActiveValue::set(data.msg),
    msg_origin: ActiveValue::set(data.msg_origin),
    from: ActiveValue::set(data.from),
    from_who: ActiveValue::set(data.from_who),
    r#type: ActiveValue::set(data.r#type),
    likes: ActiveValue::set(data.likes),
    public: ActiveValue::set(if data.public { "1" } else { "0" }.to_string()),
    created: ActiveValue::not_set(),
  };
  active.insert(conn).await.context("Failed to create hitokoto")
}

pub async fn update(
  conn: &DatabaseConnection,
  uuid: String,
  data: ReqHitokotoData,
) -> Result<romi_hitokotos::Model> {
  let model = romi_hitokotos::Entity::find()
    .filter(romi_hitokotos::Column::Uuid.eq(&uuid))
    .one(conn)
    .await
    .context("Failed to fetch hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto not found"))?;

  let exists = romi_hitokotos::Entity::find()
    .filter(romi_hitokotos::Column::Msg.eq(&data.msg))
    .filter(romi_hitokotos::Column::Uuid.ne(&uuid))
    .one(conn)
    .await
    .context("Failed to check duplicate hitokoto")?
    .is_some();
  if exists {
    anyhow::bail!("Hitokoto msg already exists");
  }

  let mut active = model.into_active_model();
  active.msg = ActiveValue::set(data.msg);
  active.msg_origin = ActiveValue::set(data.msg_origin);
  active.from = ActiveValue::set(data.from);
  active.from_who = ActiveValue::set(data.from_who);
  active.r#type = ActiveValue::set(data.r#type);
  active.likes = ActiveValue::set(data.likes);
  active.public = ActiveValue::set(if data.public { "1" } else { "0" }.to_string());
  active.update(conn).await.context("Failed to update hitokoto")
}

pub async fn remove(conn: &DatabaseConnection, uuid: String) -> Result<()> {
  let model = romi_hitokotos::Entity::find()
    .filter(romi_hitokotos::Column::Uuid.eq(uuid))
    .one(conn)
    .await
    .context("Failed to find hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto not found"))?;

  romi_hitokotos::Entity::delete_by_id(model.id)
    .exec(conn)
    .await
    .context("Failed to delete hitokoto")?;
  Ok(())
}

pub async fn like(conn: &DatabaseConnection, uuid: String) -> Result<()> {
  let model = romi_hitokotos::Entity::find()
    .filter(romi_hitokotos::Column::Uuid.eq(uuid))
    .one(conn)
    .await
    .context("Failed to get hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto not found"))?;

  let mut active = model.into_active_model();
  active.likes = ActiveValue::set(active.likes.unwrap() + 1);
  active.update(conn).await.context("Failed to like hitokoto")?;
  Ok(())
}

fn to_res(model: romi_hitokotos::Model) -> ResHitokotoData {
  ResHitokotoData {
    uuid: model.uuid,
    msg: model.msg,
    msg_origin: model.msg_origin,
    from: model.from,
    from_who: model.from_who,
    r#type: model.r#type,
    likes: model.likes,
    public: model.public == "1",
    created: model.created.timestamp_millis() as u64,
  }
}
