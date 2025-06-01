use std::env;
use std::process::Command;

use crate::entity::{
    romi_comments, romi_hitokotos, romi_metas, romi_news, romi_news_comments, romi_posts,
    romi_seimgs, romi_users,
};
use crate::guards::admin::AdminUser;
use crate::models::info::{ResDashboardData, ResProjectData, ResSettingsData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::cache::{get_projects_cache, get_settings_cache};
use crate::utils::pool::Db;
use anyhow::Context;
use futures::try_join;
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

    let (
        posts_count,
        categories_count,
        tags_count,
        comments_count_1,
        comments_count_2,
        users_count,
        hitokotos_count,
        seimgs_count,
        news_count,
    ) = try_join!(
        romi_posts::Entity::find().count(db),
        romi_metas::Entity::find()
            .filter(romi_metas::Column::IsCategory.eq("1"))
            .count(db),
        romi_metas::Entity::find()
            .filter(romi_metas::Column::IsCategory.ne("1"))
            .count(db),
        romi_comments::Entity::find().count(db),
        romi_news_comments::Entity::find().count(db),
        romi_users::Entity::find().count(db),
        romi_hitokotos::Entity::find().count(db),
        romi_seimgs::Entity::find().count(db),
        romi_news::Entity::find().count(db),
    )
    .context("Failed to fetch dashboard counts")?;
    api_ok(ResDashboardData {
        posts_count,
        categories_count,
        tags_count,
        comments_count: comments_count_1 + comments_count_2,
        users_count,
        hitokotos_count,
        seimgs_count,
        news_count,
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
    })
}

#[get("/settings")]
pub async fn fetch_settings(
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResSettingsData> {
    l_info!(logger, "Fetching site settings");
    api_ok(
        get_settings_cache(conn.into_inner())
            .await
            .map_err(|e| ApiError::internal(e.to_string()))?,
    )
}

#[get("/projects")]
pub async fn fetch_projects(logger: &State<Logger>) -> ApiResult<Vec<ResProjectData>> {
    l_info!(logger, "Fetching projects data from github repository");
    api_ok(
        get_projects_cache()
            .await
            .map_err(|e| ApiError::internal(e.to_string()))?,
    )
}
