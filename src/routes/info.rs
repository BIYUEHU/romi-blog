use std::{env, process::Command};

use anyhow::Context;
use axum::{Router, extract::State, routing::get};
use fetcher::playlist::SongInfo;
use futures::try_join;
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter};
use sysinfo::System;

use crate::{
    app::AppState,
    entity::{
        romi_comments, romi_hitokotos, romi_metas, romi_news, romi_news_comments, romi_posts,
        romi_seimgs, romi_users,
    },
    guards::admin::AdminUser,
    models::info::{ResDashboardData, ResMusicData, ResProjectData, ResSettingsData},
    service::music::{MusicCache, get_music_cache},
    utils::{
        api::{ApiResult, api_ok},
        cache::{get_projects_cache, get_settings_cache},
    },
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/dashboard", get(fetch_dashboard))
        .route("/settings", get(fetch_settings))
        .route("/projects", get(fetch_projects))
        .route("/music", get(fetch_music))
}

async fn fetch_dashboard(
    _admin_user: AdminUser,
    State(AppState { ref conn, .. }): State<AppState>,
) -> ApiResult<ResDashboardData> {
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
        romi_posts::Entity::find().count(conn),
        romi_metas::Entity::find().filter(romi_metas::Column::IsCategory.eq("1")).count(conn),
        romi_metas::Entity::find().filter(romi_metas::Column::IsCategory.ne("1")).count(conn),
        romi_comments::Entity::find().count(conn),
        romi_news_comments::Entity::find().count(conn),
        romi_users::Entity::find().count(conn),
        romi_hitokotos::Entity::find().count(conn),
        romi_seimgs::Entity::find().count(conn),
        romi_news::Entity::find().count(conn),
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

async fn fetch_settings(
    State(AppState { ref conn, .. }): State<AppState>,
) -> ApiResult<ResSettingsData> {
    api_ok(get_settings_cache(conn).await.context("Failed to fetch site settings")?)
}

async fn fetch_projects() -> ApiResult<Vec<ResProjectData>> {
    api_ok(get_projects_cache().await.context("Failed to fetch projects data")?)
}

async fn fetch_music() -> ApiResult<Vec<ResMusicData>> {
    api_ok(get_music_cache().await.context("Failed to fetch music data").map(
        |MusicCache { data, .. }| {
            data.into_iter()
                .map(|SongInfo { name, artist, url, cover, lrc }| ResMusicData {
                    name,
                    artist,
                    url,
                    cover,
                    lrc,
                })
                .collect()
        },
    )?)
}
