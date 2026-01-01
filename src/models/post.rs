use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqPostData {
    pub str_id: Option<String>,
    pub title: String,
    pub text: String,
    pub password: Option<String>,
    pub hide: bool,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
    pub banner: Option<String>,
    pub allow_comment: bool,
    pub created: u32,
    pub modified: u32,
}

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqDecryptPostData {
    pub password: String,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResPostData {
    pub id: u32,
    pub str_id: Option<String>,
    pub title: String,
    pub created: u32,
    pub modified: u32,
    pub summary: String,
    pub password: Option<String>,
    pub hide: bool,
    pub allow_comment: bool,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
    pub views: i32,
    pub likes: i32,
    pub comments: i32,
    pub banner: Option<String>,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResPostSingleDataRelatedPost {
    pub id: u32,
    pub str_id: Option<String>,
    pub title: String,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResPostSingleData {
    pub id: u32,
    pub str_id: Option<String>,
    pub title: String,
    pub created: u32,
    pub modified: u32,
    pub text: String,
    pub languages: Vec<String>,
    pub password: Option<String>,
    pub hide: bool,
    pub allow_comment: bool,
    pub tags: Vec<String>,
    pub categories: Vec<String>,
    pub views: i32,
    pub likes: i32,
    pub comments: i32,
    pub banner: Option<String>,
    pub prev: Option<ResPostSingleDataRelatedPost>,
    pub next: Option<ResPostSingleDataRelatedPost>,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResDecryptPostData {
    pub text: String,
    pub languages: Vec<String>,
}
