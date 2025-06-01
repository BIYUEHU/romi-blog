use std::time::SystemTime;

use crate::entity::romi_characters;
use crate::guards::admin::AdminUser;
use crate::models::character::{ReqCharacterData, ResCharacterData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use rocket::serde::json::Json;
use rocket::State;
use roga::{l_info, Logger};
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait, IntoActiveModel};
use sea_orm_rocket::Connection;

fn split_pipe_str_to_vec(s: &str) -> Vec<String> {
    s.split('|')
        .filter(|t| !t.is_empty())
        .map(str::to_string)
        .collect()
}

fn opt_split_pipe_str_to_vec(opt: &Option<String>) -> Vec<String> {
    opt.as_ref()
        .map(|s| split_pipe_str_to_vec(s))
        .unwrap_or_default()
}

fn vec_to_opt_str(v: Vec<String>) -> Option<String> {
    if v.is_empty() {
        None
    } else {
        Some(v.join("|"))
    }
}

#[get("/")]
pub async fn fetch_all(
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResCharacterData>> {
    l_info!(logger, "Fetching all characters");
    let db: &DatabaseConnection = conn.into_inner();

    let models = romi_characters::Entity::find()
        .all(db)
        .await
        .context("Failed to fetch characters")?;

    let results: Vec<ResCharacterData> = models
        .into_iter()
        .map(|m| {
            let alias_vec = opt_split_pipe_str_to_vec(&m.alias);
            let images_vec = split_pipe_str_to_vec(&m.images);
            let url_vec = opt_split_pipe_str_to_vec(&m.url);
            let tags_vec = opt_split_pipe_str_to_vec(&m.tags);

            let hide_bool = m.hide != "0";

            ResCharacterData {
                id: m.id,
                name: m.name,
                romaji: m.romaji,
                color: m.color,
                song_id: m.song_id,
                gender: m.gender, // 直接用 String 字段，不使用枚举
                alias: alias_vec,
                age: m.age,
                images: images_vec,
                url: url_vec,
                description: m.description,
                comment: m.comment,
                hitokoto: m.hitokoto,
                birthday: m.birthday,
                voice: m.voice,
                series: m.series,
                series_genre: m.series_genre,
                tags: tags_vec,
                hair_color: m.hair_color,
                eye_color: m.eye_color,
                blood_type: m.blood_type,
                height: m.height,
                weight: m.weight,
                bust: m.bust,
                waist: m.waist,
                hip: m.hip,
                order: m.order,
                hide: hide_bool,
            }
        })
        .collect();

    api_ok(results)
}

#[get("/<id>")]
pub async fn fetch(
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResCharacterData> {
    l_info!(logger, "Fetching character by id={}", id);
    let db: &DatabaseConnection = conn.into_inner();

    match romi_characters::Entity::find_by_id(id)
        .one(db)
        .await
        .context("Failed to fetch character")?
    {
        Some(m) => {
            let alias_vec = opt_split_pipe_str_to_vec(&m.alias);
            let images_vec = split_pipe_str_to_vec(&m.images);
            let url_vec = opt_split_pipe_str_to_vec(&m.url);
            let tags_vec = opt_split_pipe_str_to_vec(&m.tags);
            let hide_bool = m.hide != "0";

            let res = ResCharacterData {
                id: m.id,
                name: m.name,
                romaji: m.romaji,
                color: m.color,
                song_id: m.song_id,
                gender: m.gender,
                alias: alias_vec,
                age: m.age,
                images: images_vec,
                url: url_vec,
                description: m.description,
                comment: m.comment,
                hitokoto: m.hitokoto,
                birthday: m.birthday,
                voice: m.voice,
                series: m.series,
                series_genre: m.series_genre,
                tags: tags_vec,
                hair_color: m.hair_color,
                eye_color: m.eye_color,
                blood_type: m.blood_type,
                height: m.height,
                weight: m.weight,
                bust: m.bust,
                waist: m.waist,
                hip: m.hip,
                order: m.order,
                hide: hide_bool,
            };
            api_ok(res)
        }
        None => Err(ApiError::not_found(format!("Character {} not found", id))),
    }
}

#[post("/", data = "<body>")]
pub async fn create(
    _admin: AdminUser,
    body: Json<ReqCharacterData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_characters::Model> {
    l_info!(logger, "Creating new character: {}", body.name);
    let db: &DatabaseConnection = conn.into_inner();
    let req = body.into_inner();

    let alias_str = vec_to_opt_str(req.alias);
    let images_str = req.images.join("|");
    let url_str = vec_to_opt_str(req.url);
    let tags_str = vec_to_opt_str(req.tags);

    let birthday_u32 = req.birthday.map(|ts| ts as u32);
    let hide_str = if req.hide.unwrap_or(false) { "1" } else { "0" }.to_string();

    let active = romi_characters::ActiveModel {
        id: ActiveValue::not_set(),
        name: ActiveValue::set(req.name.clone()),
        romaji: ActiveValue::set(req.romaji.clone()),
        gender: ActiveValue::set(req.gender.clone()),
        alias: ActiveValue::set(alias_str),
        age: ActiveValue::set(req.age),
        images: ActiveValue::set(images_str),
        url: ActiveValue::set(url_str),
        description: ActiveValue::set(req.description.clone()),
        comment: ActiveValue::set(req.comment.clone()),
        hitokoto: ActiveValue::set(req.hitokoto.clone()),
        birthday: ActiveValue::set(birthday_u32),
        voice: ActiveValue::set(req.voice.clone()),
        series: ActiveValue::set(req.series.clone()),
        series_genre: ActiveValue::set(req.series_genre.clone()),
        tags: ActiveValue::set(tags_str),
        hair_color: ActiveValue::set(req.hair_color.clone()),
        eye_color: ActiveValue::set(req.eye_color.clone()),
        blood_type: ActiveValue::set(req.blood_type.clone()),
        height: ActiveValue::set(req.height),
        weight: ActiveValue::set(req.weight),
        bust: ActiveValue::set(req.bust),
        waist: ActiveValue::set(req.waist),
        hip: ActiveValue::set(req.hip),
        order: ActiveValue::set(req.order.unwrap_or(50)),
        hide: ActiveValue::set(hide_str),
        song_id: ActiveValue::set(req.song_id),
        color: ActiveValue::set(req.color.clone()),
        created: ActiveValue::set(
            SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .unwrap()
                .as_secs() as u32,
        ),
    };

    let res = active
        .insert(db)
        .await
        .context("Failed to insert character")?;

    api_ok(res)
}

#[put("/<id>", data = "<body>")]
pub async fn update(
    _admin: AdminUser,
    id: u32,
    body: Json<ReqCharacterData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_characters::Model> {
    l_info!(logger, "Updating character id={}", id);
    let db: &DatabaseConnection = conn.into_inner();

    let existing = romi_characters::Entity::find_by_id(id)
        .one(db)
        .await
        .context("Failed to fetch character for update")?;

    if existing.is_none() {
        return Err(ApiError::not_found(format!("Character {} not found", id)));
    }

    let req = body.into_inner();

    let alias_str = vec_to_opt_str(req.alias);
    let images_str = req.images.join("|");
    let url_str = vec_to_opt_str(req.url);
    let tags_str = vec_to_opt_str(req.tags);
    let birthday_u32 = req.birthday.map(|ts| ts as u32);
    let hide_str = if req.hide.unwrap_or(false) { "1" } else { "0" }.to_string();

    // 取消枚举转换，直接使用 String
    let mut active: romi_characters::ActiveModel = existing.unwrap().into_active_model();

    active.name = ActiveValue::set(req.name.clone());
    active.romaji = ActiveValue::set(req.romaji.clone());
    active.gender = ActiveValue::set(req.gender.clone());
    active.alias = ActiveValue::set(alias_str);
    active.age = ActiveValue::set(req.age);
    active.images = ActiveValue::set(images_str);
    active.url = ActiveValue::set(url_str);
    active.description = ActiveValue::set(req.description.clone());
    active.comment = ActiveValue::set(req.comment.clone());
    active.hitokoto = ActiveValue::set(req.hitokoto.clone());
    active.birthday = ActiveValue::set(birthday_u32);
    active.voice = ActiveValue::set(req.voice.clone());
    active.series = ActiveValue::set(req.series.clone());
    active.series_genre = ActiveValue::set(req.series_genre.clone());
    active.tags = ActiveValue::set(tags_str);
    active.hair_color = ActiveValue::set(req.hair_color.clone());
    active.eye_color = ActiveValue::set(req.eye_color.clone());
    active.blood_type = ActiveValue::set(req.blood_type.clone());
    active.height = ActiveValue::set(req.height);
    active.weight = ActiveValue::set(req.weight);
    active.bust = ActiveValue::set(req.bust);
    active.waist = ActiveValue::set(req.waist);
    active.hip = ActiveValue::set(req.hip);
    active.order = ActiveValue::set(req.order.unwrap_or(50));
    active.hide = ActiveValue::set(hide_str);
    active.song_id = ActiveValue::set(req.song_id);

    let res = active
        .update(db)
        .await
        .context("Failed to update character")?;

    api_ok(res)
}

#[delete("/<id>")]
pub async fn delete(
    _admin: AdminUser,
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<bool> {
    l_info!(logger, "Deleting character id={}", id);
    let db: &DatabaseConnection = conn.into_inner();

    let result = romi_characters::Entity::delete_by_id(id)
        .exec(db)
        .await
        .context("Failed to delete character")?;

    api_ok(result.rows_affected > 0)
}
