use crate::entity::{romi_metas, romi_posts, romi_relationships};
use crate::guards::admin::AdminUser;
use crate::models::post::{ReqPostData, ResPostData, ResPostSingleData};
use crate::tools::markdown::summary_markdown;
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::utils::pool::Db;
use anyhow::Context;
use futures::future::join_all;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    QueryFilter, TryIntoModel,
};
use sea_orm_rocket::Connection;

async fn get_post_metas(
    id: u32,
    logger: &Logger,
    db: &DatabaseConnection,
) -> Result<(Vec<String>, Vec<String>), ApiError> {
    let metas = join_all(
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

    Ok((
        metas
            .iter()
            .filter_map(|meta| {
                meta.as_ref()
                    .filter(|m| m.is_category.ne(&1.to_string()))
                    .map(|m| m.name.clone())
            })
            .collect(),
        metas
            .iter()
            .filter_map(|meta| {
                meta.as_ref()
                    .filter(|m| m.is_category.eq(&1.to_string()))
                    .map(|m| m.name.clone())
            })
            .collect(),
    ))
}

#[get("/")]
pub async fn fetch(
    logger: &State<Logger>,
    coon: Connection<'_, Db>,
) -> ApiResult<Vec<ResPostData>> {
    l_info!(logger, "Fetching posts");
    let db = coon.into_inner();

    api_ok(
        join_all(
            romi_posts::Entity::find()
                .all(db)
                .await
                .with_context(|| "Failed to fetch posts")
                .map_err(|err| {
                    l_error!(logger, "Failed to fetch posts: {}", err);
                    ApiError::from(err)
                })?
                .iter()
                .rev()
                .filter(|data| data.hide.ne(&1.to_string()))
                .map(|data| async {
                    let (tags, categories) = get_post_metas(data.pid.clone(), logger, db)
                        .await
                        .unwrap_or((vec![], vec![]));

                    ResPostData {
                        id: data.pid.clone(),
                        title: data.title.clone(),
                        summary: summary_markdown(data.text.as_str(), 70),
                        created: data.created,
                        banner: data.banner.clone(),
                        tags,
                        categories,
                        views: data.views,
                        likes: data.likes,
                        comments: data.comments,
                    }
                }),
        )
        .await,
    )
}

#[get("/<id>")]
pub async fn fetch_all(
    id: u32,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<ResPostSingleData> {
    l_info!(logger, "Fetching post details: id={}", id);
    let db = coon.into_inner();

    match romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch post {}", id))
        .map_err(|err| {
            l_error!(logger, "Failed to fetch post: {}", err);
            ApiError::from(err)
        })? {
        Some(model) => {
            let (tags, categories) = get_post_metas(id, logger, db).await?;
            let response = ResPostSingleData {
                id: model.pid.clone(),
                title: model.title.clone(),
                created: model.created,
                modified: model.modified,
                text: model.text.clone(),
                password: model.password.is_some(),
                hide: model.hide.eq(&1.to_string()),
                allow_comment: model.allow_comment.eq(&1.to_string()),
                tags,
                categories,
                views: model.views,
                likes: model.likes,
                comments: model.comments,
                banner: model.banner.clone(),
            };

            l_debug!(logger, "Successfully fetched post: {}", model.title);
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
    _admin_user: AdminUser,
    post: Json<ReqPostData>,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<romi_posts::Model> {
    l_info!(logger, "Creating new post: {}", post.title);

    let result = romi_posts::ActiveModel {
        pid: ActiveValue::not_set(),
        title: ActiveValue::set(post.title.clone()),
        text: ActiveValue::set(post.text.clone()),
        password: ActiveValue::set(if post.password.is_empty() {
            None
        } else {
            Some(post.password.clone())
        }),
        hide: ActiveValue::set((if post.hide { 1 } else { 0 }).to_string()),
        allow_comment: ActiveValue::set((if post.allow_comment { 1 } else { 0 }).to_string()),
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
    _admin_user: AdminUser,
    id: u32,
    post: Json<ReqPostData>,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<romi_posts::Model> {
    l_info!(logger, "Updating post: id={}", id);
    let db = coon.into_inner();

    match romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch post {}", id))
        .map_err(|err| {
            l_error!(logger, "Failed to fetch post for update: {}", err);
            ApiError::from(err)
        })? {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.title = ActiveValue::Set(post.title.clone());
            active_model.text = ActiveValue::Set(post.text.clone());
            active_model.password = ActiveValue::set(if post.password.is_empty() {
                None
            } else {
                Some(post.password.clone())
            });
            active_model.hide = ActiveValue::Set((if post.hide { 1 } else { 0 }).to_string());
            active_model.allow_comment =
                ActiveValue::set((if post.allow_comment { 1 } else { 0 }).to_string());
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
    _admin_user: AdminUser,
    id: u32,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<()> {
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
    api_ok(())
}
