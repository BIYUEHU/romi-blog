pub fn get_req_user_agent(headers: &http::HeaderMap) -> Option<&str> {
    headers.get("user-agent").and_then(|v| v.to_str().ok())
}
