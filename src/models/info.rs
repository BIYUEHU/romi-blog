use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Serialize, Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSettingsData {
    pub site_title: String,
    pub site_description: String,
    pub site_keywords: Vec<String>,
    pub site_name: String,
    // pub site_url: String,
    pub site_favicon: String,
    pub site_logo: String,
    // pub site_author: String,
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResDashboardData {
    pub posts_count: u64,
    pub categories_count: u64,
    pub tags_count: u64,
    pub comments_count: u64,
    pub users_count: u64,
    pub version: String,
    pub os_info: String,
    pub home_dir: String,
    pub nodejs_version: String,
}
