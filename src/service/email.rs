use anyhow::Context;
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor, message::Mailbox};
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

  let mailer = AsyncSmtpTransport::<Tokio1Executor>::builder_dangerous(&settings.smtp_host)
    .port(settings.smtp_port)
    .build();

  mailer.send(email).await?;
  Ok(())
}
