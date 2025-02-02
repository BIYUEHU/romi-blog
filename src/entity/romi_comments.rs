use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "romi_comments")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub cid: u32,
    pub pid: u32,
    pub uid: u32,
    pub created: u32,
    pub ip: String,
    #[sea_orm(column_type = "Text")]
    pub ua: String,
    #[sea_orm(column_type = "Text")]
    pub text: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
