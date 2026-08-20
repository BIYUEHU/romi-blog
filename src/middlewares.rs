use std::net::SocketAddr;

use axum::{
  extract::{ConnectInfo, Request, State},
  http::StatusCode,
  middleware::Next,
  response::{IntoResponse, Response},
};
use roga::*;

use crate::{
  app::RomiState, constant::NODEJS_LOGGER_LABEL, service::info, utils::http::get_req_user_agent,
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
  let ip = addr.ip().to_string();
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

  l_record!(
    logger.clone().with_label("Req").with_label(req.method().to_string().to_uppercase()),
    "Calling {} with ip: {}, user_agent: {}",
    req.uri().to_string(),
    addr.ip().to_string(),
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
