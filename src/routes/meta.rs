use std::collections::HashMap;

use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post},
};
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter,
    QuerySelect, TransactionTrait,
};

use crate::{
    app::RomiState,
    entity::{romi_metas, romi_relationships},
    guards::admin::AdminUser,
    models::meta::{ReqMetaData, ResMetaData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/", post(create))
        .route("/{id}", get(fetch))
        .route("/{id}", delete(remove))
}

async fn fetch_all(
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<Vec<ResMetaData>> {
    let metas = romi_metas::Entity::find().all(conn).await.context("Failed to fetch metas")?;

    if metas.is_empty() {
        return api_ok(vec![]);
    }

    let meta_ids: Vec<u32> = metas.iter().map(|m| m.mid).collect();

    let counts: Vec<(u32, i64)> = romi_relationships::Entity::find()
        .filter(romi_relationships::Column::Mid.is_in(meta_ids))
        .select_only()
        .column(romi_relationships::Column::Mid)
        .column_as(romi_relationships::Column::Mid.count(), "count")
        .group_by(romi_relationships::Column::Mid)
        .into_tuple()
        .all(conn)
        .await
        .context("Failed to count relationships")?;

    let count_map: HashMap<u32, i64> = counts.into_iter().collect();

    api_ok(
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

async fn fetch(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResMetaData> {
    let meta = romi_metas::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch meta {}", id))?;

    match meta {
        Some(meta) => {
            let response = ResMetaData {
                mid: meta.mid,
                name: meta.clone().name,
                count: romi_relationships::Entity::find()
                    .filter(romi_relationships::Column::Mid.eq(id))
                    .count(conn)
                    .await
                    .context("Failed to count relationships")?,
                is_category: meta.is_category.eq(&1.to_string()),
            };

            api_ok(response)
        }
        None => {
            l_warn!(logger, "Meta {} not found", id);
            Err(ApiError::not_found("Meta not found"))
        }
    }
}

async fn create(
    AdminUser(admin_user): AdminUser,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(meta): Json<ReqMetaData>,
) -> ApiResult {
    if romi_metas::Entity::find()
        .filter(romi_metas::Column::Name.eq(meta.name.clone()))
        .filter(
            romi_metas::Column::IsCategory.eq(if meta.is_category { "1" } else { "0" }.to_string()),
        )
        .one(conn)
        .await
        .with_context(|| format!("Failed to check if meta name exists: {}", meta.name))?
        .is_some()
    {
        l_warn!(logger, "Meta name already exists: {}", meta.name);
        return Err(ApiError::bad_request("Meta name already exists"));
    }

    let result = romi_metas::ActiveModel {
        mid: ActiveValue::not_set(),
        name: ActiveValue::set(meta.name.clone()),
        is_category: ActiveValue::set(if meta.is_category { "1" } else { "0" }.to_string()),
    }
    .insert(conn)
    .await
    .context("Failed to create meta")?;

    l_info!(
        logger,
        "Created meta {} ({}) by admin {} ({})",
        result.mid,
        meta.name,
        admin_user.id,
        admin_user.username
    );
    api_ok(())
}

async fn remove(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    let txn = conn.begin().await.context("Failed to begin transaction")?;

    romi_metas::Entity::delete_by_id(id)
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete meta {}", id))?;

    romi_relationships::Entity::delete_many()
        .filter(romi_relationships::Column::Mid.eq(id))
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete relationships for meta {}", id))?;

    txn.commit().await.context("Failed to commit transaction")?;

    l_info!(logger, "Deleted meta {} by admin {} ({})", id, admin_user.id, admin_user.username);

    api_ok(())
}
