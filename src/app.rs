use roga::Logger;
use sea_orm::DatabaseConnection;
use serde::Deserialize;

use crate::service::ssr::SSR;

#[derive(Debug, Deserialize, Clone)]
pub struct RomiConfig {
    pub address: String,
    pub port: u16,
    pub database_url: String,
    pub ssr_entry: String,
    pub log_level: String,
}

#[derive(Clone)]
pub struct AppState {
    pub conn: DatabaseConnection,
    pub logger: Logger,
    // pub config: RomiConfig,
    pub ssr: SSR,
    pub secret: String,
}
