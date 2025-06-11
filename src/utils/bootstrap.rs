use crate::constant::CACHE_DIR;
use dotenvy::dotenv;
use std::path::Path;

pub fn load_env_vars() -> Result<(), String> {
    if Path::new(".env").exists() {
        if let Err(e) = dotenv() {
            return Err(format!(
                "Failed to load environment variables from .env file: {}",
                e
            ));
        }
    }
    return Ok(());
}

pub fn set_env_var(key: &str, value: &str) {
    std::env::set_var(key, value);
}

pub fn init_dirs() -> Result<(), String> {
    if Path::new(CACHE_DIR).exists() {
        Ok(())
    } else {
        std::fs::create_dir(CACHE_DIR)
            .map_err(|e| format!("Failed to create cache directory: {}", e))
    }
}
