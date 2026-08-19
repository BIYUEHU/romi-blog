pub use sea_orm_migration::prelude::*;

mod m20260730_add_fulltext_index;
mod m20260819_add_ip_blacklist;

pub struct Migrator;

#[async_trait::async_trait]
impl MigratorTrait for Migrator {
  fn migrations() -> Vec<Box<dyn MigrationTrait>> {
    vec![
      Box::new(crate::m20260730_add_fulltext_index::Migration),
      Box::new(crate::m20260819_add_ip_blacklist::Migration),
    ]
  }
}
