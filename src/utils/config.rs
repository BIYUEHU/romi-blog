use std::sync::OnceLock;

use anyhow::{Context, Result};
use config::{Config, File, FileFormat};
use roga::LoggerLevel;
use serde::Deserialize;

use crate::constant::CONFIG_FILE;

#[derive(Debug, Deserialize, Clone)]
pub struct RomiConfig {
    pub address: String,
    pub port: u16,
    pub database_url: String,
    pub ssr_entry: String,
    pub log_level: String,
}

static CONFIG: OnceLock<RomiConfig> = OnceLock::new();

pub fn load_config() -> Result<RomiConfig> {
    let current_dir = std::env::current_dir().context("Failed to get current directory")?;
    Ok(Config::builder()
        .add_source(File::new(
            current_dir.join(CONFIG_FILE).to_str().unwrap(),
            FileFormat::Toml,
        ))
        .build()
        .map_err(|e| {
            anyhow::anyhow!(
                "Cannot find {}at current directory: {}, error: {}",
                CONFIG_FILE,
                current_dir.display(),
                e
            )
        })?
        .try_deserialize()
        .map_err(|e| anyhow::anyhow!("Failed to deserialize config: {}", e,))
        .and_then(|config: RomiConfig| {
            let log_level = config.log_level.clone();
            let log_level_arr = [
                "fatal", "error", "warn", "info", "record", "debug", "trace", "silent",
            ];
            if log_level_arr.contains(&log_level.as_str()) {
                Ok(CONFIG.get_or_init(|| config).clone())
            } else {
                Err(anyhow::anyhow!(
                    "Invalid log level: {}. Expected one of: {}",
                    log_level,
                    log_level_arr.join(", ")
                ))
            }
        })?)
}

pub fn get_config() -> RomiConfig {
    CONFIG.get().expect("Config not initialized").clone()
}

pub fn get_logger_level() -> LoggerLevel {
    match get_config().log_level.as_str() {
        "fatal" => LoggerLevel::Fatal,
        "error" => LoggerLevel::Error,
        "warn" => LoggerLevel::Warn,
        "info" => LoggerLevel::Info,
        "record" => LoggerLevel::Record,
        "debug" => LoggerLevel::Debug,
        "trace" => LoggerLevel::Trace,
        _ => unreachable!(),
    }
}
