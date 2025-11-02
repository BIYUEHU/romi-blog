use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post, put},
};
use roga::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, IntoActiveModel};

use crate::{
    app::RomiState,
    entity::romi_news,
    guards::{
        admin::AdminUser,
        auth::{Access, AccessLevel},
    },
    models::news::{ReqNewsData, ResNewsData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/", post(create))
        .route("/{id}", get(fetch))
        .route("/{id}", put(update))
        .route("/{id}", delete(remove))
        .route("/like/{id}", put(like))
        .route("/view/{id}", put(view))
}

async fn fetch(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    access: Access,
) -> ApiResult<ResNewsData> {
    let news = romi_news::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch news {}", id))?
        .ok_or_else(|| {
            l_warn!(logger, "News {} not found", id);
            ApiError::not_found("News not found")
        })?;
    let private = news.hide.eq(&1.to_string());
    if private && access.level != AccessLevel::Admin {
        l_warn!(logger, "News {} is private", id);
        return Err(ApiError::not_found("News not found"));
    }

    api_ok(ResNewsData {
        id: news.nid,
        created: news.created,
        modified: news.modified,
        text: news.text,
        private,
        views: news.views,
        likes: news.likes,
        comments: news.comments,
        imgs: news
            .imgs
            .map(|imgs| imgs.split(',').map(|s| s.to_string()).collect())
            .unwrap_or_default(),
    })
}

async fn fetch_all(
    State(RomiState { ref conn, .. }): State<RomiState>,
    access: Access,
) -> ApiResult<Vec<ResNewsData>> {
    api_ok(
        romi_news::Entity::find()
            .all(conn)
            .await
            .context("Failed to fetch news list")?
            .into_iter()
            .filter_map(|news| {
                let private = news.hide.eq(&1.to_string());
                if private && access.level != AccessLevel::Admin {
                    None
                } else {
                    Some(ResNewsData {
                        id: news.nid,
                        created: news.created,
                        modified: news.modified,
                        text: news.text,
                        private,
                        views: news.views,
                        likes: news.likes,
                        comments: news.comments,
                        imgs: news
                            .imgs
                            .map(|imgs| {
                                imgs.split(',')
                                    .filter_map(|s| {
                                        s.is_empty().then(|| None).unwrap_or(Some(s.to_string()))
                                    })
                                    .collect()
                            })
                            .unwrap_or_default(),
                    })
                }
            })
            .collect(),
    )
}

async fn create(
    AdminUser(admin_user): AdminUser,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(news): Json<ReqNewsData>,
) -> ApiResult {
    let news = romi_news::ActiveModel {
        nid: ActiveValue::not_set(),
        created: ActiveValue::set(news.created),
        modified: ActiveValue::set(news.modified),
        text: ActiveValue::set(news.text.clone()),
        hide: ActiveValue::set(news.private.then(|| 1).unwrap_or(0).to_string()),
        views: ActiveValue::set(0),
        likes: ActiveValue::set(0),
        comments: ActiveValue::set(0),
        imgs: ActiveValue::set(Some(news.imgs.join(","))),
    }
    .insert(conn)
    .await
    .context("Failed to create news")?;

    l_info!(
        logger,
        "Created news {} by admin {} ({})",
        news.nid,
        admin_user.id,
        admin_user.username
    );
    api_ok(())
}

async fn update(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(news): Json<ReqNewsData>,
) -> ApiResult {
    match romi_news::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch news {}", id))?
    {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.created = ActiveValue::set(news.created);
            active_model.modified = ActiveValue::set(news.modified);
            active_model.text = ActiveValue::set(news.text.clone());
            active_model.hide = ActiveValue::set(news.private.then(|| 1).unwrap_or(0).to_string());
            active_model.imgs = ActiveValue::set(Some(news.imgs.join(",")));

            active_model
                .save(conn)
                .await
                .with_context(|| format!("Failed to update news {}", id))?
        }
        None => {
            l_warn!(logger, "News {} not found", id);
            return Err(ApiError::not_found("News not found"));
        }
    };

    l_info!(logger, "Updated news {} by admin {} ({})", id, admin_user.id, admin_user.username);
    api_ok(())
}

async fn like(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    match romi_news::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch news {} for like", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.likes = ActiveValue::set(model.likes + 1);
            active_model.save(conn).await.with_context(|| format!("Failed to like news {}", id))?;
            l_info!(logger, "Liked news {}", id);
        }
        None => {
            l_warn!(logger, "News {} not found", id);
            return Err(ApiError::not_found("News not found"));
        }
    };

    api_ok(())
}

async fn view(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    match romi_news::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch news {} for view", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.views = ActiveValue::set(model.views + 1);
            active_model.save(conn).await.with_context(|| format!("Failed to view news {}", id))?;
            l_info!(logger, "Viewed news {}", id);
        }
        None => {
            l_warn!(logger, "News {} not found", id);
            return Err(ApiError::not_found("News not found"));
        }
    };

    api_ok(())
}

async fn remove(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    romi_news::Entity::delete_by_id(id)
        .exec(conn)
        .await
        .with_context(|| format!("Failed to delete news {}", id))?;

    l_info!(logger, "Deleted news {} by admin {} ({})", id, admin_user.id, admin_user.username);
    api_ok(())
}
