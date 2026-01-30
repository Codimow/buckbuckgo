use config::{Config, ConfigError, Environment, File};
use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct AppConfig {
    pub database_url: String,
    pub redis_url: String,
    pub rabbitmq_url: String,
    pub crawler_concurrency: usize,
    pub user_agent: String,
}

impl AppConfig {
    pub fn new() -> Result<Self, ConfigError> {
        let builder = Config::builder()
            // Add configuration values from a file named `config` (optional)
            .add_source(File::with_name("config").required(false))
            // Add in settings from the environment (with a prefix of APP)
            // e.g. APP_DATABASE_URL=postgres://...
            .add_source(Environment::default())
            // Set defaults
            .set_default("crawler_concurrency", 10)?
            .set_default("user_agent", "BuckBuckGoBot/1.0 (+https://buckbuckgo.com/bot)")?;

        builder.build()?.try_deserialize()
    }
}
