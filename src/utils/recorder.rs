use super::config::RomiConfig;
use crate::{
    guards::client_info::ClientInfo,
    utils::api::{ApiError, ApiErrorReal},
};
use rocket::{
    fairing::{Fairing, Info, Kind, Result},
    request::{FromRequest, Outcome},
    Build, Data, Orbit, Request, Response, Rocket,
};
use roga::*;
use std::io;

#[derive(Clone)]
pub struct Recorder {
    logger: Logger,
    config: RomiConfig,
}

impl Recorder {
    pub fn new(logger: Logger, config: RomiConfig) -> Self {
        Self { logger, config }
    }
}

#[rocket::async_trait]
impl Fairing for Recorder {
    fn info(&self) -> Info {
        Info {
            name: "Request Logger",
            kind: Kind::Ignite | Kind::Shutdown | Kind::Request | Kind::Response,
        }
    }

    async fn on_ignite(&self, rocket: Rocket<Build>) -> Result {
        l_info!(
            &self.logger,
            "Server launched at http://localhost:{} successfully",
            self.config.port
        );
        if !self.config.ssr_entry.trim().is_empty() {
            l_info!(
                &self.logger,
                "SSR launched at http://localhost:{} successfully",
                self.config.port + 1
            );
        }
        Ok(rocket)
    }

    async fn on_request(&self, req: &mut Request<'_>, _: &mut Data<'_>) {
        let (ip, user_agent) = match ClientInfo::from_request(req).await {
            Outcome::Success(client_info) => (client_info.ip, client_info.user_agent),
            _ => ("unknown".to_string(), "unknown".to_string()),
        };

        l_record!(
            self.logger
                .clone()
                .with_label("Request")
                .with_label(req.method().to_string().to_uppercase()),
            "Calling {} with ip: {}, user_agent: {}",
            req.uri(),
            ip,
            user_agent
        );
    }

    async fn on_response<'r>(&self, req: &'r Request<'_>, res: &mut Response<'r>) {
        let body = res
            .body_mut()
            .to_string()
            .await
            .map(|body| {
                if !body.contains("raw_error") {
                    return body;
                }
                if let Ok(ApiError {
                    raw_error,
                    code,
                    msg,
                }) = serde_json::from_str::<ApiError>(&body)
                {
                    l_error!(self.logger.clone(), raw_error.unwrap_or(msg.clone()));
                    serde_json::to_string(&ApiErrorReal { code, msg }).unwrap_or("".into())
                } else {
                    body
                }
            })
            .unwrap_or("".into());

        l_record!(
            self.logger.clone().with_label("Response"),
            "Returnning {} with status: {}",
            req.uri(),
            res.status()
        );
        res.set_sized_body(body.len(), io::Cursor::new(body));
    }

    async fn on_shutdown(&self, _rocket: &Rocket<Orbit>) {
        l_warn!(&self.logger, "Server are shutting down...");
    }
}
