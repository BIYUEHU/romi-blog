#[macro_use]
extern crate rocket;

mod api;
mod entity;
mod tools;
mod utils;

use api::global::ssr_handler;
use api::post;
use dotenvy::dotenv;
use logger::*;
use rocket::http::Method;
use rocket::Config;
use rocket_cors::{AllowedHeaders, AllowedOrigins, Cors};
use sea_orm_rocket::Database;
use transport::console::ConsoleTransport;
use utils::pool::Db;
use utils::request_logger::RequestLogger;
use utils::ssr::SSR;

fn get_cors() -> Cors {
    rocket_cors::CorsOptions {
        allowed_origins: AllowedOrigins::All,
        allowed_methods: vec![
            Method::Get,
            Method::Post,
            Method::Options,
            Method::Delete,
            Method::Put,
        ]
        .into_iter()
        .map(From::from)
        .collect(),
        allowed_headers: AllowedHeaders::All,
        allow_credentials: true,
        ..Default::default()
    }
    .to_cors()
    .expect("cors config error")
}

#[rocket::main]
async fn bootstrap() {
    dotenv().expect("Failed to load .env file");

    let config = Config {
        port: 3200,
        log_level: rocket::config::LogLevel::Off,
        ..Config::debug_default()
    };

    let logger = Logger::new()
        .with_transport(ConsoleTransport {
            label_color: "magenta",
            ..Default::default()
        })
        .with_level(LoggerLevel::Debug);

    let result = rocket::custom(config.clone())
        .attach(Db::init())
        .attach(get_cors())
        .attach(RequestLogger::new(logger.clone()))
        .manage(SSR::new(
            "dist\\server\\server.mjs",
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
        .mount("/", routes![ssr_handler])
        .launch()
        .await
        .map(|_| ());

    if let Err(e) = result {
        l_fatal!(&logger, e);
    }
}

fn main() {
    bootstrap();
}
