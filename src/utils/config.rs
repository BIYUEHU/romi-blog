use anyhow::{Context, Result};
use config::{Config, File, FileFormat};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct RomiConfig {
    pub port: u16,
    pub database_url: String,
    pub ssr_entry: String,
    pub log_level: String,
}

pub fn load_config() -> Result<RomiConfig> {
    let config: RomiConfig = Config::builder()
        .add_source(File::new("romi.toml", FileFormat::Toml))
        .build()
        .context("Cannot find romi.toml at current directory")?
        .try_deserialize()
        .map_err(|e| anyhow::anyhow!("Failed to deserialize config: {}", e,))?;
    Ok(config)
}
