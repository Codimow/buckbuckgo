use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub database_url: String, 
    pub redis_url: String,
    pub crawler_concurrency: usize,
    pub user_agent: String,
    pub rate_limit_per_domain: u32, // Requests per second
}

impl AppConfig {
    pub fn new() -> Result<Self, ConfigError> {
        let builder = Config::builder()
            .add_source(File::with_name("config").required(false))
            .add_source(Environment::default())
            .set_default("crawler_concurrency", 50)?
            .set_default("database_url", "postgres://buckbuckgo:postgres@localhost:5432/buckbuckgo")?
            .set_default("redis_url", "redis://localhost:6379")?
            .set_default("user_agent", "BuckBuckGoBot/1.0 (+https://buckbuckgo.com/bot)")?
            .set_default("rate_limit_per_domain", 2)?;

        builder.build()?.try_deserialize()
    }
}
