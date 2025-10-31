use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};

use crate::{
    app::AppState,
    guards::auth::{Access, ApiError, AuthUser},
};

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let access = Access::from_request_parts(parts, state).await?;
        match access.user {
            Some(user) if user.status == 0 => Ok(user),
            _ => Err(ApiError(StatusCode::UNAUTHORIZED, "No token provided or invalid".into())),
        }
    }
}
