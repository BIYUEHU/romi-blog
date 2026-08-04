use axum::{
  Router,
  extract::State,
  http::header,
  response::{IntoResponse, Response},
  routing::get,
};
use roga::*;

use crate::{app::RomiState, service::rss};

pub fn routes() -> Router<RomiState> {
  Router::new().route("/rss.xml", get(fetch))
}

async fn fetch(State(RomiState { ref logger, ref conn, .. }): State<RomiState>) -> Response {
  match rss::generate_rss(conn).await {
    Ok(xml) => {
      ([(header::CONTENT_TYPE, "application/rss+xml; charset=utf-8")], xml).into_response()
    }
    Err(e) => {
      l_error!(logger, "Failed to generate RSS: {}", e);
      (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to generate RSS").into_response()
    }
  }
}
