use axum::{
  Router,
  extract::State,
  response::{IntoResponse, Response},
  routing::get,
};
use roga::*;

use crate::{app::RomiState, service::sitemap};

pub fn routes() -> Router<RomiState> {
  Router::new().route("/sitemap.xml", get(fetch))
}

async fn fetch(State(RomiState { ref logger, ref conn, .. }): State<RomiState>) -> Response {
  match sitemap::generate_sitemap(conn).await {
    Ok(resp) => resp,
    Err(e) => {
      l_error!(logger, "Failed to generate sitemap: {}", e);
      (axum::http::StatusCode::INTERNAL_SERVER_ERROR, "Failed to generate sitemap").into_response()
    }
  }
}
