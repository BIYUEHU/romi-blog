use std::net::SocketAddr;

use axum::{
  extract::{ConnectInfo, Request, State},
  http::StatusCode,
  middleware::Next,
  response::{IntoResponse, Response},
};
use roga::*;

use crate::{
  app::RomiState,
  constant::NODEJS_LOGGER_LABEL,
  service::info,
  utils::http::{get_real_ip, get_req_user_agent},
};

fn setup_logger(logger: Logger, user_agent: Option<&str>) -> Logger {
  if user_agent.map(|str| str.contains("node")).unwrap_or(false) {
    logger.with_label(NODEJS_LOGGER_LABEL)
  } else {
    logger
  }
}

pub async fn ip_blacklist_middleware(
  State(RomiState { conn, logger, .. }): State<RomiState>,
  ConnectInfo(addr): ConnectInfo<SocketAddr>,
  req: Request,
  next: Next,
) -> Response {
  let ip = get_real_ip(req.headers(), addr.ip()).to_string();
  match info::is_ip_blacklisted(&conn, &ip).await {
    Ok(true) => {
      l_warn!(logger.clone().with_label("Security"), "Blocked request from blacklisted IP: {}", ip);
      return (StatusCode::FORBIDDEN, "Forbidden").into_response();
    }
    Ok(false) => {}
    Err(e) => {
      l_error!(logger.clone().with_label("Security"), "Failed to check IP blacklist: {:#}", e);
    }
  }
  next.run(req).await
}

pub async fn req_logger_middleware(
  State(RomiState { logger, .. }): State<RomiState>,
  ConnectInfo(addr): ConnectInfo<SocketAddr>,
  req: Request,
  next: Next,
) -> Response {
  let user_agent = get_req_user_agent(req.headers());
  let logger = setup_logger(logger, user_agent);

  let ip = get_real_ip(req.headers(), addr.ip());
  l_record!(
    logger.clone().with_label("Req").with_label(req.method().to_string().to_uppercase()),
    "Calling {} with ip: {}, user_agent: {}",
    req.uri().to_string(),
    ip.to_string(),
    user_agent.unwrap_or("unknown")
  );

  next.run(req).await
}

pub async fn res_error_inspector_middleware(
  State(RomiState { logger, .. }): State<RomiState>,
  req: Request,
  next: Next,
) -> Response {
  let uri = req.uri().to_string();
  let logger = setup_logger(logger, get_req_user_agent(req.headers()));

  let res = next.run(req).await;

  if let Some(err) = res.extensions().get::<String>() {
    l_error!(logger, "Unknown: {}", err);
  }

  l_record!(logger.with_label("Res"), "Returning {} with status: {}", uri, res.status());

  res
}

type KeyedLimiter = governor::RateLimiter<
  std::net::IpAddr,
  governor::state::keyed::DefaultKeyedStateStore<std::net::IpAddr>,
  governor::clock::DefaultClock,
>;

fn build_keyed_limiter(per_second: u32, burst: u32) -> KeyedLimiter {
  let quota = governor::Quota::per_second(std::num::NonZeroU32::new(per_second).unwrap())
    .allow_burst(std::num::NonZeroU32::new(burst).unwrap());
  governor::RateLimiter::keyed(quota)
}

static LOOPBACK_LIMITER: std::sync::LazyLock<governor::DefaultDirectRateLimiter> =
  std::sync::LazyLock::new(|| {
    governor::RateLimiter::direct(governor::Quota::per_second(
      std::num::NonZeroU32::new(100).unwrap(),
    ))
  });

static GLOBAL_LIMITER: std::sync::LazyLock<KeyedLimiter> =
  std::sync::LazyLock::new(|| build_keyed_limiter(4, 30));

static STRICT_LIMITER: std::sync::LazyLock<KeyedLimiter> =
  std::sync::LazyLock::new(|| build_keyed_limiter(1, 5));

fn is_allowed(ip: std::net::IpAddr, limiter: &KeyedLimiter) -> bool {
  if ip.is_loopback() { LOOPBACK_LIMITER.check().is_ok() } else { limiter.check_key(&ip).is_ok() }
}

pub async fn global_rate_limit_middleware(
  ConnectInfo(addr): ConnectInfo<SocketAddr>,
  req: Request,
  next: Next,
) -> Response {
  let ip = get_real_ip(req.headers(), addr.ip());
  if is_allowed(ip, &GLOBAL_LIMITER) {
    next.run(req).await
  } else {
    (StatusCode::TOO_MANY_REQUESTS, "Too many requests").into_response()
  }
}

pub async fn strict_rate_limit_middleware(
  ConnectInfo(addr): ConnectInfo<SocketAddr>,
  req: Request,
  next: Next,
) -> Response {
  let ip = get_real_ip(req.headers(), addr.ip());
  if is_allowed(ip, &STRICT_LIMITER) {
    next.run(req).await
  } else {
    (StatusCode::TOO_MANY_REQUESTS, "Too many requests").into_response()
  }
}
