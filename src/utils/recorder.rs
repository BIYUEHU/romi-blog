use rocket::{
    fairing::{Fairing, Info, Kind, Result},
    Build, Data, Orbit, Request, Response, Rocket,
};
use roga::*;

use super::config::RomiConfig;

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
        l_record!(
            self.logger
                .clone()
                .with_label("Request")
                .with_label(req.method().to_string().to_uppercase()),
            "Calling {} with headers: {:?}",
            req.uri(),
            req.headers()
        );
    }

    async fn on_response<'r>(&self, req: &'r Request<'_>, res: &mut Response<'r>) {
        l_record!(
            self.logger.clone().with_label("Response"),
            "Returnning {} with status: {}",
            req.uri(),
            res.status()
        );
    }

    async fn on_shutdown(&self, _rocket: &Rocket<Orbit>) {
        l_warn!(&self.logger, "Server are shutting down...");
    }
}
