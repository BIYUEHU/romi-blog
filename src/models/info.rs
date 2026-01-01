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
pub struct ResProjectDataLicense {
    pub name: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResProjectData {
    pub id: u64,
    pub name: String,
    pub description: Option<String>,
    pub html_url: String,
    pub homepage: Option<String>,
    pub language: Option<String>,
    pub stargazers_count: u64,
    pub forks_count: u64,
    pub topics: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub license: Option<ResProjectDataLicense>,
    pub archived: bool,
    pub visibility: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResBangumiData {
    // origin_id: u64,
    pub name: String,
    pub tags: Vec<String>,
    pub image: String,
    pub summary: String,
    pub eps: Option<u64>,
    pub date: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
pub struct OriginBangumiData {
    pub data: Vec<OriginBangumiDataItem>,
    pub total: u64,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
pub struct OriginBangumiDataItem {
    pub subject_id: u64,
    pub tags: Vec<String>,
    pub subject: OriginBangumiSubject,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
pub struct OriginBangumiSubject {
    pub name: String,
    pub images: OriginBangumiSubjectImages,
    pub short_summary: String,
    pub eps: Option<u64>,
    pub date: String,
}

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
pub struct OriginBangumiSubjectImages {
    pub medium: String,
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
