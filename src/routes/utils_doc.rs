use utoipa::OpenApi;

use crate::models::{
  hitokoto::ResHitokotoData,
  utils::{
    QueryAgentData, QueryViewBadgeData, ResBingData, ResMcskinData, ResMotdData, ResViewData,
    ResWordsData,
  },
};

#[allow(dead_code)]
#[derive(OpenApi)]
#[openapi(
  info(
    title = "RomiChan Public Api",
    description = "Public, cross-origin-enabled endpoints. All requests are rate-limited per IP; exceeding the limit returns 429 Too Many Requests."
  ),
  paths(
    super::utils::agent_get,
    super::utils::agent_post,
    super::hitokoto::get_random,
    super::utils::motd,
    super::utils::motd_default_port,
    super::utils::motdbe,
    super::utils::motdbe_default_port,
    super::utils::mcskin,
    super::utils::qqavatar_default,
    super::utils::qqavatar_qid,
    super::utils::qqavatar_qid_size,
    super::utils::background_default,
    super::utils::background_id,
    super::utils::get_views,
    super::utils::post_views,
    super::utils::view_badge,
    super::utils::color_random,
    super::utils::color_rgb,
    super::utils::bing_redirect,
    super::utils::bing_json,
    super::utils::words_with_type,
    super::utils::words
  ),
  components(schemas(
    QueryAgentData,
    QueryViewBadgeData,
    ResViewData,
    ResMcskinData,
    ResBingData,
    ResMotdData,
    ResHitokotoData,
    ResWordsData
  ))
)]
struct UtilsApiDoc;

#[test]
fn export_utils_api_doc() {
  let json = UtilsApiDoc::openapi().to_pretty_json().expect("Failed to serialize UtilsApiDoc");
  std::fs::create_dir_all("client/public/api").unwrap();
  std::fs::write("client/public/api/openapi-utils.json", json).unwrap();
}
