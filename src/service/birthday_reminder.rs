use std::time::Duration;

use chrono::{FixedOffset, Timelike, Utc};
use roga::Logger;
use sea_orm::DatabaseConnection;

use crate::service::{email::send_email, info};

pub fn spawn(db: DatabaseConnection, logger: Logger, admin_email: String) {
  tokio::spawn(async move {
    loop {
      run(&db, &logger, &admin_email).await;
      tokio::time::sleep(Duration::from_secs(60)).await;
    }
  });
}

async fn run(db: &DatabaseConnection, logger: &Logger, admin_email: &str) {
  let Ok(config) = info::get_birthday_reminder_config(db).await else {
    roga::l_error!(logger, "Failed to get birthday reminder config");
    return;
  };

  if !config.enabled {
    return;
  }

  let now = Utc::now().with_timezone(&FixedOffset::east_opt(8 * 3600).unwrap());
  if now.hour() != config.hour as u32 || now.minute() != config.minute as u32 {
    return;
  }

  let month_day = now.format("%m-%d").to_string();
  let Ok(characters) = info::get_characters_with_birthday(db, &month_day).await else {
    roga::l_error!(logger, "Failed to get birthday characters");
    return;
  };

  let Ok(mut log) = info::get_birthday_reminder_log(db).await else {
    roga::l_error!(logger, "Failed to get birthday reminder log");
    return;
  };

  for character in characters {
    let key = character.id.to_string();
    if log.get(&key).and_then(|v| v.as_str()) == Some(month_day.as_str()) {
      continue;
    }

    let body = config
      .template
      .replace("$name$", &character.name)
      .replace("$romaji$", &character.romaji)
      .replace("$description$", &character.description)
      .replace("$month$", &now.format("%m").to_string())
      .replace("$day$", &now.format("%d").to_string())
      .replace("$age$", &character.age.map(|a| a.to_string()).unwrap_or_default());

    match send_email(db, admin_email, &format!("今天是 {} 的生日", character.name), &body).await
    {
      Ok(_) => {
        log.insert(key, serde_json::json!(month_day));
        if let Err(e) = info::set_birthday_reminder_log(db, log.clone()).await {
          roga::l_error!(logger, "Failed to update birthday reminder log: {}", e);
        }
        roga::l_info!(
          logger,
          "Sent birthday reminder for character {} ({})",
          character.name,
          character.id
        );
      }
      Err(e) => {
        roga::l_error!(
          logger,
          "Failed to send birthday reminder for character {}: {}",
          character.name,
          e
        );
      }
    }
  }
}
