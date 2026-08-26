pub fn get_req_user_agent(headers: &http::HeaderMap) -> Option<&str> {
  headers.get("user-agent").and_then(|v| v.to_str().ok())
}

pub fn get_real_ip(headers: &http::HeaderMap, fallback: std::net::IpAddr) -> std::net::IpAddr {
  headers
    .get("x-forwarded-for")
    .and_then(|v| v.to_str().ok())
    .and_then(|v| v.split(',').next())
    .or_else(|| headers.get("x-real-ip").and_then(|v| v.to_str().ok()))
    .and_then(|v| v.trim().parse().ok())
    .unwrap_or(fallback)
}
