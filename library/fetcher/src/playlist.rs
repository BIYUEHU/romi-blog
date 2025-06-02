use reqwest::header::{HeaderMap, HeaderValue, COOKIE, REFERER, USER_AGENT};
use reqwest::ClientBuilder;
use roga::*;
use serde::Serialize;
use serde_json::Value;
use std::thread::sleep;
use std::time::{Duration, Instant};

const COOKIES: &str = "";

#[derive(Debug, Serialize)]
pub struct SongInfo {
    name: String,
    artist: String,
    url: String,
    cover: String,
    lrc: String,
}

// TODO: 这里多定义返回数据结构体 别老是搁那 match 里面

pub type Playlist = Vec<SongInfo>;

fn extract_csrf_token(cookie: &str) -> String {
    cookie
        .split(";")
        .find(|s| s.trim_start().starts_with("__csrf="))
        .map(|s| s.trim().trim_start_matches("__csrf=").to_string())
        .unwrap_or_default()
}

pub async fn fetch_playlist(
    logger: &Logger,
    playlist_id: u64,
    max_attempt: u64,
) -> Option<Playlist> {
    let start = Instant::now();
    l_info!(logger, "Starting fetch playlist {}...", playlist_id);

    let csrf_token = extract_csrf_token(COOKIES);

    let playlist_url = if csrf_token.is_empty() {
        // l_warn!(logger, "CSRF token not found in cookies.");
        format!(
            "https://music.163.com/api/v3/playlist/detail?id={}",
            playlist_id
        )
    } else {
        format!(
            "https://music.163.com/api/v3/playlist/detail?id={}&csrf_token={}",
            playlist_id, csrf_token
        )
    };

    let mut headers = HeaderMap::new();
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64)"),
    );
    headers.insert(REFERER, HeaderValue::from_static("https://music.163.com"));
    if COOKIES.is_empty() {
        // l_warn!(logger, "Cookies is empty.");
    } else {
        headers.insert(
            COOKIE,
            match HeaderValue::from_str(COOKIES) {
                Ok(v) => v,
                Err(e) => {
                    l_error!(logger, "Failed to parse cookies: {}", e);
                    return None;
                }
            },
        );
    }

    let client = match ClientBuilder::new().default_headers(headers).build() {
        Ok(client) => client,
        Err(e) => {
            l_error!(logger, "Failed to build client: {}", e);
            return None;
        }
    };

    let res = match client.get(&playlist_url).send().await {
        Ok(r) => r,
        Err(e) => {
            l_error!(logger, "Failed to fetch playlist: {}", e);
            return None;
        }
    };
    let data = match res.json::<serde_json::Value>().await {
        Ok(v) => v,
        Err(e) => {
            l_error!(logger, "Failed to parse playlist response: {}", e);
            return None;
        }
    };
    let tracks = match data["playlist"]["trackIds"].as_array() {
        Some(arr) => arr,
        None => {
            l_error!(logger, "trackIds not found in response.");
            return None;
        }
    };

    let mut results = Vec::new();
    let total = tracks.len();
    l_info!(logger, "Total tracks: {}", total);

    for (index, track) in tracks.iter().enumerate() {
        let logger = logger
            .clone()
            .with_label(format!("{}/{}", index + 1, total));

        let id = match track["id"].as_i64() {
            Some(id) => id,
            None => {
                l_warn!(logger, "Failed to parse track id.");
                continue;
            }
        };

        let parse_song_info = async || -> Option<SongInfo> {
            let data = match client
                .get(&format!(
                    "https://music.163.com/api/song/detail/?id={}&ids=[{}]",
                    id, id
                ))
                .send()
                .await
            {
                Ok(res) => match res.json::<Value>().await {
                    Ok(v) => v,
                    Err(_) => {
                        l_warn!(logger, "Failed to parse song {} detail", id);
                        return None;
                    }
                },
                Err(_) => {
                    l_warn!(logger, "Request failed for song id {}", id);
                    return None;
                }
            };

            let data = match data["songs"].as_array().map(|arr| arr.first()) {
                Some(data) if data.is_some() => data.unwrap(),
                _ => {
                    l_warn!(logger, "Failed to find song {} detail", id);
                    return None;
                }
            };

            let name = data["name"].as_str().unwrap_or("").to_string();
            let artist = data["artists"]
                .as_array()
                .unwrap_or(&vec![])
                .first()
                .map(|obj| obj["name"].as_str().unwrap_or_default())
                .unwrap_or_default()
                .to_string();
            let cover = data["album"]["picUrl"]
                .as_str()
                .unwrap_or_default()
                .to_string();
            let url = format!("http://music.163.com/song/media/outer/url?id={}.mp3", id);

            let lrc = match client
                .get(&format!(
                    "https://music.163.com/api/song/lyric?id={}&lv=1&kv=1&tv=-1",
                    id
                ))
                .send()
                .await
            {
                Ok(resp) => match resp.json::<serde_json::Value>().await {
                    Ok(json) => json["lrc"]["lyric"].as_str().unwrap_or("").to_string(),
                    Err(_) => "".to_string(),
                },
                Err(_) => "".to_string(),
            };

            l_info!(logger, "Fetched {} - {} ({})", name, artist, id);
            Some(SongInfo {
                name,
                artist,
                url,
                cover,
                lrc,
            })
        };

        let mut attempt = 0;
        let mut success = false;
        while attempt < max_attempt {
            if success {
                break;
            }

            match parse_song_info().await {
                Some(song_info) => {
                    results.push(song_info);
                    success = true;
                }
                None => {
                    attempt += 1;
                    if attempt < max_attempt {
                        l_info!(
                            logger,
                            "Retrying song {} detail (attempt {}/{})",
                            id,
                            attempt + 1,
                            max_attempt
                        );
                        sleep(Duration::from_secs(1 + attempt));
                    } else {
                        l_error!(logger, "Failed to fetch song {} detail or parse detail", id,)
                    };
                }
            }
        }
    }

    let duration = start.elapsed();
    l_info!(
        logger,
        "Finished in {:.2?}. Total: {}, Success: {}",
        duration,
        total,
        results.len()
    );
    return Some(results);
}
