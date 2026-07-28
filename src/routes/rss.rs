use axum::{
    Router,
    extract::State,
    http::header,
    response::{IntoResponse, Response},
    routing::get,
};
use chrono::{DateTime, Utc};
use rss::{Channel, ChannelBuilder, Item, ItemBuilder};
use sea_orm::{ColumnTrait, EntityTrait, QueryFilter};

use crate::{
    app::RomiState,
    entity::{romi_news, romi_posts},
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
        let posts = romi_posts::Entity::find()
            .all(conn)
            .await
            .map_err(|e| anyhow::anyhow!(e))?;

        let news = romi_news::Entity::find()
            .filter(romi_news::Column::Private.ne("1"))
            .all(conn)
            .await
            .map_err(|e| anyhow::anyhow!(e))?;

        let mut channel = ChannelBuilder::default()
            .title(&config.site_name)
            .link(&config.site_url)
            .description(&config.site_description)
            .build();

        for post in posts {
            let link = format!("{}/post/{}", config.site_url,
                post.str_id.clone().filter(|s| !s.is_empty()).unwrap_or_else(|| post.pid.to_string())
            );
            let title = post.title.unwrap_or_default(); // assuming post has title field, need check entity
            let description = post.content.map(|c| c).unwrap_or_default(); // may be text
            let pub_date = to_rfc2822(post.created);
            let guid = link.clone();

            let item = ItemBuilder::default()
                .title(Some(title))
                .link(Some(link))
                .description(Some(description))
                .pub_date(Some(pub_date))
                .guid(Some(guid))
                .build();
            channel.items.push(item);
        }

        for item in news {
            let link = format!("{}/news/{}", config.site_url, item.nid);
            let title = item.title.unwrap_or_default();
            let description = item.content.map(|c| c).unwrap_or_default();
            let pub_date = to_rfc2822(item.created);
            let guid = link.clone();

            let rss_item = ItemBuilder::default()
                .title(Some(title))
                .link(Some(link))
                .description(Some(description))
                .pub_date(Some(pub_date))
                .guid(Some(guid))
                .build();
            channel.items.push(rss_item);
        }

        let xml = channel.to_string();
        Ok(([(header::CONTENT_TYPE, "application/rss+xml; charset=utf-8")], xml).into_response())
    }.await;

    match result {
        Ok(resp) => resp,
        Err(_) => (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to generate RSS").into_response(),
    }
}