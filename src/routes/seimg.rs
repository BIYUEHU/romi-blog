use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, Query, State},
    routing::{delete, get, post, put},
};
use roga::*;
use sea_orm::{ActiveModelTrait, ActiveValue, DbBackend, EntityTrait, IntoActiveModel, Statement};

use crate::{
    app::AppState,
    entity::romi_seimgs,
    guards::admin::AdminUser,
    models::seimg::{ReqSeimgData, ResSeimgData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(fetch))
        .route("/", post(create))
        .route("/{id}", put(update))
        .route("/{id}", delete(remove))
}

async fn fetch(
    Query(params): Query<std::collections::HashMap<String, String>>,
    State(AppState { ref conn, .. }): State<AppState>,
) -> ApiResult<Vec<ResSeimgData>> {
    let limit = params.get("limit").and_then(|l| l.parse().ok()).map_or(1, |l: i32| l.clamp(1, 10));
    let tag = params.get("tag").cloned();
    let r18 = params.get("r18").cloned();

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

    api_ok(
        romi_seimgs::Entity::find()
            .from_raw_sql(Statement::from_string(DbBackend::MySql, sql))
            .all(conn)
            .await
            .context("Failed to fetch seimg")?
            .into_iter()
            .map(|img| ResSeimgData {
                pid: img.pixiv_pid,
                uid: img.pixiv_uid,
                title: img.title,
                author: img.author,
                r18: img.r18.eq("1"),
                tags: img.tags.unwrap_or_default().split(',').map(str::to_string).collect(),
                width: img.width,
                height: img.height,
                r#type: img.r#type,
                url: img.url,
            })
            .collect(),
    )
}

async fn create(
    AdminUser(admin_user): AdminUser,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
    Json(seimg): Json<ReqSeimgData>,
) -> ApiResult<romi_seimgs::Model> {
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
    .insert(conn)
    .await
    .context("Failed to create seimg")?;

    l_info!(
        logger,
        "Created seimg id {} ({}) by admin {} ({})",
        result.id,
        seimg.title,
        admin_user.id,
        admin_user.username
    );
    api_ok(result)
}

async fn update(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
    Json(seimg): Json<ReqSeimgData>,
) -> ApiResult {
    match romi_seimgs::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to find seimg {}", id))?
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

            active_model
                .update(conn)
                .await
                .with_context(|| format!("Failed to update seimg {}", id))?;

            l_info!(
                logger,
                "Updated seimg {} ({}) by admin {} ({})",
                id,
                seimg.title,
                admin_user.id,
                admin_user.username
            );
            api_ok(())
        }
        None => {
            l_warn!(logger, "Seimg {} not found", id);
            Err(ApiError::not_found(format!("Seimg {} not found", id)))
        }
    }
}

async fn remove(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
) -> ApiResult {
    romi_seimgs::Entity::delete_by_id(id)
        .exec(conn)
        .await
        .with_context(|| format!("Failed to delete seimg {}", id))?;

    l_info!(logger, "Deleted seimg {} by admin {} ({})", id, admin_user.id, admin_user.username);
    api_ok(())
}
