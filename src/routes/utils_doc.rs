use utoipa::OpenApi;

use crate::models::{
  hitokoto::ResHitokotoData,
  utils::{
    QueryAgentData, QueryViewBadgeData, ResBingData, ResMcskinData, ResMotdData, ResViewData,
  },
};

#[allow(dead_code)]
#[derive(OpenApi)]
#[openapi(
  info(title = "RomiChan Public Api"),
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
    super::utils::bing_json
  ),
  components(schemas(
    QueryAgentData,
    QueryViewBadgeData,
    ResViewData,
    ResMcskinData,
    ResBingData,
    ResMotdData,
    ResHitokotoData
  ))
)]
struct UtilsApiDoc;

#[test]
fn export_utils_api_doc() {
  let json = UtilsApiDoc::openapi().to_pretty_json().expect("Failed to serialize UtilsApiDoc");
  std::fs::create_dir_all("client/public/api").unwrap();
  std::fs::write("client/public/api/openapi-utils.json", json).unwrap();
}
