use async_trait::async_trait;
use sea_orm_rocket::{rocket::figment::Figment, Database};

#[derive(Database, Debug)]
#[database("sea_orm")]
pub struct Db(SeaOrmPool);

#[derive(Debug, Clone)]
pub struct SeaOrmPool {
    pub conn: sea_orm::DatabaseConnection,
}

#[async_trait]
impl sea_orm_rocket::Pool for SeaOrmPool {
    type Error = sea_orm::DbErr;

    type Connection = sea_orm::DatabaseConnection;

    async fn init(_: &Figment) -> Result<Self, Self::Error> {
        Ok(SeaOrmPool {
            conn: sea_orm::Database::connect(
                std::env::var("DATABASE_URL").expect("DATABASE_URL environment variable not set"),
            )
            .await?,
        })
    }

    fn borrow(&self) -> &Self::Connection {
        &self.conn
    }
}
