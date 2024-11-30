#[macro_use]
extern crate rocket;

mod api;
mod entity;
mod tools;
mod utils;

use api::posts;
use rocket::figment::providers::Env;
use rocket::fs::{relative, FileServer};
// use rocket::http::uri::Path;
use rocket::http::Method;
use rocket::response::content::RawHtml;
use rocket::serde::json::Json;
use rocket::Request;
use rocket_cors::{AllowedHeaders, AllowedOrigins, Cors};
use sea_orm_rocket::Database;
use std::fs;
use std::path::{Path, PathBuf};
use utils::pool::Db;

pub struct Directory {
    root_dir: PathBuf,
    static_dir: PathBuf,
}

#[catch(404)]
pub fn not_found(req: &Request<'_>) -> Json<String> {
    Json(format!("Not found: {}", req.uri()).to_string())
}

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

#[get("/<_path..>", rank = 99)]
fn fallback_route(_path: std::path::PathBuf) -> RawHtml<String> {
    RawHtml(
        if let Ok(content) = fs::read_to_string(Path::new("static/index.html")) {
            content
        } else {
            "<html><body><h1>404 Not Found</h1><p>Page not exists.</p></body></html>".to_string()
        },
    )
}

fn init_directory() -> Directory {
    let root_dir = std::env::current_dir().unwrap();
    let static_dir = root_dir.join("static");
    if !static_dir.exists() {
        fs::create_dir(static_dir.clone()).unwrap();
    }
    Directory {
        root_dir,
        static_dir,
    }
}

#[rocket::main]
async fn bootstrap() -> Result<(), rocket::Error> {
    init_directory();
    // TODO: run migrations
    rocket::build()
        .attach(Db::init())
        .mount("/", FileServer::from(relative!("static")))
        .attach(get_cors())
        .mount(
            "/api/posts",
            routes![
                posts::fetch,
                // temporary route for testing
                posts::fetch_test,
                posts::fetch_all,
                posts::create,
                posts::update,
                posts::delete
            ],
        )
        .mount("/", routes![fallback_route])
        .register("/", catchers![not_found])
        .launch()
        .await
        .map(|_| ())
}

fn main() {
    let result = bootstrap();

    if let Some(err) = result.err() {
        println!("Error: {err}");
    }
}
