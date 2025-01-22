use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq)]
#[sea_orm(table_name = "romi_posts")]
#[derive(serde::Serialize)]
pub struct Model {
    #[sea_orm(primary_key)]
    pub pid: u32,
    pub title: String,
    pub created: Option<u32>,
    pub modified: Option<u32>,
    #[sea_orm(column_type = "custom(\"LONGTEXT\")")]
    pub text: String,
    pub password: Option<String>,
    pub hide: Option<String>,
    #[sea_orm(column_name = "allowComment")]
    pub allow_comment: Option<String>,
    pub views: Option<i32>,
    pub likes: Option<i32>,
    pub comments: Option<i32>,
    pub banner: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
