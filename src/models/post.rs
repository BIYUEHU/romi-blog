use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqPostData {
    pub title: String,
    pub text: String,
    pub password: String,
    pub hide: bool,
    pub allow_comment: bool,
    pub created: u32,
    pub modified: u32,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResPostData {
    pub id: u32,
    pub title: String,
    pub summary: String,
    pub created: u32,
    pub banner: Option<String>,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
    pub views: i32,
    pub likes: i32,
    pub comments: i32,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResPostSingleData {
    pub id: u32,
    pub title: String,
    pub created: u32,
    pub modified: u32,
    pub text: String,
    pub password: bool,
    pub hide: bool,
    pub allow_comment: bool,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
    pub views: i32,
    pub likes: i32,
    pub comments: i32,
    pub banner: Option<String>,
}
