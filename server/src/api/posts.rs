use crate::entity::{romi_metas, romi_posts, romi_relationships};
use crate::tools::{from_bool, summary_markdown, to_bool};
use crate::utils::pool::Db;
use crate::utils::req::{req_result_ok, ReqErr, ReqResult};
use anyhow::{Context, Result};
use rocket::serde::json::Json;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, EntityTrait, IntoActiveModel, QueryFilter,
    TryIntoModel,
};
use sea_orm_rocket::Connection;
use std::fs;
use std::{env, vec};
use walkdir::WalkDir;

#[derive(serde::Deserialize)]
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

#[derive(serde::Serialize)]
pub struct ResPostData {
    pub id: u32,
    pub title: String,
    pub summary: String,
    pub created: u32,
    pub banner: Option<String>,
}

#[derive(serde::Serialize)]
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

fn read_markdown_files() -> Result<Vec<String>> {
    let dir_path = env::current_dir()?.join("posts");

    if !dir_path.exists() {
        return Err(anyhow::anyhow!(
            "Directory '{}' does not exist",
            dir_path.to_str().unwrap()
        ));
    }

    let mut posts = Vec::new();

    for entry in WalkDir::new(dir_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if path
            .extension()
            .map_or(false, |ext| ext.eq_ignore_ascii_case("md"))
        {
            let content = fs::read_to_string(path)
                .with_context(|| format!("Failed to read file: {}", path.display()))?;

            posts.push(content);
        }
    }

    Ok(posts)
}

#[get("/test")]
pub async fn fetch_test() -> ReqResult<Vec<String>> {
    req_result_ok(match read_markdown_files() {
        Ok(posts) => posts,
        Err(e) => {
            eprintln!("Error: {}", e);
            vec![]
        }
    })
}

#[get("/")]
pub async fn fetch(coon: Connection<'_, Db>) -> ReqResult<Vec<ResPostData>> {
    req_result_ok(
        romi_posts::Entity::find()
            .all(coon.into_inner())
            .await
            .map_err(|_| ReqErr {
                ..Default::default()
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
pub async fn fetch_all(id: u32, coon: Connection<'_, Db>) -> ReqResult<ResPostSingleData> {
    let db = coon.into_inner();
    let metas = futures::future::join_all(
        romi_relationships::Entity::find()
            .filter(romi_relationships::Column::Pid.eq(id))
            .all(db)
            .await
            .map_err(|_| ReqErr {
                ..Default::default()
            })?
            .iter()
            .map(|tag| async {
                romi_metas::Entity::find_by_id(tag.mid)
                    .one(db)
                    .await
                    .map_err(|_| ReqErr {
                        ..Default::default()
                    })
                    .unwrap()
            }),
    )
    .await;

    if let Some(post) = romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .map_err(|_| ReqErr {
            ..Default::default()
        })?
    {
        req_result_ok(ResPostSingleData {
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
                    if let Some(meta) = meta {
                        meta.is_category != Some("1".to_string())
                    } else {
                        false
                    }
                })
                .map(|meta| meta.clone().unwrap().name.clone())
                .collect::<Vec<String>>(),
            categories: metas
                .iter()
                .filter(|meta| {
                    if let Some(meta) = meta {
                        meta.is_category == Some("1".to_string())
                    } else {
                        false
                    }
                })
                .map(|meta| meta.clone().unwrap().name.clone())
                .collect::<Vec<String>>(),
            views: post.views.unwrap(),
            likes: post.likes.unwrap(),
            comments: post.comments.unwrap(),
            banner: post.banner.clone(),
        })
    } else {
        Err(ReqErr {
            code: 404,
            msg: "Post not found".to_string(),
        })
    }
}

#[post("/", data = "<post>")]
pub async fn create(
    post: Json<ReqPostData>,
    coon: Connection<'_, Db>,
) -> ReqResult<romi_posts::Model> {
    req_result_ok(
        romi_posts::ActiveModel {
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
        .map_err(|_| ReqErr {
            ..Default::default()
        })?
        .try_into_model()
        .map_err(|_| ReqErr {
            ..Default::default()
        })?,
    )
}

#[put("/<id>", data = "<post>")]
pub async fn update(
    id: u32,
    post: Json<ReqPostData>,
    coon: Connection<'_, Db>,
) -> ReqResult<romi_posts::Model> {
    let db = coon.into_inner();

    match romi_posts::Entity::find_by_id(id)
        .one(db)
        .await
        .map_err(|_| ReqErr {
            ..Default::default()
        })? {
        Some(post_origin) => {
            let mut post_origin = post_origin.into_active_model();
            post_origin.title = ActiveValue::Set(post.title.clone());
            post_origin.text = ActiveValue::Set(post.text.clone());
            post_origin.password = ActiveValue::Set(from_bool(post.password));
            post_origin.hide = ActiveValue::Set(from_bool(post.hide));
            post_origin.allow_comment = ActiveValue::Set(from_bool(post.allow_comment));
            post_origin.created = ActiveValue::Set(post.created);
            post_origin.modified = ActiveValue::Set(post.modified);
            req_result_ok(
                post_origin
                    .save(db)
                    .await
                    .map_err(|_| ReqErr {
                        ..Default::default()
                    })?
                    .try_into_model()
                    .map_err(|_| ReqErr {
                        ..Default::default()
                    })?,
            )
        }
        None => Err(ReqErr {
            code: 404,
            msg: "Post not found".to_string(),
        }),
    }
}

#[delete("/<id>")]
pub async fn delete(id: u32, coon: Connection<'_, Db>) -> ReqResult<String> {
    let db = coon.into_inner();

    romi_posts::Entity::delete_by_id(id)
        .exec(db)
        .await
        .map_err(|_| ReqErr {
            ..Default::default()
        })?;

    Ok(Json("Post deleted".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_read_markdown_files() -> Result<()> {
        // 测试读取函数
        let posts = read_markdown_files()?;

        assert_ne!(posts.len(), 0);
        Ok(())
    }
}
