use axum::{Router, middleware};
use roga::Logger;
use sea_orm::DatabaseConnection;
use serde::Deserialize;

use crate::{
    middlewares::{req_logger_middleware, res_error_inspector_middleware},
    routes::{self, global::fallback},
    service::ssr::SSR,
    utils::bootstrap::get_cors,
};

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
    pub ssr: SSR,
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
        .nest("/utils", routes::utils::routes());

    let app = Router::new()
        .nest("/api", api)
        .layer(get_cors())
        .layer(middleware::from_fn_with_state(state.clone(), req_logger_middleware))
        .layer(middleware::from_fn_with_state(state.clone(), res_error_inspector_middleware))
        .fallback(fallback)
        .with_state(state);

    app
}
