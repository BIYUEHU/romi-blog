use crate::entity::romi_articles;
use crate::utils::pool::Db;
use crate::utils::req::{req_result_ok, ReqErr, ReqResult};
use anyhow::{Context, Result};
use rocket::serde::json::Json;
use sea_orm::{ActiveModelTrait, ActiveValue, EntityTrait, IntoActiveModel, TryIntoModel};
use sea_orm_rocket::Connection;
use std::env;
use std::fs;
use walkdir::WalkDir;

#[derive(serde::Deserialize)]
pub struct ArticleData {
    pub title: String,
    pub text: String,
    pub password: Option<String>,
    pub hide: Option<String>,
    pub allow_comment: Option<String>,
    pub created: Option<u32>,
    pub modified: Option<u32>,
}

fn read_markdown_files() -> Result<Vec<String>> {
    let dir_path = env::current_dir()?.join("articles");

    // 确保目录存在
    if !dir_path.exists() {
        return Err(anyhow::anyhow!(
            "Directory '{}' does not exist",
            dir_path.to_str().unwrap()
        ));
    }

    let mut articles = Vec::new();

    // 使用 walkdir 递归遍历目录
    for entry in WalkDir::new(dir_path)
        .follow_links(true)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        // 检查文件扩展名是否为 .md
        if path
            .extension()
            .map_or(false, |ext| ext.eq_ignore_ascii_case("md"))
        {
            // 读取文件内容
            let content = fs::read_to_string(path)
                .with_context(|| format!("Failed to read file: {}", path.display()))?;

            articles.push(content);
        }
    }

    Ok(articles)
}

#[get("/test")]
pub async fn fetch_test() -> ReqResult<Vec<String>> {
    req_result_ok(match read_markdown_files() {
        Ok(articles) => articles,
        Err(e) => {
            eprintln!("Error: {}", e);
            vec![]
        }
    })
}

#[get("/")]
pub async fn fetch(coon: Connection<'_, Db>) -> ReqResult<Vec<romi_articles::Model>> {
    req_result_ok(
        romi_articles::Entity::find()
            .all(coon.into_inner())
            .await
            .map_err(|_| ReqErr {
                ..Default::default()
            })?,
    )
}

#[get("/<id>")]
pub async fn fetch_all(id: u32, coon: Connection<'_, Db>) -> ReqResult<romi_articles::Model> {
    match romi_articles::Entity::find_by_id(id)
        .one(coon.into_inner())
        .await
        .map_err(|_| ReqErr {
            ..Default::default()
        })? {
        Some(article) => req_result_ok(article),
        None => Err(ReqErr {
            code: 404,
            msg: "Article not found".to_string(),
        }),
    }
}

#[post("/", data = "<article>")]
pub async fn create(
    article: Json<ArticleData>,
    coon: Connection<'_, Db>,
) -> ReqResult<romi_articles::Model> {
    req_result_ok(
        romi_articles::ActiveModel {
            aid: ActiveValue::not_set(),
            title: ActiveValue::set(article.title.clone()),
            text: ActiveValue::set(article.text.clone()),
            password: ActiveValue::set(article.password.clone()),
            hide: ActiveValue::set(article.hide.clone()),
            allow_comment: ActiveValue::set(article.allow_comment.clone()),
            created: ActiveValue::set(article.created),
            modified: ActiveValue::set(article.modified),
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

#[put("/<id>", data = "<article>")]
pub async fn update(
    id: u32,
    article: Json<ArticleData>,
    coon: Connection<'_, Db>,
) -> ReqResult<romi_articles::Model> {
    let db = coon.into_inner();
    match romi_articles::Entity::find_by_id(id)
        .one(db)
        .await
        .map_err(|_| ReqErr {
            ..Default::default()
        })? {
        Some(article_origin) => {
            let mut article_origin = article_origin.into_active_model();
            article_origin.title = ActiveValue::Set(article.title.clone());
            article_origin.text = ActiveValue::Set(article.text.clone());
            article_origin.password = ActiveValue::Set(article.password.clone());
            article_origin.hide = ActiveValue::Set(article.hide.clone());
            article_origin.allow_comment = ActiveValue::Set(article.allow_comment.clone());
            article_origin.created = ActiveValue::Set(article.created);
            article_origin.modified = ActiveValue::Set(article.modified);
            req_result_ok(
                article_origin
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
            msg: "Article not found".to_string(),
        }),
    }
}

#[delete("/<id>")]
pub async fn delete(id: u32, coon: Connection<'_, Db>) -> ReqResult<String> {
    let db = coon.into_inner();

    romi_articles::Entity::delete_by_id(id)
        .exec(db)
        .await
        .map_err(|_| ReqErr {
            ..Default::default()
        })?;

    Ok(Json("Article deleted".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_read_markdown_files() -> Result<()> {
        // 测试读取函数
        let articles = read_markdown_files()?;

        assert_ne!(articles.len(), 0);
        Ok(())
    }
}
