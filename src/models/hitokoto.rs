use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqHitokotoData {
    pub msg: String,
    pub from: String,
    pub r#type: u32,
    pub is_public: bool,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResHitokotoData {
    pub id: u32,
    pub msg: String,
    pub from: String,
    pub r#type: u32,
    pub likes: i32,
    pub is_public: bool,
}
