use std::collections::HashSet;

use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post, put},
};
use futures::{
    future::{join_all, try_join_all},
    try_join,
};
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr,
    EntityTrait, IntoActiveModel, QueryFilter, QueryOrder, TransactionTrait, TryIntoModel,
};
use tokio::spawn;

use crate::{
    app::AppState,
    entity::{romi_comments, romi_metas, romi_posts, romi_relationships},
    guards::{
        admin::AdminUser,
        auth::{Access, AccessLevel},
    },
    models::post::{
        ReqDecryptPostData, ReqPostData, ResDecryptPostData, ResPostData, ResPostSingleData,
        ResPostSingleDataRelatedPost,
    },
    tools::markdown::summary_markdown,
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<AppState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/", post(create))
        .route("/{id}", get(fetch))
        .route("/{id}", put(update))
        .route("/like/{id}", put(like))
        .route("/view/{id}", put(view))
        .route("/{id}", delete(remove))
        .route("/decrypt/{id}", post(decrypt))
}

async fn get_post_metas(
    id: u32,
    conn: &DatabaseConnection,
) -> Result<(Vec<String>, Vec<String>), DbErr> {
    let metas = try_join_all(
        romi_relationships::Entity::find()
            .filter(romi_relationships::Column::Pid.eq(id))
            .all(conn)
            .await?
            .iter()
            .map(|tag| async { romi_metas::Entity::find_by_id(tag.mid).one(conn).await }),
    )
    .await?;

    Ok((
        metas
            .iter()
            .filter_map(|meta| {
                meta.as_ref().filter(|m| m.is_category.ne(&1.to_string())).map(|m| m.name.clone())
            })
            .collect(),
        metas
            .iter()
            .filter_map(|meta| {
                meta.as_ref().filter(|m| m.is_category.eq(&1.to_string())).map(|m| m.name.clone())
            })
            .collect(),
    ))
}

async fn fetch_all(State(state): State<AppState>, access: Access) -> ApiResult<Vec<ResPostData>> {
    l_info!(&state.logger, "Fetching posts");
    let is_admin = access.level.eq(&AccessLevel::Admin);

    api_ok(
        join_all(
            romi_posts::Entity::find()
                .all(&state.conn)
                .await
                .context("Failed to fetch posts")?
                .iter()
                .rev()
                .filter(|data| is_admin || data.hide.ne(&1.to_string()))
                .map(|data| async {
                    let (tags, categories) = get_post_metas(data.pid.clone(), &state.conn)
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

async fn fetch(
    Path(id): Path<u32>,
    State(state): State<AppState>,
    access: Access,
) -> ApiResult<ResPostSingleData> {
    l_info!(&state.logger, "Fetching post details: id={}", id);

    match romi_posts::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch post {}", id))?
    {
        Some(model) => {
            let (tags, categories) = get_post_metas(id, &state.conn)
                .await
                .with_context(|| format!("Failed to fetch metas of post {}", id))?;
            let password = model.password.clone().filter(|p| !p.is_empty());

            let prev_post = romi_posts::Entity::find()
                .filter(romi_posts::Column::Hide.ne(1))
                .filter(romi_posts::Column::Pid.lt(id))
                .order_by_desc(romi_posts::Column::Pid)
                .one(&state.conn)
                .await
                .with_context(|| format!("Failed to fetch prev post for {}", id))?;

            let next_post = romi_posts::Entity::find()
                .filter(romi_posts::Column::Hide.ne(1))
                .filter(romi_posts::Column::Pid.gt(id))
                .order_by_asc(romi_posts::Column::Pid)
                .one(&state.conn)
                .await
                .with_context(|| format!("Failed to fetch next post for {}", id))?;

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
                    access.level.eq(&AccessLevel::Admin).then(|| p).unwrap_or("password".into())
                }),
                hide: model.hide.eq(&1.to_string()),
                allow_comment: model.allow_comment.eq(&1.to_string()),
                tags,
                categories,
                views: model.views,
                likes: model.likes,
                comments: model.comments,
                banner: model.banner.clone(),
                prev: prev_post.map(|m| ResPostSingleDataRelatedPost { id: m.pid, title: m.title }),
                next: next_post.map(|m| ResPostSingleDataRelatedPost { id: m.pid, title: m.title }),
            };

            l_debug!(&state.logger, "Successfully fetched post: {}", model.title);
            api_ok(response)
        }
        None => {
            l_warn!(&state.logger, "Post not found: id={}", id);
            Err(ApiError::not_found("Post not found"))
        }
    }
}

async fn handle_metas(
    names: Vec<String>,
    is_category: bool,
    conn: &DatabaseTransaction,
) -> Result<Vec<u32>, DbErr> {
    let is_category_str = if is_category { "1" } else { "0" };
    let mut mid_list = Vec::new();

    let existing_metas = romi_metas::Entity::find()
        .filter(romi_metas::Column::Name.is_in(names.clone()))
        .filter(romi_metas::Column::IsCategory.eq(is_category_str))
        .all(conn)
        .await?;

    let existing_names: HashSet<_> = existing_metas.iter().map(|m| m.name.clone()).collect();

    mid_list.extend(existing_metas.iter().map(|m| m.mid));

    let new_names: Vec<_> =
        names.into_iter().filter(|name| !existing_names.contains(name)).collect();

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

        romi_metas::Entity::insert_many(new_metas).exec(conn).await?;

        mid_list.extend(
            romi_metas::Entity::find()
                .filter(romi_metas::Column::Name.is_in(new_names.clone()))
                .filter(romi_metas::Column::IsCategory.eq(is_category_str))
                .all(conn)
                .await?
                .iter()
                .map(|m| m.mid),
        );
    }

    Ok(mid_list)
}

async fn create(
    _admin_user: AdminUser,
    State(state): State<AppState>,
    Json(post): Json<ReqPostData>,
) -> ApiResult<()> {
    l_info!(&state.logger, "Creating new post: {}", post.title);

    let txn = state.conn.begin().await.context("Failed to begin transaction")?;

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
            .exec(&state.conn)
            .await
            .context("Failed to create relationships")?;
    }

    txn.commit().await.context("Failed to commit transaction")?;

    let result = post_model.try_into_model().context("Failed to convert model")?;
    l_info!(&state.logger, "Successfully created post: id={}", result.pid);
    api_ok(())
}

async fn update(
    _admin_user: AdminUser,
    Path(id): Path<u32>,
    State(state): State<AppState>,
    Json(post): Json<ReqPostData>,
) -> ApiResult<()> {
    l_info!(&state.logger, "Updating post: id={}", id);

    let txn = state.conn.begin().await.context("Failed to begin transaction")?;

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
                active_model.password =
                    ActiveValue::set(if password.is_empty() { None } else { Some(password) });
            }
            active_model.hide = ActiveValue::set((if post.hide { 1 } else { 0 }).to_string());
            active_model.allow_comment =
                ActiveValue::set((if post.allow_comment { 1 } else { 0 }).to_string());
            active_model.created = ActiveValue::set(post.created);
            active_model.modified = ActiveValue::set(post.modified);
            active_model.banner = ActiveValue::set(post.banner.clone());
            active_model.save(&txn).await.context("Failed to update post")?;
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
        .filter_map(|meta| if meta.is_category == "1" { Some(meta.name.clone()) } else { None })
        .collect();
    let origin_tags: Vec<_> = origin_metas
        .clone()
        .filter_map(|meta| if meta.is_category == "0" { Some(meta.name.clone()) } else { None })
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
            post.tags.clone().into_iter().filter(|name| !origin_tags.contains(name)).collect(),
            false,
            &txn
        )
    )
    .context("Failed to handle metas")?;

    romi_relationships::Entity::delete_many()
        .filter(romi_relationships::Column::Pid.eq(id))
        .filter(romi_relationships::Column::Mid.is_in(origin_metas.filter_map(|meta| {
            if !post.tags.contains(&meta.name) && !post.categories.contains(&meta.name) {
                Some(meta.mid)
            } else {
                None
            }
        })))
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

    l_info!(&state.logger, "Successfully updated post: id={}", id);
    api_ok(())
}

async fn like(Path(id): Path<u32>, State(state): State<AppState>) -> ApiResult<()> {
    l_info!(&state.logger, "Liking post: id={}", id);

    match romi_posts::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch post {} for like", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.likes = ActiveValue::set(model.likes + 1);
            active_model.save(&state.conn).await.context("Failed to update post")?;
        }
        None => return Err(ApiError::not_found("Post not found")),
    };

    l_info!(&state.logger, "Successfully liked post: id={}", id);
    api_ok(())
}

async fn view(Path(id): Path<u32>, State(state): State<AppState>) -> ApiResult<()> {
    l_info!(&state.logger, "Viewing post: id={}", id);

    match romi_posts::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch post {} for view", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.views = ActiveValue::set(model.views + 1);
            active_model.save(&state.conn).await.context("Failed to update post")?;
        }
        None => return Err(ApiError::not_found("Post not found")),
    };

    l_info!(&state.logger, "Successfully viewed post: id={}", id);
    api_ok(())
}

async fn remove(
    _admin_user: AdminUser,
    Path(id): Path<u32>,
    State(state): State<AppState>,
) -> ApiResult<()> {
    l_info!(&state.logger, "Deleting post: id={}", id);

    romi_posts::Entity::delete_by_id(id)
        .exec(&state.conn)
        .await
        .context("Failed to delete post")?;

    let conn_clone = state.conn.clone();
    let logger_clone = state.logger.clone();
    spawn(async move {
        if let Err(e) = romi_relationships::Entity::delete_many()
            .filter(romi_relationships::Column::Pid.eq(id))
            .exec(&conn_clone)
            .await
        {
            l_error!(&logger_clone, "Failed to delete relationships for post {}: {}", id, e);
        }

        if let Err(e) = romi_comments::Entity::delete_many()
            .filter(romi_comments::Column::Pid.eq(id))
            .exec(&conn_clone)
            .await
        {
            l_error!(&logger_clone, "Failed to delete comments for post {}: {}", id, e);
        }
    });

    l_info!(&state.logger, "Successfully deleted post: id={}", id);
    api_ok(())
}

async fn decrypt(
    Path(id): Path<u32>,
    State(state): State<AppState>,
    Json(data): Json<ReqDecryptPostData>,
) -> ApiResult<ResDecryptPostData> {
    l_info!(&state.logger, "Decrypting post: id={}", id);

    match romi_posts::Entity::find_by_id(id)
        .one(&state.conn)
        .await
        .with_context(|| format!("Failed to fetch post {} for decrypt", id))?
    {
        Some(model) => {
            if let Some(password) = model.password {
                if password == data.password {
                    l_info!(&state.logger, "Successfully decrypted post: id={}", id);
                    api_ok(ResDecryptPostData { text: model.text })
                } else {
                    l_warn!(&state.logger, "Incorrect password for post: id={}", id);
                    Err(ApiError::unauthorized("Incorrect password"))
                }
            } else {
                Err(ApiError::bad_request("Post is not password protected"))
            }
        }
        None => {
            l_warn!(&state.logger, "Post not found: id={}", id);
            Err(ApiError::not_found("Post not found"))
        }
    }
}
