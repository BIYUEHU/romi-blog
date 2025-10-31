use std::sync::Arc;

pub mod transport;

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub enum LoggerLevel {
    Fatal = 0,
    Error = 1,
    Warn = 2,
    Info = 3,
    Record = 4,
    Debug = 5,
    Trace = 6,
    Silent = 7,
}

#[derive(Clone)]
pub struct LogData {
    pub level: LoggerLevel,
    pub time: i64,
    pub pid: u32,
    pub label: Vec<String>,
    pub msg: String,
}

pub trait Transport: Send + Sync {
    fn handle(&self, data: &LogData);
}

#[derive(Clone)]
pub struct Logger {
    level: LoggerLevel,
    label: Vec<String>,
    transports: Vec<Arc<dyn Transport>>,
}

impl Logger {
    pub fn new() -> Self {
        Self { level: LoggerLevel::Info, label: vec![], transports: vec![] }
    }

    pub fn with_level(mut self, level: LoggerLevel) -> Self {
        self.level = level;
        self
    }

    pub fn with_label(self, name: impl Into<String>) -> Self {
        let mut label = self.label.clone();
        label.push(name.into());
        Self { label, ..self }
    }

    pub fn with_transport(mut self, transport: impl Transport + 'static) -> Self {
        self.transports.push(Arc::new(transport));
        self
    }

    pub fn log(&self, level: LoggerLevel, message: String) {
        if level > self.level {
            return;
        }

        let data = LogData {
            level,
            time: chrono::Local::now().timestamp_millis(),
            pid: std::process::id(),
            label: self.label.clone(),
            msg: message,
        };

        for transport in &self.transports {
            transport.handle(&data);
        }
    }
}

#[macro_export]
macro_rules! log_args {
    ($fmt:expr) => ({
        $fmt.to_string()
    });
    ($fmt:expr, $($arg:tt)*) => ({
        format!($fmt, $($arg)*)
    });
}

#[macro_export]
macro_rules! l_fatal {
    ($logger:expr, $fmt:expr) => {
        $logger.log(LoggerLevel::Fatal, log_args!($fmt))
    };
    ($logger:expr, $fmt:expr, $($arg:tt)*) => {
        $logger.log(LoggerLevel::Fatal, log_args!($fmt, $($arg)*))
    };
}

#[macro_export]
macro_rules! l_error {
    ($logger:expr, $fmt:expr) => {
        $logger.log(roga::LoggerLevel::Error, roga::log_args!($fmt))
    };
    ($logger:expr, $fmt:expr, $($arg:tt)*) => {
        $logger.log(roga::LoggerLevel::Error, roga::log_args!($fmt, $($arg)*))
    };
}

#[macro_export]
macro_rules! l_warn {
    ($logger:expr, $fmt:expr) => {
        $logger.log(roga::LoggerLevel::Warn, roga::log_args!($fmt))
    };
    ($logger:expr, $fmt:expr, $($arg:tt)*) => {
        $logger.log(roga::LoggerLevel::Warn, roga::log_args!($fmt, $($arg)*))
    };
}

#[macro_export]
macro_rules! l_info {
    ($logger:expr, $fmt:expr) => {
        $logger.log(roga::LoggerLevel::Info, roga::log_args!($fmt))
    };
    ($logger:expr, $fmt:expr, $($arg:tt)*) => {
        $logger.log(roga::LoggerLevel::Info, roga::log_args!($fmt, $($arg)*))
    };
}

#[macro_export]
macro_rules! l_record {
    ($logger:expr, $fmt:expr) => {
        $logger.log(roga::LoggerLevel::Record, roga::log_args!($fmt))
    };
    ($logger:expr, $fmt:expr, $($arg:tt)*) => {
        $logger.log(roga::LoggerLevel::Record, roga::log_args!($fmt, $($arg)*))
    };
}

#[macro_export]
macro_rules! l_debug {
    ($logger:expr, $fmt:expr) => {
        $logger.log(roga::LoggerLevel::Debug, roga::log_args!($fmt))
    };
    ($logger:expr, $fmt:expr, $($arg:tt)*) => {
        $logger.log(roga::LoggerLevel::Debug, roga::log_args!($fmt, $($arg)*))
    };
}

#[macro_export]
macro_rules! l_trace {
    ($logger:expr, $fmt:expr) => {
        $logger.log(roga::LoggerLevel::Trace, roga::log_args!($fmt))
    };
    ($logger:expr, $fmt:expr, $($arg:tt)*) => {
        $logger.log(roga::LoggerLevel::Trace, roga::log_args!($fmt, $($arg)*))
    };
}

impl Default for Logger {
    fn default() -> Self {
        Self::new()
    }
}
