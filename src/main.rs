#[macro_use]
extern crate rocket;

mod constant;
mod entity;
mod guards;
mod models;
mod routes;
mod service;
mod tools;
mod utils;

use rocket::Config;
use roga::*;
use routes::*;
use sea_orm_rocket::Database;
use service::pool::Db;
use service::recorder::Recorder;
use service::ssr::SSR;
use std::fs::exists;
use utils::bootstrap::{initialize_directories, load_env_vars, set_env_var};
use utils::catcher;
use utils::config::load_config;
use utils::cros::get_cors;
use utils::logger::get_logger;
use uuid::Uuid;

pub const FREE_HONG_KONG: &'static str =
    "香港に栄光あれ\n光复香港，时代革命\nFree Hong Kong, revolution now";

#[rocket::main]
async fn main() {
    if let Err(e) = load_env_vars() {
        eprintln!("{}", e);
        return;
    }

    set_env_var(
        "FREE_HONG_KONG_SECRET",
        format!("{}FREE{}", FREE_HONG_KONG, Uuid::new_v4().to_string()).as_str(),
    );

    let config = match load_config() {
        Ok(config) => config,
        Err(e) => {
            eprintln!("{}", e);
            return;
        }
    };

    let logger = get_logger();

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

    if let Err(e) = initialize_directories() {
        l_fatal!(&logger, "{}", e);
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
            news::view,
            news::like,
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
            info::fetch_projects,
            info::fetch_music
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
