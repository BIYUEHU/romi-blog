use std::{
    io::{BufRead, BufReader},
    process::{Child, Command, Stdio},
    sync::Arc,
    thread::{self, spawn},
    time::Duration,
};

use anyhow::{Context, Result};
use axum::response::{IntoResponse, Response};
use http::StatusCode;
use reqwest::Client;
use roga::*;
use tokio::sync::Mutex;

use crate::constant::NODEJS_LOGGER_LABEL;

#[derive(Clone)]
pub struct SSR {
    process: Option<Arc<Mutex<Child>>>,
    client: Client,
    port: u16,
}

impl SSR {
    pub fn new(file: String, port: u16, logger: Logger) -> Self {
        if file.trim().is_empty() {
            return SSR {
                process: None,
                client: Client::builder()
                    .pool_max_idle_per_host(5)
                    .timeout(Duration::from_secs(30))
                    .build()
                    .unwrap_or_default(),
                port,
            };
        }

        let mut process = Command::new("node")
            .arg(file.clone())
            .env("PORT", port.to_string())
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| {
                l_error!(
                    logger.clone().with_label(NODEJS_LOGGER_LABEL),
                    "Failed to start Node.js process: {}",
                    e
                );
                e
            })
            .unwrap();

        l_info!(logger, "SSR launched ➜ http://127.0.0.1:{}", port);
        l_info!(logger, "Node.js process ID: {}", process.id());

        thread::sleep(Duration::from_secs(1));

        if let Some(stderr) = process.stderr.take() {
            let logger = logger.clone();
            spawn(move || {
                let reader = BufReader::new(stderr);
                reader.lines().for_each(|line| {
                    if let Ok(line) = line {
                        l_error!(logger.clone().with_label(NODEJS_LOGGER_LABEL), "{}", line)
                    }
                });
            });
        }

        SSR {
            process: Some(Arc::new(Mutex::new(process))),
            client: Client::builder().timeout(Duration::from_secs(30)).build().unwrap_or_default(),
            port,
        }
    }

    pub fn is_running(&self) -> bool {
        self.process.is_some()
    }

    pub async fn render(&self, url: &str) -> Result<SSRResponse> {
        if self.process.is_none() {
            return Ok(SSRResponse {
                status: StatusCode::NOT_FOUND,
                headers: vec![("content-type".to_string(), "text/plain".to_string())],
                body: "404 Not found".as_bytes().to_vec(),
            });
        }

        let request_url = format!("http://localhost:{}/{}", self.port, url.trim_start_matches('/'));

        let response = self
            .client
            .get(&request_url)
            .send()
            .await
            .context("Failed to connect to Node.js server")?;

        let status = StatusCode::from_u16(response.status().as_u16()).unwrap_or(StatusCode::OK);

        let headers_raw = response.headers().clone();
        let body = response.bytes().await?.to_vec();

        let mut headers = Vec::new();

        for (name, value) in headers_raw.iter() {
            if let Ok(value_str) = value.to_str() {
                headers.push((name.as_str().to_string(), value_str.to_owned()));
            }
        }

        Ok(SSRResponse { status, headers, body })
    }

    pub async fn shutdown(&self) {
        if let Some(process) = &self.process {
            let mut guard = process.lock().await;
            let _ = guard.kill();
            let _ = guard.wait();
        }
    }
}

pub struct SSRResponse {
    pub status: StatusCode,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl IntoResponse for SSRResponse {
    fn into_response(self) -> Response {
        let mut builder = http::Response::builder().status(self.status);
        for (name, value) in self.headers {
            if let Ok(header_name) = http::header::HeaderName::from_bytes(name.as_bytes()) {
                if let Ok(header_value) = http::header::HeaderValue::from_str(&value) {
                    builder = builder.header(header_name, header_value);
                }
            }
        }
        builder.body(axum::body::Body::from(self.body)).unwrap_or_else(|_| {
            http::Response::builder()
                .status(StatusCode::INTERNAL_SERVER_ERROR)
                .body(axum::body::Body::from("Internal Server Error"))
                .unwrap()
        })
    }
}
