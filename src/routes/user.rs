use crate::entity::romi_users;
use crate::guards::admin::AdminUser;
use crate::guards::auth::AuthUser;
use crate::models::user::{LoginRequest, LoginResponse, ReqUserData, ResUserData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use crate::FREE_HONG_KONG;
use anyhow::Context;
use jsonwebtoken::{encode, EncodingKey, Header};
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter,
    TryIntoModel,
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
        .with_context(|| "Failed to fetch user")?
    {
        Some(user) => user,
        None => return Err(ApiError::unauthorized("Invalid credentials")),
    };

    if user.password != credentials.password {
        return Err(ApiError::unauthorized("Invalid credentials"));
    }

    let claims = AuthUser {
        id: user.uid,
        username: user.username.clone(),
        created: user.created.clone(),
        url: user.url.clone(),
        exp: (std::time::SystemTime::now() + std::time::Duration::from_secs(3600))
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs() as u64,
        is_admin: user.is_admin.eq(&"1".to_string()),
    };

    let thread_db = (*db).clone();
    let thread_user_id = user.uid;
    spawn(async move {
        if let Ok(Some(model)) = romi_users::Entity::find_by_id(thread_user_id)
            .one(&thread_db)
            .await
        {
            let mut active_model = model.into_active_model();
            active_model.last_login = ActiveValue::Set(
                std::time::SystemTime::now()
                    .duration_since(std::time::UNIX_EPOCH)
                    .unwrap()
                    .as_secs() as u32,
            );
            let _ = active_model.save(&thread_db).await;
        }
    });

    let token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(FREE_HONG_KONG.as_bytes()),
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
        .filter(romi_users::Column::IsDeleted.ne("1"))
        .all(db)
        .await
        .with_context(|| "Failed to fetch users")
        .map_err(|err| {
            l_error!(logger, "Failed to fetch users: {}", err);
            ApiError::from(err)
        })?;

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
        .with_context(|| format!("Failed to fetch user {}", id))
        .map_err(|err| {
            l_error!(logger, "Failed to fetch user: {}", err);
            ApiError::from(err)
        })? {
        Some(user) => api_ok(ResUserData {
            uid: user.uid,
            username: user.username,
            email: user.email,
            created: user.created,
            last_login: user.last_login,
            is_admin: user.is_admin == "1",
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
) -> ApiResult<ResUserData> {
    let db = conn.into_inner();

    l_info!(logger, "Creating new user: {}", user.username);

    // TODO: Hash password and salt
    let salt = "random_salt";
    let now = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs() as u32;

    let result = romi_users::ActiveModel {
        uid: ActiveValue::not_set(),
        username: ActiveValue::set(user.username.clone()),
        password: ActiveValue::set(user.password.clone()),
        salt: ActiveValue::set(salt.to_string()),
        email: ActiveValue::set(user.email.clone()),
        created: ActiveValue::set(now),
        last_login: ActiveValue::set(now),
        is_admin: ActiveValue::set("0".to_string()),
        is_deleted: ActiveValue::set("0".to_string()),
        url: ActiveValue::set(user.url.clone()),
    }
    .save(db)
    .await
    .with_context(|| "Failed to create user")
    .map_err(|err| {
        l_error!(logger, "Failed to create user: {}", err);
        ApiError::from(err)
    })?;

    let model = result
        .try_into_model()
        .with_context(|| "Model conversion failed")
        .map_err(|err| {
            l_error!(logger, "Model conversion failed: {}", err);
            ApiError::from(err)
        })?;

    api_ok(ResUserData {
        uid: model.uid,
        username: model.username,
        email: model.email,
        created: model.created,
        last_login: model.last_login,
        is_admin: model.is_admin == "1",
        url: model.url,
    })
}

#[put("/<id>", data = "<user>")]
pub async fn update(
    id: u32,
    user: Json<ReqUserData>,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<ResUserData> {
    l_info!(logger, "Updating user: id={}", id);
    let db = coon.into_inner();

    match romi_users::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch user {}", id))
        .map_err(|err| {
            l_error!(logger, "Failed to fetch user for update: {}", err);
            ApiError::from(err)
        })? {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.username = ActiveValue::Set(user.username.clone());
            active_model.password = ActiveValue::Set(user.password.clone());
            active_model.email = ActiveValue::Set(user.email.clone());
            active_model.url = ActiveValue::Set(user.url.clone());

            let result = active_model
                .save(db)
                .await
                .with_context(|| format!("Failed to update user {}", id))
                .map_err(|err| {
                    l_error!(logger, "Failed to update user: {}", err);
                    ApiError::from(err)
                })?
                .try_into_model()
                .with_context(|| "Failed to convert updated user model")
                .map_err(|err| {
                    l_error!(logger, "Model conversion failed: {}", err);
                    ApiError::from(err)
                })?;

            api_ok(ResUserData {
                uid: result.uid,
                username: result.username,
                email: result.email,
                created: result.created,
                last_login: result.last_login,
                is_admin: result.is_admin == "1",
                url: result.url,
            })
        }
        None => {
            l_warn!(logger, "User not found for update: id={}", id);
            Err(ApiError::not_found("User not found"))
        }
    }
}

#[delete("/<id>")]
pub async fn delete(id: u32, coon: Connection<'_, Db>, logger: &State<Logger>) -> ApiResult<()> {
    let db = coon.into_inner();
    l_info!(logger, "Deleting user: id={}", id);

    romi_users::Entity::delete_by_id(id)
        .exec(db)
        .await
        .with_context(|| format!("Failed to delete user {}", id))
        .map_err(|err| {
            l_error!(logger, "Failed to delete user: {}", err);
            ApiError::from(err)
        })?;

    l_info!(logger, "Successfully deleted user: id={}", id);
    api_ok(())
}
