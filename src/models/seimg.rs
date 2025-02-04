use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqSeimgData {
    pub pixiv_pid: u32,
    pub pixiv_uid: u32,
    pub title: String,
    pub author: String,
    pub r18: bool,
    pub tags: Vec<String>,
    pub width: u32,
    pub height: u32,
    pub r#type: String,
    pub url: String,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSeimgData {
    pub pid: u32,
    pub uid: u32,
    pub title: String,
    pub author: String,
    pub r18: bool,
    pub tags: Vec<String>,
    pub width: u32,
    pub height: u32,
    pub r#type: String,
    pub url: String,
}
