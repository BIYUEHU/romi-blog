use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "romi_posts")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub pid: u32,
    pub str_id: Option<String>,
    pub title: String,
    pub created: u32,
    pub modified: u32,
    #[sea_orm(column_type = "custom(\"LONGTEXT\")")]
    pub text: String,
    pub password: Option<String>,
    pub hide: String,
    #[sea_orm(column_name = "allowComment")]
    pub allow_comment: String,
    pub views: i32,
    pub likes: i32,
    pub comments: i32,
    #[sea_orm(column_type = "custom(\"LONGTEXT\")", nullable)]
    pub banner: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
