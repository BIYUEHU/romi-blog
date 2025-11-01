use axum::{
    extract::{Request, State},
    middleware::Next,
    response::Response,
};
use roga::*;

use crate::{
    app::AppState,
    constant::NODEJS_LOGGER_LABEL,
    utils::http::{get_req_ip, get_req_user_agent},
};

fn setup_logger(logger: Logger, user_agent: Option<&str>) -> Logger {
    if user_agent == Some("node") { logger.with_label(NODEJS_LOGGER_LABEL) } else { logger }
}

pub async fn req_logger_middleware(
    State(AppState { logger, .. }): State<AppState>,
    req: Request,
    next: Next,
) -> Response {
    let uri = req.uri().to_string();
    let headers = req.headers();
    let user_agent = get_req_user_agent(headers);
    let ip = get_req_ip(headers).unwrap_or("unknown");

    let logger = setup_logger(logger, user_agent);

    l_record!(
        logger.clone().with_label("Req").with_label(req.method().to_string().to_uppercase()),
        "Calling {} with ip: {}, user_agent: {}",
        uri,
        ip,
        user_agent.unwrap_or("unknown")
    );

    next.run(req).await
}

pub async fn res_error_inspector_middleware(
    State(AppState { logger, .. }): State<AppState>,
    req: Request,
    next: Next,
) -> Response {
    let uri = req.uri().to_string();
    let logger = setup_logger(logger, get_req_user_agent(req.headers()));

    let res = next.run(req).await;

    if let Some(err) = res.extensions().get::<String>() {
        l_error!(logger, "Unknown: {}", err);
    }

    l_record!(logger.with_label("Res"), "Returnning {} with status: {}", uri, res.status());

    res
}
