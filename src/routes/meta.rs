use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post},
};
use futures::future::try_join_all;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter,
    TransactionTrait, TryIntoModel,
};

use crate::{
    app::AppState,
    entity::{romi_metas, romi_relationships},
    guards::admin::AdminUser,
    models::meta::{ReqMetaData, ResMetaData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/", post(create))
        .route("/{id}", get(fetch))
        .route("/{id}", delete(remove))
}

async fn fetch_all(State(state): State<AppState>) -> ApiResult<Vec<ResMetaData>> {
    l_info!(&state.logger, "Fetching all metas");

    api_ok(
        try_join_all(
            romi_metas::Entity::find()
                .all(&state.conn)
                .await
                .context("Failed to fetch metas")?
                .iter()
                .map(|meta| async {
                    Ok::<ResMetaData, ApiError>(ResMetaData {
                        mid: meta.mid,
                        name: meta.clone().name,
                        count: romi_relationships::Entity::find()
                            .filter(romi_relationships::Column::Mid.eq(meta.mid))
                            .count(&state.conn)
                            .await
                            .context("Failed to count relationships")?,
                        is_category: meta.clone().is_category.eq(&1.to_string()),
                    })
                }),
        )
        .await?,
    )
}

async fn fetch(Path(id): Path<u32>, State(state): State<AppState>) -> ApiResult<ResMetaData> {
    l_info!(&state.logger, "Fetching meta: id={}", id);

    let meta = romi_metas::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch meta {}", id))?;

    match meta {
        Some(meta) => {
            let response = ResMetaData {
                mid: meta.mid,
                name: meta.clone().name,
                count: romi_relationships::Entity::find()
                    .filter(romi_relationships::Column::Mid.eq(id))
                    .count(&state.conn)
                    .await
                    .context("Failed to count relationships")?,
                is_category: meta.is_category.eq(&1.to_string()),
            };

            l_debug!(&state.logger, "Successfully fetched meta: {}", meta.clone().name);
            api_ok(response)
        }
        None => {
            l_warn!(&state.logger, "Meta not found: id={}", id);
            Err(ApiError::not_found("Meta not found"))
        }
    }
}

async fn create(
    _admin_user: AdminUser,
    State(state): State<AppState>,
    Json(meta): Json<ReqMetaData>,
) -> ApiResult<romi_metas::Model> {
    l_info!(&state.logger, "Creating new meta: {}", meta.name);

    if romi_metas::Entity::find()
        .filter(romi_metas::Column::Name.eq(meta.name.clone()))
        .filter(
            romi_metas::Column::IsCategory.eq(if meta.is_category { "1" } else { "0" }.to_string()),
        )
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to check if meta name exists: {}", meta.name))?
        .is_some()
    {
        l_warn!(&state.logger, "Meta name already exists: {}", meta.name);
        return Err(ApiError::bad_request("Meta name already exists"));
    }

    let result = romi_metas::ActiveModel {
        mid: ActiveValue::not_set(),
        name: ActiveValue::set(meta.name.clone()),
        is_category: ActiveValue::set(if meta.is_category { "1" } else { "0" }.to_string()),
    }
    .save(&state.conn)
    .await
    .context("Failed to create meta")?
    .try_into_model()
    .context("Failed to convert meta model")?;

    l_info!(&state.logger, "Successfully created meta: id={}", result.mid);
    api_ok(result)
}

async fn remove(
    _admin_user: AdminUser,
    Path(id): Path<u32>,
    State(state): State<AppState>,
) -> ApiResult<String> {
    l_info!(&state.logger, "Deleting meta: id={}", id);

    let meta = romi_metas::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch meta {}", id))?
        .ok_or_else(|| ApiError::not_found("Meta not found"))?;

    let txn = state.conn.begin().await.context("Failed to begin transaction")?;

    romi_metas::Entity::delete_by_id(id)
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete meta {}", id))?;

    txn.commit().await.context("Failed to commit transaction")?;

    let conn_clone = state.conn.clone();
    let meta_type = if meta.is_category == "1" { "category" } else { "tag" };
    let logger_clone = state.logger.clone();

    tokio::spawn(async move {
        match romi_relationships::Entity::delete_many()
            .filter(romi_relationships::Column::Mid.eq(id))
            .exec(&conn_clone)
            .await
        {
            Ok(result) => {
                l_info!(
                    &logger_clone,
                    "Successfully deleted {} relationships for {} {}",
                    result.rows_affected,
                    meta_type,
                    id
                );
            }
            Err(err) => {
                l_error!(
                    &logger_clone,
                    "Failed to delete relationships for {} {}: {}",
                    meta_type,
                    id,
                    err
                );
            }
        }
    });

    l_info!(&state.logger, "Successfully deleted {} {}: id={}", meta_type, meta.name, id);

    api_ok(format!("{} '{}' deleted", meta_type, meta.name))
}
