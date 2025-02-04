use crate::entity::romi_seimgs;
use crate::guards::admin::AdminUser;
use crate::models::seimg::{ReqSeimgData, ResSeimgData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DbBackend, EntityTrait, IntoActiveModel,
    QueryFilter, Statement,
};
use sea_orm_rocket::Connection;

#[get("/?<limit>&<tag>&<r18>")]
pub async fn fetch(
    limit: Option<u32>,
    tag: Option<String>,
    r18: Option<u32>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResSeimgData>> {
    let limit = limit.map_or(1, |l| l.clamp(1, 10));
    l_info!(
        logger,
        "Fetching seimg with limit={}, tag={:?}, r18={:?}",
        limit,
        tag,
        r18
    );

    let mut query = romi_seimgs::Entity::find();

    if let Some(r18_val) = r18 {
        query = query.filter(romi_seimgs::Column::R18.eq(r18_val.to_string()));
    }

    if let Some(tag_str) = tag {
        for tag in tag_str.split('|').collect::<Vec<&str>>() {
            query = query.filter(romi_seimgs::Column::Tags.contains(tag));
        }
    }

    api_ok(
        romi_seimgs::Entity::find()
            .from_raw_sql(Statement::from_sql_and_values(
                DbBackend::MySql,
                r#"SELECT * FROM romi_seimgs ORDER BY RAND() limit $1"#,
                [limit.into()],
            ))
            .all(conn.into_inner())
            .await
            .with_context(|| "Failed to fetch seimg")?
            .into_iter()
            .map(|img| ResSeimgData {
                pid: img.pixiv_pid,
                uid: img.pixiv_uid,
                title: img.title,
                author: img.author,
                r18: img.r18.eq(&1.to_string()),
                tags: img
                    .tags
                    .unwrap_or("".to_string())
                    .split(',')
                    .map(String::from)
                    .collect(),
                width: img.width,
                height: img.height,
                r#type: img.r#type,
                url: img.url,
            })
            .collect(),
    )
}

#[post("/", data = "<seimg>")]
pub async fn create(
    _admin_user: AdminUser,
    seimg: Json<ReqSeimgData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_seimgs::Model> {
    l_info!(logger, "Creating new seimg");

    let result = romi_seimgs::ActiveModel {
        id: ActiveValue::not_set(),
        pixiv_pid: ActiveValue::set(seimg.pixiv_pid),
        pixiv_uid: ActiveValue::set(seimg.pixiv_uid),
        title: ActiveValue::set(seimg.title.clone()),
        author: ActiveValue::set(seimg.author.clone()),
        r18: ActiveValue::set(if seimg.r18 { 1 } else { 0 }.to_string()),
        tags: ActiveValue::set(Some(seimg.tags.join(","))),
        width: ActiveValue::set(seimg.width),
        height: ActiveValue::set(seimg.height),
        r#type: ActiveValue::set(seimg.r#type.clone()),
        url: ActiveValue::set(seimg.url.clone()),
    }
    .insert(conn.into_inner())
    .await
    .with_context(|| "Failed to create seimg")?;

    l_info!(logger, "Successfully created seimg: id={}", result.id);
    api_ok(result)
}

#[put("/<id>", data = "<seimg>")]
pub async fn update(
    _admin_user: AdminUser,
    id: u32,
    seimg: Json<ReqSeimgData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_seimgs::Model> {
    l_info!(logger, "Updating seimg with id={}", id);

    let db = conn.into_inner();

    match romi_seimgs::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to find seimg with id={}", id))?
    {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.title = ActiveValue::set(seimg.title.clone());
            active_model.author = ActiveValue::set(seimg.author.clone());
            active_model.r18 = ActiveValue::set(if seimg.r18 { 1 } else { 0 }.to_string());
            active_model.tags = ActiveValue::set(Some(seimg.tags.join(",")));
            active_model.width = ActiveValue::set(seimg.width);
            active_model.height = ActiveValue::set(seimg.height);
            active_model.r#type = ActiveValue::set(seimg.r#type.clone());
            active_model.url = ActiveValue::set(seimg.url.clone());

            let result = active_model
                .update(db)
                .await
                .with_context(|| format!("Failed to update seimg with id={}", id))?;

            l_info!(logger, "Successfully updated seimg: id={}", result.id);
            api_ok(result)
        }
        None => Err(ApiError::not_found(format!("Seimg {} not found", id))),
    }
}

#[delete("/<id>")]
pub async fn delete(
    _admin_user: AdminUser,
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<()> {
    l_info!(logger, "Deleting seimg with id={}", id);

    romi_seimgs::Entity::delete_by_id(id)
        .exec(conn.into_inner())
        .await
        .with_context(|| format!("Failed to delete seimg with id={}", id))?;

    l_info!(logger, "Successfully deleted seimg: id={}", id);
    api_ok(())
}
