use crate::entity::{romi_metas, romi_relationships};
use crate::guards::admin::AdminUser;
use crate::models::meta::{ReqMetaData, ResMetaData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use futures::future::try_join_all;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter,
    TransactionTrait, TryIntoModel,
};
use sea_orm_rocket::Connection;

#[get("/")]
pub async fn fetch_all(
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResMetaData>> {
    l_info!(logger, "Fetching all metas");

    let db = conn.into_inner();

    api_ok(
        try_join_all(
            romi_metas::Entity::find()
                .all(db)
                .await
                .context("Failed to fetch metas")?
                .iter()
                .map(|meta| async {
                    Ok::<ResMetaData, ApiError>(ResMetaData {
                        mid: meta.mid,
                        name: meta.clone().name,
                        count: romi_relationships::Entity::find()
                            .filter(romi_relationships::Column::Mid.eq(meta.mid))
                            .count(db)
                            .await
                            .context("Failed to count relationships")?,
                        is_category: meta.clone().is_category.eq(&1.to_string()),
                    })
                }),
        )
        .await?,
    )
}

#[get("/<id>")]
pub async fn fetch(
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResMetaData> {
    l_info!(logger, "Fetching meta: id={}", id);
    let db = conn.into_inner();

    let meta = romi_metas::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch meta {}", id))?;

    match meta {
        Some(meta) => {
            let response = ResMetaData {
                mid: meta.mid,
                name: meta.clone().name,
                count: romi_relationships::Entity::find()
                    .filter(romi_relationships::Column::Mid.eq(id))
                    .count(db)
                    .await
                    .context("Failed to count relationships")?,
                is_category: meta.is_category.eq(&1.to_string()),
            };

            l_debug!(logger, "Successfully fetched meta: {}", meta.clone().name);
            api_ok(response)
        }
        None => {
            l_warn!(logger, "Meta not found: id={}", id);
            Err(ApiError::not_found("Meta not found"))
        }
    }
}

#[post("/", data = "<meta>")]
pub async fn create(
    _admin_user: AdminUser,
    meta: Json<ReqMetaData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_metas::Model> {
    l_info!(logger, "Creating new meta: {}", meta.name);
    let db = conn.into_inner();

    if romi_metas::Entity::find()
        .filter(romi_metas::Column::Name.eq(meta.name.clone()))
        .filter(
            romi_metas::Column::IsCategory.eq(if meta.is_category { "1" } else { "0" }.to_string()),
        )
        .one(db)
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
    .save(db)
    .await
    .context("Failed to create meta")?
    .try_into_model()
    .context("Failed to convert meta model")?;

    l_info!(logger, "Successfully created meta: id={}", result.mid);
    api_ok(result)
}

// #[put("/<id>", data = "<meta>")]
// pub async fn update(
//     _admin_user: AdminUser,
//     id: u32,
//     meta: Json<ReqMetaData>,
//     logger: &State<Logger>,
//     conn: Connection<'_, Db>,
// ) -> ApiResult<romi_metas::Model> {
//     l_info!(logger, "Updating meta: id={}", id);
//     let db = conn.into_inner();

//     let meta_result = romi_metas::Entity::find_by_id(id)
//         .one(db)
//         .await
//         .with_context(|| format!("Failed to fetch meta {}", id))
//         .map_err(|err| {
//             l_error!(logger, "Failed to fetch meta for update: {}", err);
//             ApiError::from(err)
//         })?;

//     match meta_result {
//         Some(meta_origin) => {
//             let mut active_model = meta_origin.into_active_model();
//             active_model.name = ActiveValue::Set(meta.name.clone());
//             active_model.is_category =
//                 ActiveValue::Set(if meta.is_category { "1" } else { "0" }.to_string());

//             let result = active_model
//                 .save(db)
//                 .await
//                 .with_context(|| format!("Failed to update meta {}", id))
//                 .map_err(|err| {
//                     l_error!(logger, "Failed to update meta: {}", err);
//                     ApiError::from(err)
//                 })?
//                 .try_into_model()
//                 .context("Failed to convert updated meta model")
//                 .map_err(|err| {
//                     l_error!(logger, "Model conversion failed: {}", err);
//                     ApiError::from(err)
//                 })?;

//             l_info!(logger, "Successfully updated meta: id={}", id);
//             api_ok(result)
//         }
//         None => {
//             l_warn!(logger, "Meta not found for update: id={}", id);
//             Err(ApiError::not_found("Meta not found"))
//         }
//     }
// }

#[delete("/<id>")]
pub async fn delete(
    _admin_user: AdminUser,
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<String> {
    l_info!(logger, "Deleting meta: id={}", id);
    let db = conn.into_inner();

    let meta = romi_metas::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch meta {}", id))?
        .ok_or_else(|| ApiError::not_found("Meta not found"))?;

    let txn = db.begin().await.context("Failed to begin transaction")?;

    romi_metas::Entity::delete_by_id(id)
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete meta {}", id))?;

    txn.commit().await.context("Failed to commit transaction")?;

    let db_clone = db.clone();
    let meta_type = if meta.is_category == "1" {
        "category"
    } else {
        "tag"
    };
    let logger_clone = (*logger).clone();

    tokio::spawn(async move {
        match romi_relationships::Entity::delete_many()
            .filter(romi_relationships::Column::Mid.eq(id))
            .exec(&db_clone)
            .await
        {
            Ok(result) => {
                l_info!(
                    logger_clone,
                    "Successfully deleted {} relationships for {} {}",
                    result.rows_affected,
                    meta_type,
                    id
                );
            }
            Err(err) => {
                l_error!(
                    logger_clone,
                    "Failed to delete relationships for {} {}: {}",
                    meta_type,
                    id,
                    err
                );
            }
        }
    });

    l_info!(
        logger,
        "Successfully deleted {} {}: id={}",
        meta_type,
        meta.name,
        id
    );

    api_ok(format!("{} '{}' deleted", meta_type, meta.name))
}
