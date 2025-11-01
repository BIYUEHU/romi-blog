use serde::Deserialize;

#[derive(Deserialize)]
struct QueryAgent {
    url: Option<String>,
    #[serde(rename = "type")]
    content_type: Option<String>,
}

