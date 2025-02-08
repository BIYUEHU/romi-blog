use anyhow::{Context, Result};
use config::{Config, File, FileFormat};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct RomiConfig {
    pub address: String,
    pub port: u16,
    pub database_url: String,
    pub ssr_entry: String,
    pub log_level: String,
}

pub fn load_config() -> Result<RomiConfig> {
    let current_dir = std::env::current_dir().context("Failed to get current directory")?;
    let config: RomiConfig = Config::builder()
        .add_source(File::new(
            current_dir.join("romi.toml").to_str().unwrap(),
            FileFormat::Toml,
        ))
        .build()
        .map_err(|e| {
            anyhow::anyhow!(
                "Cannot find romi.toml at current directory: {}, error: {}",
                current_dir.display(),
                e
            )
        })?
        .try_deserialize()
        .map_err(|e| anyhow::anyhow!("Failed to deserialize config: {}", e,))?;
    Ok(config)
}
