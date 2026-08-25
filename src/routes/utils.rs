use std::fs;
use std::net::IpAddr;
use std::time::Duration;

use anyhow::Context;
use axum::{
  Json, Router,
  extract::{Path, Query, State},
  http::{HeaderMap, HeaderName, HeaderValue, StatusCode},
  response::{IntoResponse, Redirect, Response},
  routing::{get, post},
};
use futures_util::stream::StreamExt;
use rand::random;
use reqwest::{Client, Method};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, IntoActiveModel};

use crate::{
  app::{RomiConfig, RomiState},
  constant::DATA_DIR,
  entity::romi_views,
  models::utils::{QueryAgentData, QueryViewBadgeData, ReqAgentData, ResViewData},
  utils::api::{ApiError, ApiResult, api_ok},
};

const DEFAULT_BACKGROUNDS: &str = include_str!("../../data/background_2.txt");

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
    .route("/agent", get(agent_get))
    .route("/agent", post(agent_post))
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

/// Returns the default QQ avatar based on the configured QQ ID.
#[utoipa::path(get, path = "/api/utils/qqavatar", responses((status = 200, description = "Default QQ avatar")))]
async fn qqavatar_default(
  State(RomiState { config: RomiConfig { qid, .. }, .. }): State<RomiState>,
) -> impl IntoResponse {
  qqavatar(qid.unwrap_or("10101".to_string()), 640).await
}

/// Returns a QQ avatar for the given QQ ID.
#[utoipa::path(get, path = "/api/utils/qqavatar/{qid}", responses((status = 200, description = "QQ avatar by qid")))]
async fn qqavatar_qid(Path(qid): Path<String>) -> impl IntoResponse {
  qqavatar(qid, 640).await
}

/// Returns a QQ avatar for the given QQ ID and size.
#[utoipa::path(get, path = "/api/utils/qqavatar/{qid}/{size}", responses((status = 200, description = "QQ avatar by qid and size")))]
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

/// Redirects to a random default background image.
#[utoipa::path(get, path = "/api/utils/background", responses((status = 303, description = "Default random background")))]
async fn background_default() -> impl IntoResponse {
  choose_background(DEFAULT_BACKGROUNDS.to_string()).into_response()
}

/// Redirects to a random background image from the given background set.
#[utoipa::path(get, path = "/api/utils/background/{id}", responses((status = 303, description = "Random background by id")))]
async fn background_id(Path(id): Path<String>) -> impl IntoResponse {
  background(id).await
}

/// Fetches content from a remote URL via GET and returns it as a proxy response.
#[utoipa::path(get, path = "/api/utils/agent", params(QueryAgentData), responses((status = 200, description = "Fetch agent by url")))]
async fn agent_get(Query(params): Query<QueryAgentData>) -> Response {
  match params.url {
    Some(url) => {
      let headers = params.headers.and_then(|s| serde_json::from_str(&s).ok());
      proxy_request(Method::GET, &url, headers, None, params.content_type).await
    }
    None => (StatusCode::BAD_REQUEST, "missing url param").into_response(),
  }
}

/// Fetches content from a remote URL via POST with optional custom headers and body.
#[utoipa::path(post, path = "/api/utils/agent", request_body = ReqAgentData, responses((status = 200, description = "Fetch agent by url")))]
async fn agent_post(Json(payload): Json<ReqAgentData>) -> Response {
  proxy_request(Method::POST, &payload.url, payload.headers, payload.body, payload.content_type)
    .await
}

fn is_private_ip(ip: IpAddr) -> bool {
  match ip {
    IpAddr::V4(ip) => ip.is_loopback() || ip.is_private() || ip.is_unspecified(),
    IpAddr::V6(ip) => ip.is_loopback() || ip.is_unicast_link_local() || ip.is_unspecified(),
  }
}

async fn proxy_request(
  method: Method,
  url: &str,
  headers: Option<Vec<(String, String)>>,
  body: Option<String>,
  content_type: Option<String>,
) -> Response {
  let parsed = match reqwest::Url::parse(url) {
    Ok(parsed) => parsed,
    Err(_) => return (StatusCode::BAD_REQUEST, "invalid url").into_response(),
  };

  let host = match parsed.host_str() {
    Some(host) => host,
    None => return (StatusCode::BAD_REQUEST, "missing host").into_response(),
  };

  let resolved = tokio::net::lookup_host((host, 80)).await;
  if let Ok(mut ips) = resolved
    && let Some(ip) = ips.next()
    && is_private_ip(ip.ip())
  {
    return (StatusCode::FORBIDDEN, "private ip not allowed").into_response();
  }

  let client = Client::builder()
    .timeout(Duration::from_secs(15))
    .connect_timeout(Duration::from_secs(10))
    .build()
    .unwrap_or_default();

  let mut req = client.request(method, url);
  if let Some(body) = body {
    req = req.body(body);
  }
  if let Some(headers) = headers {
    for (name, value) in headers {
      if let (Ok(name), Ok(value)) =
        (HeaderName::from_bytes(name.as_bytes()), HeaderValue::from_str(&value))
      {
        req = req.header(name, value);
      }
    }
  }

  match req.send().await {
    Ok(resp) => {
      let status = resp.status();
      let mut headers = HeaderMap::new();
      if let Some(ct) = content_type
        && let Ok(value) = ct.parse()
      {
        headers.insert("Content-Type", value);
      }

      let mut stream = resp.bytes_stream();
      let mut buf = Vec::new();
      let limit = 20 * 1024 * 1024;

      while let Some(chunk) = stream.next().await {
        let chunk = match chunk {
          Ok(chunk) => chunk,
          Err(_) => return (StatusCode::BAD_GATEWAY, "fetch failed").into_response(),
        };
        if buf.len() + chunk.len() > limit {
          return (StatusCode::PAYLOAD_TOO_LARGE, "response too large").into_response();
        }
        buf.extend_from_slice(&chunk);
      }
      (status, headers, buf).into_response()
    }
    Err(_) => (StatusCode::BAD_GATEWAY, "fetch failed").into_response(),
  }
}

/// Gets the current view count for the given slug without incrementing it.
#[utoipa::path(get, path = "/api/utils/view/{slug}", responses((status = 200, description = "Get view count", body = ResViewData)))]
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

/// Increments the view count for the given slug.
#[utoipa::path(post, path = "/api/utils/view/{slug}", responses((status = 200, description = "Increase view count")))]
async fn post_views(
  Path(slug): Path<String>,
  State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<u32> {
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
      api_ok(model.count)
    }
    None => {
      romi_views::ActiveModel { slug: ActiveValue::Set(slug.clone()), count: ActiveValue::Set(1) }
        .insert(conn)
        .await
        .with_context(|| format!("Failed to create view {}", slug.clone()))?;
      api_ok(0)
    }
  }
}

/// Increments the view count and returns an SVG badge for the given slug.
#[utoipa::path(get, path = "/api/utils/view/badge/{slug}", params(QueryViewBadgeData), responses((status = 200, description = "View badge SVG")))]
async fn view_badge(
  Path(slug): Path<String>,
  Query(params): Query<QueryViewBadgeData>,
  State(RomiState { ref conn, .. }): State<RomiState>,
) -> impl IntoResponse {
  let label = params.label.unwrap_or_else(|| "views".to_string());
  let left_color = params.left_color.unwrap_or_else(|| "#555".to_string());
  let right_color = params.right_color.unwrap_or_else(|| "#4c1".to_string());
  let count = match romi_views::Entity::find_by_id(slug.clone()).one(conn).await.ok().flatten() {
    Some(model) => {
      let count = model.count + 1;
      let mut active_model = model.into_active_model();
      active_model.count = ActiveValue::Set(count);
      let _ = active_model.update(conn).await;
      count
    }
    None => {
      let _ = romi_views::ActiveModel {
        slug: ActiveValue::Set(slug.clone()),
        count: ActiveValue::Set(1),
      }
      .insert(conn)
      .await;
      1
    }
  }
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
