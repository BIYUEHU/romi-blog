use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqUserData {
    pub username: String,
    pub password: String,
    pub email: String,
    pub url: Option<String>,
    pub status: u8,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResUserData {
    pub uid: u32,
    pub username: String,
    pub email: String,
    pub created: u32,
    pub last_login: u32,
    pub is_admin: bool,
    pub status: u8,
    pub url: Option<String>,
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct LoginResponse {
    pub token: String,
}
