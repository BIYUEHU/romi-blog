use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "romi_characters")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: u32,
    pub name: String,
    pub romaji: String,
    pub gender: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub alias: Option<String>,
    pub age: Option<u32>,
    #[sea_orm(column_type = "Text")]
    pub images: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub url: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub description: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub comment: Option<String>,
    #[sea_orm(column_type = "Text", nullable)]
    pub hitokoto: Option<String>,
    pub birthday: Option<u32>,
    pub voice: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub series: String,
    #[sea_orm(column_name = "seriesGenre")]
    pub series_genre: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub tags: Option<String>,
    #[sea_orm(column_name = "hairColor")]
    pub hair_color: Option<String>,
    #[sea_orm(column_name = "eyeColor")]
    pub eye_color: Option<String>,
    #[sea_orm(column_name = "bloodType")]
    pub blood_type: Option<String>,
    pub height: Option<u32>,
    pub bust: Option<u32>,
    pub waist: Option<u32>,
    pub hip: Option<u32>,
    pub created: u32,
    pub color: Option<String>,
    pub hide: String,
    pub order: u32,
    #[sea_orm(column_name = "songId")]
    pub song_id: Option<u32>,
    pub weight: Option<u32>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
