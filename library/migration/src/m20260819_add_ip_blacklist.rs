use sea_orm_migration::prelude::*;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
  async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager
      .get_connection()
      .execute_unprepared(
        "CREATE TABLE IF NOT EXISTS romi_ip_blacklist (
          id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
          ip VARCHAR(45) NOT NULL UNIQUE,
          reason TEXT NULL,
          created BIGINT NOT NULL
        )",
      )
      .await?;
    Ok(())
  }

  async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
    manager.get_connection().execute_unprepared("DROP TABLE IF EXISTS romi_ip_blacklist").await?;
    Ok(())
  }
}
