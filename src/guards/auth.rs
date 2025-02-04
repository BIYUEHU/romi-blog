use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use serde::{Deserialize, Serialize};

use crate::utils::api::ApiError;
use crate::FREE_HONG_KONG;

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthUser {
    pub id: u32,
    pub username: String,
    pub created: u32,
    pub url: Option<String>,
    pub is_admin: bool,
    pub exp: u64,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AuthUser {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let token = match req.headers().get_one("Authorization") {
            Some(token) => token.replace("Bearer ", ""),
            None => {
                return Outcome::Error((
                    Status::Unauthorized,
                    ApiError::unauthorized("No token provided"),
                ))
            }
        };

        match decode::<AuthUser>(
            &token,
            &DecodingKey::from_secret(FREE_HONG_KONG.as_bytes()),
            &Validation::new(Algorithm::HS256),
        ) {
            Ok(token_data) => Outcome::Success(token_data.claims),
            Err(_) => Outcome::Error((
                Status::Unauthorized,
                ApiError::unauthorized("Invalid token"),
            )),
        }
    }
}
