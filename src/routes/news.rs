use crate::entity::romi_news;
use crate::guards::admin::AdminUser;
use crate::models::news::{ReqNewsData, ResNewsData};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, IntoActiveModel, TryIntoModel};
use sea_orm_rocket::Connection;

#[get("/<id>")]
pub async fn fetch(
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResNewsData> {
    l_info!(logger, "Fetching news: id={}", id);
    let db = conn.into_inner();

    let news = romi_news::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch news {}", id))?
        .ok_or_else(|| ApiError::not_found("News not found"))?;

    Ok(Json(ResNewsData {
        created: news.created,
        modified: news.modified,
        text: news.text,
        hide: news.hide,
        views: news.views,
        likes: news.likes,
        comments: news.comments,
        imgs: news
            .imgs
            .map(|imgs| serde_json::from_str(&imgs).unwrap_or_default())
            .unwrap_or_default(),
    }))
}

#[get("/")]
pub async fn fetch_all(
    // page: Option<u64>,
    // limit: Option<u64>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResNewsData>> {
    // let page = page.unwrap_or(1);
    // let limit = limit.unwrap_or(10);
    // l_info!(logger, "Fetching news list: page={}, limit={}", page, limit);
    l_info!(logger, "Fetching news list");
    let db = conn.into_inner();

    // let paginator = romi_news::Entity::find()
    //     .order_by_desc(romi_news::Column::Created)
    //     .paginate(db, limit);

    let news_list = romi_news::Entity::find()
        .all(db)
        // .fetch_page(page - 1)
        .await
        .with_context(|| "Failed to fetch news list")?;

    Ok(Json(
        news_list
            .into_iter()
            .map(|news| ResNewsData {
                created: news.created,
                modified: news.modified,
                text: news.text,
                hide: news.hide,
                views: news.views,
                likes: news.likes,
                comments: news.comments,
                imgs: news
                    .imgs
                    .map(|imgs| imgs.split(',').map(|s| s.to_string()).collect())
                    .unwrap_or_default(),
            })
            .collect(),
    ))
}

#[post("/", data = "<news>")]
pub async fn create(
    _admin_user: AdminUser,
    news: Json<ReqNewsData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResNewsData> {
    l_info!(logger, "Creating new news");
    let db = conn.into_inner();

    let news_model = romi_news::ActiveModel {
        nid: ActiveValue::not_set(),
        created: ActiveValue::set(news.created),
        modified: ActiveValue::set(news.modified),
        text: ActiveValue::set(news.text.clone()),
        hide: ActiveValue::set(news.hide.clone()),
        views: ActiveValue::set(0),
        likes: ActiveValue::set(0),
        comments: ActiveValue::set(0),
        imgs: ActiveValue::set(Some(
            serde_json::to_string(&news.imgs).with_context(|| "Failed to serialize images")?,
        )),
    }
    .save(db)
    .await
    .with_context(|| "Failed to create news")?;

    let news = news_model
        .try_into_model()
        .with_context(|| "Failed to convert news model")?;

    l_info!(logger, "Successfully created news: id={}", news.nid);
    Ok(Json(ResNewsData {
        created: news.created,
        modified: news.modified,
        text: news.text,
        hide: news.hide,
        views: news.views,
        likes: news.likes,
        comments: news.comments,
        imgs: news
            .imgs
            .map(|imgs| serde_json::from_str(&imgs).unwrap_or_default())
            .unwrap_or_default(),
    }))
}

#[put("/<id>", data = "<news>")]
pub async fn update(
    _admin_user: AdminUser,
    id: u32,
    news: Json<ReqNewsData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<ResNewsData> {
    l_info!(logger, "Updating news: id={}", id);
    let db = conn.into_inner();

    let news_model = match romi_news::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch news {}", id))?
    {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.created = ActiveValue::set(news.created);
            active_model.modified = ActiveValue::set(news.modified);
            active_model.text = ActiveValue::set(news.text.clone());
            active_model.hide = ActiveValue::set(news.hide.clone());
            active_model.imgs = ActiveValue::set(Some(
                serde_json::to_string(&news.imgs).with_context(|| "Failed to serialize images")?,
            ));

            active_model
                .save(db)
                .await
                .with_context(|| format!("Failed to update news {}", id))?
        }
        None => {
            l_warn!(logger, "News not found for update: id={}", id);
            return Err(ApiError::not_found("News not found"));
        }
    };

    let news = news_model
        .try_into_model()
        .with_context(|| "Failed to convert updated news model")?;

    l_info!(logger, "Successfully updated news: id={}", id);
    Ok(Json(ResNewsData {
        created: news.created,
        modified: news.modified,
        text: news.text,
        hide: news.hide,
        views: news.views,
        likes: news.likes,
        comments: news.comments,
        imgs: news
            .imgs
            .map(|imgs| serde_json::from_str(&imgs).unwrap_or_default())
            .unwrap_or_default(),
    }))
}

#[delete("/<id>")]
pub async fn delete(
    _admin_user: AdminUser,
    id: u32,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<()> {
    l_info!(logger, "Deleting news: id={}", id);
    let db = conn.into_inner();

    romi_news::Entity::delete_by_id(id)
        .exec(db)
        .await
        .with_context(|| format!("Failed to delete news {}", id))?;

    l_info!(logger, "Successfully deleted news: id={}", id);
    api_ok(())
}
