use std::{fs, net::SocketAddr};

use axum::{
    Router,
    extract::Query,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Redirect},
    routing::get,
};
use serde::Deserialize;

#[derive(Deserialize)]
struct QQAvatarParams {
    qq: Option<String>,
    size: Option<u32>,
}

async fn qqavatar(Query(params): Query<QQAvatarParams>) -> impl IntoResponse {
    let qq = params.qq.unwrap_or_else(|| "10001".to_string());
    let size = params.size.unwrap_or(640);
    let url = format!("https://q.qlogo.cn/g?b=qq&s={size}&nk={qq}");

    match reqwest::get(&url).await {
        Ok(resp) => {
            let bytes = resp.bytes().await.unwrap_or_default();
            let mut headers = HeaderMap::new();
            headers.insert("Content-Type", "image/jpeg".parse().unwrap());
            (headers, bytes).into_response()
        }
        Err(_) => (StatusCode::BAD_GATEWAY, "failed to fetch qq avatar").into_response(),
    }
}

#[derive(Deserialize)]
struct BackgroundParams {
    id: Option<String>,
}

async fn background(Query(params): Query<BackgroundParams>) -> impl IntoResponse {
    let id = params.id.unwrap_or_else(|| "1".to_string());
    let file_path = format!("./{id}.txt");

    match fs::read_to_string(&file_path) {
        Ok(content) => {
            let lines: Vec<_> = content.lines().collect();
            if lines.is_empty() {
                return (StatusCode::NOT_FOUND, "no urls found").into_response();
            }
            let idx = rand::random::<usize>() % lines.len();
            Redirect::to(lines[idx])
        }
        Err(_) => (StatusCode::NOT_FOUND, "file not found").into_response(),
    }
}

async fn agent(Query(params): Query<AgentParams>) -> impl IntoResponse {
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
