use crate::utils::ssr::{SSRResponse, SSR};
use rocket::{http::Status, State};
use roga::*;

#[get("/<path..>", rank = 99)]
pub async fn ssr_handler(
    path: std::path::PathBuf,
    ssr: &State<SSR>,
    logger: &State<Logger>,
) -> Result<SSRResponse, Status> {
    let url = path.to_str().unwrap_or("");
    Ok(ssr.render(url).await.map_err(|e| {
        l_error!(logger, "SSR render error: {}", e);
        Status::InternalServerError
    })?)
}
