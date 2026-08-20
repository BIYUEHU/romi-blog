use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqHitokotoData {
  pub msg: String,
  #[serde(rename = "msgOrigin")]
  pub msg_origin: Option<String>,
  pub from: Option<String>,
  #[serde(rename = "fromWho")]
  pub from_who: Option<String>,
  pub r#type: u8,
  pub likes: u32,
  pub public: bool,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResHitokotoData {
  pub uuid: String,
  pub msg: String,
  #[serde(rename = "msgOrigin")]
  pub msg_origin: Option<String>,
  pub from: Option<String>,
  #[serde(rename = "fromWho")]
  pub from_who: Option<String>,
  pub r#type: u8,
  pub likes: u32,
  pub public: bool,
  pub created: u64,
}
