use std::{
    process::Command,
    time::{SystemTime, UNIX_EPOCH},
};

fn main() {
    let git_hash = match Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .output()
        .ok()
        .and_then(|o| String::from_utf8(o.stdout).ok())
    {
        Some(hash) => hash,
        None => {
            eprintln!("Failed to get git hash");
            return;
        }
    };

    let build_time = match SystemTime::now().duration_since(UNIX_EPOCH) {
        Ok(duration) => duration.as_millis().to_string(),
        Err(_) => {
            eprintln!("Failed to get build time");
            return;
        }
    };

    println!("cargo:rustc-env=GIT_HASH={git_hash}");
    println!("cargo:rustc-env=BUILD_TIME={build_time}");
}
