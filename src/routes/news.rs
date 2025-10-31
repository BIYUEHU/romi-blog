use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post, put},
};
use roga::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, IntoActiveModel, TryIntoModel};

use crate::{
    app::AppState,
    entity::romi_news,
    guards::admin::AdminUser,
    models::news::{ReqNewsData, ResNewsData},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/", post(create))
        .route("/{id}", get(fetch))
        .route("/{id}", put(update))
        .route("/{id}", delete(remove))
        .route("/like/{id}", put(like))
        .route("/view/{id}", put(view))
}

async fn fetch(Path(id): Path<u32>, State(state): State<AppState>) -> ApiResult<ResNewsData> {
    l_info!(&state.logger, "Fetching news: id={}", id);

    let news = romi_news::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch news {}", id))?
        .ok_or_else(|| ApiError::not_found("News not found"))?;

    api_ok(ResNewsData {
        id: news.nid,
        created: news.created,
        modified: news.modified,
        text: news.text,
        hide: news.hide.eq(&1.to_string()),
        views: news.views,
        likes: news.likes,
        comments: news.comments,
        imgs: news
            .imgs
            .map(|imgs| imgs.split(',').map(|s| s.to_string()).collect())
            .unwrap_or_default(),
    })
}

async fn fetch_all(State(state): State<AppState>) -> ApiResult<Vec<ResNewsData>> {
    l_info!(&state.logger, "Fetching news list");

    let news_list = romi_news::Entity::find()
        .all(&state.conn)
        .await
        .with_context(|| "Failed to fetch news list")?;

    api_ok(
        news_list
            .into_iter()
            .map(|news| ResNewsData {
                id: news.nid,
                created: news.created,
                modified: news.modified,
                text: news.text,
                hide: news.hide.eq(&1.to_string()),
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
            .collect(),
    )
}

async fn create(
    _admin_user: AdminUser,
    State(state): State<AppState>,
    Json(news): Json<ReqNewsData>,
) -> ApiResult<()> {
    l_info!(&state.logger, "Creating new news");

    let news_model = romi_news::ActiveModel {
        nid: ActiveValue::not_set(),
        created: ActiveValue::set(news.created),
        modified: ActiveValue::set(news.modified),
        text: ActiveValue::set(news.text.clone()),
        hide: ActiveValue::set(news.hide.then(|| 1).unwrap_or(0).to_string()),
        views: ActiveValue::set(0),
        likes: ActiveValue::set(0),
        comments: ActiveValue::set(0),
        imgs: ActiveValue::set(Some(news.imgs.join(","))),
    }
    .save(&state.conn)
    .await
    .with_context(|| "Failed to create news")?;

    let news = news_model.try_into_model().with_context(|| "Failed to convert news model")?;

    l_info!(&state.logger, "Successfully created news: id={}", news.nid);
    api_ok(())
}

async fn update(
    _admin_user: AdminUser,
    Path(id): Path<u32>,
    State(state): State<AppState>,
    Json(news): Json<ReqNewsData>,
) -> ApiResult<()> {
    l_info!(&state.logger, "Updating news: id={}", id);

    match romi_news::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch news {}", id))?
    {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.created = ActiveValue::set(news.created);
            active_model.modified = ActiveValue::set(news.modified);
            active_model.text = ActiveValue::set(news.text.clone());
            active_model.hide = ActiveValue::set(news.hide.then(|| 1).unwrap_or(0).to_string());
            active_model.imgs = ActiveValue::set(Some(news.imgs.join(",")));

            active_model
                .save(&state.conn)
                .await
                .with_context(|| format!("Failed to update news {}", id))?
        }
        None => {
            l_warn!(&state.logger, "News not found for update: id={}", id);
            return Err(ApiError::not_found("News not found"));
        }
    };

    l_info!(&state.logger, "Successfully updated news: id={}", id);
    api_ok(())
}

async fn like(Path(id): Path<u32>, State(state): State<AppState>) -> ApiResult<()> {
    l_info!(&state.logger, "Liking news: id={}", id);

    match romi_news::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch news {} for like", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.likes = ActiveValue::set(model.likes + 1);
            active_model.save(&state.conn).await.context("Failed to update news")?;
        }
        None => return Err(ApiError::not_found("News not found")),
    };

    l_info!(&state.logger, "Successfully liked news: id={}", id);
    api_ok(())
}

async fn view(Path(id): Path<u32>, State(state): State<AppState>) -> ApiResult<()> {
    l_info!(&state.logger, "Viewing news: id={}", id);

    match romi_news::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch news {} for view", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.views = ActiveValue::set(model.views + 1);
            active_model.save(&state.conn).await.context("Failed to update news")?;
        }
        None => return Err(ApiError::not_found("News not found")),
    };

    l_info!(&state.logger, "Successfully viewed news: id={}", id);
    api_ok(())
}

async fn remove(
    _admin_user: AdminUser,
    Path(id): Path<u32>,
    State(state): State<AppState>,
) -> ApiResult<()> {
    l_info!(&state.logger, "Deleting news: id={}", id);

    romi_news::Entity::delete_by_id(id)
        .exec(&state.conn)
        .await
        .with_context(|| format!("Failed to delete news {}", id))?;

    l_info!(&state.logger, "Successfully deleted news: id={}", id);
    api_ok(())
}
