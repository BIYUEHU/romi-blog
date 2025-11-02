use std::time::{Duration, SystemTime};

use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post, put},
};
use jsonwebtoken::{EncodingKey, Header, encode};
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter,
};
use tokio::spawn;

use crate::{
    app::RomiState,
    entity::romi_users,
    guards::{admin::AdminUser, auth::AuthUser},
    models::user::{LoginRequest, LoginResponse, ReqUserData, ResUserData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/login", post(login))
        .route("/", get(fetch_all))
        .route("/", post(create))
        .route("/{id}", get(fetch))
        .route("/{id}", put(update))
        .route("/{id}", delete(remove))
}

async fn login(
    State(RomiState { ref logger, ref conn, ref secret, .. }): State<RomiState>,
    Json(credentials): Json<LoginRequest>,
) -> ApiResult<LoginResponse> {
    l_info!(logger, "Login attempt for user: {}", credentials.username);

    let user = match romi_users::Entity::find()
        .filter(romi_users::Column::Username.eq(&credentials.username))
        .one(conn)
        .await
        .context("Failed to fetch user")?
    {
        Some(user) if user.password == credentials.password => user,
        _ => {
            l_warn!(logger, "Invalid credentials for user: {}", credentials.username);
            return Err(ApiError::unauthorized("Invalid credentials"));
        }
    };

    let claims = AuthUser {
        id: user.uid,
        username: user.username.clone(),
        created: user.created.clone(),
        url: user.url.clone(),
        exp: (SystemTime::now() + Duration::from_secs(60 * 60 * 24 * 12))
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs() as u64,
        is_admin: user.is_admin.eq(&"1".to_string()),
        status: user.is_deleted.parse().unwrap_or(1),
    };

    let conn_clone = conn.clone();
    let user_id_clone = user.uid;
    spawn(async move {
        if let Ok(Some(model)) =
            romi_users::Entity::find_by_id(user_id_clone).one(&conn_clone).await
        {
            let mut active_model = model.into_active_model();
            active_model.last_login = ActiveValue::Set(
                SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u32,
            );
            let _ = active_model.save(&conn_clone).await;
        }
    });

    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
        .context("Failed to generate token")?;

    api_ok(LoginResponse { token })
}

async fn fetch_all(
    _admin_user: AdminUser,
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<Vec<ResUserData>> {
    api_ok(
        romi_users::Entity::find()
            .all(conn)
            .await
            .context("Failed to fetch users")?
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

async fn fetch(
    _admin_user: AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResUserData> {
    match romi_users::Entity::find_by_id(id)
        .filter(romi_users::Column::IsDeleted.ne("1"))
        .one(conn)
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
        None => {
            l_warn!(logger, "User {} not found", id);
            Err(ApiError::not_found("User not found"))
        }
    }
}

async fn create(
    AdminUser(admin_user): AdminUser,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(user): Json<ReqUserData>,
) -> ApiResult {
    if romi_users::Entity::find()
        .filter(romi_users::Column::Username.eq(&user.username))
        .one(conn)
        .await
        .context("Failed to fetch user")?
        .is_some()
        || romi_users::Entity::find()
            .filter(romi_users::Column::Email.eq(&user.email))
            .one(conn)
            .await
            .context("Failed to fetch user")?
            .is_some()
    {
        l_warn!(logger, "Username or email already taken");
        return Err(ApiError::bad_request("Username or email already taken"));
    }

    let salt = "random_salt";
    let now = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u32;

    let result = romi_users::ActiveModel {
        uid: ActiveValue::not_set(),
        username: ActiveValue::set(user.username.clone()),
        password: ActiveValue::set(user.password.clone()),
        salt: ActiveValue::set(salt.to_string()),
        email: ActiveValue::set(user.email.clone()),
        created: ActiveValue::set(now),
        last_login: ActiveValue::set(0),
        is_admin: ActiveValue::set("0".to_string()),
        is_deleted: ActiveValue::set(
            (0..3).contains(&user.status).then(|| user.status.to_string()).unwrap_or(1.to_string()),
        ),
        url: ActiveValue::set(user.url.clone()),
    }
    .insert(conn)
    .await
    .context("Failed to create user")?;

    l_info!(
        logger,
        "Created user {} ({}) by admin {} ({})",
        result.uid,
        user.username,
        admin_user.id,
        admin_user.username
    );

    api_ok(())
}

async fn update(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(user): Json<ReqUserData>,
) -> ApiResult {
    match romi_users::Entity::find_by_id(id)
        .one(conn)
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
                .save(conn)
                .await
                .with_context(|| format!("Failed to update user {}", id))?;

            l_info!(
                logger,
                "Updated user {} ({}) by admin {} ({})",
                id,
                user.username,
                admin_user.id,
                admin_user.username
            );
            api_ok(())
        }
        None => {
            l_warn!(logger, "User {} not found", id);
            Err(ApiError::not_found("User not found"))
        }
    }
}

async fn remove(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    if admin_user.id == id {
        l_warn!(logger, "Administrator {} cannot delete self", id);
        return Err(ApiError::forbidden("Cannot delete self"));
    }

    romi_users::Entity::delete_by_id(id)
        .exec(conn)
        .await
        .with_context(|| format!("Failed to delete user {}", id))?;

    l_info!(logger, "Deleted user {} by admin {} ({})", id, admin_user.id, admin_user.username);
    api_ok(())
}
