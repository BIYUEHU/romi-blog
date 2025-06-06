/** 我草你妈的，傻逼支那豚，你翻你妈的代码 **/

#[macro_use]
extern crate rocket;

mod entity;
mod guards;
mod models;
mod routes;
mod tools;
mod utils;

use dotenvy::dotenv;
use rocket::Config;
use roga::*;
use routes::{character, comment, global, hitokoto, info, meta, news, post, seimg, user};
use sea_orm_rocket::Database;
use std::env;
use std::fs::exists;
use transport::console::ConsoleTransport;
use utils::catcher;
use utils::config::load_config;
use utils::cros::get_cors;
use utils::pool::Db;
use utils::recorder::Recorder;
use utils::ssr::SSR;
use uuid::Uuid;

pub const FREE_HONG_KONG: &'static str =
    "香港に栄光あれ\n光复香港，时代革命\nFree Hong Kong, revolution now";

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

    env::set_var(
        "FREE_HONG_KONG_SECRET",
        format!("{}FREE{}", FREE_HONG_KONG, Uuid::new_v4().to_string()),
    );

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

    let _ = rocket::custom(Config {
        address: config.address.parse().unwrap(),
        port: config.port,
        log_level: rocket::config::LogLevel::Off,
        ..Config::default()
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
            post::like,
            post::view,
            post::delete,
            post::decrypt
        ],
    )
    .mount(
        "/api/meta",
        routes![
            meta::fetch,
            meta::fetch_all,
            meta::create,
            // meta::update,
            meta::delete
        ],
    )
    .mount(
        "/api/comment",
        routes![
            comment::fetch_all,
            comment::fetch_by_post,
            comment::create,
            comment::delete
        ],
    )
    .mount(
        "/api/user",
        routes![
            user::login,
            user::fetch,
            user::fetch_all,
            user::create,
            user::update,
            user::delete
        ],
    )
    .mount(
        "/api/hitokoto",
        routes![
            hitokoto::fetch,
            hitokoto::fetch_by_id,
            hitokoto::fetch_public,
            hitokoto::fetch_all,
            hitokoto::create,
            hitokoto::update,
            hitokoto::like,
            hitokoto::delete
        ],
    )
    .mount(
        "/api/news",
        routes![
            news::fetch,
            news::fetch_all,
            news::create,
            news::update,
            news::delete
        ],
    )
    .mount(
        "/api/character",
        routes![
            character::fetch,
            character::fetch_all,
            character::create,
            character::update,
            character::delete
        ],
    )
    .mount(
        "/api/seimg",
        routes![seimg::fetch, seimg::create, seimg::update, seimg::delete],
    )
    .mount(
        "/api/info",
        routes![
            info::fetch_dashboard,
            info::fetch_settings,
            info::fetch_projects
        ],
    )
    .register(
        "/",
        catchers![
            catcher::bad_request,
            catcher::unauthorized,
            catcher::forbidden,
            catcher::not_found,
            catcher::unprocessable_entity,
            catcher::internal_server_error
        ],
    )
    .mount("/", routes![global::ssr_handler])
    // .mount("/", FileServer::from(relative!("dist/browser")))
    .launch()
    .await
    .map(|_| ())
    .map_err(|e| {
        l_fatal!(&logger, "Failed to launch server: {}", e);
    });
}

fn main() {
    bootstrap();
}
