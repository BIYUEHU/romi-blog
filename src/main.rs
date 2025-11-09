use std::{env, fs, net::SocketAddr};

use roga::{transport::console::ConsoleTransport, *};
use sea_orm::Database;
use tokio::signal;
use utils::bootstrap::{load_config, load_env_vars};
use uuid::Uuid;

use crate::{
    app::{RomiState, build_app},
    constant::{BUILD_TIME, HASH, VERSION},
    service::ssr::SSR,
    utils::bootstrap::{get_network_ip, initialize_directories},
};

mod app;
mod constant;
mod entity;
mod guards;
mod middlewares;
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
        Ok(mut config) => {
            if let Ok(qid) = env::var("QID") {
                config.qid = Some(qid);
            }
            if let Ok(database_url) = env::var("DATABASE_URL") {
                config.database_url = database_url;
            }
            config
        }
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

    let conn = {
        let database_url = if config.database_url.trim().is_empty() {
            l_fatal!(&logger, "DATABASE_URL not set");
            return;
        } else {
            config.database_url.clone()
        };
        match Database::connect(&database_url).await {
            Ok(conn) => conn,
            Err(err) => {
                l_fatal!(
                    &logger,
                    "Failed to connect to database at {}, error: {}",
                    database_url,
                    err
                );
                return;
            }
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

    let app = build_app(RomiState {
        secret: format!("{}FREE{}", FREE_HONG_KONG, Uuid::new_v4().to_string()),
        logger: logger.clone(),
        conn,
        ssr: ssr.clone(),
        config: config.clone(),
    });

    let addr = SocketAddr::from((
        match config.address.parse::<std::net::IpAddr>() {
            Ok(addr) => addr,
            Err(e) => {
                l_fatal!(&logger, "Invalid address: {}, error: {}", config.address, e);
                return;
            }
        },
        config.port,
    ));

    let _ = axum::serve(
        match tokio::net::TcpListener::bind(&addr).await {
            Ok(listener) => {
                l_info!(&logger, "Server launched ➜ http://{}", addr);
                if config.address.as_str() == "0.0.0.0" {
                    l_info!(&logger, "Server launched ➜ local http://127.0.0.1:{}", config.port);
                    if let Some(ip) = get_network_ip() {
                        l_info!(&logger, "Server launched ➜ network http://{}:{}", ip, config.port);
                    }
                }

                l_info!(
                    &logger,
                    "RomiChan - By Arimura Sena | Version: v{} HASH: {} BUILD: {}",
                    VERSION,
                    HASH,
                    BUILD_TIME
                );

                listener
            }
            Err(e) => {
                l_fatal!(&logger, "Failed to bind to address {}, error: {}", addr, e);
                return;
            }
        },
        app.into_make_service_with_connect_info::<SocketAddr>(),
    )
    .with_graceful_shutdown(shutdown_signal())
    .await
    .map_err(|e| {
        l_fatal!(&logger, "Failed to launch server: {}", e);
    });

    l_warn!(&logger, "Server are shutting down...");
    ssr.shutdown().await;
    l_debug!(&logger, "Server shutdown complete");
}

async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c().await.expect("Failed to install Ctrl+C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("Failed to install signal handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {},
        _ = terminate => {},
    }
}
