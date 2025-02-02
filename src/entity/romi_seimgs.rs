use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "romi_seimgs")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: u32,
    #[sea_orm(column_name = "pixivPid")]
    pub pixiv_pid: u32,
    #[sea_orm(column_name = "pixivUid")]
    pub pixiv_uid: u32,
    pub title: String,
    pub author: String,
    pub r18: String,
    #[sea_orm(column_type = "Text", nullable)]
    pub tags: Option<String>,
    pub width: u32,
    pub height: u32,
    pub r#type: String,
    #[sea_orm(column_type = "Text")]
    pub url: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
