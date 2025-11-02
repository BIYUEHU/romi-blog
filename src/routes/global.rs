use anyhow::Context;
use axum::{
    extract::{Path, Request, State},
    response::IntoResponse,
};
use http::Method;

use crate::{app::RomiState, service::ssr::SSRResponse, utils::api::ApiError};

async fn ssr_handler(
    State(RomiState { ssr, .. }): State<RomiState>,
    Path(path): Path<String>,
) -> Result<SSRResponse, ApiError> {
    ssr.render(path.as_str()).await.context("SSR rendering failed").map_err(|e| e.into())
}

pub async fn fallback(state: State<RomiState>, req: Request) -> impl IntoResponse {
    if req.method().to_string().to_lowercase() == Method::GET.to_string().to_lowercase() {
        if state.ssr.is_running() {
            ssr_handler(state, Path(req.uri().path().to_string())).await.into_response()
        } else {
            ApiError::not_found("Page not found").into_response()
        }
    } else {
        ().into_response()
    }
}
