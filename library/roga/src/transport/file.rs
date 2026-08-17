use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::PathBuf;

use chrono::Local;
use serde_json::json;

use crate::{LogData, Transport};

#[derive(Clone)]
pub struct FileTransport<'a> {
  pub directory: &'a str,
  pub name_format: &'a str,
}

impl<'a> Transport for FileTransport<'a> {
  fn handle(&self, data: &LogData) {
    let name = Local::now().format(&self.name_format).to_string();
    let mut path = PathBuf::from(self.directory);
    if fs::create_dir_all(&path).is_err() {
      return;
    }
    path.push(name);

    let mut file = match OpenOptions::new().create(true).append(true).open(&path) {
      Ok(file) => file,
      Err(_) => return,
    };

    let _ = writeln!(
      file,
      "{}",
      json!({
        "time": data.time,
        "level": format!("{:?}", data.level),
        "pid": data.pid,
        "label": data.label,
        "msg": data.msg,
      })
      .to_string()
    );
  }
}

impl<'a> Default for FileTransport<'a> {
  fn default() -> Self {
    Self { directory: "logs", name_format: "%y-%m-%d.log" }
  }
}
