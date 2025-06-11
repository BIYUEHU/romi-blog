use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Serialize, Deserialize, TS, Debug)]
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
    pub hitokotos_count: u64,
    pub news_count: u64,
    pub seimgs_count: u64,
    pub version: String,
    pub os_info: String,
    pub home_dir: String,
    pub nodejs_version: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
struct ResProjectDataLicense {
    pub name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResProjectData {
    id: u64,
    name: String,
    description: Option<String>,
    html_url: String,
    homepage: Option<String>,
    language: Option<String>,
    stargazers_count: u64,
    forks_count: u64,
    topics: Vec<String>,
    created_at: String,
    updated_at: String,
    license: Option<ResProjectDataLicense>,
    archived: bool,
    visibility: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResMusicData {
    pub name: String,
    pub artist: String,
    pub url: String,
    pub cover: String,
    pub lrc: String,
}
