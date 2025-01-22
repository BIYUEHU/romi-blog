use anyhow::{Context, Result};
use logger::*;
use rocket::http::Status;
use rocket::response::{self, Responder};
use rocket::Response;
use std::io::{BufRead, Cursor};
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::thread;
use tokio::sync::Mutex;

pub struct SSR {
    process: Arc<Mutex<Child>>,
    client: reqwest::Client,
    port: u16,
}

impl SSR {
    pub fn new(file: &'static str, port: u16, logger: Logger) -> Self {
        let mut process = Command::new("node")
            .arg(file)
            .env("PORT", port.to_string())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .expect("Failed to start Node.js process");

        if let Some(stderr) = process.stderr.take() {
            thread::spawn(move || {
                let reader = std::io::BufReader::new(stderr);
                reader.lines().for_each(|line| {
                    if let Ok(line) = line {
                        l_error!(logger.clone().with_label("Node.js"), "{}", line);
                    }
                });
            });
        }

        SSR {
            process: Arc::new(Mutex::new(process)),
            client: reqwest::Client::new(),
            port,
        }
    }

    pub async fn render(&self, url: &str) -> Result<(Status, Vec<(String, String)>, Vec<u8>)> {
        let response = self
            .client
            .get(format!("http://localhost:{}/{}", self.port, url))
            .send()
            .await
            .context("Failed to send request to Node.js process")?;

        let status = Status::from_code(response.status().as_u16()).unwrap_or(Status::Ok);
        let headers: Vec<(String, String)> = response
            .headers()
            .iter()
            .filter_map(|(name, value)| Some((name.to_string(), value.to_str().ok()?.to_owned())))
            .collect();

        let body = response
            .bytes()
            .await
            .map_err(|e| anyhow::Error::from(e))?
            .to_vec();

        Ok((status, headers, body))
    }
}

impl Drop for SSR {
    fn drop(&mut self) {
        if let Ok(mut process) = self.process.try_lock() {
            let _ = process.kill();
        }
    }
}

pub struct SSRResponse {
    pub status: Status,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl<'r> Responder<'r, 'static> for SSRResponse {
    fn respond_to(self, _: &'r rocket::Request<'_>) -> response::Result<'static> {
        let mut response = Response::build();
        let response = response
            .status(self.status)
            .sized_body(self.body.len(), Cursor::new(self.body));

        // 添加 headers
        for (name, value) in self.headers {
            response.raw_header(name, value);
        }

        response.ok()
    }
}
