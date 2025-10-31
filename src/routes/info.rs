use std::{env, process::Command};

use anyhow::Context;
use axum::{Router, extract::State, routing::get};
use fetcher::playlist::SongInfo;
use futures::try_join;
use roga::*;
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
        api::{ApiError, ApiResult, api_ok},
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
    State(state): State<AppState>,
) -> ApiResult<ResDashboardData> {
    l_info!(&state.logger, "Fetching dashboard data");

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
        romi_posts::Entity::find().count(&state.conn),
        romi_metas::Entity::find()
            .filter(romi_metas::Column::IsCategory.eq("1"))
            .count(&state.conn),
        romi_metas::Entity::find()
            .filter(romi_metas::Column::IsCategory.ne("1"))
            .count(&state.conn),
        romi_comments::Entity::find().count(&state.conn),
        romi_news_comments::Entity::find().count(&state.conn),
        romi_users::Entity::find().count(&state.conn),
        romi_hitokotos::Entity::find().count(&state.conn),
        romi_seimgs::Entity::find().count(&state.conn),
        romi_news::Entity::find().count(&state.conn),
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

async fn fetch_settings(State(state): State<AppState>) -> ApiResult<ResSettingsData> {
    l_info!(&state.logger, "Fetching site settings");
    api_ok(get_settings_cache(&state.conn).await.map_err(|e| ApiError::internal(e.to_string()))?)
}

async fn fetch_projects(State(state): State<AppState>) -> ApiResult<Vec<ResProjectData>> {
    l_info!(&state.logger, "Fetching projects data from github repository");
    api_ok(get_projects_cache().await.map_err(|e| ApiError::internal(e.to_string()))?)
}

async fn fetch_music(State(state): State<AppState>) -> ApiResult<Vec<ResMusicData>> {
    l_info!(&state.logger, "Fetching music data from netease music");
    api_ok(get_music_cache().await.map_err(|e| ApiError::internal(e.to_string())).map(
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
