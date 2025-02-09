use std::env;

use crate::entity::romi_users;
use crate::guards::admin::AdminUser;
use crate::guards::auth::AuthUser;
use crate::models::user::{LoginRequest, LoginResponse, ReqUserData, ResUserData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use jsonwebtoken::{encode, EncodingKey, Header};
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter,
};
use sea_orm_rocket::Connection;
use tokio::spawn;

#[post("/login", data = "<credentials>")]
pub async fn login(
    credentials: Json<LoginRequest>,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<LoginResponse> {
    let db = coon.into_inner();
    l_info!(logger, "Login attempt for user: {}", credentials.username);

    let user = match romi_users::Entity::find()
        .filter(romi_users::Column::Username.eq(&credentials.username))
        .one(db)
        .await
        .context("Failed to fetch user")?
    {
        Some(user) if user.password == credentials.password => user,
        _ => return Err(ApiError::unauthorized("Invalid credentials")),
    };

    let claims = AuthUser {
        id: user.uid,
        username: user.username.clone(),
        created: user.created.clone(),
        url: user.url.clone(),
        exp: (std::time::SystemTime::now() + std::time::Duration::from_secs(60 * 60 * 24 * 12))
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as u64,
        is_admin: user.is_admin.eq(&"1".to_string()),
        status: user.is_deleted.parse().unwrap_or(1),
    };

    let db_clone = (*db).clone();
    let user_id_clone = user.uid;
    spawn(async move {
        if let Ok(Some(model)) = romi_users::Entity::find_by_id(user_id_clone)
            .one(&db_clone)
            .await
        {
            let mut active_model = model.into_active_model();
            active_model.last_login = ActiveValue::Set(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as u32,
            );
            let _ = active_model.save(&db_clone).await;
        }
    });

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(env::var("FREE_HONG_KONG_SECRET").unwrap().as_bytes()),
    )
    .map_err(|_| ApiError::internal("Token generation failed"))?;

    api_ok(LoginResponse { token })
}

#[get("/")]
pub async fn fetch_all(
    _admin_user: AdminUser,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResUserData>> {
    l_info!(logger, "Fetching all users");
    let db = conn.into_inner();

    let users = romi_users::Entity::find()
        .all(db)
        .await
        .context("Failed to fetch users")?;

    api_ok(
        users
            .into_iter()
            .map(|user| ResUserData {
                uid: user.uid,
                username: user.username,
                email: user.email,
                created: user.created,
                last_login: user.last_login,
                is_admin: user.is_admin == "1",
                url: user.url,
                status: user.is_deleted.parse().unwrap_or(1),
            })
            .collect(),
    )
}

#[get("/<id>")]
pub async fn fetch(
    _admin_user: AdminUser,
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResUserData> {
    l_info!(logger, "Fetching user: id={}", id);
    let db = conn.into_inner();

    match romi_users::Entity::find_by_id(id)
        .filter(romi_users::Column::IsDeleted.ne("1"))
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch user {}", id))?
    {
        Some(user) => api_ok(ResUserData {
            uid: user.uid,
            username: user.username,
            email: user.email,
            created: user.created,
            last_login: user.last_login,
            is_admin: user.is_admin == "1",
            status: user.is_deleted.parse().unwrap_or(1),
            url: user.url,
        }),
        None => Err(ApiError::not_found("User not found")),
    }
}

#[post("/", data = "<user>")]
pub async fn create(
    _admin_user: AdminUser,
    user: Json<ReqUserData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<()> {
    let db = conn.into_inner();

    l_info!(logger, "Creating new user: {}", user.username);

    if romi_users::Entity::find()
        .filter(romi_users::Column::Username.eq(&user.username))
        .one(db)
        .await
        .context("Failed to fetch user")?
        .is_some()
        || romi_users::Entity::find()
            .filter(romi_users::Column::Email.eq(&user.email))
            .one(db)
            .await
            .context("Failed to fetch user")?
            .is_some()
    {
        l_warn!(logger, "Username or email already taken");
        return Err(ApiError::bad_request("Username or email already taken"));
    }

    // TODO: Hash password and salt
    let salt = "random_salt";
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as u32;

    romi_users::ActiveModel {
        uid: ActiveValue::not_set(),
        username: ActiveValue::set(user.username.clone()),
        password: ActiveValue::set(user.password.clone()),
        salt: ActiveValue::set(salt.to_string()),
        email: ActiveValue::set(user.email.clone()),
        created: ActiveValue::set(now),
        last_login: ActiveValue::set(0),
        is_admin: ActiveValue::set("0".to_string()),
        is_deleted: ActiveValue::set(
            (0..3)
                .contains(&user.status)
                .then(|| user.status.to_string())
                .unwrap_or(1.to_string()),
        ),
        url: ActiveValue::set(user.url.clone()),
    }
    .save(db)
    .await
    .context("Failed to create user")?;

    api_ok(())
}

#[put("/<id>", data = "<user>")]
pub async fn update(
    _admin_user: AdminUser,
    id: u32,
    user: Json<ReqUserData>,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<()> {
    l_info!(logger, "Updating user: id={}", id);
    let db = coon.into_inner();

    match romi_users::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch user {}", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.username = ActiveValue::Set(user.username.clone());
            if !user.password.is_empty() {
                active_model.password = ActiveValue::Set(user.password.clone());
            }
            active_model.email = ActiveValue::Set(user.email.clone());
            active_model.url = ActiveValue::Set(user.url.clone());
            if !model.is_admin.eq(&"1".to_string()) {
                active_model.is_deleted = ActiveValue::Set(
                    (0..3)
                        .contains(&user.status)
                        .then(|| user.status.to_string())
                        .unwrap_or(1.to_string()),
                );
            }
            active_model
                .save(db)
                .await
                .with_context(|| format!("Failed to update user {}", id))?;

            api_ok(())
        }
        None => {
            l_warn!(logger, "User not found for update: id={}", id);
            Err(ApiError::not_found("User not found"))
        }
    }
}

#[delete("/<id>")]
pub async fn delete(
    admin_user: AdminUser,
    id: u32,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<()> {
    let db = coon.into_inner();
    l_info!(logger, "Deleting user: id={}", id);
    if admin_user.0.id == id {
        return Err(ApiError::unauthorized("Cannot delete self"));
    }

    romi_users::Entity::delete_by_id(id)
        .exec(db)
        .await
        .with_context(|| format!("Failed to delete user {}", id))?;

    l_info!(logger, "Successfully deleted user: id={}", id);
    api_ok(())
}
