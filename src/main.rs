use std::{env, fs, net::SocketAddr};

use axum::{Router, routing::get};
use roga::{transport::console::ConsoleTransport, *};
use sea_orm::Database;
use utils::bootstrap::{get_cors, initialize_directories, load_config, load_env_vars};
use uuid::Uuid;

use crate::{app::AppState, service::ssr::SSR};

mod app;
mod constant;
mod entity;
mod guards;
mod models;
mod routes;
mod service;
mod tools;
mod utils;

pub const FREE_HONG_KONG: &'static str =
    "香港に栄光あれ\n光复香港，时代革命\nFree Hong Kong, revolution now";

#[tokio::main]
async fn main() {
    if let Err(e) = load_env_vars() {
        eprintln!("{}", e);
        return;
    }

    let config = match load_config() {
        Ok(cfg) => cfg,
        Err(e) => {
            eprintln!("{}", e);
            return;
        }
    };

    let logger = Logger::new()
        .with_transport(ConsoleTransport { label_color: "magenta", ..Default::default() })
        .with_level(match config.log_level.as_str() {
            "fatal" => LoggerLevel::Fatal,
            "error" => LoggerLevel::Error,
            "warn" => LoggerLevel::Warn,
            "info" => LoggerLevel::Info,
            "record" => LoggerLevel::Record,
            "debug" => LoggerLevel::Debug,
            "trace" => LoggerLevel::Trace,
            "silent" => LoggerLevel::Silent,
            _ => {
                eprintln!("Invalid log level: {}", config.log_level);
                return;
            }
        });

    if !config.database_url.trim().is_empty() {
        unsafe {
            env::set_var("DATABASE_URL", config.clone().database_url);
        }
    }
    let conn =
        match Database::connect(env::var("DATABASE_URL").expect("DATABASE_URL not set")).await {
            Ok(conn) => conn,
            Err(err) => {
                l_fatal!(
                    &logger,
                    "Failed to connect to database at {}, error: {}",
                    config.database_url,
                    err
                );
                return;
            }
        };

    if config.ssr_entry.trim().is_empty() {
        l_warn!(&logger, "SSR entry file not provided, SSR will not be launched")
    } else if !fs::exists(config.ssr_entry.clone()).unwrap() {
        l_fatal!(&logger, "SSR entry file not found: {}", config.ssr_entry.clone());
        return;
    }

    if let Err(e) = initialize_directories() {
        l_fatal!(&logger, "{}", e);
    }

    let ssr = SSR::new(config.ssr_entry.clone(), config.port + 1, logger.clone());
    // let recorder = Recorder::new(logger.clone(), config.clone());
    let app = Router::new()
        .nest("/api/post", routes::post::routes())
        .nest("/api/meta", routes::meta::routes())
        .nest("/api/comment", routes::comment::routes())
        .nest("/api/user", routes::user::routes())
        .nest("/api/hitokoto", routes::hitokoto::routes())
        .nest("/api/news", routes::news::routes())
        .nest("/api/character", routes::character::routes())
        .nest("/api/seimg", routes::seimg::routes())
        .nest("/api/info", routes::info::routes())
        .route("/{*path}", get(routes::global::ssr_handler))
        .layer(get_cors())
        .with_state(AppState {
            secret: format!("{}FREE{}", FREE_HONG_KONG, Uuid::new_v4().to_string()),
            logger: logger.clone(),
            // config: config.clone(),
            conn,
            ssr,
        });

    let addr = SocketAddr::from((config.address.parse::<std::net::IpAddr>().unwrap(), config.port));
    l_info!(&logger, "Listening on {}", addr);

    let _ = axum::serve(tokio::net::TcpListener::bind(&addr).await.unwrap(), app)
        .await
        .map(|_| ())
        .map_err(|e| {
            l_fatal!(&logger, "Failed to launch server: {}", e);
        });
}
