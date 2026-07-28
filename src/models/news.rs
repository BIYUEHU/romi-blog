use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqNewsData {
  pub created: u32,
  pub modified: u32,
  pub text: String,
  pub private: bool,
  pub imgs: Vec<String>,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResNewsData {
  pub id: u32,
  pub created: u32,
  pub modified: u32,
  pub text: String,
  pub private: bool,
  pub views: u32,
  pub likes: u32,
  pub comments: u32,
  pub imgs: Vec<String>,
}
