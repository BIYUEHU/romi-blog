use std::collections::HashMap;

use anyhow::{Context, Result};
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait,
  QueryFilter, QuerySelect, TransactionTrait,
};

use crate::entity::{romi_metas, romi_relationships};
use crate::models::meta::{ReqMetaData, ResMetaData};

pub async fn list(db: &DatabaseConnection) -> Result<Vec<ResMetaData>> {
  let metas = romi_metas::Entity::find().all(db).await.context("Failed to list metas")?;

  if metas.is_empty() {
    return Ok(vec![]);
  }

  let meta_ids: Vec<u32> = metas.iter().map(|m| m.mid).collect();

  let counts: Vec<(u32, i64)> = romi_relationships::Entity::find()
    .filter(romi_relationships::Column::Mid.is_in(meta_ids))
    .select_only()
    .column(romi_relationships::Column::Mid)
    .column_as(romi_relationships::Column::Mid.count(), "count")
    .group_by(romi_relationships::Column::Mid)
    .into_tuple()
    .all(db)
    .await
    .context("Failed to count relationships")?;

  let count_map: HashMap<u32, i64> = counts.into_iter().collect();

  Ok(
    metas
      .iter()
      .map(|meta| ResMetaData {
        mid: meta.mid,
        name: meta.name.clone(),
        count: (*count_map.get(&meta.mid).unwrap_or(&0)).try_into().unwrap_or(0),
        is_category: meta.is_category == "1",
      })
      .collect(),
  )
}

pub async fn get(db: &DatabaseConnection, id: u32) -> Result<ResMetaData> {
  let meta = romi_metas::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to get meta")?
    .ok_or_else(|| anyhow::anyhow!("Meta not found"))?;

  let count = romi_relationships::Entity::find()
    .filter(romi_relationships::Column::Mid.eq(id))
    .count(db)
    .await
    .context("Failed to count relationships")?;

  Ok(ResMetaData { mid: meta.mid, name: meta.name, count, is_category: meta.is_category == "1" })
}

pub async fn create(db: &DatabaseConnection, data: ReqMetaData) -> Result<romi_metas::Model> {
  let exists = romi_metas::Entity::find()
    .filter(romi_metas::Column::Name.eq(data.name.clone()))
    .filter(romi_metas::Column::IsCategory.eq(if data.is_category { "1" } else { "0" }.to_string()))
    .one(db)
    .await
    .context("Failed to check meta existence")?
    .is_some();

  if exists {
    anyhow::bail!("Meta name already exists");
  }

  let active = romi_metas::ActiveModel {
    mid: ActiveValue::not_set(),
    name: ActiveValue::set(data.name),
    is_category: ActiveValue::set(if data.is_category { "1" } else { "0" }.to_string()),
  };

  active.insert(db).await.context("Failed to create meta")
}

pub async fn remove(db: &DatabaseConnection, id: u32) -> Result<()> {
  let txn = db.begin().await.context("Failed to begin transaction")?;

  romi_metas::Entity::delete_by_id(id).exec(&txn).await.context("Failed to delete meta")?;

  romi_relationships::Entity::delete_many()
    .filter(romi_relationships::Column::Mid.eq(id))
    .exec(&txn)
    .await
    .context("Failed to delete relationships")?;

  txn.commit().await.context("Failed to commit transaction")?;
  Ok(())
}
