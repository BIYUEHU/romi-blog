use crate::entity::romi_seimgs;
use crate::guards::admin::AdminUser;
use crate::models::seimg::{ReqSeimgData, ResSeimgData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{ActiveModelTrait, ActiveValue, DbBackend, EntityTrait, IntoActiveModel, Statement};
use sea_orm_rocket::Connection;

#[get("/?<limit>&<tag>&<r18>")]
pub async fn fetch(
    limit: Option<u32>,
    tag: Option<String>,
    r18: Option<String>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResSeimgData>> {
    let limit = limit.map_or(1, |l| l.clamp(1, 10));

    l_info!(
        logger,
        "Fetching seimg with limit={}, r18={:?}, tag={:?}",
        limit,
        r18,
        tag
    );

    let mut conditions = Vec::new();

    if let Some(r18_str) = r18 {
        let r18_val = if r18_str == "true" { 1 } else { 0 };
        conditions.push(format!("r18 = {}", r18_val));
    }

    if let Some(tag_str) = tag {
        let tags: Vec<String> = tag_str
            .split('|')
            .filter(|s| !s.trim().is_empty())
            .map(|s| s.trim().to_string())
            .collect();

        if !tags.is_empty() {
            let tag_sqls: Vec<String> = tags
                .iter()
                .map(|t| format!("tags LIKE '%{}%'", t.replace('\'', "''")))
                .collect();
            conditions.push(format!("({})", tag_sqls.join(" OR ")));
        }
    }

    let mut sql = String::from("SELECT * FROM romi_seimgs");

    if !conditions.is_empty() {
        sql.push_str(" WHERE ");
        sql.push_str(&conditions.join(" AND "));
    }

    sql.push_str(&format!(" ORDER BY RAND() LIMIT {}", limit));

    let result = romi_seimgs::Entity::find()
        .from_raw_sql(Statement::from_string(DbBackend::MySql, sql))
        .all(conn.into_inner())
        .await
        .context("Failed to fetch seimg")?;

    api_ok(
        result
            .into_iter()
            .map(|img| ResSeimgData {
                pid: img.pixiv_pid,
                uid: img.pixiv_uid,
                title: img.title,
                author: img.author,
                r18: img.r18.eq("1"),
                tags: img
                    .tags
                    .unwrap_or_default()
                    .split(',')
                    .map(str::to_string)
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
    .context("Failed to create seimg")?;

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
