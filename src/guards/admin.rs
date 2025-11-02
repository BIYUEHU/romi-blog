use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
};

use crate::{
    app::RomiState,
    guards::auth::{ApiError, AuthUser},
};

pub struct AdminUser(pub AuthUser);

impl FromRequestParts<RomiState> for AdminUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &RomiState,
    ) -> Result<Self, Self::Rejection> {
        let user = AuthUser::from_request_parts(parts, state).await?;
        if !user.is_admin {
            return Err(ApiError(StatusCode::FORBIDDEN, "Admin required".into()));
        }
        Ok(AdminUser(user))
    }
}
