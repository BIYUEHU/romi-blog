use std::{env, fs, path::Path};

use anyhow::{Context, Result};
use config::{Config, File, FileFormat};
use dotenvy::dotenv;
use http::Method;
use tower_http::cors::{Any, CorsLayer};

use crate::{
    app::RomiConfig,
    constant::{CONFIG_FILE, DATA_DIR},
};

pub fn load_env_vars() -> Result<(), String> {
    if Path::new(".env").exists() {
        if let Err(e) = dotenv() {
            return Err(format!("Failed to load environment variables from .env file: {}", e));
        }
    }
    return Ok(());
}

pub fn initialize_directories() -> Result<(), String> {
    if !Path::new(DATA_DIR).exists() {
        fs::create_dir(DATA_DIR).map_err(|e| format!("Failed to create data directory: {}", e))?;
    }

    Ok(())
}

pub fn get_cors() -> CorsLayer {
    CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS, Method::PUT, Method::DELETE])
        .allow_headers(Any)
    // .allow_credentials(true)
}

pub fn load_config() -> Result<RomiConfig> {
    let current_dir = env::current_dir().context("Failed to get current directory")?;
    Ok(Config::builder()
        .add_source(File::new(current_dir.join(CONFIG_FILE).to_str().unwrap(), FileFormat::Toml))
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
        .map_err(|e| anyhow::anyhow!("Failed to deserialize config: {}", e,))?)
}
