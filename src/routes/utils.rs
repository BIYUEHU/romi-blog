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
use base64::{Engine, engine::general_purpose::STANDARD as BASE64};
use futures_util::stream::StreamExt;
use rand::random;
use regex::Regex;
use reqwest::{Client, Method};
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, IntoActiveModel};
use tokio::net::{TcpStream, UdpSocket};

use crate::{
  app::{RomiConfig, RomiState},
  constant::DATA_DIR,
  entity::romi_views,
  models::utils::{
    QueryAgentData, QueryViewBadgeData, ReqAgentData, ResBingData, ResMcskinData, ResMotdData,
    ResViewData, ResWordsData,
  },
  utils::api::{ApiError, ApiResult, api_ok},
};

const DEFAULT_MC_PORT: u16 = 25565;
const DEFAULT_MCBE_PORT: u16 = 19132;

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
    .route("/color", get(color_random))
    .route("/color/{r}/{g}/{b}", get(color_rgb))
    .route("/mcskin/{name}", get(mcskin))
    .route("/bing", get(bing_redirect))
    .route("/bing/json", get(bing_json))
    .route("/motd/{host}", get(motd_default_port))
    .route("/motd/{host}/{port}", get(motd))
    .route("/motdbe/{host}", get(motdbe_default_port))
    .route("/motdbe/{host}/{port}", get(motdbe))
    .route("/words/{msg}", get(words_with_type))
    .route("/words", get(words))
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

fn color_svg(r: u8, g: u8, b: u8) -> String {
  let text_color = format!(
    "#{:02X}{:02X}{:02X}",
    r.saturating_sub(32),
    g.saturating_sub(32),
    b.saturating_sub(32)
  );
  let hex = format!("#{r:02X}{g:02X}{b:02X}");
  let hsl = format!(
    "hsl({},{}%,{}%)",
    (r as f32 / 255.0 * 360.0).round(),
    (g as f32 / 255.0 * 100.0).round(),
    (b as f32 / 255.0 * 100.0).round()
  );
  format!(
    r##"<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720">
<rect width="1280" height="720" fill="rgb({r},{g},{b})"/>
<g fill="{text_color}" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="48">
<text x="640" y="330">rgb({r},{g},{b})</text>
<text x="640" y="390">{hex}</text>
<text x="640" y="450">{hsl}</text>
</g>
</svg>"##
  )
}

/// Returns an SVG image showing the given color with its RGB/hex/HSL values.
#[utoipa::path(
  get,
  path = "/api/utils/color/{r}/{g}/{b}",
  params(
    ("r" = u8, Path, description = "Red channel, 0-255"),
    ("g" = u8, Path, description = "Green channel, 0-255"),
    ("b" = u8, Path, description = "Blue channel, 0-255"),
  ),
  responses(
    (status = 200, description = "SVG image with rgb/hex/hsl text overlay", content_type = "image/svg+xml"),
    (status = 400, description = "Any channel out of 0-255 range"),
  )
)]
async fn color_rgb(Path((r, g, b)): Path<(u8, u8, u8)>) -> impl IntoResponse {
  ([("Content-Type", "image/svg+xml; charset=utf-8")], color_svg(r, g, b))
}

/// Returns an SVG image showing a random color with its RGB/hex/HSL values.
#[utoipa::path(
  get,
  path = "/api/utils/color",
  responses((status = 200, description = "SVG image with rgb/hex/hsl text overlay", content_type = "image/svg+xml"))
)]
async fn color_random() -> impl IntoResponse {
  color_rgb(Path((random(), random(), random()))).await
}

async fn mojang_uuid(name: &str) -> Option<String> {
  reqwest::get(format!("https://api.mojang.com/users/profiles/minecraft/{name}"))
    .await
    .ok()?
    .json::<serde_json::Value>()
    .await
    .ok()?
    .get("id")
    .and_then(|id| id.as_str())
    .map(str::to_string)
}

async fn mojang_textures(uuid: &str) -> Option<serde_json::Value> {
  let value =
    reqwest::get(format!("https://sessionserver.mojang.com/session/minecraft/profile/{uuid}"))
      .await
      .ok()?
      .json::<serde_json::Value>()
      .await
      .ok()?;
  let encoded = value.get("properties")?.get(0)?.get("value")?.as_str()?;
  let decoded = BASE64.decode(encoded).ok()?;
  serde_json::from_slice::<serde_json::Value>(&decoded).ok()?.get("textures").cloned()
}

/// Fetches Minecraft skin and cape URLs for the given player name.
#[utoipa::path(
  get,
  path = "/api/utils/mcskin/{name}",
  params(("name" = String, Path, description = "Minecraft Java Edition player name")),
  responses(
    (status = 200, description = "Skin and cape URLs", body = ResMcskinData),
    (status = 404, description = "Player name not found or has no skin set"),
    (status = 502, description = "Failed to reach Mojang API"),
  )
)]
async fn mcskin(Path(name): Path<String>) -> ApiResult<ResMcskinData> {
  let uuid = mojang_uuid(&name).await.ok_or_else(|| ApiError::not_found("Player not found"))?;
  let textures = mojang_textures(&uuid)
    .await
    .ok_or_else(|| ApiError::bad_gateway("Failed to fetch skin data"))?;
  let skin = textures
    .get("SKIN")
    .and_then(|skin| skin.get("url"))
    .and_then(|url| url.as_str())
    .map(str::to_string)
    .ok_or_else(|| ApiError::not_found("No skin found"))?;
  let cape = textures
    .get("CAPE")
    .and_then(|cape| cape.get("url"))
    .and_then(|url| url.as_str())
    .map(str::to_string);
  api_ok(ResMcskinData { skin, cape })
}
async fn fetch_bing() -> Option<ResBingData> {
  let body = reqwest::get("https://cn.bing.com/HPImageArchive.aspx?idx=0&n=1")
    .await
    .ok()?
    .text()
    .await
    .ok()?;
  let url = Regex::new(r"<url>(.*?)</url>").ok()?.captures(&body)?.get(1)?.as_str().to_string();
  let copyright =
    Regex::new(r"<copyright>(.*?)</copyright>").ok()?.captures(&body)?.get(1)?.as_str().to_string();
  Some(ResBingData { url: format!("https://cn.bing.com{url}"), copyright })
}

/// Redirects to today's Bing wallpaper image.
#[utoipa::path(
  get,
  path = "/api/utils/bing",
  responses(
    (status = 303, description = "Redirect to Bing wallpaper image"),
    (status = 502, description = "Failed to fetch or parse Bing's daily image feed"),
  )
)]
async fn bing_redirect() -> Response {
  match fetch_bing().await {
    Some(data) => Redirect::to(&data.url).into_response(),
    None => ApiError::bad_gateway("Failed to fetch Bing wallpaper").into_response(),
  }
}

/// Returns today's Bing wallpaper image URL and copyright as JSON.
#[utoipa::path(
  get,
  path = "/api/utils/bing/json",
  responses(
    (status = 200, description = "Bing wallpaper image URL and copyright text", body = ResBingData),
    (status = 502, description = "Failed to fetch or parse Bing's daily image feed"),
  )
)]
async fn bing_json() -> ApiResult<ResBingData> {
  fetch_bing()
    .await
    .ok_or_else(|| ApiError::bad_gateway("Failed to fetch Bing wallpaper"))
    .map(api_ok)?
}

async fn ping_motd(host: String, port: u16) -> ApiResult<ResMotdData> {
  let mut stream =
    tokio::time::timeout(Duration::from_secs(5), TcpStream::connect((host.as_str(), port)))
      .await
      .map_err(|_| ApiError::bad_gateway("Failed to connect to server"))?
      .map_err(|_| ApiError::bad_gateway("Failed to connect to server"))?;
  let response =
    tokio::time::timeout(Duration::from_secs(5), craftping::tokio::ping(&mut stream, &host, port))
      .await
      .map_err(|_| ApiError::bad_gateway("Failed to ping server"))?
      .map_err(|_| ApiError::bad_gateway("Failed to ping server"))?;
  let motd = response
    .description
    .as_ref()
    .and_then(|d| d.get("text"))
    .and_then(|t| t.as_str())
    .unwrap_or_default();
  api_ok(ResMotdData {
    online: true,
    version: response.version,
    motd: motd.to_string(),
    players_online: response.online_players as u32,
    players_max: response.max_players as u32,
  })
}

/// Queries a Minecraft Java Edition server's status via the given host and port.
#[utoipa::path(
  get,
  path = "/api/utils/motd/{host}/{port}",
  params(
    ("host" = String, Path, description = "Server hostname or IP address"),
    ("port" = u16, Path, description = "Server port"),
  ),
  responses(
    (status = 200, description = "Server version, motd and player counts", body = ResMotdData),
    (status = 502, description = "Server unreachable or does not speak the Java ping protocol"),
  )
)]
async fn motd(Path((host, port)): Path<(String, u16)>) -> ApiResult<ResMotdData> {
  ping_motd(host, port).await
}

/// Queries a Minecraft Java Edition server's status using the default port 25565.
#[utoipa::path(
  get,
  path = "/api/utils/motd/{host}",
  params(("host" = String, Path, description = "Server hostname or IP address")),
  responses(
    (status = 200, description = "Server version, motd and player counts", body = ResMotdData),
    (status = 502, description = "Server unreachable or does not speak the Java ping protocol"),
  )
)]
async fn motd_default_port(Path(host): Path<String>) -> ApiResult<ResMotdData> {
  ping_motd(host, DEFAULT_MC_PORT).await
}

async fn ping_motdbe(host: String, port: u16) -> ApiResult<ResMotdData> {
  let socket =
    UdpSocket::bind("0.0.0.0:0").await.map_err(|_| ApiError::internal("Failed to bind socket"))?;
  tokio::time::timeout(Duration::from_secs(5), socket.connect((host.as_str(), port)))
    .await
    .map_err(|_| ApiError::bad_gateway("Failed to connect to server"))?
    .map_err(|_| ApiError::bad_gateway("Failed to connect to server"))?;

  let mut packet = vec![0x01u8];
  packet.extend_from_slice(&0u64.to_be_bytes());
  packet.extend_from_slice(&[
    0x00, 0xff, 0xff, 0x00, 0xfe, 0xfe, 0xfe, 0xfe, 0xfd, 0xfd, 0xfd, 0xfd, 0x12, 0x34, 0x56, 0x78,
  ]);
  packet.extend_from_slice(&0u64.to_be_bytes());
  tokio::time::timeout(Duration::from_secs(5), socket.send(&packet))
    .await
    .map_err(|_| ApiError::bad_gateway("Failed to send ping"))?
    .map_err(|_| ApiError::bad_gateway("Failed to send ping"))?;

  let mut buf = [0u8; 1024];
  let len = tokio::time::timeout(Duration::from_secs(5), socket.recv(&mut buf))
    .await
    .map_err(|_| ApiError::bad_gateway("Failed to receive pong"))?
    .map_err(|_| ApiError::bad_gateway("Failed to receive pong"))?;
  let text = String::from_utf8_lossy(&buf[35..len]);
  let fields = text.split(';').collect::<Vec<_>>();
  let field = |index: usize| fields.get(index).map(|s| s.to_string()).unwrap_or_default();

  api_ok(ResMotdData {
    online: true,
    version: field(3),
    motd: field(1),
    players_online: field(4).parse().unwrap_or_default(),
    players_max: field(5).parse().unwrap_or_default(),
  })
}

/// Queries a Minecraft Bedrock Edition server's status via the given host and port.
#[utoipa::path(
  get,
  path = "/api/utils/motdbe/{host}/{port}",
  params(
    ("host" = String, Path, description = "Server hostname or IP address"),
    ("port" = u16, Path, description = "Server port"),
  ),
  responses(
    (status = 200, description = "Server version, motd and player counts", body = ResMotdData),
    (status = 502, description = "Server unreachable or does not speak the RakNet ping protocol"),
  )
)]
async fn motdbe(Path((host, port)): Path<(String, u16)>) -> ApiResult<ResMotdData> {
  ping_motdbe(host, port).await
}

/// Queries a Minecraft Bedrock Edition server's status using the default port 19132.
#[utoipa::path(
  get,
  path = "/api/utils/motdbe/{host}",
  params(("host" = String, Path, description = "Server hostname or IP address")),
  responses(
    (status = 200, description = "Server version, motd and player counts", body = ResMotdData),
    (status = 502, description = "Server unreachable or does not speak the RakNet ping protocol"),
  )
)]
async fn motdbe_default_port(Path(host): Path<String>) -> ApiResult<ResMotdData> {
  ping_motdbe(host, DEFAULT_MCBE_PORT).await
}

fn clean_line(line: &str) -> String {
  line.replace(['\n', '\t', '\r'], "")
}

const WORD_TYPES: &[(&str, &str)] = &[
  ("yan", "一言"),
  ("saohua", "骚话"),
  ("like", "情话"),
  ("life", "人生语录"),
  ("socwords", "社会语录"),
  ("badsoup", "毒鸡汤"),
  ("jokes", "笑话"),
  ("sadness", "网抑云"),
  ("gentle", "温柔语录"),
  ("dog", "舔狗语录"),
  ("love", "爱情语录"),
  ("sign", "个性签名"),
  ("renjian", "人间"),
  ("classics", "经典语录"),
  ("ce", "英汉语录"),
  ("poetry", "诗词"),
];

/// Returns a random quote from the given collection, or a bilingual pair for `msg=ce`.
///
/// Available `msg` values:
/// `yan` (一言), `saohua` (骚话), `like` (情话), `life` (人生语录),
/// `socwords` (社会语录), `badsoup` (毒鸡汤), `jokes` (笑话),
/// `sadness` (网抑云), `gentle` (温柔语录), `dog` (舔狗语录),
/// `love` (爱情语录), `sign` (个性签名), `renjian` (人间),
/// `classics` (经典语录), `ce` (英汉语录), `poetry` (诗词).
#[utoipa::path(
  get,
  path = "/api/utils/words/{msg}",
  params(("msg" = String, Path, description = "Quote type: yan, saohua, like, life, socwords, badsoup, jokes, sadness, gentle, dog, love, sign, renjian, classics, ce, poetry")),
  responses(
    (status = 200, description = "Random quote", body = ResWordsData),
    (status = 404, description = "No quotes available"),
  )
)]
async fn words_with_type(Path(msg): Path<String>) -> ApiResult<ResWordsData> {
  let msg = WORD_TYPES.iter().position(|(file, _)| *file == msg).unwrap_or(0) + 1;
  let (file_name, word_type) = WORD_TYPES[msg - 1];
  let path = format!("data/words/{file_name}.txt");
  let content = tokio::fs::read_to_string(&path).await.context("Failed to read words file")?;
  let lines = content.lines().filter(|line| !line.trim().is_empty()).collect::<Vec<_>>();
  if lines.is_empty() {
    return Err(ApiError::not_found("No quotes available"));
  }
  let index = random::<usize>() % lines.len();
  let mut text = clean_line(lines[index]);
  let mut english = None;
  let mut chinese = None;

  if msg == 15 {
    if text.chars().any(|ch| ch.is_ascii_alphabetic()) {
      english = Some(text.clone());
      chinese = lines.get(index.wrapping_sub(1)).map(|line| clean_line(line));
      text = format!("{}\n{}", text, chinese.clone().unwrap_or_default());
    } else {
      chinese = Some(text.clone());
      english = lines.get((index + 1).min(lines.len() - 1)).map(|line| clean_line(line));
      text = format!("{}\n{}", english.clone().unwrap_or_default(), text);
    }
  }

  api_ok(ResWordsData { text, word_type: word_type.to_string(), english, chinese })
}

/// Returns a random quote from any available collection.
#[utoipa::path(
  get,
  path = "/api/utils/words",
  responses((status = 200, description = "Random quote from any collection", body = ResWordsData))
)]
async fn words() -> ApiResult<ResWordsData> {
  let msg = random::<usize>() % WORD_TYPES.len() + 1;
  let (file_name, word_type) = WORD_TYPES[msg - 1];
  let path = format!("data/words/{file_name}.txt");
  let content = tokio::fs::read_to_string(&path).await.context("Failed to read words file")?;
  let lines = content.lines().filter(|line| !line.trim().is_empty()).collect::<Vec<_>>();
  if lines.is_empty() {
    return Err(ApiError::not_found("No quotes available"));
  }
  let index = random::<usize>() % lines.len();
  let text = clean_line(lines[index]);
  api_ok(ResWordsData { text, word_type: word_type.to_string(), english: None, chinese: None })
}
