use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub convex_url: String, // e.g. https://happy-otter-123.convex.cloud
    pub crawler_concurrency: usize,
    pub user_agent: String,
}

impl AppConfig {
    pub fn new() -> Result<Self, ConfigError> {
        let builder = Config::builder()
            .add_source(File::with_name("config").required(false))
            .add_source(Environment::default())
            .set_default("crawler_concurrency", 10)?
            .set_default("user_agent", "BuckBuckGoBot/1.0 (+https://buckbuckgo.com/bot)")?;

        builder.build()?.try_deserialize()
    }
}
