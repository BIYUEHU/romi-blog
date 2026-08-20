use std::time::{Duration, SystemTime};

use anyhow::{Context, Result};
use jsonwebtoken::{EncodingKey, Header, encode};
use sea_orm::{
  ActiveModelTrait, ActiveValue, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
  QueryFilter,
};
use tokio::spawn;

use crate::entity::romi_users;
use crate::guards::auth::AuthUser;
use crate::models::user::{
  ReqLoginData, ReqProfileData, ReqRegisterData, ReqUserData, ResLoginData, ResUserData,
};
use crate::service::email::send_email;
use crate::tools::random::generate_random_password;
use roga::*;

pub async fn login(
  db: &DatabaseConnection,
  credentials: ReqLoginData,
  secret: &str,
) -> Result<ResLoginData> {
  let user = romi_users::Entity::find()
    .filter(romi_users::Column::Email.eq(&credentials.email))
    .one(db)
    .await
    .context("Failed to fetch user")?
    .ok_or_else(|| anyhow::anyhow!("Invalid credentials"))?;

  if user.password != credentials.password {
    anyhow::bail!("Invalid credentials");
  }

  let claims = AuthUser {
    id: user.uid,
    username: user.username.clone(),
    url: user.url.clone(),
    created: user.created,
    exp: (SystemTime::now() + Duration::from_secs(60 * 60 * 24 * 12))
      .duration_since(SystemTime::UNIX_EPOCH)
      .unwrap()
      .as_secs(),
    is_admin: user.is_admin == "1",
    status: user.is_deleted.parse().unwrap_or(1),
  };

  let db_clone = db.clone();
  let user_id = user.uid;
  spawn(async move {
    if let Ok(Some(model)) = romi_users::Entity::find_by_id(user_id).one(&db_clone).await {
      let mut active = model.into_active_model();
      active.last_login = ActiveValue::Set(
        SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u32,
      );
      let _ = active.update(&db_clone).await;
    }
  });

  let token = encode(&Header::default(), &claims, &EncodingKey::from_secret(secret.as_bytes()))
    .context("Failed to generate token")?;

  Ok(ResLoginData { token })
}

pub async fn list(db: &DatabaseConnection) -> Result<Vec<ResUserData>> {
  let users = romi_users::Entity::find().all(db).await.context("Failed to list users")?;

  Ok(
    users
      .into_iter()
      .map(|user| ResUserData {
        uid: user.uid,
        username: user.username,
        email: user.email,
        created: user.created,
        last_login: user.last_login,
        is_admin: user.is_admin == "1",
        url: user.url,
        status: user.is_deleted.parse().unwrap_or(1),
      })
      .collect(),
  )
}

pub async fn get(db: &DatabaseConnection, id: u32) -> Result<ResUserData> {
  let user = romi_users::Entity::find_by_id(id)
    .filter(romi_users::Column::IsDeleted.ne("1"))
    .one(db)
    .await
    .context("Failed to get user")?
    .ok_or_else(|| anyhow::anyhow!("User not found"))?;

  Ok(ResUserData {
    uid: user.uid,
    username: user.username,
    email: user.email,
    created: user.created,
    last_login: user.last_login,
    is_admin: user.is_admin == "1",
    url: user.url,
    status: user.is_deleted.parse().unwrap_or(1),
  })
}

pub async fn create(db: &DatabaseConnection, data: ReqUserData) -> Result<romi_users::Model> {
  let exists = romi_users::Entity::find()
    .filter(
      romi_users::Column::Username.eq(&data.username).or(romi_users::Column::Email.eq(&data.email)),
    )
    .one(db)
    .await
    .context("Failed to check user existence")?
    .is_some();

  if exists {
    anyhow::bail!("Username or email already taken");
  }

  let salt = "random_salt";
  let now = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u32;

  let active = romi_users::ActiveModel {
    uid: ActiveValue::not_set(),
    username: ActiveValue::set(data.username),
    password: ActiveValue::set(data.password),
    salt: ActiveValue::set(salt.to_string()),
    email: ActiveValue::set(data.email),
    created: ActiveValue::set(now),
    last_login: ActiveValue::set(0),
    is_admin: ActiveValue::set("0".to_string()),
    is_deleted: ActiveValue::set(
      (0..3).contains(&data.status).then(|| data.status.to_string()).unwrap_or("1".to_string()),
    ),
    url: ActiveValue::set(data.url),
  };

  active.insert(db).await.context("Failed to create user")
}

pub async fn register(
  db: &DatabaseConnection,
  payload: ReqRegisterData,
  logger: &Logger,
) -> Result<romi_users::Model> {
  if payload.username.is_empty() || payload.email.is_empty() {
    anyhow::bail!("Username and email are required");
  }

  let username_exists = romi_users::Entity::find()
    .filter(romi_users::Column::Username.eq(&payload.username))
    .one(db)
    .await
    .context("Failed to check username")?
    .is_some();

  if username_exists {
    anyhow::bail!("Username already taken");
  }

  let email_exists = romi_users::Entity::find()
    .filter(romi_users::Column::Email.eq(&payload.email))
    .one(db)
    .await
    .context("Failed to check email")?
    .is_some();

  if email_exists {
    anyhow::bail!("Email already registered");
  }

  let password = generate_random_password(12);
  let salt = "random_salt";
  let now = SystemTime::now().duration_since(SystemTime::UNIX_EPOCH).unwrap().as_secs() as u32;

  let active = romi_users::ActiveModel {
    uid: ActiveValue::not_set(),
    username: ActiveValue::set(payload.username.clone()),
    password: ActiveValue::set(password.clone()),
    salt: ActiveValue::set(salt.to_string()),
    email: ActiveValue::set(payload.email.clone()),
    created: ActiveValue::set(now),
    last_login: ActiveValue::set(0),
    is_admin: ActiveValue::set("0".to_string()),
    is_deleted: ActiveValue::set("0".to_string()),
    url: ActiveValue::set(payload.url.clone()),
  };

  let result = active.insert(db).await.map_err(|e| {
    l_error!(logger, "Failed to create user: {:#}", e);
    anyhow::anyhow!(e)
  })?;

  let subject = "欢迎注册 Romi 账号";
  let body = format!(
    r#"<h2>您好，{}！</h2>
<p>您的账号已注册成功。</p>
<p><strong>登录邮箱：</strong>{}</p>
<p><strong>临时密码：</strong><code>{}</code></p>
<p>请登录后及时修改密码。</p>
<br>
<p>Romi 团队</p>"#,
    payload.username, payload.email, password
  );

  if let Err(e) = send_email(db, &payload.email, subject, &body).await {
    l_error!(logger, "Failed to send registration email: {:#}", e);
  }

  Ok(result)
}

pub async fn update_profile(
  db: &DatabaseConnection,
  user_id: u32,
  payload: ReqProfileData,
  logger: &Logger,
) -> Result<()> {
  let model = romi_users::Entity::find_by_id(user_id)
    .one(db)
    .await
    .context("Failed to get user")?
    .ok_or_else(|| anyhow::anyhow!("User not found"))?;

  if model.is_deleted == "1" {
    anyhow::bail!("User is deleted");
  }

  if payload.old_password != model.password {
    l_error!(logger, "Invalid old password for user {}", user_id);
    anyhow::bail!("Invalid old password");
  }

  let uid = model.uid;
  let mut active = model.into_active_model();

  if let Some(username) = &payload.username {
    if username.is_empty() {
      anyhow::bail!("Username cannot be empty");
    }
    let exists = romi_users::Entity::find()
      .filter(romi_users::Column::Username.eq(username))
      .filter(romi_users::Column::Uid.ne(uid))
      .one(db)
      .await
      .context("Failed to check username")?
      .is_some();
    if exists {
      l_warn!(logger, "Username {} already taken", username);
      anyhow::bail!("Username already taken");
    }
    active.username = ActiveValue::Set(username.clone());
  }

  if let Some(url) = &payload.url {
    active.url = ActiveValue::Set(Some(url.clone()));
  }

  if let Some(new_password) = payload.new_password {
    if new_password.len() < 6 {
      anyhow::bail!("Password must be at least 6 characters");
    }
    active.password = ActiveValue::Set(new_password);
  }

  active.update(db).await.context("Failed to update profile")?;
  Ok(())
}

pub async fn update(db: &DatabaseConnection, id: u32, data: ReqUserData) -> Result<()> {
  let model = romi_users::Entity::find_by_id(id)
    .one(db)
    .await
    .context("Failed to get user")?
    .ok_or_else(|| anyhow::anyhow!("User not found"))?;

  let is_admin = model.is_admin.clone();
  let mut active = model.into_active_model();
  active.username = ActiveValue::set(data.username);
  if !data.password.is_empty() {
    active.password = ActiveValue::set(data.password);
  }
  active.email = ActiveValue::set(data.email);
  active.url = ActiveValue::set(data.url);
  let status = data.status;
  if is_admin != "1" {
    active.is_deleted = ActiveValue::set(
      (0..3).contains(&status).then(|| status.to_string()).unwrap_or("1".to_string()),
    );
  }

  active.update(db).await.context("Failed to update user")?;
  Ok(())
}

pub async fn remove(db: &DatabaseConnection, id: u32) -> Result<()> {
  romi_users::Entity::delete_by_id(id).exec(db).await.context("Failed to remove user")?;
  Ok(())
}
