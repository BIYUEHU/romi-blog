use logger::*;
use rocket::{
    fairing::{Fairing, Info, Kind},
    Data, Request, Response,
};

#[derive(Clone)]
pub struct RequestLogger {
    logger: Logger,
}

impl RequestLogger {
    pub fn new(logger: Logger) -> Self {
        Self { logger }
    }
}

#[rocket::async_trait]
impl Fairing for RequestLogger {
    fn info(&self) -> Info {
        Info {
            name: "Request Logger",
            kind: Kind::Request | Kind::Response,
        }
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
}
