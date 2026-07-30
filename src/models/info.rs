use serde::{Deserialize, Serialize};
use ts_rs::TS;

#[derive(Clone, Serialize, Deserialize, TS, Debug)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSettingsDataHomeLink(String, String, Option<String>);

#[derive(Clone, Serialize, Deserialize, TS, Debug)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSettingsDataIndependentPage {
  pub name: String,
  pub title: String,
  pub id: u32,
  pub routine: bool,
  #[serde(rename = "hideToc")]
  pub hide_toc: bool,
  #[serde(rename = "hideComments")]
  pub hide_comments: bool,
  pub template: String,
}

#[derive(Clone, Serialize, Deserialize, TS, Debug)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSettingsDataFriendLink {
  pub name: String,
  pub link: String,
  pub avatar: String,
  pub description: String,
}

#[derive(Clone, Serialize, Deserialize, TS, Debug)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSettingsData {
  #[serde(rename = "siteTitle")]
  pub site_title: String,
  #[serde(rename = "siteDescription")]
  pub site_description: String,
  #[serde(rename = "siteKeywords")]
  pub site_keywords: String,
  #[serde(rename = "siteName")]
  pub site_name: String,
  #[serde(rename = "siteFavicon")]
  pub site_favicon: String,
  #[serde(rename = "siteLogo")]
  pub site_logo: String,
  #[serde(rename = "siteUrl")]
  pub site_url: String,
  #[serde(rename = "headerBackground")]
  pub header_background: String,
  #[serde(rename = "homeAvatar")]
  pub home_avatar: String,
  #[serde(rename = "homeTitle")]
  pub home_title: String,
  #[serde(rename = "homeSubtitle")]
  pub home_subtitle: String,
  #[serde(rename = "homeLinks")]
  pub home_links: Vec<ResSettingsDataHomeLink>,
  #[serde(rename = "independentPages")]
  pub independent_pages: Vec<ResSettingsDataIndependentPage>,
  pub links: Vec<ResSettingsDataFriendLink>,
}

#[derive(Clone, Serialize, Deserialize, TS, Debug)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSmtpSettings {
  #[serde(rename = "smtpHost")]
  pub smtp_host: String,
  #[serde(rename = "smtpPort")]
  pub smtp_port: u16,
  #[serde(rename = "smtpUsername")]
  pub smtp_username: String,
  #[serde(rename = "smtpPassword")]
  pub smtp_password: String,
  #[serde(rename = "adminEmail")]
  pub admin_email: String, // TODO
}

#[derive(Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResDashboardData {
  #[serde(rename = "postsCount")]
  pub posts_count: u64,
  #[serde(rename = "categoriesCount")]
  pub categories_count: u64,
  #[serde(rename = "tagsCount")]
  pub tags_count: u64,
  #[serde(rename = "commentsCount")]
  pub comments_count: u64,
  #[serde(rename = "usersCount")]
  pub users_count: u64,
  #[serde(rename = "hitokotosCount")]
  pub hitokotos_count: u64,
  #[serde(rename = "newsCount")]
  pub news_count: u64,
  #[serde(rename = "seimgsCount")]
  pub seimgs_count: u64,
  pub version: String,
  #[serde(rename = "osInfo")]
  pub os_info: String,
  #[serde(rename = "homeDir")]
  pub home_dir: String,
  #[serde(rename = "nodejsVersion")]
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
  pub id: u32,
  pub name: String,
  pub description: Option<String>,
  pub html_url: String,
  pub homepage: Option<String>,
  pub language: Option<String>,
  pub stargazers_count: u32,
  pub forks_count: u32,
  pub topics: Vec<String>,
  pub created_at: String,
  pub updated_at: String,
  pub license: Option<ResProjectDataLicense>,
  pub archived: bool,
  pub visibility: String,
}

// #[derive(Clone, Debug, Deserialize, Serialize, TS)]
// #[ts(export, export_to = "../client/output.ts")]
// pub struct ResBangumiData {
//   pub name: String,
//   pub tags: Vec<String>,
//   pub image: String,
//   pub summary: String,
//   pub eps: Option<u32>,
//   pub date: String,
// }

// #[derive(Clone, Debug, Deserialize, Serialize, TS)]
// pub struct OriginBangumiData {
//   pub data: Vec<OriginBangumiDataItem>,
//   pub total: u32,
// }

// #[derive(Clone, Debug, Deserialize, Serialize, TS)]
// pub struct OriginBangumiDataItem {
//   #[serde(rename = "subjectId")]
//   pub subject_id: u32,
//   pub tags: Vec<String>,
//   pub subject: OriginBangumiSubject,
// }

// #[derive(Clone, Debug, Deserialize, Serialize, TS)]
// pub struct OriginBangumiSubject {
//   pub name: String,
//   pub images: OriginBangumiSubjectImages,
//   #[serde(rename = "shortSummary")]
//   pub short_summary: String,
//   pub eps: Option<u32>,
//   pub date: String,
// }

// #[derive(Clone, Debug, Deserialize, Serialize, TS)]
// pub struct OriginBangumiSubjectImages {
//   pub medium: String,
// }

#[derive(Clone, Debug, Deserialize, Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResMusicData {
  pub name: String,
  pub artist: String,
  pub url: String,
  pub cover: String,
  pub lrc: String,
}

#[derive(Debug, Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSearchResultItem {
  pub pid: u32,
  pub str_id: Option<String>,
  pub title: String,
  pub modified: u32,
  pub summary: String,
}

#[derive(Debug, Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqSearchQuery {
  pub q: String,
  #[serde(default = "default_page")]
  pub page: u32,
  #[serde(default = "default_per_page")]
  pub per_page: u32,
}

fn default_page() -> u32 {
  1
}
fn default_per_page() -> u32 {
  20
}

#[derive(Debug, Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqContactForm {
  pub name: String,
  pub email: String,
  pub message: String,
}
