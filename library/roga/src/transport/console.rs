use chrono::Local;
use colored::*;

use crate::{LogData, LoggerLevel, Transport};

#[derive(Clone)]
pub struct ConsoleTransport<'a> {
    pub use_color: bool,
    pub label_color: &'a str,
    pub time_format: &'a str,
    pub template: &'a str,
    pub label_template: &'a str,
}

impl<'a> Transport for ConsoleTransport<'a> {
    fn handle(&self, data: &LogData) {
        let time = Local::now().format(&self.time_format).to_string().blue();
        let time = (if self.use_color { time } else { time.clear() }).to_string();
        let level = match data.level {
            LoggerLevel::Fatal => "FATAL".to_string().bright_red().bold(),
            LoggerLevel::Error => "ERROR".to_string().red(),
            LoggerLevel::Warn => "WARN".to_string().yellow(),
            LoggerLevel::Info => "INFO".to_string().green(),
            LoggerLevel::Record => "LOG".to_string().cyan(),
            LoggerLevel::Debug => "DEBUG".to_string().magenta(),
            LoggerLevel::Trace => "TRACE".to_string().black(),
            LoggerLevel::Silent => "".hidden(),
        };
        let level = (if self.use_color { level } else { level.clear() }).to_string();
        let pid = if self.use_color {
            data.pid.to_string().bold().to_string()
        } else {
            data.pid.to_string()
        };
        let labels = data
            .label
            .iter()
            .map(|name| {
                self.label_template.replace("{name}", &name.color(self.label_color).to_string())
            })
            .collect::<Vec<_>>()
            .join(" ");
        let msg = match data.msg.parse::<serde_json::Value>() {
            Ok(json) => serde_json::to_string_pretty(&json).unwrap_or_else(|_| data.msg.clone()),
            Err(_) => data.msg.clone(),
        };
        let msg = match data.level {
            LoggerLevel::Fatal => msg.to_string().bright_red(),
            LoggerLevel::Error => msg.to_string().red(),
            LoggerLevel::Warn => msg.to_string().bright_yellow(),
            LoggerLevel::Debug => msg.to_string().magenta(),
            LoggerLevel::Trace => msg.to_string().black(),
            _ => msg.color(""),
        }
        .to_string();

        let output = self
            .template
            .replace("{time}", &time.to_string())
            .replace("{level}", &level)
            .replace("{pid}", &pid.to_string())
            .replace("{labels}", &labels)
            .replace("{msg}", &msg);

        match data.level {
            LoggerLevel::Fatal | LoggerLevel::Error => eprintln!("{}", output),
            _ => println!("{}", output),
        }
    }
}

impl<'a> Default for ConsoleTransport<'a> {
    fn default() -> Self {
        Self {
            use_color: true,
            label_color: "cyan",
            time_format: "%y/%m/%d %H:%M:%S",
            template: "{time} {level} ({pid}) {labels}: {msg}",
            label_template: "[{name}]",
        }
    }
}
