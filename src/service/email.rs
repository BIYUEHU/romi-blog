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

  let from = settings.admin_email.parse::<Mailbox>()?;
  let to = to.parse::<Mailbox>()?;

  let email = Message::builder().from(from).to(to).subject(subject).body(body.to_string())?;

  let creds = Credentials::new(settings.smtp_username, settings.smtp_password);

  let mailer = AsyncSmtpTransport::<Tokio1Executor>::starttls_relay(&settings.smtp_host)?
    .port(settings.smtp_port)
    .credentials(creds)
    .build();

  mailer.send(email).await?;
  Ok(())
}
