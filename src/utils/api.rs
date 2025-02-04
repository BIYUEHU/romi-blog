use rocket::{
    http::{ContentType, Status},
    response::{self, Responder},
    serde::json::Json,
    Request, Response,
};
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ApiError {
    pub code: u16,

    pub msg: String,
}

impl ApiError {
    pub fn new<T: Into<String>>(code: u16, msg: T) -> Self {
        Self {
            code,
            msg: msg.into(),
        }
    }

    pub fn bad_request<T: Into<String>>(msg: T) -> Self {
        Self::new(400, msg)
    }

    pub fn unauthorized<T: Into<String>>(msg: T) -> Self {
        Self::new(401, msg)
    }

    pub fn forbidden<T: Into<String>>(msg: T) -> Self {
        Self::new(403, msg)
    }

    pub fn not_found<T: Into<String>>(msg: T) -> Self {
        Self::new(404, msg)
    }

    pub fn unprocessable_entity<T: Into<String>>(msg: T) -> Self {
        Self::new(422, msg)
    }

    pub fn internal<T: Into<String>>(msg: T) -> Self {
        Self::new(500, msg)
    }
}

impl Default for ApiError {
    fn default() -> Self {
        Self::internal("Internal Server Error")
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(error: anyhow::Error) -> Self {
        Self::internal(error.to_string())
    }
}

impl<'r> Responder<'r, 'static> for ApiError {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        let body = serde_json::to_string(&self).unwrap();
        Response::build()
            .sized_body(body.len(), std::io::Cursor::new(body))
            .header(ContentType::JSON)
            .status(Status::new(self.code))
            .ok()
    }
}

pub type ApiResult<T> = Result<Json<T>, ApiError>;

pub fn api_ok<T: Serialize>(data: T) -> ApiResult<T> {
    Ok(Json(data))
}
