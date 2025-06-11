use crate::entity::{romi_comments, romi_metas, romi_posts, romi_relationships};
use crate::guards::access::{Access, AccessLevel};
use crate::guards::admin::AdminUser;
use crate::models::post::{
    ReqDecryptPostData, ReqPostData, ResDecryptPostData, ResPostData, ResPostSingleData,
};
use crate::tools::markdown::summary_markdown;
use crate::utils::api::{api_ok, ApiError, ApiResult};
use crate::service::pool::Db;
use anyhow::Context;
use futures::future::{join_all, try_join_all};
use futures::try_join;
use rocket::serde::json::Json;
use rocket::State;
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr,
    EntityTrait, IntoActiveModel, QueryFilter, TransactionTrait, TryIntoModel,
};
use sea_orm_rocket::Connection;
use std::collections::HashSet;
use std::vec;
use tokio::spawn;

async fn get_post_metas(
    id: u32,
    db: &DatabaseConnection,
) -> Result<(Vec<String>, Vec<String>), DbErr> {
    let metas = try_join_all(
        romi_relationships::Entity::find()
            .filter(romi_relationships::Column::Pid.eq(id))
            .all(db)
            .await?
            .iter()
            .map(|tag| async { romi_metas::Entity::find_by_id(tag.mid).one(db).await }),
    )
    .await?;

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
pub async fn fetch_all(
    logger: &State<Logger>,
    coon: Connection<'_, Db>,
    access: Access,
) -> ApiResult<Vec<ResPostData>> {
    l_info!(logger, "Fetching posts");
    let db = coon.into_inner();
    let is_admin = access.level.eq(&AccessLevel::Admin);

    api_ok(
        join_all(
            romi_posts::Entity::find()
                .all(db)
                .await
                .context("Failed to fetch posts")?
                .iter()
                .rev()
                .filter(|data| is_admin || data.hide.ne(&1.to_string()))
                .map(|data| async {
                    let (tags, categories) = get_post_metas(data.pid.clone(), db)
                        .await
                        .unwrap_or((vec![], vec![]));
                    let password = data.password.clone().filter(|p| !p.is_empty());

                    ResPostData {
                        id: data.pid.clone(),
                        title: data.title.clone(),
                        summary: if password.is_none() || access.level.eq(&AccessLevel::Admin) {
                            summary_markdown(data.text.as_str(), 70)
                        } else {
                            "".into()
                        },
                        created: data.created,
                        modified: data.modified,
                        banner: data.banner.clone(),
                        tags,
                        categories,
                        views: data.views,
                        likes: data.likes,
                        comments: data.comments,
                        allow_comment: data.allow_comment.eq(&1.to_string()),
                        password: password.map(|p| {
                            access
                                .level
                                .eq(&AccessLevel::Admin)
                                .then(|| p)
                                .unwrap_or("password".into())
                        }),
                        hide: data.hide.eq(&1.to_string()),
                    }
                }),
        )
        .await,
    )
}

#[get("/<id>")]
pub async fn fetch(
    id: u32,
    coon: Connection<'_, Db>,
    logger: &State<Logger>,
    access: Access,
) -> ApiResult<ResPostSingleData> {
    l_info!(logger, "Fetching post details: id={}", id);
    let db = coon.into_inner();

    match romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch post {}", id))?
    {
        Some(model) => {
            let (tags, categories) = get_post_metas(id, db)
                .await
                .with_context(|| format!("Failed to fetch metas of post {}", id))?;
            let password = model.password.clone().filter(|p| !p.is_empty());

            let response = ResPostSingleData {
                id: model.pid.clone(),
                title: model.title.clone(),
                created: model.created,
                modified: model.modified,
                text: if password.is_none() || access.level.eq(&AccessLevel::Admin) {
                    model.text.clone()
                } else {
                    "".into()
                },
                password: password.map(|p| {
                    access
                        .level
                        .eq(&AccessLevel::Admin)
                        .then(|| p)
                        .unwrap_or("password".into())
                }),
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

async fn handle_metas(
    names: Vec<String>,
    is_category: bool,
    db: &DatabaseTransaction,
) -> Result<Vec<u32>, DbErr> {
    let is_category_str = if is_category { "1" } else { "0" };
    let mut mid_list = Vec::new();

    let existing_metas = romi_metas::Entity::find()
        .filter(romi_metas::Column::Name.is_in(names.clone()))
        .filter(romi_metas::Column::IsCategory.eq(is_category_str))
        .all(db)
        .await?;

    let existing_names: HashSet<_> = existing_metas.iter().map(|m| m.name.clone()).collect();

    mid_list.extend(existing_metas.iter().map(|m| m.mid));

    let new_names: Vec<_> = names
        .into_iter()
        .filter(|name| !existing_names.contains(name))
        .collect();

    if !new_names.is_empty() {
        let new_metas: Vec<romi_metas::ActiveModel> = new_names
            .clone()
            .into_iter()
            .map(|name| romi_metas::ActiveModel {
                mid: ActiveValue::not_set(),
                name: ActiveValue::set(name),
                is_category: ActiveValue::set(is_category_str.to_string()),
            })
            .collect();

        romi_metas::Entity::insert_many(new_metas).exec(db).await?;

        mid_list.extend(
            romi_metas::Entity::find()
                .filter(romi_metas::Column::Name.is_in(new_names.clone()))
                .filter(romi_metas::Column::IsCategory.eq(is_category_str))
                .all(db)
                .await?
                .iter()
                .map(|m| m.mid),
        );
    }

    Ok(mid_list)
}

#[post("/", data = "<post>")]
pub async fn create(
    _admin_user: AdminUser,
    post: Json<ReqPostData>,
    conn: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<()> {
    l_info!(logger, "Creating new post: {}", post.title);
    let db = conn.into_inner();

    let txn = db.begin().await.context("Failed to begin transaction")?;

    let post_model = romi_posts::ActiveModel {
        pid: ActiveValue::not_set(),
        title: ActiveValue::set(post.title.clone()),
        text: ActiveValue::set(post.text.clone()),
        password: ActiveValue::set(post.password.clone().filter(|p| !p.is_empty())),
        hide: ActiveValue::set((if post.hide { 1 } else { 0 }).to_string()),
        allow_comment: ActiveValue::set((if post.allow_comment { 1 } else { 0 }).to_string()),
        created: ActiveValue::set(post.created),
        modified: ActiveValue::set(post.modified),
        banner: ActiveValue::set(post.banner.clone()),
        ..Default::default()
    }
    .save(&txn)
    .await
    .context("Failed to create post")?;

    let post_id = post_model.clone().pid.unwrap();

    let (category_mids, tag_mids) = try_join!(
        handle_metas(post.categories.clone(), true, &txn),
        handle_metas(post.tags.clone(), false, &txn)
    )
    .context("Failed to handle metas")?;

    let relations: Vec<romi_relationships::ActiveModel> = category_mids
        .into_iter()
        .chain(tag_mids.into_iter())
        .map(|mid| romi_relationships::ActiveModel {
            pid: ActiveValue::set(post_id),
            mid: ActiveValue::set(mid),
        })
        .collect();

    if !relations.is_empty() {
        romi_relationships::Entity::insert_many(relations)
            .exec(db)
            .await
            .context("Failed to create relationships")?;
    }

    txn.commit().await.context("Failed to commit transaction")?;

    let result = post_model
        .try_into_model()
        .context("Failed to convert model")?;
    l_info!(logger, "Successfully created post: id={}", result.pid);
    api_ok(())
}

#[put("/<id>", data = "<post>")]
pub async fn update(
    _admin_user: AdminUser,
    id: u32,
    post: Json<ReqPostData>,
    conn: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<()> {
    l_info!(logger, "Updating post: id={}", id);
    let db = conn.into_inner();

    let txn = db.begin().await.context("Failed to begin transaction")?;

    match romi_posts::Entity::find_by_id(id)
        .one(&txn)
        .await
        .with_context(|| format!("Failed to fetch post {} for update", id))?
    {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.title = ActiveValue::set(post.title.clone());
            active_model.text = ActiveValue::set(post.text.clone());
            if let Some(password) = post.password.clone() {
                active_model.password = ActiveValue::set(if password.is_empty() {
                    None
                } else {
                    Some(password)
                });
            }
            active_model.hide = ActiveValue::set((if post.hide { 1 } else { 0 }).to_string());
            active_model.allow_comment =
                ActiveValue::set((if post.allow_comment { 1 } else { 0 }).to_string());
            active_model.created = ActiveValue::set(post.created);
            active_model.modified = ActiveValue::set(post.modified);
            active_model.banner = ActiveValue::set(post.banner.clone());
            active_model
                .save(&txn)
                .await
                .context("Failed to update post")?;
        }
        None => return Err(ApiError::not_found("Post not found")),
    };

    let origin_metas = try_join_all(
        romi_relationships::Entity::find()
            .filter(romi_relationships::Column::Pid.eq(id))
            .all(&txn)
            .await
            .context("Failed to fetch existing relations")?
            .iter()
            .map(|model| async {
                romi_metas::Entity::find_by_id(model.mid)
                    .one(&txn)
                    .await
                    .with_context(|| format!("Failed to fetch meta {} for update", model.mid))
            }),
    )
    .await?
    .into_iter()
    .filter_map(|meta| meta);

    let origin_categories: Vec<_> = origin_metas
        .clone()
        .filter_map(|meta| {
            if meta.is_category == "1" {
                Some(meta.name.clone())
            } else {
                None
            }
        })
        .collect();
    let origin_tags: Vec<_> = origin_metas
        .clone()
        .filter_map(|meta| {
            if meta.is_category == "0" {
                Some(meta.name.clone())
            } else {
                None
            }
        })
        .collect();

    let (new_category_mids, new_tag_mids) = try_join!(
        handle_metas(
            post.categories
                .clone()
                .into_iter()
                .filter(|name| !origin_categories.contains(name))
                .collect(),
            true,
            &txn
        ),
        handle_metas(
            post.tags
                .clone()
                .into_iter()
                .filter(|name| !origin_tags.contains(name))
                .collect(),
            false,
            &txn
        )
    )
    .context("Failed to handle metas")?;

    romi_relationships::Entity::delete_many()
        .filter(romi_relationships::Column::Pid.eq(id))
        .filter(
            romi_relationships::Column::Mid.is_in(origin_metas.filter_map(|meta| {
                if !post.tags.contains(&meta.name) && !post.categories.contains(&meta.name) {
                    Some(meta.mid)
                } else {
                    None
                }
            })),
        )
        .exec(&txn)
        .await
        .context("Failed to delete old relations")?;

    let new_relations: Vec<romi_relationships::ActiveModel> = new_category_mids
        .into_iter()
        .chain(new_tag_mids.into_iter())
        .map(|mid| romi_relationships::ActiveModel {
            pid: ActiveValue::set(id),
            mid: ActiveValue::set(mid),
        })
        .collect();

    if !new_relations.is_empty() {
        romi_relationships::Entity::insert_many(new_relations)
            .exec(&txn)
            .await
            .context("Failed to create new relations")?;
    }

    txn.commit().await.context("Failed to commit transaction")?;

    l_info!(logger, "Successfully updated post: id={}", id);
    api_ok(())
}

#[put("/like/<id>")]
pub async fn like(id: u32, conn: Connection<'_, Db>, logger: &State<Logger>) -> ApiResult<()> {
    l_info!(logger, "Liking post: id={}", id);
    let db = conn.into_inner();

    match romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch post {} for like", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.likes = ActiveValue::set(model.likes + 1);
            active_model
                .save(db)
                .await
                .context("Failed to update post")?;
        }
        None => return Err(ApiError::not_found("Post not found")),
    };

    l_info!(logger, "Successfully liked post: id={}", id);
    api_ok(())
}

#[put("/view/<id>")]
pub async fn view(id: u32, conn: Connection<'_, Db>, logger: &State<Logger>) -> ApiResult<()> {
    l_info!(logger, "Viewing post: id={}", id);
    let db = conn.into_inner();

    match romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch post {} for view", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.views = ActiveValue::set(model.views + 1);
            active_model
                .save(db)
                .await
                .context("Failed to update post")?;
        }
        None => return Err(ApiError::not_found("Post not found")),
    };

    l_info!(logger, "Successfully viewed post: id={}", id);
    api_ok(())
}

#[delete("/<id>")]
pub async fn delete(
    _admin_user: AdminUser,
    id: u32,
    conn: Connection<'_, Db>,
    logger: &State<Logger>,
) -> ApiResult<()> {
    l_info!(logger, "Deleting post: id={}", id);
    let db = conn.into_inner();

    romi_posts::Entity::delete_by_id(id)
        .exec(db)
        .await
        .context("Failed to delete post")?;

    let db_clone = db.clone();
    let logger_clone = (*logger).clone();
    spawn(async move {
        if let Err(e) = romi_relationships::Entity::delete_many()
            .filter(romi_relationships::Column::Pid.eq(id))
            .exec(&db_clone)
            .await
        {
            l_error!(
                logger_clone,
                "Failed to delete relationships for post {}: {}",
                id,
                e
            );
        }

        if let Err(e) = romi_comments::Entity::delete_many()
            .filter(romi_comments::Column::Pid.eq(id))
            .exec(&db_clone)
            .await
        {
            l_error!(
                logger_clone,
                "Failed to delete comments for post {}: {}",
                id,
                e
            );
        }
    });

    l_info!(logger, "Successfully deleted post: id={}", id);
    api_ok(())
}

#[post("/decrypt/<id>", data = "<data>")]
pub async fn decrypt(
    id: u32,
    conn: Connection<'_, Db>,
    logger: &State<Logger>,
    data: Json<ReqDecryptPostData>,
) -> ApiResult<ResDecryptPostData> {
    l_info!(logger, "Decrypting post: id={}", id);
    let db = conn.into_inner();

    match romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .with_context(|| format!("Failed to fetch post {} for decrypt", id))?
    {
        Some(model) => {
            if let Some(password) = model.password {
                if password == data.password {
                    l_info!(logger, "Successfully decrypted post: id={}", id);
                    api_ok(ResDecryptPostData { text: model.text })
                } else {
                    l_warn!(logger, "Incorrect password for post: id={}", id);
                    Err(ApiError::unauthorized("Incorrect password"))
                }
            } else {
                Err(ApiError::bad_request("Post is not password protected"))
            }
        }
        None => {
            l_warn!(logger, "Post not found: id={}", id);
            Err(ApiError::not_found("Post not found"))
        }
    }
}
