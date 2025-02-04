use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "romi_users")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub uid: u32,
    #[sea_orm(unique)]
    pub username: String,
    pub password: String,
    pub salt: String,
    #[sea_orm(unique)]
    pub email: String,
    pub created: u32,
    #[sea_orm(column_name = "lastLogin")]
    pub last_login: u32,
    #[sea_orm(column_name = "isAdmin")]
    pub is_admin: String,
    #[sea_orm(column_name = "isDeleted")]
    pub is_deleted: String,
    pub url: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
