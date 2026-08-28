use std::collections::{HashMap, HashSet};

use anyhow::{Context, Result};
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
  IntoActiveModel, QueryFilter, QueryOrder, TransactionTrait, TryIntoModel,
};
use tokio::try_join;

use crate::entity::{romi_comments, romi_metas, romi_posts, romi_relationships};
use crate::guards::auth::AccessLevel;
use crate::models::post::{
  ReqPostData, ResDecryptPostData, ResPostData, ResPostSingleData, ResPostSingleDataRelatedPost,
};
use crate::tools::markdown::{collect_markdown_languages, summary_markdown};
use crate::tools::time::get_timestamp;

#[derive(Debug, thiserror::Error)]
pub enum PostError {
  #[error("Post not found")]
  NotFound,
  #[error("Post is not password protected")]
  NotPasswordProtected,
  #[error("Incorrect password")]
  IncorrectPassword,
}

fn valid_str_id(s: String) -> Option<String> {
  if s.is_empty() || !s.is_ascii() || !s.chars().next().unwrap().is_ascii_alphabetic() {
    None
  } else {
    Some(s)
  }
}

async fn get_post_metas(db: &DatabaseConnection, pid: u32) -> Result<(Vec<String>, Vec<String>)> {
  let relationships = romi_relationships::Entity::find()
    .filter(romi_relationships::Column::Pid.eq(pid))
    .all(db)
    .await
    .context("Failed to fetch relationships")?;

  let meta_ids: Vec<u32> = relationships.iter().map(|r| r.mid).collect();
  let metas = romi_metas::Entity::find()
    .filter(romi_metas::Column::Mid.is_in(meta_ids))
    .all(db)
    .await
    .context("Failed to fetch metas")?;

  Ok((
    metas.iter().filter(|m| m.is_category != "1").map(|m| m.name.clone()).collect(),
    metas.iter().filter(|m| m.is_category == "1").map(|m| m.name.clone()).collect(),
  ))
}

async fn handle_metas(
  db: &DatabaseTransaction,
  names: Vec<String>,
  is_category: bool,
) -> Result<Vec<u32>> {
  if names.is_empty() {
    return Ok(vec![]);
  }

  let is_category_str = if is_category { "1" } else { "0" };
  let existing = romi_metas::Entity::find()
    .filter(romi_metas::Column::Name.is_in(names.clone()))
    .filter(romi_metas::Column::IsCategory.eq(is_category_str))
    .all(db)
    .await
    .context("Failed to fetch existing metas")?;

  let existing_names: HashSet<_> = existing.iter().map(|m| m.name.clone()).collect();
  let mut mids: Vec<u32> = existing.iter().map(|m| m.mid).collect();

  let new_names: Vec<_> = names.into_iter().filter(|n| !existing_names.contains(n)).collect();
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

    let inserted = romi_metas::Entity::find()
      .filter(romi_metas::Column::Name.is_in(new_names))
      .filter(romi_metas::Column::IsCategory.eq(is_category_str))
      .all(db)
      .await?;
    mids.extend(inserted.iter().map(|m| m.mid));
  }

  Ok(mids)
}

pub async fn list(db: &DatabaseConnection, access_level: AccessLevel) -> Result<Vec<ResPostData>> {
  let posts = romi_posts::Entity::find().all(db).await.context("Failed to list posts")?;

  if posts.is_empty() {
    return Ok(vec![]);
  }

  let pids: Vec<u32> = posts.iter().map(|p| p.pid).collect();
  let relationships = romi_relationships::Entity::find()
    .filter(romi_relationships::Column::Pid.is_in(pids.clone()))
    .all(db)
    .await
    .context("Failed to fetch relationships")?;

  let meta_ids: Vec<u32> = relationships.iter().map(|r| r.mid).collect();
  let metas = romi_metas::Entity::find()
    .filter(romi_metas::Column::Mid.is_in(meta_ids))
    .all(db)
    .await
    .context("Failed to fetch metas")?;

  let meta_map: HashMap<u32, &romi_metas::Model> = metas.iter().map(|m| (m.mid, m)).collect();
  let mut post_metas: HashMap<u32, (Vec<String>, Vec<String>)> = HashMap::new();
  for rel in relationships {
    if let Some(meta) = meta_map.get(&rel.mid) {
      let entry = post_metas.entry(rel.pid).or_insert((vec![], vec![]));
      if meta.is_category == "1" {
        entry.1.push(meta.name.clone());
      } else {
        entry.0.push(meta.name.clone());
      }
    }
  }

  let is_admin = access_level == AccessLevel::Admin;
  Ok(
    posts
      .into_iter()
      .map(|post| {
        let (tags, categories) = post_metas.get(&post.pid).cloned().unwrap_or((vec![], vec![]));

        ResPostData {
          id: post.pid,
          str_id: post.str_id.clone(),
          title: post.title,
          summary: if post.password.as_ref().map(|p| !p.is_empty()).unwrap_or(false) {
            String::new()
          } else {
            summary_markdown(&post.text, 70)
          },
          created: post.created,
          modified: post.modified,
          banner: post.banner,
          tags,
          categories,
          views: post.views,
          likes: post.likes,
          comments: post.comments,
          allow_comment: post.allow_comment == "1",
          password: post
            .password
            .clone()
            .filter(|p| !p.is_empty())
            .map(|p| if is_admin { p } else { "password".to_string() }),
          hide: post.hide == "1",
        }
      })
      .collect(),
  )
}

pub async fn get_by_id(
  db: &DatabaseConnection,
  pid: u32,
  access_level: AccessLevel,
) -> Result<ResPostSingleData> {
  let post = romi_posts::Entity::find_by_id(pid)
    .one(db)
    .await
    .context("Failed to get post")?
    .ok_or(PostError::NotFound)?;

  let (tags, categories) = get_post_metas(db, pid).await?;
  let has_password = post.password.as_ref().map(|p| !p.is_empty()).unwrap_or(false);
  let is_admin = access_level == AccessLevel::Admin;

  let prev = romi_posts::Entity::find()
    .filter(romi_posts::Column::Hide.ne("1"))
    .filter(romi_posts::Column::Pid.lt(pid))
    .order_by_desc(romi_posts::Column::Pid)
    .one(db)
    .await?;

  let next = romi_posts::Entity::find()
    .filter(romi_posts::Column::Hide.ne("1"))
    .filter(romi_posts::Column::Pid.gt(pid))
    .order_by_asc(romi_posts::Column::Pid)
    .one(db)
    .await?;

  Ok(ResPostSingleData {
    id: post.pid,
    str_id: post.str_id.clone(),
    title: post.title,
    created: post.created,
    modified: post.modified,
    text: if !has_password || is_admin { post.text.clone() } else { String::new() },
    languages: if !has_password { collect_markdown_languages(&post.text) } else { vec![] },
    password: post
      .password
      .clone()
      .filter(|p| !p.is_empty())
      .map(|p| if is_admin { p } else { "password".to_string() }),
    hide: post.hide == "1",
    allow_comment: post.allow_comment == "1",
    tags,
    categories,
    views: post.views,
    likes: post.likes,
    comments: post.comments,
    banner: post.banner,
    prev: prev.map(|p| ResPostSingleDataRelatedPost {
      id: p.pid,
      str_id: p.str_id,
      title: p.title,
    }),
    next: next.map(|p| ResPostSingleDataRelatedPost {
      id: p.pid,
      str_id: p.str_id,
      title: p.title,
    }),
  })
}

pub async fn get_by_str_id(
  db: &DatabaseConnection,
  str_id: String,
  access_level: AccessLevel,
) -> Result<ResPostSingleData> {
  let post = romi_posts::Entity::find()
    .filter(romi_posts::Column::StrId.eq(Some(str_id.clone())))
    .one(db)
    .await
    .context("Failed to get post by str_id")?
    .ok_or(PostError::NotFound)?;

  let (tags, categories) = get_post_metas(db, post.pid).await?;
  let has_password = post.password.as_ref().map(|p| !p.is_empty()).unwrap_or(false);
  let is_admin = access_level == AccessLevel::Admin;

  let prev = romi_posts::Entity::find()
    .filter(romi_posts::Column::Hide.ne("1"))
    .filter(romi_posts::Column::Pid.lt(post.pid))
    .order_by_desc(romi_posts::Column::Pid)
    .one(db)
    .await?;

  let next = romi_posts::Entity::find()
    .filter(romi_posts::Column::Hide.ne("1"))
    .filter(romi_posts::Column::Pid.gt(post.pid))
    .order_by_asc(romi_posts::Column::Pid)
    .one(db)
    .await?;

  Ok(ResPostSingleData {
    id: post.pid,
    str_id: post.str_id.clone(),
    title: post.title,
    created: post.created,
    modified: post.modified,
    text: if !has_password || is_admin { post.text.clone() } else { String::new() },
    languages: collect_markdown_languages(&post.text),
    password: post
      .password
      .clone()
      .filter(|p| !p.is_empty())
      .map(|p| if is_admin { p } else { "password".to_string() }),
    hide: post.hide == "1",
    allow_comment: post.allow_comment == "1",
    tags,
    categories,
    views: post.views,
    likes: post.likes,
    comments: post.comments,
    banner: post.banner,
    prev: prev.map(|p| ResPostSingleDataRelatedPost {
      id: p.pid,
      str_id: p.str_id,
      title: p.title,
    }),
    next: next.map(|p| ResPostSingleDataRelatedPost {
      id: p.pid,
      str_id: p.str_id,
      title: p.title,
    }),
  })
}

pub async fn create(db: &DatabaseConnection, data: ReqPostData) -> Result<romi_posts::Model> {
  let txn = db.begin().await.context("Failed to begin transaction")?;

  let str_id = data.str_id.and_then(valid_str_id);

  let post = romi_posts::ActiveModel {
    pid: ActiveValue::not_set(),
    str_id: ActiveValue::set(str_id),
    title: ActiveValue::set(data.title),
    text: ActiveValue::set(data.text),
    password: ActiveValue::set(data.password.clone().filter(|p| !p.is_empty())),
    hide: ActiveValue::set(if data.hide { "1" } else { "0" }.to_string()),
    allow_comment: ActiveValue::set(if data.allow_comment { "1" } else { "0" }.to_string()),
    created: ActiveValue::set(data.created),
    modified: ActiveValue::set(get_timestamp()),
    banner: ActiveValue::set(data.banner),
    views: ActiveValue::set(0),
    likes: ActiveValue::set(0),
    comments: ActiveValue::set(0),
  }
  .save(&txn)
  .await
  .context("Failed to create post")?;

  let pid = post.clone().pid.unwrap();

  let (category_mids, tag_mids) =
    try_join!(handle_metas(&txn, data.categories, true), handle_metas(&txn, data.tags, false),)
      .context("Failed to handle metas")?;

  let relations: Vec<romi_relationships::ActiveModel> = category_mids
    .into_iter()
    .chain(tag_mids)
    .map(|mid| romi_relationships::ActiveModel {
      pid: ActiveValue::set(pid),
      mid: ActiveValue::set(mid),
    })
    .collect();

  if !relations.is_empty() {
    romi_relationships::Entity::insert_many(relations)
      .exec(&txn)
      .await
      .context("Failed to create relationships")?;
  }

  txn.commit().await.context("Failed to commit transaction")?;
  post.try_into_model().context("Failed to convert model")
}

pub async fn update(db: &DatabaseConnection, pid: u32, data: ReqPostData) -> Result<()> {
  let txn = db.begin().await.context("Failed to begin transaction")?;

  let existing = romi_posts::Entity::find_by_id(pid)
    .one(&txn)
    .await
    .context("Failed to get post")?
    .ok_or(PostError::NotFound)?;

  let mut active = existing.into_active_model();
  active.title = ActiveValue::set(data.title);
  active.str_id = ActiveValue::set(data.str_id);
  active.text = ActiveValue::set(data.text);
  if let Some(password) = data.password {
    active.password = ActiveValue::set(if password.is_empty() { None } else { Some(password) });
  }
  active.hide = ActiveValue::set(if data.hide { "1" } else { "0" }.to_string());
  active.allow_comment = ActiveValue::set(if data.allow_comment { "1" } else { "0" }.to_string());
  active.created = ActiveValue::set(data.created);
  active.modified = ActiveValue::set(get_timestamp());
  active.banner = ActiveValue::set(data.banner);
  active.update(&txn).await.context("Failed to update post")?;

  // 更新 metas
  let all_metas = romi_metas::Entity::find().all(&txn).await?;
  let relationships = romi_relationships::Entity::find()
    .filter(romi_relationships::Column::Pid.eq(pid))
    .all(&txn)
    .await?;

  let origin_metas: Vec<_> =
    relationships.iter().filter_map(|r| all_metas.iter().find(|m| m.mid == r.mid)).collect();

  let origin_categories: Vec<_> = origin_metas
    .iter()
    .filter_map(|m| if m.is_category == "1" { Some(m.name.clone()) } else { None })
    .collect();
  let origin_tags: Vec<_> = origin_metas
    .iter()
    .filter_map(|m| if m.is_category != "1" { Some(m.name.clone()) } else { None })
    .collect();

  let new_categories: Vec<_> =
    data.categories.clone().into_iter().filter(|n| !origin_categories.contains(n)).collect();
  let new_tags: Vec<_> =
    data.tags.clone().into_iter().filter(|n| !origin_tags.contains(n)).collect();

  let (category_mids, tag_mids) =
    try_join!(handle_metas(&txn, new_categories, true), handle_metas(&txn, new_tags, false),)
      .context("Failed to handle metas")?;

  let to_remove: Vec<u32> = origin_metas
    .iter()
    .filter_map(|m| {
      if !data.tags.contains(&m.name) && !data.categories.contains(&m.name) {
        Some(m.mid)
      } else {
        None
      }
    })
    .collect();

  if !to_remove.is_empty() {
    romi_relationships::Entity::delete_many()
      .filter(romi_relationships::Column::Pid.eq(pid))
      .filter(romi_relationships::Column::Mid.is_in(to_remove))
      .exec(&txn)
      .await
      .context("Failed to remove old relationships")?;
  }

  let new_relations: Vec<romi_relationships::ActiveModel> = category_mids
    .into_iter()
    .chain(tag_mids)
    .map(|mid| romi_relationships::ActiveModel {
      pid: ActiveValue::set(pid),
      mid: ActiveValue::set(mid),
    })
    .collect();

  if !new_relations.is_empty() {
    romi_relationships::Entity::insert_many(new_relations)
      .exec(&txn)
      .await
      .context("Failed to create new relationships")?;
  }

  txn.commit().await.context("Failed to commit transaction")?;
  Ok(())
}

pub async fn like(db: &DatabaseConnection, pid: u32) -> Result<()> {
  let post = romi_posts::Entity::find_by_id(pid)
    .one(db)
    .await
    .context("Failed to get post")?
    .ok_or(PostError::NotFound)?;

  let likes = post.likes + 1;
  let mut active = post.into_active_model();
  active.likes = ActiveValue::set(likes);
  active.update(db).await.context("Failed to like post")?;
  Ok(())
}

pub async fn view(db: &DatabaseConnection, pid: u32) -> Result<()> {
  let post = romi_posts::Entity::find_by_id(pid)
    .one(db)
    .await
    .context("Failed to get post")?
    .ok_or(PostError::NotFound)?;

  let views = post.views + 1;
  let mut active = post.into_active_model();
  active.views = ActiveValue::set(views);
  active.update(db).await.context("Failed to view post")?;
  Ok(())
}

pub async fn remove(db: &DatabaseConnection, pid: u32) -> Result<()> {
  let txn = db.begin().await.context("Failed to begin transaction")?;

  romi_posts::Entity::delete_by_id(pid).exec(&txn).await.context("Failed to delete post")?;

  romi_relationships::Entity::delete_many()
    .filter(romi_relationships::Column::Pid.eq(pid))
    .exec(&txn)
    .await
    .context("Failed to delete relationships")?;

  romi_comments::Entity::delete_many()
    .filter(romi_comments::Column::Pid.eq(pid))
    .exec(&txn)
    .await
    .context("Failed to delete comments")?;

  txn.commit().await.context("Failed to commit transaction")?;
  Ok(())
}

pub async fn decrypt(
  db: &DatabaseConnection,
  pid: u32,
  password: String,
) -> Result<ResDecryptPostData> {
  let post = romi_posts::Entity::find_by_id(pid)
    .one(db)
    .await
    .context("Failed to get post")?
    .ok_or(PostError::NotFound)?;

  let stored = post.password.ok_or(PostError::NotPasswordProtected)?;
  (stored == password).then_some(()).ok_or(PostError::IncorrectPassword)?;

  let text = post.text;
  let languages = collect_markdown_languages(&text);
  Ok(ResDecryptPostData { text, languages })
}
