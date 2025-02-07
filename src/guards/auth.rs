use super::access::Access;
use crate::utils::api::ApiError;
use rocket::http::Status;
use rocket::request::{FromRequest, Outcome, Request};
use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Debug, Serialize, Deserialize, TS, Clone)]
#[ts(export, export_to = "../client/output.ts")]
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
        match Access::from_request(req).await {
            Outcome::Success(access) => match access.user {
                Some(user) => Outcome::Success(user),
                None => Outcome::Error((
                    Status::Unauthorized,
                    ApiError::unauthorized("No token provided or token is invalid"),
                )),
            },
            Outcome::Error(e) => Outcome::Error(e),
            Outcome::Forward(f) => Outcome::Forward(f),
        }
    }
}
