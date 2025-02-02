use sea_orm::entity::prelude::*;
use serde::Serialize;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel, Eq, Serialize)]
#[sea_orm(table_name = "romi_metas")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub mid: u32,
    pub name: String,
    pub count: String,
    #[sea_orm(column_name = "isCategory")]
    pub is_category: String,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
