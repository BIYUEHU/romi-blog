use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, Query, State},
    routing::{delete, get, post, put},
};
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DbBackend, EntityTrait,
    IntoActiveModel, QueryFilter, Statement,
};

use crate::{
    app::RomiState,
    entity::romi_hitokotos,
    guards::admin::AdminUser,
    models::hitokoto::{ReqHitokotoData, ResHitokotoData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/", get(fetch))
        .route("/", post(create))
        .route("/{id}", get(fetch_by_id))
        .route("/{id}", put(update))
        .route("/{id}", delete(remove))
        .route("/like/{id}", put(like))
        .route("/public", get(fetch_public))
        .route("/all", get(fetch_all))
}

async fn get_hitokoto(
    length: Option<u32>,
    conn: &DatabaseConnection,
    is_first: bool,
) -> ApiResult<ResHitokotoData> {
    match if length.is_some() {
        romi_hitokotos::Entity::find().from_raw_sql(Statement::from_sql_and_values(
            DbBackend::MySql,
            format!(
                "SELECT * FROM romi_hitokotos WHERE char_length(msg) <= {} ORDER BY RAND() limit 1",
                length.unwrap_or(2333)
            ),
            [],
        ))
    } else {
        romi_hitokotos::Entity::find().from_raw_sql(Statement::from_sql_and_values(
            DbBackend::MySql,
            r#"SELECT * FROM romi_hitokotos ORDER BY RAND() limit 1"#,
            [],
        ))
    }
    .one(conn)
    .await
    .context("Failed to fetch hitokoto")?
    {
        Some(model) => api_ok(ResHitokotoData {
            id: model.id,
            msg: model.msg,
            from: model.from,
            r#type: model.r#type.parse().unwrap_or(0),
            likes: model.likes,
            is_public: model.is_public == "1".to_string(),
        }),
        None => {
            if length.is_some() && is_first {
                Box::pin(get_hitokoto(None, conn, false)).await
            } else {
                Err(ApiError::not_found("No hitokoto found"))
            }
        }
    }
}

async fn fetch(
    Query(params): Query<std::collections::HashMap<String, String>>,
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<ResHitokotoData> {
    get_hitokoto(params.get("length").and_then(|s| s.parse().ok()), conn, true).await
}

async fn fetch_by_id(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult<ResHitokotoData> {
    match romi_hitokotos::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch hitokoto {}", id))?
    {
        Some(model) => api_ok(ResHitokotoData {
            id: model.id,
            msg: model.msg,
            from: model.from,
            r#type: model.r#type.parse().unwrap_or(0),
            likes: model.likes,
            is_public: model.is_public == "1".to_string(),
        }),
        None => {
            l_warn!(logger, "Hitokoto {} not found", id);
            Err(ApiError::not_found(format!("Hitokoto {} not found", id)))
        }
    }
}

async fn fetch_public(
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<Vec<ResHitokotoData>> {
    api_ok(
        romi_hitokotos::Entity::find()
            .filter(romi_hitokotos::Column::IsPublic.eq(&1.to_string()))
            .all(conn)
            .await
            .context("Failed to fetch hitokoto")?
            .into_iter()
            .map(|model| ResHitokotoData {
                id: model.id,
                msg: model.msg,
                from: model.from,
                r#type: model.r#type.parse().unwrap_or(0),
                likes: model.likes,
                is_public: true,
            })
            .collect(),
    )
}

async fn fetch_all(
    _admin_user: AdminUser,
    State(RomiState { ref conn, .. }): State<RomiState>,
) -> ApiResult<Vec<ResHitokotoData>> {
    api_ok(
        romi_hitokotos::Entity::find()
            .all(conn)
            .await
            .context("Failed to fetch hitokotos")?
            .into_iter()
            .map(|model| ResHitokotoData {
                id: model.id,
                msg: model.msg,
                from: model.from,
                r#type: model.r#type.parse().unwrap_or(0),
                likes: model.likes,
                is_public: model.is_public == "1".to_string(),
            })
            .collect(),
    )
}

async fn create(
    AdminUser(admin_user): AdminUser,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(hitokoto): Json<ReqHitokotoData>,
) -> ApiResult {
    let result = romi_hitokotos::ActiveModel {
        id: ActiveValue::not_set(),
        msg: ActiveValue::set(hitokoto.msg.clone()),
        from: ActiveValue::set(hitokoto.from.clone()),
        r#type: ActiveValue::set(hitokoto.r#type.clone().to_string()),
        likes: ActiveValue::set(0),
        is_public: ActiveValue::set((if hitokoto.is_public { 1 } else { 0 }).to_string()),
    }
    .insert(conn)
    .await
    .context("Failed to create hitokoto")?;

    l_info!(
        logger,
        "Created hitokoto {} type <{}> from <{}> by admin {} ({})",
        result.id,
        hitokoto.r#type,
        if hitokoto.from.is_empty() { "none" } else { &hitokoto.from },
        admin_user.id,
        admin_user.username,
    );
    api_ok(())
}

async fn update(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(hitokoto): Json<ReqHitokotoData>,
) -> ApiResult {
    match romi_hitokotos::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch hitokoto {}", id))?
    {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.msg = ActiveValue::set(hitokoto.msg.clone());
            active_model.from = ActiveValue::set(hitokoto.from.clone());
            active_model.r#type = ActiveValue::set(hitokoto.r#type.clone().to_string());
            active_model.is_public =
                ActiveValue::set((if hitokoto.is_public { 1 } else { 0 }).to_string());

            active_model
                .save(conn)
                .await
                .with_context(|| format!("Failed to update hitokoto {}", id))?;

            l_info!(
                logger,
                "Updated hitokoto {} by admin {} ({})",
                id,
                admin_user.id,
                admin_user.username
            );
            api_ok(())
        }
        None => {
            l_warn!(logger, "Hitokoto {} not found", id);
            Err(ApiError::not_found(format!("Hitokoto {} not found", id)))
        }
    }
}

async fn like(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    match romi_hitokotos::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch hitokoto {}", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.likes = ActiveValue::set(model.likes + 1);

            active_model
                .save(conn)
                .await
                .with_context(|| format!("Failed to like hitokoto {}", id))?;

            l_info!(logger, "Liked hitokoto {}", id);
            api_ok(())
        }
        None => {
            l_warn!(logger, "Hitokoto {} not found", id);
            Err(ApiError::not_found("Hitokoto not found"))
        }
    }
}

async fn remove(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    romi_hitokotos::Entity::delete_by_id(id)
        .exec(conn)
        .await
        .with_context(|| format!("Failed to delete hitokoto {}", id))?;

    l_info!(logger, "Deleted hitokoto {} by admin {} ({})", id, admin_user.id, admin_user.username);
    api_ok(())
}
