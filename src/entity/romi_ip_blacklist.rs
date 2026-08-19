use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(table_name = "romi_ip_blacklist")]
pub struct Model {
  #[sea_orm(primary_key)]
  pub id: u32,
  #[sea_orm(unique)]
  pub ip: String,
  pub reason: Option<String>,
  pub created: i64,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
