use anyhow::Context;
use lettre::{
  AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor, message::Mailbox,
  transport::smtp::authentication::Credentials,
};
use sea_orm::DatabaseConnection;

use crate::{models::info::ResSmtpSettings, utils::cache::get_smtp_settings_cache};

pub async fn send_email(
  conn: &DatabaseConnection,
  to: &str,
  subject: &str,
  body: &str,
) -> anyhow::Result<()> {
  let settings: ResSmtpSettings =
    get_smtp_settings_cache(conn).await.context("Failed to fetch smtp settings")?;

  let from = settings.smtp_email.parse::<Mailbox>()?;
  let to = to.parse::<Mailbox>()?;

  let email = Message::builder()
    .from(from)
    .to(to)
    .subject(subject)
    .header(lettre::message::header::ContentType::TEXT_HTML)
    .body(body.to_string())?;

  let credentials =
    Credentials::new(settings.smtp_username.clone(), settings.smtp_password.clone());

  let mailer = match settings.smtp_port {
    465 => AsyncSmtpTransport::<Tokio1Executor>::relay(&settings.smtp_host)?
      .port(settings.smtp_port)
      .credentials(credentials)
      .build(),
    587 => AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&settings.smtp_host)?
      .port(settings.smtp_port)
      .credentials(credentials)
      .build(),
    _ => AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&settings.smtp_host)
      .port(settings.smtp_port)
      .credentials(credentials)
      .build(),
  };

  mailer.send(email).await?;
  Ok(())
}
