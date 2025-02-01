use crate::entity::romi_hitokotos;
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, DatabaseConnection, DbBackend, EntityTrait, Statement,
};
use sea_orm_rocket::Connection;
use ts_rs::TS;

#[derive(serde::Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqHitokotoData {
    pub msg: String,
    pub from: String,
    pub r#type: u32,
}

#[derive(serde::Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResHitokotoData {
    pub id: u32,
    pub msg: String,
    pub from: String,
    pub r#type: u32,
    pub likes: i32,
}

async fn get_hitokoto(
    length: Option<u32>,
    db: &DatabaseConnection,
    is_first: bool,
) -> ApiResult<ResHitokotoData> {
    let query = if length.is_some() {
        romi_hitokotos::Entity::find().from_raw_sql(Statement::from_sql_and_values(
            DbBackend::MySql,
            r#"SELECT * FROM romi_hitokotos WHERE char_length(msg) <= $1 ORDER BY RAND() limit 1"#,
            [length.unwrap().into()],
        ))
    } else {
        romi_hitokotos::Entity::find().from_raw_sql(Statement::from_sql_and_values(
            DbBackend::MySql,
            r#"SELECT * FROM romi_hitokotos ORDER BY RAND() limit 1"#,
            [],
        ))
    };

    match query
        .one(db)
        .await
        .with_context(|| "Failed to fetch hitokoto")?
    {
        Some(hitokoto) => api_ok(ResHitokotoData {
            id: hitokoto.id,
            msg: hitokoto.msg,
            from: hitokoto.from,
            r#type: hitokoto.r#type.parse::<u32>().unwrap_or(0),
            likes: hitokoto.likes.unwrap_or(0),
        }),
        None => {
            if length.is_some() && is_first {
                Box::pin(get_hitokoto(None, db, false)).await
            } else {
                Err(ApiError::not_found("No hitokoto found"))
            }
        }
    }
}

#[get("/?<length>")]
pub async fn fetch(
    length: Option<u32>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResHitokotoData> {
    l_info!(logger, "Fetching random hitokoto");
    let db = conn.into_inner();
    get_hitokoto(length, &db, true).await
}

#[post("/", data = "<hitokoto>")]
pub async fn create(
    hitokoto: Json<ReqHitokotoData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_hitokotos::Model> {
    l_info!(logger, "Creating new hitokoto");

    let model = romi_hitokotos::ActiveModel {
        id: ActiveValue::not_set(),
        msg: ActiveValue::set(hitokoto.msg.clone()),
        from: ActiveValue::set(hitokoto.from.clone()),
        r#type: ActiveValue::set(hitokoto.r#type.clone().to_string()),
        likes: ActiveValue::set(Some(0)),
        is_public: ActiveValue::set(Some("1".to_string())),
    };

    let result = model
        .insert(conn.into_inner())
        .await
        .with_context(|| "Failed to create hitokoto")?;

    l_info!(logger, "Successfully created hitokoto: id={}", result.id);
    api_ok(result)
}

// #[post("/like/<id>")]
// pub async fn like(
//     id: u32,
//     logger: &State<Logger>,
//     conn: Connection<'_, Db>,
// ) -> ApiResult<romi_hitokotos::Model> {
//     l_info!(logger, "Liking hitokoto: id={}", id);
//     let db = conn.into_inner();

//     let hitokoto = romi_hitokotos::Entity::find_by_id(id)
//         .one(db)
//         .await
//         .with_context(|| format!("Failed to fetch hitokoto {}", id))?;

//     match hitokoto {
//         Some(mut hitokoto) => {
//             let mut model = hitokoto.clone();
//             model.likes = ActiveValue::set(Some((model.likes.unwrap() + 1)));

//             let result = model
//                 .update(db)
//                 .await
//                 .with_context(|| format!("Failed to update hitokoto {}", id))?;

//             l_info!(logger, "Successfully liked hitokoto: id={}", id);
//             api_ok(result)
//         }
//         None => Err(ApiError::not_found("Hitokoto not found")),
//     }
// }
