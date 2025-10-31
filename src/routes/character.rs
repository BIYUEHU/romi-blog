use std::time::SystemTime;

use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post, put},
};
use roga::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, IntoActiveModel};

use crate::{
    app::AppState,
    entity::romi_characters,
    guards::admin::AdminUser,
    models::character::{ReqCharacterData, ResCharacterData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/", post(create))
        .route("/{id}", get(fetch))
        .route("/{id}", put(update))
        .route("/{id}", delete(remove))
}

fn split_pipe_str_to_vec(s: &str) -> Vec<String> {
    s.split('|').filter(|t| !t.is_empty()).map(str::to_string).collect()
}

fn opt_split_pipe_str_to_vec(opt: &Option<String>) -> Vec<String> {
    opt.as_ref().map(|s| split_pipe_str_to_vec(s)).unwrap_or_default()
}

fn vec_to_opt_str(v: Vec<String>) -> Option<String> {
    if v.is_empty() { None } else { Some(v.join("|")) }
}

async fn fetch_all(State(state): State<AppState>) -> ApiResult<Vec<ResCharacterData>> {
    l_info!(&state.logger, "Fetching all characters");

    let models = romi_characters::Entity::find()
        .all(&state.conn)
        .await
        .context("Failed to fetch characters")?;

    api_ok(
        models
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
                }
            })
            .collect(),
    )
}

async fn fetch(Path(id): Path<u32>, State(state): State<AppState>) -> ApiResult<ResCharacterData> {
    l_info!(&state.logger, "Fetching character by id={}", id);

    match romi_characters::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .context("Failed to fetch character")?
    {
        Some(m) => {
            let alias_vec = opt_split_pipe_str_to_vec(&m.alias);
            let images_vec = split_pipe_str_to_vec(&m.images);
            let url_vec = opt_split_pipe_str_to_vec(&m.url);
            let tags_vec = opt_split_pipe_str_to_vec(&m.tags);
            let hide_bool = m.hide != "0";

            api_ok(ResCharacterData {
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
            })
        }
        None => Err(ApiError::not_found(format!("Character {} not found", id))),
    }
}

async fn create(
    _admin: AdminUser,
    State(state): State<AppState>,
    Json(req): Json<ReqCharacterData>,
) -> ApiResult<romi_characters::Model> {
    l_info!(&state.logger, "Creating new character: {}", req.name);

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
            SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u32,
        ),
    };

    api_ok(active.insert(&state.conn).await.context("Failed to insert character")?)
}

async fn update(
    _admin: AdminUser,
    Path(id): Path<u32>,
    State(state): State<AppState>,
    Json(req): Json<ReqCharacterData>,
) -> ApiResult<romi_characters::Model> {
    l_info!(&state.logger, "Updating character id={}", id);

    let existing = romi_characters::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .context("Failed to fetch character for update")?;

    let existing =
        existing.ok_or_else(|| ApiError::not_found(format!("Character {} not found", id)))?;

    let alias_str = vec_to_opt_str(req.alias);
    let images_str = req.images.join("|");
    let url_str = vec_to_opt_str(req.url);
    let tags_str = vec_to_opt_str(req.tags);
    let birthday_u32 = req.birthday.map(|ts| ts as u32);
    let hide_str = if req.hide.unwrap_or(false) { "1" } else { "0" }.to_string();

    let mut active: romi_characters::ActiveModel = existing.into_active_model();

    active.name = ActiveValue::set(req.name.clone());
    active.color = ActiveValue::set(req.color.clone());
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

    api_ok(active.update(&state.conn).await.context("Failed to update character")?)
}

async fn remove(
    _admin: AdminUser,
    Path(id): Path<u32>,
    State(state): State<AppState>,
) -> ApiResult<bool> {
    l_info!(&state.logger, "Deleting character id={}", id);

    let result = romi_characters::Entity::delete_by_id(id)
        .exec(&state.conn)
        .await
        .context("Failed to delete character")?;

    api_ok(result.rows_affected > 0)
}
