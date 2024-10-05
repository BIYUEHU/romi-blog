use rocket::{
    http::{ContentType, Status},
    response::{self, Responder},
    serde::json::Json,
    Request, Response,
};

#[derive(Debug, serde::Serialize)]
pub struct ReqErr {
    pub msg: String,
    pub code: u16,
}

impl Default for ReqErr {
    fn default() -> Self {
        Self {
            msg: "Internal Server Error".to_string(),
            code: 500,
        }
    }
}

impl<'r> Responder<'r, 'static> for ReqErr {
    fn respond_to(self, _: &'r Request<'_>) -> response::Result<'static> {
        // Convert object to json
        let body = serde_json::to_string(&self).unwrap();
        Response::build()
            .sized_body(body.len(), std::io::Cursor::new(body))
            .header(ContentType::JSON)
            .status(Status::new(self.code))
            .ok()
    }
}

pub type ReqResult<T> = Result<Json<T>, ReqErr>;

pub fn req_result_ok<T: serde::Serialize>(result: T) -> ReqResult<T> {
    Ok(Json(result))
}
