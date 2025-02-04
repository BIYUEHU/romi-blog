use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqMetaData {
    pub name: String,
    pub is_category: bool,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResMetaData {
    pub mid: u32,
    pub name: String,
    pub count: i32,
    pub is_category: bool,
}
