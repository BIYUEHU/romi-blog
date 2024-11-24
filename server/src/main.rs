#[macro_use]
extern crate rocket;

mod api;
mod entity;
mod utils;

use api::articles;
use rocket::http::Method;
use rocket::{serde::json::Json, Request};
use rocket_cors::{AllowedHeaders, AllowedOrigins, Cors};
use sea_orm_rocket::Database;
use utils::pool::Db;

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

#[rocket::main]
async fn bootstrap() -> Result<(), rocket::Error> {
    // TODO: run migrations
    rocket::build()
        .attach(Db::init())
        .attach(get_cors())
        .mount(
            "/api/articles",
            routes![
                articles::fetch,
                // temporary route for testing
                articles::fetch_test,
                articles::fetch_all,
                articles::create,
                articles::update,
                articles::delete
            ],
        )
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
