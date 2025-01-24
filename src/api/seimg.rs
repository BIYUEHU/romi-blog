use std::collections::HashSet;

#[derive(serde::Deserialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ReqSeimgData {
    pub pixiv_pid: u32,
    pub pixiv_uid: u32,
    pub title: String,
    pub author: String,
    pub r18: bool,
    pub tags: Vec<String>,
    pub width: u32,
    pub height: u32,
    pub type_: String,
    pub url: String,
}

#[derive(serde::Serialize, TS)]
#[ts(export, export_to = "../client/output.ts")]
pub struct ResSeimgData {
    pub pid: u32,
    pub uid: u32,
    pub title: String,
    pub author: String,
    pub r18: bool,
    pub tags: Vec<String>,
    pub width: u32,
    pub height: u32,
    pub type_: String,
    pub url: String,
}

#[get("/?<limit>&<tag>&<r18>")]
pub async fn fetch(
    limit: Option<u32>,
    tag: Option<String>,
    r18: Option<u32>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<Vec<ResSeimgData>> {
    let limit = limit.map_or(1, |l| l.clamp(1, 10));
    l_info!(
        logger,
        "Fetching seimg with limit={}, tag={:?}, r18={:?}",
        limit,
        tag,
        r18
    );

    let mut query = romi_seimgs::Entity::find();

    if let Some(r18_val) = r18 {
        query = query.filter(romi_seimgs::Column::R18.eq(r18_val.to_string()));
    }

    if let Some(tag_str) = tag {
        let tags: Vec<&str> = tag_str.split('|').collect();
        for tag in tags {
            query = query.filter(romi_seimgs::Column::Tags.contains(tag));
        }
    }

    let results = query
        .order_by_raw("RAND()")
        .limit(limit as u64)
        .all(conn.into_inner())
        .await
        .with_context(|| "Failed to fetch seimg")?;

    api_ok(
        results
            .into_iter()
            .map(|img| ResSeimgData {
                pid: img.pixiv_pid,
                uid: img.pixiv_uid,
                title: img.title,
                author: img.author,
                r18: img.r18 == "1",
                tags: img.tags.split(',').map(String::from).collect(),
                width: img.width,
                height: img.height,
                type_: img.type_,
                url: img.url,
            })
            .collect(),
    )
}

#[post("/", data = "<seimg>")]
pub async fn create(
    seimg: Json<ReqSeimgData>,
    logger: &State<Logger>,
    conn: Connection<'_, Db>,
) -> ApiResult<romi_seimgs::Model> {
    l_info!(logger, "Creating new seimg");

    let model = romi_seimgs::ActiveModel {
        id: ActiveValue::not_set(),
        pixiv_pid: ActiveValue::set(seimg.pixiv_pid),
        pixiv_uid: ActiveValue::set(seimg.pixiv_uid),
        title: ActiveValue::set(seimg.title.clone()),
        author: ActiveValue::set(seimg.author.clone()),
        r18: ActiveValue::set(if seimg.r18 { "1" } else { "0" }.to_string()),
        tags: ActiveValue::set(seimg.tags.join(",")),
        width: ActiveValue::set(seimg.width),
        height: ActiveValue::set(seimg.height),
        type_: ActiveValue::set(seimg.type_.clone()),
        url: ActiveValue::set(seimg.url.clone()),
    };

    let result = model
        .insert(conn.into_inner())
        .await
        .with_context(|| "Failed to create seimg")?;

    l_info!(logger, "Successfully created seimg: id={}", result.id);
    api_ok(result)
}

// 在 main.rs 或相应的模块中注册路由
pub fn stage() -> rocket::fairing::AdHoc {
    rocket::fairing::AdHoc::on_ignite("API", |rocket| async {
        rocket
            .mount(
                "/api/hitokoto",
                routes![hitokoto::fetch, hitokoto::create, hitokoto::like,],
            )
            .mount("/api/seimg", routes![seimg::fetch, seimg::create,])
    })
}
