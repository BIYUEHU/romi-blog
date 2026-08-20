# RomiChan Deployment Guide

RomiChan consists of two parts: frontend static assets `romichan-client` and backend executable `romichan-server`. Follow the steps below to deploy from scratch.

## Step 1: Download Build Artifacts

Go to the Actions page of the GitHub repository, find the latest successful build, and download these two artifacts:

- `romichan-client`: frontend static files
- `romichan-server`: Rust executable for your server platform

Choose the correct version for your system. For example, if you are on Linux x86_64, download the Linux version, not the Windows one.

## Step 2: Create the Database

Create a database in MySQL first:

```sql
CREATE DATABASE romichan DEFAULT CHARACTER SET utf8mb4;
```

Then import the tables and initial data using [`data.sql`](https://github.com/biyuehu/romi-nest/blob/main/library/migration/data.sql) from the project:

```bash
mysql -u username -p romichan < data.sql
```

After importing, the database will have all required tables for posts, moments, characters, settings, and more, along with a default admin account.

## Step 3: Configure romi.toml

Copy `romi.toml` from the project into your deployment directory and edit it for your environment:

```toml
address = "0.0.0.0"
port = 8000
database_url = "mysql://username:password@127.0.0.1:3306/romichan"
ssr_entry = "./dist/server/server.mjs"
log_level = "info"
```

Notes:

- `address`: listening address, usually `0.0.0.0`
- `port`: listening port, default is 8000
- `database_url`: database connection string, replace with your own username, password, and database name
- `ssr_entry`: path to the frontend SSR entry file inside dist
- `log_level`: log level, options are `fatal`, `error`, `warn`, `info`, `record`, `debug`, `trace`

## Step 4: Prepare the Directory Layout

Extract both downloaded archives. The final directory should look like this:

```text
your-deploy-directory/
├── romichan          # or romichan.exe on Windows
├── dist/             # frontend static files
└── romi.toml         # configuration file
```

`romichan` is the executable, `dist` contains the frontend, and `romi.toml` sits at the same level.

## Step 5: Run

Start the server from the deployment directory:

```bash
./romichan
```

On Windows, double-click or run `romichan.exe` from the command line.

Once you see `Server launched` in the logs, the server is running. The default access URL is:

```text
http://your-server-ip:8000
```

## Optional: Reverse Proxy and Domain

If you have a domain, it is recommended to set up a reverse proxy with Nginx or Caddy.

Nginx example:

```nginx
server {
    listen 80;
    server_name your-domain;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

After that, you can configure HTTPS as needed.

## Default Admin Account

After deployment, log in to the admin panel:

- Username: `romi`
- Password: `password`
- Email: `admin@gmail.com`

The admin panel is at `/admin/login`. Change the password immediately after logging in.
