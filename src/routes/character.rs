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

async fn fetch_all(
    State(AppState { ref conn, .. }): State<AppState>,
) -> ApiResult<Vec<ResCharacterData>> {
    api_ok(
        romi_characters::Entity::find()
            .all(conn)
            .await
            .context("Failed to fetch characters")?
            .into_iter()
            .map(|m| ResCharacterData {
                id: m.id,
                name: m.name,
                romaji: m.romaji,
                color: m.color,
                song_id: m.song_id,
                gender: m.gender,
                alias: opt_split_pipe_str_to_vec(&m.alias),
                age: m.age,
                images: split_pipe_str_to_vec(&m.images),
                url: opt_split_pipe_str_to_vec(&m.url),
                description: m.description,
                comment: m.comment,
                hitokoto: m.hitokoto,
                birthday: m.birthday,
                voice: m.voice,
                series: m.series,
                series_genre: m.series_genre,
                tags: opt_split_pipe_str_to_vec(&m.tags),
                hair_color: m.hair_color,
                eye_color: m.eye_color,
                blood_type: m.blood_type,
                height: m.height,
                weight: m.weight,
                bust: m.bust,
                waist: m.waist,
                hip: m.hip,
                order: m.order,
                hide: m.hide != "0",
            })
            .collect(),
    )
}

async fn fetch(
    Path(id): Path<u32>,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
) -> ApiResult<ResCharacterData> {
    match romi_characters::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch character {}", id))?
    {
        Some(m) => api_ok(ResCharacterData {
            id: m.id,
            name: m.name,
            romaji: m.romaji,
            color: m.color,
            song_id: m.song_id,
            gender: m.gender,
            alias: opt_split_pipe_str_to_vec(&m.alias),
            age: m.age,
            images: split_pipe_str_to_vec(&m.images),
            url: opt_split_pipe_str_to_vec(&m.url),
            description: m.description,
            comment: m.comment,
            hitokoto: m.hitokoto,
            birthday: m.birthday,
            voice: m.voice,
            series: m.series,
            series_genre: m.series_genre,
            tags: opt_split_pipe_str_to_vec(&m.tags),
            hair_color: m.hair_color,
            eye_color: m.eye_color,
            blood_type: m.blood_type,
            height: m.height,
            weight: m.weight,
            bust: m.bust,
            waist: m.waist,
            hip: m.hip,
            order: m.order,
            hide: m.hide != "0",
        }),
        None => {
            l_warn!(logger, "Character {} not found", id);
            Err(ApiError::not_found(format!("Character {} not found", id)))
        }
    }
}

async fn create(
    AdminUser(admin_user): AdminUser,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
    Json(character): Json<ReqCharacterData>,
) -> ApiResult {
    let result = romi_characters::ActiveModel {
        id: ActiveValue::not_set(),
        name: ActiveValue::set(character.name.clone()),
        romaji: ActiveValue::set(character.romaji.clone()),
        gender: ActiveValue::set(character.gender.clone()),
        alias: ActiveValue::set(vec_to_opt_str(character.alias)),
        age: ActiveValue::set(character.age),
        images: ActiveValue::set(character.images.join("|")),
        url: ActiveValue::set(vec_to_opt_str(character.url)),
        description: ActiveValue::set(character.description.clone()),
        comment: ActiveValue::set(character.comment.clone()),
        hitokoto: ActiveValue::set(character.hitokoto.clone()),
        birthday: ActiveValue::set(character.birthday.map(|ts| ts as u32)),
        voice: ActiveValue::set(character.voice.clone()),
        series: ActiveValue::set(character.series.clone()),
        series_genre: ActiveValue::set(character.series_genre.clone()),
        tags: ActiveValue::set(vec_to_opt_str(character.tags)),
        hair_color: ActiveValue::set(character.hair_color.clone()),
        eye_color: ActiveValue::set(character.eye_color.clone()),
        blood_type: ActiveValue::set(character.blood_type.clone()),
        height: ActiveValue::set(character.height),
        weight: ActiveValue::set(character.weight),
        bust: ActiveValue::set(character.bust),
        waist: ActiveValue::set(character.waist),
        hip: ActiveValue::set(character.hip),
        order: ActiveValue::set(character.order.unwrap_or(50)),
        hide: ActiveValue::set(if character.hide.unwrap_or(false) { "1" } else { "0" }.to_string()),
        song_id: ActiveValue::set(character.song_id),
        color: ActiveValue::set(character.color.clone()),
        created: ActiveValue::set(
            SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u32,
        ),
    }
    .insert(conn)
    .await
    .context("Failed to insert character")?;

    l_info!(
        logger,
        "Created character {} ({}) by admin {} ({})",
        result.id,
        result.name,
        admin_user.id,
        admin_user.username
    );
    api_ok(())
}

async fn update(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
    Json(character): Json<ReqCharacterData>,
) -> ApiResult {
    let existing = romi_characters::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch character {}", id))?
        .ok_or_else(|| {
            l_warn!(logger, "Character {} not found", id);
            ApiError::not_found(format!("Character {} not found", id))
        })?;

    let mut active: romi_characters::ActiveModel = existing.into_active_model();

    active.name = ActiveValue::set(character.name.clone());
    active.color = ActiveValue::set(character.color.clone());
    active.romaji = ActiveValue::set(character.romaji.clone());
    active.gender = ActiveValue::set(character.gender.clone());
    active.alias = ActiveValue::set(vec_to_opt_str(character.alias));
    active.age = ActiveValue::set(character.age);
    active.images = ActiveValue::set(character.images.join("|"));
    active.url = ActiveValue::set(vec_to_opt_str(character.url));
    active.description = ActiveValue::set(character.description.clone());
    active.comment = ActiveValue::set(character.comment.clone());
    active.hitokoto = ActiveValue::set(character.hitokoto.clone());
    active.birthday = ActiveValue::set(character.birthday.map(|ts| ts as u32));
    active.voice = ActiveValue::set(character.voice.clone());
    active.series = ActiveValue::set(character.series.clone());
    active.series_genre = ActiveValue::set(character.series_genre.clone());
    active.tags = ActiveValue::set(vec_to_opt_str(character.tags));
    active.hair_color = ActiveValue::set(character.hair_color.clone());
    active.eye_color = ActiveValue::set(character.eye_color.clone());
    active.blood_type = ActiveValue::set(character.blood_type.clone());
    active.height = ActiveValue::set(character.height);
    active.weight = ActiveValue::set(character.weight);
    active.bust = ActiveValue::set(character.bust);
    active.waist = ActiveValue::set(character.waist);
    active.hip = ActiveValue::set(character.hip);
    active.order = ActiveValue::set(character.order.unwrap_or(50));
    active.hide =
        ActiveValue::set(if character.hide.unwrap_or(false) { "1" } else { "0" }.to_string());
    active.song_id = ActiveValue::set(character.song_id);

    active.update(conn).await.with_context(|| format!("Failed to update character {}", id))?;

    l_info!(
        logger,
        "Updated character {} ({}) by admin {} ({})",
        id,
        character.name,
        admin_user.id,
        admin_user.username
    );
    api_ok(())
}

async fn remove(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(AppState { ref logger, ref conn, .. }): State<AppState>,
) -> ApiResult {
    if romi_characters::Entity::delete_by_id(id)
        .exec(conn)
        .await
        .with_context(|| format!("Failed to delete character {}", id))?
        .rows_affected
        > 0
    {
        l_info!(
            logger,
            "Deleted character {} by admin {} ({})",
            id,
            admin_user.id,
            admin_user.username
        );
    };

    api_ok(())
}
