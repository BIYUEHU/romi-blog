use serde::{Deserialize, Serialize};
use ts_rs::TS;
use utoipa::{IntoParams, ToSchema};

#[derive(Deserialize, TS, IntoParams, ToSchema)]
#[ts(export, export_to = "../client/output.ts")]
pub struct QueryAgentData {
  pub url: Option<String>,
  #[serde(rename = "type")]
  pub content_type: Option<String>,
  #[serde(rename = "headers")]
  pub headers: Option<String>,
}

#[derive(Deserialize, TS, ToSchema)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqAgentData {
  pub url: String,
  #[serde(rename = "type")]
  pub content_type: Option<String>,
  pub headers: Option<Vec<(String, String)>>,
  pub body: Option<String>,
}

#[derive(Deserialize, TS, IntoParams, ToSchema)]
#[ts(export, export_to = "../client/output.ts")]
pub struct QueryViewBadgeData {
  pub label: Option<String>,
  #[serde(rename = "color")]
  pub left_color: Option<String>,
  #[serde(rename = "labelColor")]
  pub right_color: Option<String>,
}

#[derive(Serialize, TS, ToSchema)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResViewData {
  pub slug: String,
  pub count: u32,
}
