use std::env;
use std::process::Command;

use crate::entity::{romi_comments, romi_fields, romi_metas, romi_posts, romi_users};
use crate::guards::admin::AdminUser;
use crate::models::info::{ResDashboardData, ResSettingsData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use futures::try_join;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter};
use sea_orm_rocket::Connection;
use sysinfo::System;

#[get("/dashboard")]
pub async fn fetch_dashboard(
    _admin_user: AdminUser,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResDashboardData> {
    l_info!(logger, "Fetching dashboard data");
    let db = conn.into_inner();

    let (posts_count, categories_count, tags_count, comments_count, users_count) = try_join!(
        romi_posts::Entity::find().count(db),
        romi_metas::Entity::find()
            .filter(romi_metas::Column::IsCategory.eq("1"))
            .count(db),
        romi_metas::Entity::find()
            .filter(romi_metas::Column::IsCategory.ne("1"))
            .count(db),
        romi_comments::Entity::find().count(db),
        romi_users::Entity::find().count(db),
    )
    .context("Failed to fetch dashboard counts")?;
    Ok(Json(ResDashboardData {
        posts_count,
        categories_count,
        tags_count,
        comments_count,
        users_count,
        version: env!("CARGO_PKG_VERSION").into(),
        os_info: format!(
            "{} {}",
            System::name().unwrap_or_default().to_string(),
            System::os_version().unwrap_or_default().to_string()
        ),
        home_dir: env::var("HOME").unwrap_or_default().into(),
        nodejs_version: Command::new("node")
            .arg("-v")
            .output()
            .map(|output| String::from_utf8(output.stdout).ok().unwrap_or("".into()))
            .unwrap_or("".into()),
    }))
}

#[get("/settings")]
pub async fn fetch_settings(
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResSettingsData> {
    l_info!(logger, "Fetching site settings");
    let db = conn.into_inner();

    // 获取设置数据
    let settings = romi_fields::Entity::find()
        .filter(romi_fields::Column::Key.eq("settings"))
        .one(db)
        .await
        .context("Failed to fetch settings")?;

    if let Some(settings) = settings {
        api_ok(
            serde_json::from_str::<ResSettingsData>(&settings.value)
                .context("Failed to parse settings")?,
        )
    } else {
        l_error!(logger, "Settings not found");
        Err(ApiError::default())
    }
}
