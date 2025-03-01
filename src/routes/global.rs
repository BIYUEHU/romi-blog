use crate::utils::ssr::{SSRResponse, SSR};
use rocket::{http::Status, State};
use roga::*;

#[get("/<path..>", rank = 99)]
pub async fn ssr_handler(
    path: std::path::PathBuf,
    ssr: &State<SSR>,
    logger: &State<Logger>,
) -> Result<SSRResponse, Status> {
    Ok(ssr.render(path.to_str().unwrap_or("")).await.map_err(|e| {
        l_error!(logger, "SSR render error: {}", e);
        Status::InternalServerError
    })?)
}
