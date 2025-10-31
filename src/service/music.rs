use std::{
    fs::{read_to_string, write},
    time::{SystemTime, UNIX_EPOCH},
};

use anyhow::{Context, Result};
use fetcher::playlist::{Playlist, SongInfo, fetch_playlist};
use roga::{transport::console::ConsoleTransport, *};
use serde::{Deserialize, Serialize};

use crate::{
    constant::{MUSIC_CACHE_FILE, MUSIC_CACHE_TIMEOUT, MUSIC_MAX_ATTEMPTS, MUSIC_PLAYLIST_ID},
    define_cache,
};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MusicCache {
    pub timestamp: u64,
    pub data: Playlist,
}

define_cache!(MUSIC_CACHE, MusicCache, MUSIC_CACHE_TIMEOUT);

pub async fn get_music_cache() -> Result<MusicCache> {
    MUSIC_CACHE
        .get_or_update(|| async {
            match try_load_cache().await {
                Ok(cached_data) => Ok(cached_data),
                Err(_) => {
                    spawn_cache_refresh();
                    Ok(create_empty_cache())
                }
            }
        })
        .await
}

async fn try_load_cache() -> Result<MusicCache> {
    let content = read_to_string(MUSIC_CACHE_FILE)
        .with_context(|| format!("Failed to read cache file: {}", MUSIC_CACHE_FILE))?;

    let cache: MusicCache = serde_json::from_str(&content).context("Failed to parse cache JSON")?;

    let current_time = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .context("Failed to get system time")?
        .as_secs();

    if cache.timestamp + MUSIC_CACHE_TIMEOUT <= current_time {
        anyhow::bail!("Cache expired");
    }

    Ok(cache)
}

fn spawn_cache_refresh() {
    tokio::spawn(async move {
        let logger = create_logger();

        if let Some(data) = fetch_playlist(&logger, MUSIC_PLAYLIST_ID, MUSIC_MAX_ATTEMPTS).await {
            match save_and_update_cache(data).await {
                Ok(_) => l_info!(logger, "Music cache refreshed successfully"),
                Err(e) => l_error!(logger, "Failed to save cache: {}", e),
            }
        } else {
            l_error!(logger, "Failed to fetch music data");
        }
    });
}

async fn save_and_update_cache(data: Vec<SongInfo>) -> Result<()> {
    let cache = MusicCache {
        timestamp: SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .context("Failed to get system time")?
            .as_secs(),
        data,
    };
    let json_data = serde_json::to_string(&cache).context("Failed to serialize cache data")?;
    write(MUSIC_CACHE_FILE, json_data).context("Failed to write cache file")?;
    MUSIC_CACHE.get_or_update(|| async { Ok(cache) }).await?;
    Ok(())
}

fn create_empty_cache() -> MusicCache {
    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();

    MusicCache { timestamp, data: vec![] }
}

fn create_logger() -> Logger {
    Logger::new()
        .with_transport(ConsoleTransport {
            use_color: true,
            label_color: "red",
            time_format: "%H:%M:%S",
            template: "{time} {level} {labels}: {msg}",
            label_template: "[{name}]",
        })
        .with_level(LoggerLevel::Info)
        .with_label("Netease")
}
