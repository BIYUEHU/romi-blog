use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::fs;

#[derive(Deserialize)]
struct InputRootFather {
    data: InputRoot,
}

#[derive(Deserialize)]
struct InputRoot {
    playlist: InputResult,
}

#[derive(Deserialize)]
struct InputResult {
    tracks: Vec<InputTrack>,
}

#[derive(Deserialize)]
struct InputTrack {
    name: String,
    id: i64,
    ar: Vec<Artist>,
    al: Album,
}

#[derive(Deserialize)]
struct Artist {
    name: String,
}

#[derive(Deserialize)]
struct Album {
    #[serde(rename = "picUrl")]
    pic_url: String,
}

// Output JSON structure
#[derive(Serialize)]
struct OutputTrack {
    name: String,
    artist: String,
    url: String,
    cover: String,
    lrc: String,
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let input_data = fs::read_to_string("../../client/public/data/music_raw.json")?;
    let input: InputRootFather = serde_json::from_str(&input_data)?;

    let client = Client::new();
    let mut output_tracks = Vec::new();

    for track in input.data.playlist.tracks {
        let id = track.id;
        let music_url = format!("http://music.163.com/song/media/outer/url?id={}.mp3", id);

        let lyric = match get_lyric(&client, id).await {
            Ok(lyric) => lyric,
            Err(_) => String::new(),
        };

        let output_track = OutputTrack {
            name: track.name,
            artist: track.ar.first().map_or(String::new(), |a| a.name.clone()),
            url: music_url,
            cover: track.al.pic_url,
            lrc: lyric,
        };
        println!(
            "Get track: {}, name: {}, artist: {},  had lrc: {}",
            id,
            output_track.name,
            output_track.artist,
            output_track.lrc.len() > 0
        );

        output_tracks.push(output_track);
    }

    println!("Get {} tracks", output_tracks.len());

    let output_json = serde_json::to_string_pretty(&output_tracks)?;
    fs::write("../../client/public/data/music.json", output_json)?;

    Ok(())
}

async fn get_lyric(client: &Client, song_id: i64) -> Result<String, reqwest::Error> {
    Ok(client
        .get(format!("https://api.hotaru.icu/api/netease?id={}", song_id))
        .send()
        .await?
        .text()
        .await?)
}
