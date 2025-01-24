use crate::entity::romi_hitokotos;
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use logger::*;
use rocket::serde::json::Json;
use rocket::State;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, QueryFilter, QueryOrder, QuerySelect,
};
use sea_orm_rocket::Connection;
use ts_rs::TS;

#[derive(serde::Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqHitokotoData {
    pub msg: String,
    pub from: String,
    pub type_: String,
}

#[derive(serde::Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResHitokotoData {
    pub id: u32,
    pub msg: String,
    pub from: String,
    pub type_: String,
    pub likes: i32,
}

#[get("/?<length>")]
pub async fn fetch(
    length: Option<u32>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResHitokotoData> {
    l_info!(logger, "Fetching random hitokoto");
    let db = conn.into_inner();

    let mut query =
        romi_hitokotos::Entity::find().filter(romi_hitokotos::Column::IsPublic.eq(Some("1")));

    if let Some(len) = length {
        query = query.filter(sea_orm::Expr::expr(
            sea_orm::Func::char_length(romi_hitokotos::Column::Msg).lte(len as i32),
        ));
    }

    let result = query
        // .order_("RAND()")
        .limit(1)
        .one(db)
        .await
        .with_context(|| "Failed to fetch hitokoto")?;

    match result {
        Some(hitokoto) => api_ok(ResHitokotoData {
            id: hitokoto.id,
            msg: hitokoto.msg,
            from: hitokoto.from,
            r#type_: hitokoto.r#type,
            likes: hitokoto.likes,
        }),
        None => {
            if length.is_some() {
                // 如果有长度限制但没找到，重试无限制查询
                return fetch(None, logger, Connection::new(db)).await;
            }
            Err(ApiError::not_found("No hitokoto found"))
        }
    }
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
        r#type: ActiveValue::set(hitokoto.type_.clone()),
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
