use anyhow::{Context, Result};
use rocket::http::Status;
use rocket::response::{self, Responder};
use rocket::Response;
use roga::*;
use std::io::{BufRead, Cursor};
use std::process::{Child, Command, Stdio};
use std::sync::Arc;
use std::thread::spawn;
use tokio::sync::Mutex;

pub struct SSR {
    process: Option<Arc<Mutex<Child>>>,
    client: reqwest::Client,
    port: u16,
}

impl SSR {
    pub fn new(file: String, port: u16, logger: Logger) -> Self {
        if file.trim().is_empty() {
            return SSR {
                process: None,
                client: reqwest::Client::new(),
                port,
            };
        }

        let mut process = Command::new("node")
            .arg(file)
            .env("PORT", port.to_string())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| {
                l_error!(
                    logger.clone().with_label("Node.js"),
                    "Failed to start Node.js process: {}",
                    e
                );
                e
            })
            .unwrap();

        if let Some(stderr) = process.stderr.take() {
            spawn(move || {
                let reader = std::io::BufReader::new(stderr);
                reader.lines().for_each(|line| {
                    if let Ok(line) = line {
                        l_error!(logger.clone().with_label("Node.js"), "{}", line)
                    }
                });
            });
        }

        SSR {
            process: Some(Arc::new(Mutex::new(process))),
            client: reqwest::Client::new(),
            port,
        }
    }

    pub async fn render(&self, url: &str) -> Result<(Status, Vec<(String, String)>, Vec<u8>)> {
        if self.process.is_none() {
            return Ok((
                Status::NotFound,
                vec![("Content-Type".to_owned(), "text/plain".to_owned())],
                "404 Not found".as_bytes().to_vec(),
            ));
        }

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

        let body = response.bytes().await?.to_vec();

        Ok((status, headers, body))
    }
}

impl Drop for SSR {
    fn drop(&mut self) {
        if self.process.is_none() {
            return;
        }
        if let Ok(mut process) = self.process.as_ref().unwrap().try_lock() {
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

        for (name, value) in self.headers {
            response.raw_header(name, value);
        }

        response.ok()
    }
}
