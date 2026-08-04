use anyhow::{Context, Result};
use sea_orm::{ActiveModelTrait, ActiveValue, DatabaseConnection, EntityTrait, IntoActiveModel};
use std::time::SystemTime;

use crate::entity::romi_characters;
use crate::models::character::{ReqCharacterData, ResCharacterData};

fn split_pipe_str_to_vec(s: &str) -> Vec<String> {
  s.split('|').filter(|t| !t.is_empty()).map(str::to_string).collect()
}

fn opt_split_pipe_str_to_vec(opt: &Option<String>) -> Vec<String> {
  opt.as_ref().map(|s| split_pipe_str_to_vec(s)).unwrap_or_default()
}

fn vec_to_opt_str(v: Vec<String>) -> Option<String> {
  if v.is_empty() { None } else { Some(v.join("|")) }
}

pub async fn list(db: &DatabaseConnection) -> Result<Vec<ResCharacterData>> {
  let chars = romi_characters::Entity::find().all(db).await.context("Failed to list characters")?;

  Ok(
    chars
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

pub async fn get(db: &DatabaseConnection, id: u32) -> Result<ResCharacterData> {
  let m = romi_characters::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to get character")?
    .ok_or_else(|| anyhow::anyhow!("Character not found"))?;

  Ok(ResCharacterData {
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
}

pub async fn create(
  db: &DatabaseConnection,
  data: ReqCharacterData,
) -> Result<romi_characters::Model> {
  let active = romi_characters::ActiveModel {
    id: ActiveValue::not_set(),
    name: ActiveValue::set(data.name),
    romaji: ActiveValue::set(data.romaji),
    gender: ActiveValue::set(data.gender),
    alias: ActiveValue::set(vec_to_opt_str(data.alias)),
    age: ActiveValue::set(data.age),
    images: ActiveValue::set(data.images.join("|")),
    url: ActiveValue::set(vec_to_opt_str(data.url)),
    description: ActiveValue::set(data.description),
    comment: ActiveValue::set(data.comment),
    hitokoto: ActiveValue::set(data.hitokoto),
    birthday: ActiveValue::set(data.birthday),
    voice: ActiveValue::set(data.voice),
    series: ActiveValue::set(data.series),
    series_genre: ActiveValue::set(data.series_genre),
    tags: ActiveValue::set(vec_to_opt_str(data.tags)),
    hair_color: ActiveValue::set(data.hair_color),
    eye_color: ActiveValue::set(data.eye_color),
    blood_type: ActiveValue::set(data.blood_type),
    height: ActiveValue::set(data.height),
    weight: ActiveValue::set(data.weight),
    bust: ActiveValue::set(data.bust),
    waist: ActiveValue::set(data.waist),
    hip: ActiveValue::set(data.hip),
    order: ActiveValue::set(data.order.unwrap_or(50)),
    hide: ActiveValue::set(if data.hide.unwrap_or(false) { "1" } else { "0" }.to_string()),
    song_id: ActiveValue::set(data.song_id),
    color: ActiveValue::set(data.color),
    created: ActiveValue::set(
      SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u32,
    ),
  };

  active.insert(db).await.context("Failed to create character")
}

pub async fn update(db: &DatabaseConnection, id: u32, data: ReqCharacterData) -> Result<()> {
  let existing = romi_characters::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to get character")?
    .ok_or_else(|| anyhow::anyhow!("Character not found"))?;

  let mut active = existing.into_active_model();

  active.name = ActiveValue::set(data.name);
  active.color = ActiveValue::set(data.color);
  active.romaji = ActiveValue::set(data.romaji);
  active.gender = ActiveValue::set(data.gender);
  active.alias = ActiveValue::set(vec_to_opt_str(data.alias));
  active.age = ActiveValue::set(data.age);
  active.images = ActiveValue::set(data.images.join("|"));
  active.url = ActiveValue::set(vec_to_opt_str(data.url));
  active.description = ActiveValue::set(data.description);
  active.comment = ActiveValue::set(data.comment);
  active.hitokoto = ActiveValue::set(data.hitokoto);
  active.birthday = ActiveValue::set(data.birthday);
  active.voice = ActiveValue::set(data.voice);
  active.series = ActiveValue::set(data.series);
  active.series_genre = ActiveValue::set(data.series_genre);
  active.tags = ActiveValue::set(vec_to_opt_str(data.tags));
  active.hair_color = ActiveValue::set(data.hair_color);
  active.eye_color = ActiveValue::set(data.eye_color);
  active.blood_type = ActiveValue::set(data.blood_type);
  active.height = ActiveValue::set(data.height);
  active.weight = ActiveValue::set(data.weight);
  active.bust = ActiveValue::set(data.bust);
  active.waist = ActiveValue::set(data.waist);
  active.hip = ActiveValue::set(data.hip);
  active.order = ActiveValue::set(data.order.unwrap_or(50));
  active.hide = ActiveValue::set(if data.hide.unwrap_or(false) { "1" } else { "0" }.to_string());
  active.song_id = ActiveValue::set(data.song_id);

  active.update(db).await.context("Failed to update character")?;

  Ok(())
}

pub async fn remove(db: &DatabaseConnection, id: u32) -> Result<()> {
  romi_characters::Entity::delete_by_id(id).exec(db).await.context("Failed to remove character")?;
  Ok(())
}
