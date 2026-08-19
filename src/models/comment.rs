use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqCommentData {
  pub pid: u32,
  pub text: String,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResCommentData {
  pub cid: u32,
  pub pid: u32,
  pub uid: u32,
  pub username: String,
  pub created: u32,
  pub text: String,
  #[serde(rename = "userUrl")]
  pub user_url: Option<String>,
  #[serde(rename = "avatarHash")]
  pub avatar_hash: String,
  pub status: u8,
}
