use crate::{
  middlewares::{
    global_rate_limit_middleware, ip_blacklist_middleware, req_logger_middleware,
    res_error_inspector_middleware, strict_rate_limit_middleware,
  },
  routes::{self, global::fallback},
  service::ssr::ServerSideRender,
  utils::bootstrap::get_cors,
};

use axum::{Router, middleware};
use roga::Logger;
use sea_orm::DatabaseConnection;
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct RomiConfig {
  pub address: String,
  pub port: u16,
  pub database_url: String,
  pub ssr_entry: String,
  pub log_level: String,
  pub qid: Option<String>,
}

#[derive(Clone)]
pub struct RomiState {
  pub conn: DatabaseConnection,
  pub logger: Logger,
  pub config: RomiConfig,
  pub ssr: ServerSideRender,
  pub secret: String,
}

pub fn build_app(state: RomiState) -> Router {
  let api = Router::new()
    .nest("/post", routes::post::routes())
    .nest("/meta", routes::meta::routes())
    .nest("/comment", routes::comment::routes())
    .nest("/user", routes::user::routes())
    .nest("/hitokoto", routes::hitokoto::routes())
    .nest("/news", routes::news::routes())
    .nest("/character", routes::character::routes())
    .nest("/seimg", routes::seimg::routes())
    .nest("/info", routes::info::routes())
    .nest(
      "/utils",
      routes::utils::routes().layer(middleware::from_fn(strict_rate_limit_middleware)),
    );

  Router::new()
    .merge(routes::sitemap::routes())
    .merge(routes::rss::routes())
    .nest("/api", api)
    .layer(middleware::from_fn(global_rate_limit_middleware))
    .layer(get_cors())
    .layer(middleware::from_fn_with_state(state.clone(), ip_blacklist_middleware))
    .layer(middleware::from_fn_with_state(state.clone(), req_logger_middleware))
    .layer(middleware::from_fn_with_state(state.clone(), res_error_inspector_middleware))
    .fallback(fallback)
    .with_state(state)
}
