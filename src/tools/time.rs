use std::time::{SystemTime, UNIX_EPOCH};

pub fn get_timestamp() -> u32 {
  SystemTime::now().duration_since(UNIX_EPOCH).map(|x| x.as_millis() as u32).unwrap_or(0)
}
