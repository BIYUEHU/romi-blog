use std::collections::{HashMap, HashSet};

use anyhow::Context;
use axum::{
    Json, Router,
    extract::{Path, State},
    routing::{delete, get, post, put},
};
use roga::*;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr,
    EntityTrait, IntoActiveModel, QueryFilter, QueryOrder, TransactionTrait, TryIntoModel,
};
use tokio::try_join;

use crate::{
    app::RomiState,
    entity::{romi_comments, romi_metas, romi_posts, romi_relationships},
    guards::{
        admin::AdminUser,
        auth::{Access, AccessLevel},
    },
    models::post::{
        ReqDecryptPostData, ReqPostData, ResDecryptPostData, ResPostData, ResPostSingleData,
        ResPostSingleDataRelatedPost,
    },
    tools::markdown::{collect_markdown_languages, summary_markdown},
    utils::api::{ApiError, ApiResult, api_ok},
};

pub fn routes() -> Router<RomiState> {
    Router::new()
        .route("/", get(fetch_all))
        .route("/", post(create))
        .route("/str_id/{str_id}", get(fetch_by_str_id))
        .route("/{id}", get(fetch))
        .route("/{id}", put(update))
        .route("/like/{id}", put(like))
        .route("/view/{id}", put(view))
        .route("/{id}", delete(remove))
        .route("/decrypt/{id}", post(decrypt))
}

fn valid_str_id(str: String) -> Option<String> {
    if str.is_empty() || !str.is_ascii() || !str.chars().next().unwrap().is_ascii_alphabetic() {
        None
    } else {
        Some(str)
    }
}

async fn get_post_metas(
    id: u32,
    conn: &DatabaseConnection,
) -> Result<(Vec<String>, Vec<String>), DbErr> {
    let relationships = romi_relationships::Entity::find()
        .filter(romi_relationships::Column::Pid.eq(id))
        .all(conn)
        .await?;

    let meta_ids: Vec<u32> = relationships.iter().map(|r| r.mid).collect();

    let metas = romi_metas::Entity::find()
        .filter(romi_metas::Column::Mid.is_in(meta_ids))
        .all(conn)
        .await?;

    Ok((
        metas.iter().filter(|m| m.is_category != "1").map(|m| m.name.clone()).collect(),
        metas.iter().filter(|m| m.is_category == "1").map(|m| m.name.clone()).collect(),
    ))
}

async fn fetch_all(
    State(RomiState { ref conn, .. }): State<RomiState>,
    access: Access,
) -> ApiResult<Vec<ResPostData>> {
    let is_admin = access.level.eq(&AccessLevel::Admin);

    let posts = romi_posts::Entity::find().all(conn).await.context("Failed to fetch posts")?;
    let post_ids: Vec<u32> = posts.iter().map(|p| p.pid).collect();
    let all_relationships = romi_relationships::Entity::find()
        .filter(romi_relationships::Column::Pid.is_in(post_ids.clone()))
        .all(conn)
        .await
        .context("Failed to fetch relationships")?;

    let meta_ids: Vec<u32> = all_relationships.iter().map(|r| r.mid).collect();
    let all_metas = romi_metas::Entity::find()
        .filter(romi_metas::Column::Mid.is_in(meta_ids))
        .all(conn)
        .await
        .context("Failed to fetch metas")?;

    let meta_map: HashMap<u32, &romi_metas::Model> = all_metas.iter().map(|m| (m.mid, m)).collect();

    let mut post_metas: HashMap<u32, (Vec<String>, Vec<String>)> = HashMap::new();
    for rel in all_relationships {
        if let Some(meta) = meta_map.get(&rel.mid) {
            let entry = post_metas.entry(rel.pid).or_insert((vec![], vec![]));
            if meta.is_category == "1" {
                entry.1.push(meta.name.clone());
            } else {
                entry.0.push(meta.name.clone());
            }
        }
    }

    api_ok(
        posts
            .iter()
            .rev()
            .filter_map(|data| {
                if is_admin || data.hide.ne(&1.to_string()) {
                    let (tags, categories) =
                        post_metas.get(&data.pid).cloned().unwrap_or((vec![], vec![]));

                    let password = data.password.clone().filter(|p| !p.is_empty());

                    Some(ResPostData {
                        id: data.pid,
                        str_id: data.str_id.clone(),
                        title: data.title.clone(),
                        summary: if password.is_none() || is_admin {
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
                        password: password
                            .map(|p| is_admin.then(|| p).unwrap_or("password".into())),
                        hide: data.hide.eq(&1.to_string()),
                    })
                } else {
                    None
                }
            })
            .collect(),
    )
}

async fn fetch(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    access: Access,
) -> ApiResult<ResPostSingleData> {
    match romi_posts::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch post {}", id))?
    {
        Some(model) => {
            let (tags, categories) = get_post_metas(id, conn)
                .await
                .with_context(|| format!("Failed to fetch metas of post {}", id))?;
            let password = model.password.clone().filter(|p| !p.is_empty());

            let prev_post = romi_posts::Entity::find()
                .filter(romi_posts::Column::Hide.ne(1))
                .filter(romi_posts::Column::Pid.lt(id))
                .order_by_desc(romi_posts::Column::Pid)
                .one(conn)
                .await
                .with_context(|| format!("Failed to fetch prev post for {}", id))?;

            let next_post = romi_posts::Entity::find()
                .filter(romi_posts::Column::Hide.ne(1))
                .filter(romi_posts::Column::Pid.gt(id))
                .order_by_asc(romi_posts::Column::Pid)
                .one(conn)
                .await
                .with_context(|| format!("Failed to fetch next post for {}", id))?;

            api_ok(ResPostSingleData {
                id: model.pid.clone(),
                str_id: model.str_id.clone(),
                title: model.title.clone(),
                created: model.created,
                modified: model.modified,
                text: if password.is_none() || access.level.eq(&AccessLevel::Admin) {
                    model.text.clone()
                } else {
                    "This post is password protected.".into()
                },
                languages: if password.is_none() || access.level.eq(&AccessLevel::Admin) {
                    collect_markdown_languages(model.text.clone().as_str())
                } else {
                    vec![]
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
                prev: prev_post.map(|m| ResPostSingleDataRelatedPost {
                    id: m.pid,
                    str_id: m.str_id,
                    title: m.title,
                }),
                next: next_post.map(|m| ResPostSingleDataRelatedPost {
                    id: m.pid,
                    str_id: m.str_id,
                    title: m.title,
                }),
            })
        }
        None => {
            l_warn!(logger, "Post {} not found", id);
            Err(ApiError::not_found("Post not found"))
        }
    }
}

async fn fetch_by_str_id(
    Path(str_id): Path<String>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    access: Access,
) -> ApiResult<ResPostSingleData> {
    match romi_posts::Entity::find()
        .filter(romi_posts::Column::StrId.eq(Some(str_id.clone())))
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch post {}", str_id))?
    {
        Some(model) => {
            let (tags, categories) = get_post_metas(model.pid, conn)
                .await
                .with_context(|| format!("Failed to fetch metas of post {}", str_id))?;
            let password = model.password.clone().filter(|p| !p.is_empty());

            let prev_post = romi_posts::Entity::find()
                .filter(romi_posts::Column::Hide.ne(1))
                .filter(romi_posts::Column::Pid.lt(model.pid))
                .order_by_desc(romi_posts::Column::Pid)
                .one(conn)
                .await
                .with_context(|| format!("Failed to fetch prev post for {}", model.pid))?;

            let next_post = romi_posts::Entity::find()
                .filter(romi_posts::Column::Hide.ne(1))
                .filter(romi_posts::Column::Pid.gt(model.pid))
                .order_by_asc(romi_posts::Column::Pid)
                .one(conn)
                .await
                .with_context(|| format!("Failed to fetch next post for {}", model.pid))?;

            api_ok(ResPostSingleData {
                id: model.pid.clone(),
                str_id: model.str_id.clone(),
                title: model.title.clone(),
                created: model.created,
                modified: model.modified,
                text: if password.is_none() || access.level.eq(&AccessLevel::Admin) {
                    model.text.clone()
                } else {
                    "This post is password protected.".into()
                },
                languages: if password.is_none() || access.level.eq(&AccessLevel::Admin) {
                    collect_markdown_languages(model.text.clone().as_str())
                } else {
                    vec![]
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
                prev: prev_post.map(|m| ResPostSingleDataRelatedPost {
                    id: m.pid,
                    str_id: m.str_id,
                    title: m.title,
                }),
                next: next_post.map(|m| ResPostSingleDataRelatedPost {
                    id: m.pid,
                    str_id: m.str_id,
                    title: m.title,
                }),
            })
        }
        None => {
            l_warn!(logger, "Post {} not found", str_id);
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
    AdminUser(admin_user): AdminUser,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(post): Json<ReqPostData>,
) -> ApiResult {
    let txn = conn.begin().await.context("Failed to begin transaction")?;

    let str_id = if let Some(str_id) = post.str_id {
        if let Some(str_id) = valid_str_id(str_id) {
            Some(str_id)
        } else {
            l_warn!(logger, "Invalid str_id");
            return Err(ApiError::bad_request("Invalid str_id"));
        }
    } else {
        None
    };

    let post_model = romi_posts::ActiveModel {
        pid: ActiveValue::not_set(),
        str_id: ActiveValue::set(str_id),
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
            .exec(conn)
            .await
            .context("Failed to create relationships")?;
    }

    txn.commit().await.context("Failed to commit transaction")?;

    let result = post_model.try_into_model().context("Failed to convert model")?;
    l_info!(
        logger,
        "Created post {} ({}) by admin {} ({})",
        result.pid,
        post.title,
        admin_user.id,
        admin_user.username
    );
    api_ok(())
}

async fn update(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(post): Json<ReqPostData>,
) -> ApiResult {
    let txn = conn
        .begin()
        .await
        .with_context(|| format!("Failed to begin transaction for post {}", id))?;

    match romi_posts::Entity::find_by_id(id)
        .one(&txn)
        .await
        .with_context(|| format!("Failed to fetch post {} for update", id))?
    {
        Some(model) => {
            let mut active_model = model.into_active_model();
            active_model.title = ActiveValue::set(post.title.clone());
            active_model.str_id = ActiveValue::set(post.str_id.clone());
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
            active_model
                .save(&txn)
                .await
                .with_context(|| format!("Failed to update post {}", id))?;
        }
        None => {
            l_warn!(logger, "Post {} not found", id);
            return Err(ApiError::not_found("Post not found"));
        }
    };

    let all_metas = romi_metas::Entity::find()
        .all(&txn)
        .await
        .with_context(|| format!("Failed to fetch existing metas for post {}", id))?;

    let relationships = romi_relationships::Entity::find()
        .filter(romi_relationships::Column::Pid.eq(id))
        .all(&txn)
        .await
        .with_context(|| format!("Failed to fetch existing relations for post {}", id))?;

    let origin_metas: Vec<_> = relationships
        .iter()
        .filter_map(|model| all_metas.iter().find(|meta| meta.mid == model.mid))
        .collect();

    let origin_categories: Vec<_> = origin_metas
        .iter()
        .filter_map(|meta| if meta.is_category == "1" { Some(meta.name.clone()) } else { None })
        .collect();
    let origin_tags: Vec<_> = origin_metas
        .iter()
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
    .with_context(|| format!("Failed to handle metas for post {}", id))?;

    romi_relationships::Entity::delete_many()
        .filter(romi_relationships::Column::Pid.eq(id))
        .filter(romi_relationships::Column::Mid.is_in(origin_metas.iter().filter_map(|meta| {
            if !post.tags.contains(&meta.name) && !post.categories.contains(&meta.name) {
                Some(meta.mid)
            } else {
                None
            }
        })))
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete old relations for post {}", id))?;

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
            .with_context(|| format!("Failed to create new relations for post {}", id))?;
    }

    txn.commit().await.with_context(|| "Failed to commit transaction".to_string())?;

    l_info!(
        logger,
        "Updated post {} ({}) by admin {} ({})",
        id,
        post.title,
        admin_user.id,
        admin_user.username
    );
    api_ok(())
}

async fn like(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    match romi_posts::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch post {} for like", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.likes = ActiveValue::set(model.likes + 1);
            active_model.save(conn).await.with_context(|| format!("Failed to like post {}", id))?;
            l_info!(logger, "Liked post {} ({})", id, model.title);
        }
        None => {
            l_warn!(logger, "Post {} not found", id);
            return Err(ApiError::not_found("Post not found"));
        }
    };

    api_ok(())
}

async fn view(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    match romi_posts::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch post {} for view", id))?
    {
        Some(model) => {
            let mut active_model = model.clone().into_active_model();
            active_model.views = ActiveValue::set(model.views + 1);
            active_model.save(conn).await.with_context(|| format!("Failed to view post {}", id))?;
            l_info!(logger, "Viewed post {} ({})", id, model.title);
        }
        None => {
            l_warn!(logger, "Post {} not found", id);
            return Err(ApiError::not_found("Post not found"));
        }
    };

    api_ok(())
}

async fn remove(
    AdminUser(admin_user): AdminUser,
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
) -> ApiResult {
    let txn = conn
        .begin()
        .await
        .with_context(|| format!("Failed to begin transaction for post {}", id))?;

    romi_posts::Entity::delete_by_id(id)
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete post {}", id))?;

    romi_relationships::Entity::delete_many()
        .filter(romi_relationships::Column::Pid.eq(id))
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete relations for post {}", id))?;

    romi_comments::Entity::delete_many()
        .filter(romi_comments::Column::Pid.eq(id))
        .exec(&txn)
        .await
        .with_context(|| format!("Failed to delete comments for post {}", id))?;

    txn.commit().await.with_context(|| format!("Failed to commit transaction for post {}", id))?;

    l_info!(logger, "Deleted post {} by admin {} ({})", id, admin_user.id, admin_user.username);
    api_ok(())
}

async fn decrypt(
    Path(id): Path<u32>,
    State(RomiState { ref logger, ref conn, .. }): State<RomiState>,
    Json(data): Json<ReqDecryptPostData>,
) -> ApiResult<ResDecryptPostData> {
    match romi_posts::Entity::find_by_id(id)
        .one(conn)
        .await
        .with_context(|| format!("Failed to fetch post {} for decrypt", id))?
    {
        Some(model) => {
            if let Some(password) = model.password {
                if password == data.password {
                    api_ok(ResDecryptPostData {
                        text: model.text.clone(),
                        languages: collect_markdown_languages(model.text.as_str()),
                    })
                } else {
                    l_warn!(logger, "Incorrect password for post {}", id);
                    Err(ApiError::unauthorized("Incorrect password"))
                }
            } else {
                l_warn!(logger, "Post is not password protected {}", id);
                Err(ApiError::bad_request("Post is not password protected"))
            }
        }
        None => {
            l_warn!(logger, "Post {} not found", id);
            Err(ApiError::not_found("Post not found"))
        }
    }
}
