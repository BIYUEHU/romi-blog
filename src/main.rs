#[macro_use]
extern crate rocket;

mod api;
mod entity;
mod tools;
mod utils;

use api::global::ssr_handler;
use api::{meta, post};
use dotenvy::dotenv;
use logger::*;
use rocket::Config;
use sea_orm_rocket::Database;
use std::fs::exists;
use transport::console::ConsoleTransport;
use utils::config::load_config;
use utils::cros::get_cors;
use utils::pool::Db;
use utils::recorder::Recorder;
use utils::ssr::SSR;

#[rocket::main]
async fn bootstrap() {
    let logger = Logger::new().with_transport(ConsoleTransport {
        label_color: "magenta",
        ..Default::default()
    });

    if exists(".env").unwrap() {
        dotenv()
            .map_err(|e| {
                l_error!(
                    &logger,
                    "Failed to load environment variables from .env file: {}",
                    e
                );
            })
            .unwrap();
    }

    let config = load_config()
        .map_err(|e| l_fatal!(&logger, "{}", e))
        .unwrap();

    let logger = logger.clone().with_level(match config.log_level.as_str() {
        "trace" => LoggerLevel::Trace,
        "debug" => LoggerLevel::Debug,
        "record" => LoggerLevel::Record,
        "info" => LoggerLevel::Info,
        "warn" => LoggerLevel::Warn,
        "error" => LoggerLevel::Error,
        "fatal" => LoggerLevel::Fatal,
        "silent" => LoggerLevel::Silent,
        _ => {
            l_warn!(
                &logger,
                "Invalid log level: {}, using default level: info",
                config.log_level
            );
            LoggerLevel::Info
        }
    });

    if !config.database_url.trim().is_empty() {
        std::env::set_var("DATABASE_URL", config.clone().database_url);
    }
    if config.ssr_entry.trim().is_empty() {
        l_warn!(
            &logger,
            "SSR entry file not provided, SSR will not be launched"
        )
    } else if !exists(config.ssr_entry.clone()).unwrap() {
        l_fatal!(
            &logger,
            "SSR entry file not found: {}",
            config.ssr_entry.clone()
        );
        return;
    }

    rocket::custom(Config {
        port: config.port,
        log_level: rocket::config::LogLevel::Off,
        ..Config::debug_default()
    })
    .attach(Db::init())
    .attach(get_cors())
    .attach(Recorder::new(logger.clone(), config.clone()))
    .manage(SSR::new(
        config.ssr_entry.clone(),
        config.port + 1,
        logger.clone(),
    ))
    .manage(logger.clone())
    .mount(
        "/api/post",
        routes![
            post::fetch,
            post::fetch_all,
            post::create,
            post::update,
            post::delete
        ],
    )
    .mount(
        "/api/meta",
        routes![
            meta::fetch,
            meta::fetch_all,
            meta::create,
            meta::update,
            meta::delete
        ],
    )
    .mount("/", routes![ssr_handler])
    .launch()
    .await
    .map(|_| ())
    .map_err(|e| {
        l_fatal!(&logger, "Failed to launch server: {}", e);
    })
    .unwrap();
}

fn main() {
    bootstrap();
}
