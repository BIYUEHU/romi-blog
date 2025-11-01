use axum::{
    extract::{FromRequestParts, State},
    http::{StatusCode, request::Parts},
    response::IntoResponse,
};
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

use crate::app::AppState;

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq, Eq)]
pub enum AccessLevel {
    Visitor,
    User,
    Admin,
}

#[derive(Debug, Serialize, Deserialize, Clone, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct AuthUser {
    pub id: u32,
    pub username: String,
    pub created: u32,
    pub url: Option<String>,
    pub is_admin: bool,
    pub exp: u64,
    pub status: u8,
}

#[derive(Debug, Clone)]
pub struct Access {
    pub user: Option<AuthUser>,
    pub level: AccessLevel,
}

impl Default for Access {
    fn default() -> Self {
        Self { user: None, level: AccessLevel::Visitor }
    }
}

#[derive(Debug)]
pub struct ApiError(pub StatusCode, pub String);

impl IntoResponse for ApiError {
    fn into_response(self) -> axum::response::Response {
        (self.0, self.1).into_response()
    }
}

impl FromRequestParts<AppState> for Access {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let State(AppState { secret, .. }) = State::from_request_parts(parts, state)
            .await
            .map_err(|_| ApiError(StatusCode::INTERNAL_SERVER_ERROR, "state missing".into()))?;

        let token = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .and_then(|s| s.strip_prefix("Bearer "))
            .map(str::to_string);

        if let Some(token) = token {
            match decode::<AuthUser>(
                &token,
                &DecodingKey::from_secret(secret.as_bytes()),
                &Validation::new(Algorithm::HS256),
            ) {
                Ok(data) => {
                    let claims = data.claims;
                    Ok(Self {
                        user: Some(claims.clone()),
                        level: if claims.is_admin { AccessLevel::Admin } else { AccessLevel::User },
                    })
                }
                Err(_) => Ok(Self::default()),
            }
        } else {
            Ok(Self::default())
        }
    }
}
