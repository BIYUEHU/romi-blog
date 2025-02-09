use super::auth::AuthUser;
use crate::utils::api::ApiError;
use rocket::{
    http::Status,
    request::{FromRequest, Outcome},
    Request,
};

pub struct AdminUser(pub AuthUser);

#[rocket::async_trait]
impl<'r> FromRequest<'r> for AdminUser {
    type Error = ApiError;

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let auth_user = match AuthUser::from_request(req).await {
            Outcome::Success(user) => user,
            Outcome::Error(e) => return Outcome::Error(e),
            Outcome::Forward(f) => return Outcome::Forward(f),
        };

        if !auth_user.is_admin {
            return Outcome::Error((
                Status::Forbidden,
                ApiError::forbidden("Admin access required"),
            ));
        }

        Outcome::Success(AdminUser(auth_user))
    }
}
