use crate::entity::{romi_metas, romi_posts, romi_relationships};
use crate::tools::markdown::{from_bool, summary_markdown, to_bool};
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use roga::*;
use rocket::serde::json::Json;
use rocket::State;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter,
    TryIntoModel,
};
use sea_orm_rocket::Connection;
use ts_rs::TS;

#[derive(serde::Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqPostData {
    pub title: String,
    pub text: String,
    pub password: bool,
    pub hide: bool,
    pub allow_comment: bool,
    pub created: Option<u32>,
    pub modified: Option<u32>,
    // pub tags: Vec<String>,
    // pub categories: Vec<String>,
}

#[derive(serde::Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResPostData {
    pub id: u32,
    pub title: String,
    pub summary: String,
    pub created: u32,
    pub banner: Option<String>,
}

#[derive(serde::Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResPostSingleData {
    pub id: u32,
    pub title: String,
    pub created: u32,
    pub modified: u32,
    pub text: String,
    pub password: bool,
    pub hide: bool,
    pub allow_comment: bool,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
    pub views: i32,
    pub likes: i32,
    pub comments: i32,
    pub banner: Option<String>,
}

#[get("/")]
pub async fn fetch(
    logger: &State<Logger>,
    coon: Connection<'_, Db>,
) -> ApiResult<Vec<ResPostData>> {
    api_ok(
        romi_posts::Entity::find()
            .all(coon.into_inner())
            .await
            .with_context(|| "Failed to fetch posts")
            .map_err(|err| {
                l_error!(logger, "Failed to fetch posts: {}", err);
                ApiError::from(err)
            })?
            .iter()
            .filter(|data| data.hide != Some("1".to_string()))
            .map(|data| ResPostData {
                id: data.pid.clone(),
                title: data.title.clone(),
                summary: summary_markdown(data.text.as_str(), 70),
                created: data.created.unwrap(),
                banner: data.banner.clone(),
            })
            .rev()
            .collect(),
    )
}
#[get("/<id>")]
pub async fn fetch_all(
    id: u32,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<ResPostSingleData> {
    let db = coon.into_inner();

    l_info!(logger, "Fetching post details: id={}", id);

    let metas = futures::future::join_all(
        romi_relationships::Entity::find()
            .filter(romi_relationships::Column::Pid.eq(id))
            .all(db)
            .await
            .with_context(|| format!("Failed to fetch relationships for post {}", id))
            .map_err(|err| {
                l_error!(logger, "Failed to fetch relationships: {}", err);
                ApiError::from(err)
            })?
            .iter()
            .map(|tag| async {
                romi_metas::Entity::find_by_id(tag.mid)
                    .one(db)
                    .await
                    .with_context(|| format!("Failed to fetch meta for id {}", tag.mid))
                    .map_err(|err| {
                        l_error!(logger, "Failed to fetch meta: {}", err);
                        ApiError::from(err)
                    })
                    .unwrap()
            }),
    )
    .await;

    let post = romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch post {}", id))
        .map_err(|err| {
            l_error!(logger, "Failed to fetch post: {}", err);
            ApiError::from(err)
        })?;

    match post {
        Some(post) => {
            let response = ResPostSingleData {
                id: post.pid.clone(),
                title: post.title.clone(),
                created: post.created.unwrap(),
                modified: post.modified.unwrap(),
                text: post.text.clone(),
                password: to_bool(post.password),
                hide: to_bool(post.hide),
                allow_comment: to_bool(post.allow_comment),
                tags: metas
                    .iter()
                    .filter(|meta| {
                        meta.as_ref()
                            .map_or(false, |m| m.is_category != Some("1".to_string()))
                    })
                    .filter_map(|meta| meta.as_ref().map(|m| m.name.clone()))
                    .collect(),
                categories: metas
                    .iter()
                    .filter(|meta| {
                        meta.as_ref()
                            .map_or(false, |m| m.is_category == Some("1".to_string()))
                    })
                    .filter_map(|meta| meta.as_ref().map(|m| m.name.clone()))
                    .collect(),
                views: post.views.unwrap(),
                likes: post.likes.unwrap(),
                comments: post.comments.unwrap(),
                banner: post.banner.clone(),
            };

            l_debug!(logger, "Successfully fetched post: {}", post.title);
            api_ok(response)
        }
        None => {
            l_warn!(logger, "Post not found: id={}", id);
            Err(ApiError::not_found("Post not found"))
        }
    }
}

#[post("/", data = "<post>")]
pub async fn create(
    post: Json<ReqPostData>,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<romi_posts::Model> {
    l_info!(logger, "Creating new post: {}", post.title);

    let result = romi_posts::ActiveModel {
        pid: ActiveValue::not_set(),
        title: ActiveValue::set(post.title.clone()),
        text: ActiveValue::set(post.text.clone()),
        password: ActiveValue::set(from_bool(post.password)),
        hide: ActiveValue::set(from_bool(post.hide)),
        allow_comment: ActiveValue::set(from_bool(post.allow_comment)),
        created: ActiveValue::set(post.created),
        modified: ActiveValue::set(post.modified),
        ..Default::default()
    }
    .save(coon.into_inner())
    .await
    .with_context(|| "Failed to create post")
    .map_err(|err| {
        l_error!(logger, "Failed to create post: {}", err);
        ApiError::from(err)
    })?
    .try_into_model()
    .with_context(|| "Failed to convert post model")
    .map_err(|err| {
        l_error!(logger, "Model conversion failed: {}", err);
        ApiError::from(err)
    })?;

    l_info!(logger, "Successfully created post: id={}", result.pid);
    api_ok(result)
}

#[put("/<id>", data = "<post>")]
pub async fn update(
    id: u32,
    post: Json<ReqPostData>,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<romi_posts::Model> {
    l_info!(logger, "Updating post: id={}", id);
    let db = coon.into_inner();

    let post_result = romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch post {}", id))
        .map_err(|err| {
            l_error!(logger, "Failed to fetch post for update: {}", err);
            ApiError::from(err)
        })?;

    match post_result {
        Some(post_origin) => {
            let mut active_model = post_origin.into_active_model();
            active_model.title = ActiveValue::Set(post.title.clone());
            active_model.text = ActiveValue::Set(post.text.clone());
            active_model.password = ActiveValue::Set(from_bool(post.password));
            active_model.hide = ActiveValue::Set(from_bool(post.hide));
            active_model.allow_comment = ActiveValue::Set(from_bool(post.allow_comment));
            active_model.created = ActiveValue::Set(post.created);
            active_model.modified = ActiveValue::Set(post.modified);

            let result = active_model
                .save(db)
                .await
                .with_context(|| format!("Failed to update post {}", id))
                .map_err(|err| {
                    l_error!(logger, "Failed to update post: {}", err);
                    ApiError::from(err)
                })?
                .try_into_model()
                .with_context(|| "Failed to convert updated post model")
                .map_err(|err| {
                    l_error!(logger, "Model conversion failed: {}", err);
                    ApiError::from(err)
                })?;

            l_info!(logger, "Successfully updated post: id={}", id);
            api_ok(result)
        }
        None => {
            l_warn!(logger, "Post not found for update: id={}", id);
            Err(ApiError::not_found("Post not found"))
        }
    }
}

#[delete("/<id>")]
pub async fn delete(
    id: u32,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<String> {
    l_info!(logger, "Deleting post: id={}", id);

    romi_posts::Entity::delete_by_id(id)
        .exec(coon.into_inner())
        .await
        .with_context(|| format!("Failed to delete post {}", id))
        .map_err(|err| {
            l_error!(logger, "Failed to delete post: {}", err);
            ApiError::from(err)
        })?;

    l_info!(logger, "Successfully deleted post: id={}", id);
    api_ok("Post deleted".to_string())
}
