use std::fs;

use axum::{
    Router,
    extract::{Path, Query, State},
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Redirect},
    routing::get,
};
use rand::random;

use crate::{
    app::{RomiConfig, RomiState},
    constant::DATA_DIR,
    models::utils::QueryAgent,
    utils::api::ApiError,
};

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/qqavatar", get(qqavatar_default))
        .route("/qqavatar/{qid}", get(qqavatar_qid))
        .route("/qqavatar/{qid}/{size}", get(qqavatar_qid_size))
        .route("/background", get(background_default))
        .route("/background/{id}", get(background_id))
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

async fn background(id: String) -> impl IntoResponse {
    match fs::read_to_string(&format!("./{DATA_DIR}/background_{id}.txt")) {
        Ok(content) => {
            let lines: Vec<_> = content.lines().collect();
            if lines.is_empty() {
                ApiError::not_found("No backgrounds available").into_response()
            } else {
                Redirect::to(lines[random::<usize>() % lines.len()]).into_response()
            }
        }
        Err(_) => ApiError::not_found("No such background").into_response(),
    }
}

async fn background_default() -> impl IntoResponse {
    background("1".to_string()).await
}

async fn background_id(Path(id): Path<String>) -> impl IntoResponse {
    background(id).await
}

async fn agent(Query(params): Query<QueryAgent>) -> impl IntoResponse {
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
