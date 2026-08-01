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

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqRegisterData {
  pub username: String,
  pub email: String,
  pub url: Option<String>,
}
#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResUserData {
  pub uid: u32,
  pub username: String,
  pub email: String,
  pub created: u32,
  #[serde(rename = "lastLogin")]
  pub last_login: u32,
  #[serde(rename = "isAdmin")]
  pub is_admin: bool,
  pub status: u8,
  pub url: Option<String>,
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqLoginData {
  pub email: String,
  pub password: String,
}
#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResLoginData {
  pub token: String,
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqProfileData {
  pub username: Option<String>,
  pub url: Option<String>,
  #[serde(rename = "oldPassword")]
  pub old_password: String,
  #[serde(rename = "newPassword")]
  pub new_password: Option<String>,
}
