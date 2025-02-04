use rocket::request::{FromRequest, Outcome, Request};

#[derive(Debug)]
pub struct ClientInfo {
    pub ip: String,
    pub user_agent: String,
}

#[rocket::async_trait]
impl<'r> FromRequest<'r> for ClientInfo {
    type Error = ();

    async fn from_request(req: &'r Request<'_>) -> Outcome<Self, Self::Error> {
        let ip = req
            .client_ip()
            .map(|ip| ip.to_string())
            .unwrap_or_else(|| "unknown".to_string());

        let user_agent = req
            .headers()
            .get_one("User-Agent")
            .map(|s| s.to_string())
            .unwrap_or_else(|| "unknown".to_string());

        Outcome::Success(ClientInfo { ip, user_agent })
    }
}
