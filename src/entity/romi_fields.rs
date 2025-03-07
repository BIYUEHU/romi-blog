use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "romi_fields")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub fid: u32,
    pub key: String,
    #[sea_orm(column_type = "Text")]
    pub value: String,
    #[sea_orm(column_name = "isPublic")]
    pub is_public: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
