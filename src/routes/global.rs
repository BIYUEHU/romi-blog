use axum::extract::{Path, State};
use roga::*;

use crate::{app::AppState, service::ssr::SSRResponse, utils::api::ApiError};

pub async fn ssr_handler(
    State(AppState { logger, ssr, .. }): State<AppState>,
    Path(path): Path<String>,
) -> Result<SSRResponse, ApiError> {
    ssr.render(path.as_str())
        .await
        .map_err(|e| {
            l_error!(logger, "SSR render error: {}", e);
        })
        .map_err(|_| ApiError::default())
}
