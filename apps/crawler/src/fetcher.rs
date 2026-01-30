use reqwest::{Client, StatusCode};
use std::time::Duration;
use crate::config::AppConfig;
use crate::error::Result;
use tracing::info;

#[derive(Clone)]
pub struct Fetcher {
    client: Client,
}

impl Fetcher {
    pub fn new(config: &AppConfig) -> Result<Self> {
        let client = Client::builder()
            .user_agent(&config.user_agent)
            .timeout(Duration::from_secs(10))
            .connect_timeout(Duration::from_secs(5))
            .pool_idle_timeout(Duration::from_secs(90))
            .pool_max_idle_per_host(config.crawler_concurrency)
            .http2_prior_knowledge() // Assume HTTP/2 capability or negotiate
            .build()?; // reqwest error is converted to CrawlerError

        Ok(Self { client })
    }

    pub async fn fetch(&self, url: &str) -> Result<(StatusCode, String)> {
        info!("Fetching URL: {}", url);
        let response = self.client.get(url).send().await?;
        let status = response.status();
        let body = response.text().await?;
        Ok((status, body))
    }
    
    pub async fn fetch_head(&self, url: &str) -> Result<StatusCode> {
        let response = self.client.head(url).send().await?;
        Ok(response.status())
    }
}
