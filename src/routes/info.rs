use std::{env, process::Command};

use anyhow::Context;
use axum::{
    Json, Router,
    extract::State,
    routing::{get, put},
};
use fetcher::playlist::SongInfo;
use roga::{l_error, l_info};
use sea_orm::{ColumnTrait, EntityTrait, PaginatorTrait, QueryFilter, sea_query::Expr};
use sysinfo::System;
use tokio::try_join;

use crate::{
    app::RomiState,
    constant::SETTINGS_FIELDS,
    entity::{
        romi_comments, romi_fields, romi_hitokotos, romi_metas, romi_news, romi_news_comments,
        romi_posts, romi_seimgs, romi_users,
    },
    guards::admin::AdminUser,
    models::info::{ResDashboardData, ResMusicData, ResProjectData, ResSettingsData},
    service::music::{MusicCache, get_music_cache},
    utils::{
        api::{ApiError, ApiResult, api_ok},
        cache::{get_projects_cache, get_settings_cache, update_settings_cache},
    },
};

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/dashboard", get(fetch_dashboard))
        .route("/settings", get(fetch_settings))
        .route("/settings", put(update_settings))
        .route("/projects", get(fetch_projects))
        .route("/music", get(fetch_music))
}

async fn fetch_dashboard(
    _admin_user: AdminUser,
    State(RomiState { ref conn, .. }): State<RomiState>,
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
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<ResSettingsData> {
    api_ok(get_settings_cache(conn).await.context("Failed to fetch site settings")?)
}

async fn update_settings(
    AdminUser(admin_user): AdminUser,
    State(RomiState { ref conn, ref logger, .. }): State<RomiState>,
    Json(settings): Json<ResSettingsData>,
) -> ApiResult {
    let model = romi_fields::Entity::find()
        .filter(romi_fields::Column::Key.eq(SETTINGS_FIELDS))
        .one(conn)
        .await
        .context("Failed to fetch settings")?;

    if let Some(model) = model {
        romi_fields::Entity::update_many()
            .col_expr(
                romi_fields::Column::Value,
                Expr::value(
                    serde_json::to_string(&settings).context("Failed to serialize settings")?,
                ),
            )
            .filter(romi_fields::Column::Fid.eq(model.fid))
            .exec(conn)
            .await
            .context("Failed to update settings")?;
        update_settings_cache(settings.clone()).await;
        l_info!(logger, "Updated settings by admin {} ({})", admin_user.id, admin_user.username);
        api_ok(())
    } else {
        l_error!(
            logger,
            "A error when updating settings by admin {} ({})",
            admin_user.id,
            admin_user.username
        );
        Err(ApiError::internal("Fields table has no settings data"))
    }

    // let record = romi_fields::Entity::update()
    //     .filter(romi_fields::Column::Key.eq(SETTINGS_FIELDS))
    //     .one(conn)
    //     .await
    //     .context("Failed to fetch settings")?
    //     .ok_or_else(|| anyhow!("Settings not found"))?;
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
