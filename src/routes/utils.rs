use std::fs;

use anyhow::Context;
use axum::{
    Router,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Redirect},
    routing::{get, post},
};
use rand::random;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, IntoActiveModel};

use crate::{
    app::{RomiConfig, RomiState},
    constant::DATA_DIR,
    entity::romi_views,
    models::utils::{QueryAgentData, QueryViewBadgeData, ResViewData},
    utils::api::{ApiError, ApiResult, api_ok},
};

const DEFAULT_BACKGROUNDS: &'static str = include_str!("../../data/background_2.txt");

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/qqavatar", get(qqavatar_default))
        .route("/qqavatar/{qid}", get(qqavatar_qid))
        .route("/qqavatar/{qid}/{size}", get(qqavatar_qid_size))
        .route("/background", get(background_default))
        .route("/background/{id}", get(background_id))
        .route("/view/{slug}", get(get_views))
        .route("/view/{slug}", post(post_views))
        .route("/view/i/{slug}", get(post_views))
        .route("/view/badge/{slug}", get(view_badge))
        .route("/agent", get(agent))
}

async fn qqavatar(qid: String, size: u32) -> impl IntoResponse {
    match reqwest::get(&format!("https://q.qlogo.cn/g?b=qq&s={}&nk={}", size, qid)).await {
        Ok(resp) => {
            let bytes = resp.bytes().await.unwrap_or_default();
            let mut headers = HeaderMap::new();
            headers.insert("Content-Type", "image/jpeg".parse().unwrap());
            (headers, bytes).into_response()
        }
        Err(_) => ApiError::bad_gateway("Failed to fetch avatar").into_response(),
    }
}

async fn qqavatar_default(
    State(RomiState { config: RomiConfig { qid, .. }, .. }): State<RomiState>,
) -> impl IntoResponse {
    qqavatar(qid.unwrap_or("10101".to_string()), 640).await
}

async fn qqavatar_qid(Path(qid): Path<String>) -> impl IntoResponse {
    qqavatar(qid, 640).await
}

async fn qqavatar_qid_size(Path((qid, size)): Path<(String, u32)>) -> impl IntoResponse {
    qqavatar(qid, size).await
}

fn choose_background(content: String) -> impl IntoResponse {
    let imgs = content.lines().collect::<Vec<_>>();
    if imgs.is_empty() {
        ApiError::not_found("No backgrounds available").into_response()
    } else {
        Redirect::to(imgs[random::<usize>() % imgs.len()]).into_response()
    }
}

async fn background(id: String) -> impl IntoResponse {
    if let Ok(content) = fs::read_to_string(format!("{}/background_{}.txt", DATA_DIR, id)) {
        choose_background(content).into_response()
    } else {
        ApiError::not_found("No such background").into_response()
    }
}

async fn background_default() -> impl IntoResponse {
    choose_background(DEFAULT_BACKGROUNDS.to_string()).into_response()
}

async fn background_id(Path(id): Path<String>) -> impl IntoResponse {
    background(id).await
}

async fn agent(Query(params): Query<QueryAgentData>) -> impl IntoResponse {
    if let Some(url) = params.url {
        match reqwest::get(&url).await {
            Ok(resp) => {
                let bytes = resp.bytes().await.unwrap_or_default();
                let mut headers = HeaderMap::new();
                if let Some(ct) = params.content_type {
                    headers.insert("Content-Type", ct.parse().unwrap());
                }
                (headers, bytes).into_response()
            }
            Err(_) => (StatusCode::BAD_GATEWAY, "fetch failed").into_response(),
        }
    } else {
        (StatusCode::BAD_REQUEST, "missing url param").into_response()
    }
}

async fn get_views(
    Path(slug): Path<String>,
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<ResViewData> {
    match romi_views::Entity::find_by_id(slug.clone())
        .one(conn)
        .await
        .with_context(|| format!("Failed to select view {}", slug.clone()))?
    {
        Some(model) => api_ok(ResViewData { slug, count: model.count }),
        None => api_ok(ResViewData { slug, count: 0 }),
    }
}

async fn post_views(
    Path(slug): Path<String>,
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult {
    match romi_views::Entity::find_by_id(slug.clone())
        .one(conn)
        .await
        .with_context(|| format!("Failed to select view {}", slug.clone()))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.count = ActiveValue::Set(model.count + 1);
            active_model
                .update(conn)
                .await
                .with_context(|| format!("Failed to update view {}", slug.clone()))?;
        }
        None => {
            romi_views::ActiveModel {
                slug: ActiveValue::Set(slug.clone()),
                count: ActiveValue::Set(1),
            }
            .insert(conn)
            .await
            .with_context(|| format!("Failed to create view {}", slug.clone()))?;
        }
    }
    api_ok(())
}

async fn view_badge(
    Path(slug): Path<String>,
    Query(params): Query<QueryViewBadgeData>,
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> impl IntoResponse {
    let label = params.label.unwrap_or_else(|| "views".to_string());
    let left_color = params.left_color.unwrap_or_else(|| "#555".to_string());
    let right_color = params.right_color.unwrap_or_else(|| "#4c1".to_string());
    let count = romi_views::Entity::find_by_id(slug.clone())
        .one(conn)
        .await
        .ok()
        .flatten()
        .map(|model| model.count)
        .unwrap_or(0)
        .to_string();
    let left_width = label.len() as u32 * 7 + 20;
    let right_width = count.len() as u32 * 7 + 20;
    let width = left_width + right_width;

    (
        [("Content-Type", "image/svg+xml; charset=utf-8")],
        format!(
            r##"<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="20" role="img" aria-label="{label}: {count}">
<linearGradient id="a" x2="0" y2="100%">
<stop offset="0" stop-opacity=".1"/>
<stop offset="1" stop-opacity=".1"/>
</linearGradient>
<clipPath id="b"><rect width="{width}" height="20" rx="3" fill="#fff"/></clipPath>
<g clip-path="url(#b)">
<rect width="{left_width}" height="20" fill="{left_color}"/>
<rect x="{left_width}" width="{right_width}" height="20" fill="{right_color}"/>
<rect width="{width}" height="20" fill="url(#a)"/>
</g>
<g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="11">
<text x="{left_center}" y="15">{label}</text>
<text x="{right_center}" y="15">{count}</text>
</g>
</svg>"##,
            left_center = left_width / 2,
            right_center = left_width + right_width / 2
        ),
    )
}
