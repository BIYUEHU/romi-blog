use axum::{
    Router,
    extract::State,
    http::header,
    response::{IntoResponse, Response},
    routing::get,
};
use chrono::{DateTime, Utc};
use rss::{ChannelBuilder, ItemBuilder};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};

use crate::{
    app::RomiState,
    entity::{romi_news, romi_posts},
    models::info::ResSettingsData,
    utils::cache::get_settings_cache,
};

pub fn routes() -> Router<RomiState> {
    Router::new().route("/rss.xml", get(fetch))
}

fn to_rfc2822(timestamp: u32) -> String {
    DateTime::<Utc>::from_timestamp(timestamp as i64, 0)
        .map(|dt| dt.to_rfc2822())
        .unwrap_or_else(|| String::from(""))
}

async fn fetch(State(RomiState { ref conn, ref config, .. }): State<RomiState>) -> Response {
    let result: Result<Response, anyhow::Error> = async {
        let settings: ResSettingsData =
            get_settings_cache(conn).await.map_err(|e| anyhow::anyhow!(e))?;

        let posts = romi_posts::Entity::find().all(conn).await.map_err(|e| anyhow::anyhow!(e))?;

        let news = romi_news::Entity::find()
            .filter(romi_news::Column::Private.ne("1"))
            .all(conn)
            .await
            .map_err(|e| anyhow::anyhow!(e))?;

        let mut channel = ChannelBuilder::default()
            .title(&settings.site_name)
            .link(&config.site_url)
            .description(&settings.site_description)
            .build();

        for post in posts {
            let link = format!(
                "{}/post/{}",
                config.site_url,
                post.str_id
                    .clone()
                    .filter(|s| !s.is_empty())
                    .unwrap_or_else(|| post.pid.to_string())
            );
            let description = post.text;
            let pub_date = to_rfc2822(post.modified);

            let item = ItemBuilder::default()
                .title(Some(post.title))
                .link(Some(link.clone()))
                .description(Some(description))
                .pub_date(Some(pub_date))
                .build();
            channel.items.push(item);
        }

        for news_item in news {
            let link = format!("{}/news/{}", config.site_url, news_item.nid);
            let title = news_item.text.split('\n').next().unwrap_or("").trim().to_string();
            let description = news_item.text;
            let pub_date = to_rfc2822(news_item.modified);

            let item = ItemBuilder::default()
                .title(Some(title))
                .link(Some(link.clone()))
                .description(Some(description))
                .pub_date(Some(pub_date))
                .build();
            channel.items.push(item);
        }

        let xml = channel.to_string();
        Ok(([(header::CONTENT_TYPE, "application/rss+xml; charset=utf-8")], xml).into_response())
    }
    .await;

    match result {
        Ok(resp) => resp,
        Err(_) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to generate RSS")
            .into_response(),
    }
}
