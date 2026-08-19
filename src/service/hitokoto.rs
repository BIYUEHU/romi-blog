use anyhow::{Context, Result};
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DbBackend, EntityTrait,
  IntoActiveModel, QueryFilter, Statement,
};

use crate::entity::{romi_hitokotos, romi_hitokotos2};
use crate::models::hitokoto::{
  ReqHitokoto2Data, ReqHitokotoData, ResHitokoto2Data, ResHitokotoData,
};

pub async fn get_random(conn: &DatabaseConnection, length: Option<u32>) -> Result<ResHitokotoData> {
  let query = if let Some(len) = length {
    romi_hitokotos::Entity::find().from_raw_sql(Statement::from_sql_and_values(
      DbBackend::MySql,
      format!(
        "SELECT * FROM romi_hitokotos WHERE char_length(msg) <= {} ORDER BY RAND() limit 1",
        len
      ),
      [],
    ))
  } else {
    romi_hitokotos::Entity::find().from_raw_sql(Statement::from_sql_and_values(
      DbBackend::MySql,
      "SELECT * FROM romi_hitokotos ORDER BY RAND() limit 1",
      [],
    ))
  };

  let model = query
    .one(conn)
    .await
    .context("Failed to get hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("No hitokoto found"))?;

  Ok(ResHitokotoData {
    id: model.id,
    msg: model.msg,
    from: model.from,
    r#type: model.r#type.parse().unwrap_or(0),
    likes: model.likes as u32,
    public: model.public == "1",
  })
}

pub async fn get_by_id(conn: &DatabaseConnection, id: u32) -> Result<ResHitokotoData> {
  let model = romi_hitokotos::Entity::find_by_id(id)
    .one(conn)
    .await
    .context("Failed to get hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto not found"))?;

  Ok(ResHitokotoData {
    id: model.id,
    msg: model.msg,
    from: model.from,
    r#type: model.r#type.parse().unwrap_or(0),
    likes: model.likes as u32,
    public: model.public == "1",
  })
}

pub async fn list_public(conn: &DatabaseConnection) -> Result<Vec<ResHitokotoData>> {
  let models = romi_hitokotos::Entity::find()
    .filter(romi_hitokotos::Column::Public.eq("1"))
    .all(conn)
    .await
    .context("Failed to list hitokotos")?;

  Ok(
    models
      .into_iter()
      .map(|model| ResHitokotoData {
        id: model.id,
        msg: model.msg,
        from: model.from,
        r#type: model.r#type.parse().unwrap_or(0),
        likes: model.likes as u32,
        public: true,
      })
      .collect(),
  )
}

pub async fn list_all(conn: &DatabaseConnection) -> Result<Vec<ResHitokotoData>> {
  let models =
    romi_hitokotos::Entity::find().all(conn).await.context("Failed to list hitokotos")?;

  Ok(
    models
      .into_iter()
      .map(|model| ResHitokotoData {
        id: model.id,
        msg: model.msg,
        from: model.from,
        r#type: model.r#type.parse().unwrap_or(0),
        likes: model.likes as u32,
        public: model.public == "1",
      })
      .collect(),
  )
}

pub async fn create(
  conn: &DatabaseConnection,
  data: ReqHitokotoData,
) -> Result<romi_hitokotos::Model> {
  let active = romi_hitokotos::ActiveModel {
    id: ActiveValue::not_set(),
    msg: ActiveValue::set(data.msg),
    from: ActiveValue::set(data.from),
    r#type: ActiveValue::set(data.r#type.to_string()),
    likes: ActiveValue::set(0),
    public: ActiveValue::set(if data.public { "1" } else { "0" }.to_string()),
  };

  active.insert(conn).await.context("Failed to create hitokoto")
}

pub async fn update(
  conn: &DatabaseConnection,
  id: u32,
  data: ReqHitokotoData,
) -> Result<romi_hitokotos::Model> {
  let model = romi_hitokotos::Entity::find_by_id(id)
    .one(conn)
    .await
    .context("Failed to get hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto not found"))?;

  let mut active = model.into_active_model();
  active.msg = ActiveValue::set(data.msg);
  active.from = ActiveValue::set(data.from);
  active.r#type = ActiveValue::set(data.r#type.to_string());
  active.public = ActiveValue::set(if data.public { "1" } else { "0" }.to_string());

  active.update(conn).await.context("Failed to update hitokoto")
}

pub async fn remove(conn: &DatabaseConnection, id: u32) -> Result<()> {
  romi_hitokotos::Entity::delete_by_id(id).exec(conn).await.context("Failed to remove hitokoto")?;
  Ok(())
}

pub async fn like(conn: &DatabaseConnection, id: u32) -> Result<()> {
  let model = romi_hitokotos::Entity::find_by_id(id)
    .one(conn)
    .await
    .context("Failed to get hitokoto")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto not found"))?;

  let likes = model.likes + 1;
  let mut active = model.into_active_model();
  active.likes = ActiveValue::set(likes);

  active.update(conn).await.context("Failed to like hitokoto")?;
  Ok(())
}

// hitokoto2
pub async fn get_random2(conn: &DatabaseConnection) -> Result<ResHitokoto2Data> {
  let model = romi_hitokotos2::Entity::find()
    .from_raw_sql(Statement::from_sql_and_values(
      DbBackend::MySql,
      "SELECT * FROM romi_hitokotos2 ORDER BY RAND() limit 1",
      [],
    ))
    .one(conn)
    .await
    .context("Failed to fetch hitokoto2")?
    .ok_or_else(|| anyhow::anyhow!("No hitokoto2 found"))?;

  Ok(ResHitokoto2Data {
    uuid: model.uuid,
    msg: model.msg,
    msg_origin: model.msg_origin,
    from: model.from,
    from_who: model.from_who,
    r#type: model.r#type,
    likes: model.likes,
    public: model.public == "1",
    created: model.created.timestamp_millis() as u64,
  })
}

pub async fn list_all2(conn: &DatabaseConnection) -> Result<Vec<ResHitokoto2Data>> {
  let models =
    romi_hitokotos2::Entity::find().all(conn).await.context("Failed to fetch hitokotos2")?;

  Ok(
    models
      .into_iter()
      .map(|model| ResHitokoto2Data {
        uuid: model.uuid,
        msg: model.msg,
        msg_origin: model.msg_origin,
        from: model.from,
        from_who: model.from_who,
        r#type: model.r#type,
        likes: model.likes,
        public: model.public == "1",
        created: model.created.timestamp_millis() as u64,
      })
      .collect(),
  )
}

pub async fn create2(
  conn: &DatabaseConnection,
  data: ReqHitokoto2Data,
) -> Result<romi_hitokotos2::Model> {
  use uuid::Uuid;

  let active = romi_hitokotos2::ActiveModel {
    id: ActiveValue::not_set(),
    uuid: ActiveValue::set(Uuid::new_v4().to_string()),
    msg: ActiveValue::set(data.msg),
    msg_origin: ActiveValue::set(data.msg_origin),
    from: ActiveValue::set(data.from),
    from_who: ActiveValue::set(data.from_who),
    r#type: ActiveValue::set(data.r#type),
    likes: ActiveValue::set(data.likes),
    public: ActiveValue::set(if data.public { "1" } else { "0" }.to_string()),
    created: ActiveValue::not_set(),
  };

  active.insert(conn).await.context("Failed to create hitokoto2")
}

pub async fn update2(
  conn: &DatabaseConnection,
  uuid: String,
  data: ReqHitokoto2Data,
) -> Result<romi_hitokotos2::Model> {
  let model = romi_hitokotos2::Entity::find()
    .filter(romi_hitokotos2::Column::Uuid.eq(uuid))
    .one(conn)
    .await
    .context("Failed to fetch hitokoto2")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto2 not found"))?;

  let mut active = model.into_active_model();
  active.msg = ActiveValue::set(data.msg);
  active.from = ActiveValue::set(data.from);
  active.from_who = ActiveValue::set(data.from_who);
  active.r#type = ActiveValue::set(data.r#type);
  active.likes = ActiveValue::set(data.likes);
  active.public = ActiveValue::set(if data.public { "1" } else { "0" }.to_string());

  active.update(conn).await.context("Failed to update hitokoto2")
}

pub async fn remove2(conn: &DatabaseConnection, uuid: String) -> Result<()> {
  let model = romi_hitokotos2::Entity::find()
    .filter(romi_hitokotos2::Column::Uuid.eq(uuid))
    .one(conn)
    .await
    .context("Failed to find hitokoto2")?
    .ok_or_else(|| anyhow::anyhow!("Hitokoto2 not found"))?;

  romi_hitokotos2::Entity::delete_by_id(model.id)
    .exec(conn)
    .await
    .context("Failed to delete hitokoto2")?;
  Ok(())
}
