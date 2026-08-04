use anyhow::{Context, Result};
use chrono::{DateTime, Utc};
use rss::{ChannelBuilder, ItemBuilder};
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter};

use crate::entity::{romi_news, romi_posts};
use crate::models::info::ResSettingsData;
use crate::utils::cache::get_settings_cache;

fn to_rfc2822(timestamp: u32) -> String {
  DateTime::<Utc>::from_timestamp(timestamp as i64, 0).map(|dt| dt.to_rfc2822()).unwrap_or_default()
}

pub async fn generate_rss(db: &DatabaseConnection) -> Result<String> {
  let settings: ResSettingsData =
    get_settings_cache(db).await.context("Failed to fetch settings")?;

  let posts = romi_posts::Entity::find().all(db).await.context("Failed to fetch posts")?;

  let news = romi_news::Entity::find()
    .filter(romi_news::Column::Private.ne("1"))
    .all(db)
    .await
    .context("Failed to fetch news")?;

  let mut channel = ChannelBuilder::default()
    .title(&settings.site_name)
    .link(&settings.site_url)
    .description(&settings.site_description)
    .build();

  for post in posts {
    let link = format!(
      "{}/post/{}",
      settings.site_url,
      post.str_id.clone().filter(|s| !s.is_empty()).unwrap_or_else(|| post.pid.to_string())
    );
    let pub_date = to_rfc2822(post.modified);

    let item = ItemBuilder::default()
      .title(Some(post.title))
      .link(Some(link.clone()))
      .description(Some(post.text))
      .pub_date(Some(pub_date))
      .build();
    channel.items.push(item);
  }

  for news_item in news {
    let link = format!("{}/news/{}", settings.site_url, news_item.nid);
    let title = news_item.text.split('\n').next().unwrap_or("").trim().to_string();
    let pub_date = to_rfc2822(news_item.modified);

    let item = ItemBuilder::default()
      .title(Some(title))
      .link(Some(link.clone()))
      .description(Some(news_item.text))
      .pub_date(Some(pub_date))
      .build();
    channel.items.push(item);
  }

  Ok(channel.to_string())
}
