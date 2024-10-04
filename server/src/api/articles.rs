use sea_orm_rocket::Connection;

use crate::pool::Db;

#[get("/")]
async fn fetch(coon: Connection<'_, Db>) {}
