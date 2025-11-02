use serde::Deserialize;
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct QueryAgent {
    pub url: Option<String>,
    #[serde(rename = "type")]
    pub content_type: Option<String>,
}
