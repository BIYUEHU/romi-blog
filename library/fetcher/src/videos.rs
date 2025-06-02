use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::{error::Error, time::Duration};
use tokio::time::sleep;

#[derive(Debug, Serialize, Clone)]
pub struct Video {
    pub comment: u64,
    pub play: u64,
    pub pic: String,
    pub description: String,
    pub title: String,
    pub author: String,
    pub created: u64,
    pub aid: u64,
    pub bvid: String,
    pub length: String,
}

#[derive(Debug, Deserialize)]
struct ApiResponse {
    data: Data,
}

#[derive(Debug, Deserialize)]
struct Data {
    list: List,
}

#[derive(Debug, Deserialize)]
struct List {
    vlist: Vec<RawVideo>,
}

#[derive(Debug, Deserialize)]
struct RawVideo {
    stat: Stat,
    pic: String,
    desc: String,
    title: String,
    owner: Owner,
    pubdate: u64,
    aid: u64,
    bvid: String,
    length: String,
}

#[derive(Debug, Deserialize)]
struct Stat {
    reply: u64,
    view: u64,
}

#[derive(Debug, Deserialize)]
struct Owner {
    name: String,
}

pub async fn fetch_videos(uid: u64, max_attempts: usize) -> Result<Vec<Video>, Box<dyn Error>> {
    let client = Client::new();
    let url = format!(
        "https://api.bilibili.com/x/space/arc/search?mid={}&pn=1&ps=4&order=pubdate",
        uid
    );

    for attempt in 1..=max_attempts {
        let res = client.get(&url).send().await?;

        match res.json::<ApiResponse>().await {
            Ok(json) => {
                let result: Vec<Video> = json
                    .data
                    .list
                    .vlist
                    .into_iter()
                    .map(|raw| Video {
                        comment: raw.stat.reply,
                        play: raw.stat.view,
                        pic: raw.pic,
                        description: raw.desc,
                        title: raw.title,
                        author: raw.owner.name,
                        created: raw.pubdate,
                        aid: raw.aid,
                        bvid: raw.bvid,
                        length: raw.length,
                    })
                    .collect();
                return Ok(result);
            }
            Err(err) => {
                eprintln!(
                    "[attempt {}/{}] 请求失败：{}，10 秒后重试...",
                    attempt, max_attempts, err
                );
                sleep(Duration::from_secs(10)).await;
            }
        }
    }

    Err("达到最大重试次数，仍然无法获取数据".into())
}
