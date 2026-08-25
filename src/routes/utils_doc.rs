use utoipa::OpenApi;

use crate::models::utils::{QueryAgentData, QueryViewBadgeData, ResViewData};

#[allow(dead_code)]
#[derive(OpenApi)]
#[openapi(
  info(title = "RomiBlog Public Api"),
  paths(
    super::utils::qqavatar_default,
    super::utils::qqavatar_qid,
    super::utils::qqavatar_qid_size,
    super::utils::background_default,
    super::utils::background_id,
    super::utils::get_views,
    super::utils::post_views,
    super::utils::view_badge,
    super::utils::agent_get,
    super::utils::agent_post
  ),
  components(schemas(QueryAgentData, QueryViewBadgeData, ResViewData))
)]
struct UtilsApiDoc;

#[test]
fn export_utils_api_doc() {
  let json = UtilsApiDoc::openapi().to_pretty_json().expect("Failed to serialize UtilsApiDoc");
  std::fs::create_dir_all("client/public/api").unwrap();
  std::fs::write("client/public/api/openapi-utils.json", json).unwrap();
}
