use axum::{extract::FromRequestParts, http::request::Parts};

#[derive(Debug)]
pub struct ClientInfo {
    pub ip: String,
    pub user_agent: String,
}

impl<S> FromRequestParts<S> for ClientInfo
where
    S: Send + Sync,
{
    type Rejection = ();

    async fn from_request_parts(parts: &mut Parts, _: &S) -> Result<Self, Self::Rejection> {
        Ok(Self {
            ip: parts
                .extensions
                .get::<axum::extract::ConnectInfo<std::net::SocketAddr>>()
                .map(|ci| ci.0.ip().to_string())
                .unwrap_or_else(|| "unknown".into()),
            user_agent: parts
                .headers
                .get("User-Agent")
                .and_then(|v| v.to_str().ok())
                .unwrap_or("unknown")
                .to_string(),
        })
    }
}
