pub const CONFIG_FILE: &str = "romi.toml";

pub const DATA_DIR: &str = "data";

pub const MUSIC_PLAYLIST_ID: u64 = 2653919517;

pub const MUSIC_CACHE_FILE: &str = "data/music_cache.json";

pub const MUSIC_CACHE_TIMEOUT: u64 = 60 * 60 * 24; // 1 day

pub const SETTINGS_CACHE_TIMEOUT: u64 = 15 * 60; // 15 minutes

pub const PROJECTS_CACHE_TIMEOUT: u64 = 15 * 60; // 15 minutes

// pub const BANGUMI_CACHE_TIMEOUT: u64 = 60 * 60; // 1 hour

pub const NODEJS_LOGGER_LABEL: &str = "Node.js";

pub const GITHUB_USER: &str = "biyuehu";

pub const HTTP_CLIENT_AGENT: &str = "RomiChan-App";

pub const VERSION: &str = env!("CARGO_PKG_VERSION");

pub const HASH: &str = env!("GIT_HASH");

pub const BUILD_TIME: &str = env!("BUILD_TIME");
