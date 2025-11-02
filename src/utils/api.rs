use axum::{
    Json,
    response::{IntoResponse, Response},
};
use http::StatusCode;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize, Serialize)]
pub struct ApiError {
    pub code: u16,
    pub msg: String,
    raw_error: Option<String>,
}

impl ApiError {
    pub fn new<T: Into<String>>(code: u16, msg: T) -> Self {
        Self { code, msg: msg.into(), raw_error: None }
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

    // pub fn unprocessable_entity<T: Into<String>>(msg: T) -> Self {
    //     Self::new(422, msg)
    // }

    pub fn internal<T: Into<String>>(error: T) -> Self {
        Self { code: 500, msg: "Internal Server Error".to_string(), raw_error: Some(error.into()) }
    }

    pub fn bad_gateway<T: Into<String>>(msg: T) -> Self {
        Self::new(502, msg)
    }
}

impl From<anyhow::Error> for ApiError {
    fn from(error: anyhow::Error) -> Self {
        Self::internal(format!("{:#}", error))
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let mut res = (
            StatusCode::from_u16(self.code).unwrap_or(StatusCode::INTERNAL_SERVER_ERROR),
            Json(serde_json::json!({
                "code": self.code,
                "msg": self.msg,
            })),
        )
            .into_response();
        if let Some(raw_error) = self.raw_error {
            res.extensions_mut().insert(raw_error);
        }
        res
    }
}

pub type ApiResult<T = ()> = Result<Json<T>, ApiError>;

pub fn api_ok<T: Serialize>(data: T) -> ApiResult<T> {
    Ok(Json(data))
}
