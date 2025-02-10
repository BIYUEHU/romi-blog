use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqNewsData {
    pub created: u32,
    pub modified: u32,
    pub text: String,
    pub hide: String,
    pub imgs: Vec<String>,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResNewsData {
    pub created: u32,
    pub modified: u32,
    pub text: String,
    pub hide: String,
    pub views: i32,
    pub likes: i32,
    pub comments: i32,
    pub imgs: Vec<String>,
}
