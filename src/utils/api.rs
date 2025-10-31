use axum::{
    Json,
    response::{IntoResponse, Response},
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
        Self { code, msg: msg.into(), raw_error }
    }

    pub fn bad_request<T: Into<String>>(msg: T) -> Self {
        Self::new(400, msg, None)
    }

    pub fn unauthorized<T: Into<String>>(msg: T) -> Self {
        Self::new(401, msg, None)
    }

    // pub fn forbidden<T: Into<String>>(msg: T) -> Self {
    //     Self::new(403, msg, None)
    // }

    pub fn not_found<T: Into<String>>(msg: T) -> Self {
        Self::new(404, msg, None)
    }

    // pub fn unprocessable_entity<T: Into<String>>(msg: T) -> Self {
    //     Self::new(422, msg, None)
    // }

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
        Self { raw_error: Some(format!("{:#}", error)), ..ApiError::default() }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        Response::builder()
            .status(self.code)
            .header("content-type", "application/json")
            .body(
                match serde_json::to_string(&self) {
                    Ok(b) => b,
                    Err(_) => {
                        format!(r#"{{"code":{},"msg":"{}"}}"#, self.code, "Internal Server Error")
                    }
                }
                .into(),
            )
            .unwrap()
    }
}

pub type ApiResult<T> = Result<Json<T>, ApiError>;

pub fn api_ok<T: Serialize>(data: T) -> ApiResult<T> {
    Ok(Json(data))
}
