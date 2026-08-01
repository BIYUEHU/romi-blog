use std::{
  fs::{read_to_string, write},
  time::{SystemTime, UNIX_EPOCH},
};

use anyhow::{Context, Result, anyhow};
use roga::{transport::console::ConsoleTransport, *};
use serde::{Deserialize, Serialize};

use crate::{
  constant::{MUSIC_CACHE_FILE, MUSIC_CACHE_TIMEOUT, MUSIC_PLAYLIST_ID},
  define_cache,
};

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct SongInfo {
  pub name: String,
  pub artist: String,
  pub url: String,
  pub cover: String,
  pub lrc: String,
}

pub type Playlist = Vec<SongInfo>;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct MusicCache {
  pub timestamp: u64,
  pub data: Playlist,
}

define_cache!(MUSIC_CACHE, MusicCache, MUSIC_CACHE_TIMEOUT);

#[derive(Debug, Deserialize)]
struct OriginPlaylistResponse {
  playlist: OriginPlaylistData,
}

#[derive(Debug, Deserialize)]
struct OriginPlaylistData {
  #[serde(rename = "trackIds")]
  track_ids: Vec<OriginTrackData>,
}
#[derive(Debug, Deserialize)]
struct OriginTrackData {
  id: u64,
}

#[derive(Debug, Deserialize)]
struct OriginSongDetailResponse {
  songs: Vec<OriginSongData>,
}

#[derive(Debug, Deserialize)]
struct OriginSongData {
  name: String,
  id: u64,
  #[serde(rename = "ar")]
  artists: Vec<OriginArtistData>,
  #[serde(rename = "al")]
  album: OriginAlbumData,
}

#[derive(Debug, Deserialize)]
struct OriginArtistData {
  name: String,
}

#[derive(Debug, Deserialize)]
struct OriginAlbumData {
  #[serde(rename = "picUrl")]
  pic_url: String,
}
#[derive(Debug, Deserialize)]
struct OriginLrcResponse {
  lrc: OriginLrcData,
}

#[derive(Debug, Deserialize)]
struct OriginLrcData {
  lyric: String,
}

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

  let current_time =
    SystemTime::now().duration_since(UNIX_EPOCH).context("Failed to get system time")?.as_secs();

  if cache.timestamp + MUSIC_CACHE_TIMEOUT <= current_time {
    anyhow::bail!("Cache expired");
  }

  Ok(cache)
}

fn spawn_cache_refresh() {
  tokio::spawn(async move {
    let logger = create_logger();

    match fetch_playlist().await {
      Ok(data) => {
        if let Err(e) = save_and_update_cache(data).await {
          l_error!(logger, "Failed to save cache: {}", e);
        } else {
          l_info!(logger, "Music cache refreshed successfully");
        }
      }
      Err(e) => l_error!(logger, "Failed to fetch music data: {}", e),
    }
  });
}

async fn save_and_update_cache(data: Playlist) -> Result<()> {
  let cache = MusicCache {
    timestamp: SystemTime::now()
      .duration_since(UNIX_EPOCH)
      .context("Failed to get system time")?
      .as_secs(),
    data,
  };
  let json_data = serde_json::to_string(&cache).context("Failed to serialize cache data")?;
  write(MUSIC_CACHE_FILE, json_data).context("Failed to write cache file")?;
  MUSIC_CACHE.update(cache).await;
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

async fn fetch_playlist() -> Result<Playlist> {
  let client = reqwest::Client::new();

  let playlist_resp: OriginPlaylistResponse = client
    .post(format!(
      "https://music.163.com/api/v6/playlist/detail?id={}&n=100000&s=8",
      MUSIC_PLAYLIST_ID
    ))
    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    .header("referer", "https://music.163.com")
    .send()
    .await
    .context("Failed to fetch playlist")?
    .json()
    .await
    .context("Failed to parse playlist response")?;

  let track_ids: Vec<u64> = playlist_resp.playlist.track_ids.into_iter().map(|t| t.id).collect();
  if track_ids.is_empty() {
    return Err(anyhow!("No tracks found in playlist"));
  }

  let c_param = track_ids.iter().map(|id| serde_json::json!({"id": id})).collect::<Vec<_>>();

  let response_text = client
    .post("https://music.163.com/api/v3/song/detail")
    .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
    .header("referer", "https://music.163.com")
    .form(&[("c", serde_json::to_string(&c_param).context("Failed to serialize song ids")?)])
    .send()
    .await
    .context("Failed to fetch song details")?
    .text()
    .await
    .context("Failed to get song details response text")?;

  let song_resp: OriginSongDetailResponse = serde_json::from_str(&response_text)
    .with_context(|| format!("Failed to parse song details: {}", response_text))?;

  let mut results = Vec::with_capacity(song_resp.songs.len());

  for song in song_resp.songs {
    let name = song.name;
    let artist = song.artists.first().map(|a| a.name.clone()).unwrap_or_default();
    let cover = song.album.pic_url;
    let url = format!("http://music.163.com/song/media/outer/url?id={}.mp3", song.id);

    let lrc = fetch_lyric(&client, song.id).await.unwrap_or_default();

    results.push(SongInfo { name, artist, url, cover, lrc });
  }

  Ok(results)
}

async fn fetch_lyric(client: &reqwest::Client, song_id: u64) -> Result<String> {
  let resp: OriginLrcResponse = client
    .get(format!("https://music.163.com/api/song/lyric?id={}&lv=1&kv=1&tv=-1", song_id))
    .send()
    .await
    .context("Failed to fetch lyric")?
    .json()
    .await
    .context("Failed to parse lyric")?;

  Ok(resp.lrc.lyric)
}
