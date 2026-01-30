use crate::config::AppConfig;
use crate::error::Result;
use reqwest::Client;
use serde_json::json;
use tracing::{info, error};

#[derive(Clone)]
pub struct Storage {
    client: Client,
    convex_url: String,
}

impl Storage {
    // No async needed for constructor really, but fine.
    pub async fn new(config: &AppConfig) -> Result<Self> {
        let client = Client::new();
        Ok(Self { 
            client,
            convex_url: config.convex_url.clone(),
        })
    }

    pub async fn save_document(&self, url: &str, title: &str, content: &str) -> Result<()> {
        let mutation_url = format!("{}/api/mutation", self.convex_url);
        
        let payload = json!({
            "path": "documents:saveDocument",
            "args": {
                "url": url,
                "title": title,
                "contentText": content
            },
            "format": "json"
        });

        info!("Saving document to Convex: {}", url);

        let resp = self.client.post(&mutation_url)
            .json(&payload)
            // .header("Authorization", "Bearer ...") // If needed
            .send()
            .await?;

        if !resp.status().is_success() {
            let error_text = resp.text().await?;
            error!("Failed to save document to Convex: {}", error_text);
            return Err(crate::error::CrawlerError::Unknown(format!("Convex Error: {}", error_text)));
        }

        Ok(())
    }
}
