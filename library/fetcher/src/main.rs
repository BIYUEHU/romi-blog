use std::fs::write;

use fetcher::playlist::fetch_playlist;
use roga::{Logger, LoggerLevel, transport::console::ConsoleTransport};

#[tokio::main]
async fn main() {
    // fetch_videos(293767574, 10).await.unwrap();
    f().await;
}

async fn f() {
    let logger = Logger::new()
        .with_transport(ConsoleTransport {
            use_color: true,
            label_color: "blue",
            time_format: "%H:%M:%S",
            template: "{time} {level} {labels}: {msg}",
            label_template: "[{name}]",
        })
        .with_level(LoggerLevel::Info)
        .with_label("Netease");
    let results = fetch_playlist(&logger, 2653919517, 5).await;
    if let Some(results) = results {
        write("songs.json", serde_json::to_string(&results).unwrap()).unwrap();
    }
}
