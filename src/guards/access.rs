use crate::utils::api::ApiError;
use crate::FREE_HONG_KONG;
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use rocket::request::{FromRequest, Outcome, Request};
use serde::{Deserialize, Serialize};

use super::auth::AuthUser;

#[derive(Debug, Serialize, Deserialize, PartialEq, Eq)]
pub enum AccessLevel {
    Visitor,
    User,
    Admin,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Access {
    pub user: Option<AuthUser>,
    pub level: AccessLevel,
}

impl Default for Access {
    fn default() -> Self {
        Self {
            user: None,
            level: AccessLevel::Visitor,
        }
    }
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for Access {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let token = match req.headers().get_one("Authorization") {
            Some(token) => token.replace("Bearer ", ""),
            None => return Outcome::Success(Access::default()),
        };

        match decode::<AuthUser>(
            &token,
            &DecodingKey::from_secret(FREE_HONG_KONG.as_bytes()),
            &Validation::new(Algorithm::HS256),
        ) {
            Ok(token_data) => Outcome::Success(Access {
                user: Some(token_data.claims.clone()),
                level: if token_data.claims.is_admin {
                    AccessLevel::Admin
                } else {
                    AccessLevel::User
                },
            }),
            Err(_) => Outcome::Success(Access::default()),
        }
    }
}
