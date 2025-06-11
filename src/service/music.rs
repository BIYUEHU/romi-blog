use std::{
    fs::{read_to_string, write},
    path::Path,
    thread::spawn,
    time::{Duration, SystemTime},
};

use super::cache::Cache;
use crate::constant::{
    CACHE_DIR, MUSIC_CACHE_FILE, MUSIC_CACHE_TIMEOUT, MUSIC_MAX_ATTEMPTS, MUSIC_PLAYLIST_ID,
};
use anyhow::Context;
use fetcher::playlist::{fetch_playlist, Playlist};
use once_cell::sync::Lazy;
use roga::{transport::console::ConsoleTransport, *};
use serde::{Deserialize, Serialize};
use tokio::runtime::Runtime;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MusicCache {
    pub timestamp: u64,
    pub data: Playlist,
}

static MUSIC_CACHE: Lazy<tokio::sync::OnceCell<Cache<MusicCache>>> =
    Lazy::new(tokio::sync::OnceCell::new);

pub async fn get_music_cache() -> Result<MusicCache, anyhow::Error> {
    MUSIC_CACHE
        .get_or_init(|| async { Cache::new(Duration::from_secs(15 * 60)) })
        .await
        .get_or_update(|| async {
            let timestamp = SystemTime::now()
                .duration_since(SystemTime::UNIX_EPOCH)
                .context("Failed to get system time")?
                .as_secs();
            let path = Path::new(CACHE_DIR).join(MUSIC_CACHE_FILE);
            Ok(serde_json::from_str::<MusicCache>(
                read_to_string(path.clone())
                    .with_context(|| {
                        format!("Failed to read cache file: {}", path.to_string_lossy())
                    })?
                    .as_str(),
            )
            .map_err(|_| ())
            .and_then(|cache| {
                if cache.timestamp + MUSIC_CACHE_TIMEOUT > timestamp {
                    Ok(cache)
                } else {
                    Err(())
                }
            })
            .unwrap_or_else(move |_| {
                spawn(move || {
                    let logger = Logger::new()
                        .with_transport(ConsoleTransport {
                            use_color: true,
                            label_color: "red",
                            time_format: "%H:%M:%S",
                            template: "{time} {level} {labels}: {msg}",
                            label_template: "[{name}]",
                        })
                        .with_level(LoggerLevel::Info)
                        .with_label("Netease");
                    Runtime::new().unwrap().block_on(async {
                        if let Some(data) =
                            fetch_playlist(&logger, MUSIC_PLAYLIST_ID, MUSIC_MAX_ATTEMPTS).await
                        {
                            let data = MusicCache { timestamp, data };
                            write(
                                path.clone(),
                                serde_json::to_string(&data)
                                    .expect("Failed to music cache serialize data"),
                            )
                            .expect("Failed to write music cache file");
                            MUSIC_CACHE
                                .get()
                                .expect("Failed to get music cache instance")
                                .get_or_update(async || Ok(data))
                                .await
                                .expect("Failed to update music cache");
                        } else {
                            l_error!(logger, "Failed to fetch music cache");
                        }
                    });
                });
                MusicCache {
                    timestamp,
                    data: vec![],
                }
            }))
        })
        .await
}
