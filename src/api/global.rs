use rocket::{http::Status, State};

use crate::utils::ssr::{SSRResponse, SSR};

#[get("/<path..>", rank = 99)]
pub async fn ssr_handler(
    path: std::path::PathBuf,
    ssr: &State<SSR>,
) -> Result<SSRResponse, Status> {
    let url = path.to_str().unwrap_or("");
    match ssr.render(url).await {
        Ok((status, headers, body)) => Ok(SSRResponse {
            status,
            headers,
            body,
        }),
        Err(e) => {
            eprintln!("SSR Error for {}: {:?}", url, e);
            Err(Status::InternalServerError)
        }
    }
}
