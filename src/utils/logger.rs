use crate::utils::config::get_logger_level;
use roga::*;
use transport::console::ConsoleTransport;

static LOGGER: std::sync::OnceLock<Logger> = std::sync::OnceLock::new();

pub fn get_logger() -> &'static Logger {
    LOGGER.get_or_init(|| {
        Logger::new()
            .with_transport(ConsoleTransport {
                label_color: "magenta",
                ..Default::default()
            })
            .with_level(get_logger_level())
    })
}
