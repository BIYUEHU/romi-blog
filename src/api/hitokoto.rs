use crate::entity::romi_hitokotos;
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, DatabaseConnection, DbBackend, EntityTrait, IntoActiveModel,
    Statement, TryIntoModel,
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
    match if length.is_some() {
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
    }
    .one(db)
    .await
    .with_context(|| "Failed to fetch hitokoto")?
    {
        Some(model) => api_ok(ResHitokotoData {
            id: model.id,
            msg: model.msg,
            from: model.from,
            r#type: model.r#type.parse().unwrap_or(0),
            likes: model.likes,
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

    let result = romi_hitokotos::ActiveModel {
        id: ActiveValue::not_set(),
        msg: ActiveValue::set(hitokoto.msg.clone()),
        from: ActiveValue::set(hitokoto.from.clone()),
        r#type: ActiveValue::set(hitokoto.r#type.clone().to_string()),
        likes: ActiveValue::set(0),
        is_public: ActiveValue::set("1".to_string()),
    }
    .insert(conn.into_inner())
    .await
    .with_context(|| "Failed to create hitokoto")?;

    l_info!(logger, "Successfully created hitokoto: id={}", result.id);
    api_ok(result)
}

#[put("/<id>", data = "<hitokoto>")]
pub async fn update(
    id: u32,
    hitokoto: Json<ReqHitokotoData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_hitokotos::Model> {
    l_info!(logger, "Updating hitokoto: id={}", id);

    let db = conn.into_inner();

    match romi_hitokotos::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch hitokoto {}", id))?
    {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.msg = ActiveValue::set(hitokoto.msg.clone());
            active_model.from = ActiveValue::set(hitokoto.from.clone());
            active_model.r#type = ActiveValue::set(hitokoto.r#type.clone().to_string());
            active_model.is_public = ActiveValue::set("1".to_string());

            let result = active_model
                .save(db)
                .await
                .with_context(|| format!("Failed to update hitokoto {}", id))
                .map_err(|err| ApiError::from(err))?
                .try_into_model()
                .with_context(|| "Failed to convert hitokoto to model")?;

            l_info!(logger, "Successfully updated hitokoto: id={}", id);
            api_ok(result)
        }
        None => Err(ApiError::not_found(format!("Hitokoto {} not found", id))),
    }
}

#[put("/like/<id>")]
pub async fn like(
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_hitokotos::Model> {
    l_info!(logger, "Liking hitokoto: id={}", id);
    let db = conn.into_inner();

    match romi_hitokotos::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch hitokoto {}", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.likes = ActiveValue::set(model.likes + 1);

            let result = active_model
                .save(db)
                .await
                .with_context(|| format!("Failed to update hitokoto {}", id))
                .map_err(|err| ApiError::from(err))?
                .try_into_model()
                .with_context(|| "Failed to convert hitokoto to model")?;

            l_info!(logger, "Successfully liked hitokoto: id={}", id);
            api_ok(result)
        }
        None => Err(ApiError::not_found("Hitokoto not found")),
    }
}

#[delete("/<id>")]
pub async fn delete(id: u32, logger: &State<Logger>, conn: Connection<'_, Db>) -> ApiResult<()> {
    l_info!(logger, "Deleting hitokoto: id={}", id);

    romi_hitokotos::Entity::delete_by_id(id)
        .exec(conn.into_inner())
        .await
        .with_context(|| format!("Failed to delete hitokoto {}", id))
        .map_err(|err| ApiError::from(err))?;

    l_info!(logger, "Successfully deleted hitokoto: id={}", id);
    api_ok(())
}
