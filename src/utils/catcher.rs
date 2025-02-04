use rocket::catch;
use rocket::http::Status;
use rocket::serde::json::Json;
use rocket::Request;

use super::api::ApiError;

#[catch(400)]
pub fn bad_request(status: Status, _: &Request) -> Json<ApiError> {
    Json(ApiError::bad_request(
        status.reason().unwrap_or("Bad Request"),
    ))
}

#[catch(401)]
pub fn unauthorized(status: Status, _: &Request) -> Json<ApiError> {
    Json(ApiError::unauthorized(
        status.reason().unwrap_or("Unauthorized"),
    ))
}

#[catch(403)]
pub fn forbidden(status: Status, _: &Request) -> Json<ApiError> {
    Json(ApiError::forbidden(status.reason().unwrap_or("Forbidden")))
}

#[catch(404)]
pub fn not_found(req: &Request) -> Json<ApiError> {
    Json(ApiError::not_found(format!("{} not found", req.uri())))
}

#[catch(422)]
pub fn unprocessable_entity(status: Status, _: &Request) -> Json<ApiError> {
    Json(ApiError::unprocessable_entity(
        status.reason().unwrap_or("Unprocessable Entity"),
    ))
}

#[catch(500)]
pub fn internal_server_error(status: Status, _: &Request) -> Json<ApiError> {
    Json(
        status
            .reason()
            .map(|reason| ApiError::internal(reason))
            .unwrap_or(ApiError::default()),
    )
}

// #[catch(default)]
// pub fn default(status: Status, _: &Request) -> Json<ApiError> {
//     Json(ApiError::new(
//         status.code,
//         format!(
//             "{}: {}",
//             status.code,
//             status.reason().unwrap_or("Unknown Error")
//         ),
//     ))
// }
