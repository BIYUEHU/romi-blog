#[macro_use]
extern crate rocket;

mod pool;
use pool::Db;
use rocket::{serde::json::Json, Request};
use sea_orm_rocket::Database;

mod api;

#[catch(404)]
pub fn not_found(req: &Request<'_>) -> Json<String> {
    Json(format!("Not found: {}", req.uri()).to_string())
}

#[rocket::main]
async fn bootstrap() -> Result<(), rocket::Error> {
    // TODO: run migrations
    rocket::build()
        .attach(Db::init())
        .mount("/api/articles", routes![])
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
