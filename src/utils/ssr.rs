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
                client: reqwest::Client::builder()
                    .timeout(std::time::Duration::from_secs(30)) // 添加超时
                    .build()
                    .unwrap_or_default(),
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

        // 等待进程启动
        std::thread::sleep(std::time::Duration::from_secs(1));

        if let Some(stderr) = process.stderr.take() {
            let logger = logger.clone();
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
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(30)) // 添加超时
                .build()
                .unwrap_or_default(),
            port,
        }
    }

    pub async fn render(&self, url: &str) -> Result<SSRResponse> {
        if self.process.is_none() {
            return Ok(SSRResponse {
                status: Status::NotFound,
                headers: vec![("Content-Type".to_owned(), "text/plain".to_owned())],
                body: "404 Not found".as_bytes().to_vec(),
            });
        }

        let request_url = format!(
            "http://localhost:{}/{}",
            self.port,
            url.trim_start_matches('/')
        );

        // 使用 reqwest 发送请求并等待完整响应
        let response = self
            .client
            .get(&request_url)
            .send()
            .await
            .context("Failed to connect to Node.js server")?;

        let status = Status::from_code(response.status().as_u16()).unwrap_or(Status::Ok);

        // 先获取响应体
        let headers_raw = response.headers().clone();
        let body = response.text().await?.as_bytes().to_vec();

        // 收集响应头
        let mut headers = Vec::new();

        // 设置 Content-Type
        // if let Some(content_type) = response.headers().get("content-type") {
        //     if let Ok(content_type_str) = content_type.to_str() {
        //         headers.push(("Content-Type".to_owned(), content_type_str.to_owned()));
        //     }
        // } else {
        //     headers.push((
        //         "Content-Type".to_owned(),
        //         "application/octet-stream".to_owned(),
        //     ));
        // }

        // 明确设置 Content-Length
        // headers.push(("Content-Length".to_owned(), content_length.to_string()));

        // 处理其他头部
        for (name, value) in headers_raw {
            if let Ok(value_str) = value.to_str() {
                if let Some(name) = name {
                    headers.push((name.to_string(), value_str.to_owned()));
                }
            }
        }

        Ok(SSRResponse {
            status,
            headers,
            body,
        })
    }
}

#[derive(Debug)]
pub struct SSRResponse {
    pub status: Status,
    pub headers: Vec<(String, String)>,
    pub body: Vec<u8>,
}

impl<'r> Responder<'r, 'static> for SSRResponse {
    fn respond_to(self, _: &'r rocket::Request<'_>) -> response::Result<'static> {
        // 检查响应体是否为空
        if self.body.is_empty() {
            return Response::build()
                .status(Status::InternalServerError)
                .header(rocket::http::ContentType::Plain)
                .sized_body(None, Cursor::new("Empty response body"))
                .ok();
        }

        let mut response = Response::build();
        response.status(self.status);

        // 添加所有响应头
        for (name, value) in self.headers {
            response.raw_header(name, value);
        }

        // 使用实际的 body 长度构建响应
        response.sized_body(Some(self.body.len()), Cursor::new(self.body));

        response.ok()
    }
}

impl Drop for SSR {
    fn drop(&mut self) {
        if let Some(process) = &self.process {
            if let Ok(mut process) = process.try_lock() {
                let _ = process.kill();
                let _ = process.wait();
            }
        }
    }
}
