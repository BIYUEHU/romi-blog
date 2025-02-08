use rocket::{
    http::{ContentType, Status},
    response::{self, Responder},
    serde::json::Json,
    Request, Response,
};
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct ApiError {
    pub code: u16,
    pub msg: String,
    pub raw_error: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct ApiErrorReal {
    pub code: u16,
    pub msg: String,
}

impl ApiError {
    pub fn new<T: Into<String>>(code: u16, msg: T, raw_error: Option<String>) -> Self {
        Self {
            code,
            msg: msg.into(),
            raw_error,
        }
    }

    pub fn bad_request<T: Into<String>>(msg: T) -> Self {
        Self::new(400, msg, None)
    }

    pub fn unauthorized<T: Into<String>>(msg: T) -> Self {
        Self::new(401, msg, None)
    }

    pub fn forbidden<T: Into<String>>(msg: T) -> Self {
        Self::new(403, msg, None)
    }

    pub fn not_found<T: Into<String>>(msg: T) -> Self {
        Self::new(404, msg, None)
    }

    pub fn unprocessable_entity<T: Into<String>>(msg: T) -> Self {
        Self::new(422, msg, None)
    }

    pub fn internal<T: Into<String>>(msg: T) -> Self {
        Self::new(500, msg, None)
    }
}

impl Default for ApiError {
    fn default() -> Self {
        Self::internal("Internal Server Error")
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(error: anyhow::Error) -> Self {
        Self {
            raw_error: Some(format!("{:#}", error)),
            ..ApiError::default()
        }
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
