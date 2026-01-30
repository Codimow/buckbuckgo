use crate::config::AppConfig;
use crate::fetcher::Fetcher;
use crate::parser::Parser;
use crate::storage::Storage;
use crate::error::Result;
use tracing::{info, error, warn};
use std::collections::VecDeque;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::collections::HashSet;

pub struct Spider {
    fetcher: Fetcher,
    parser: Parser,
    storage: Storage,
    // Naive local state for MVP - replace with Redis/RabbitMQ later
    queue: Arc<Mutex<VecDeque<String>>>,
    visited: Arc<Mutex<HashSet<String>>>,
}

impl Spider {
    pub async fn new(config: &AppConfig) -> Result<Self> {
        let fetcher = Fetcher::new(config)?;
        let parser = Parser::new();
        let storage = Storage::new(config).await?;
        
        Ok(Self {
            fetcher,
            parser,
            storage,
            queue: Arc::new(Mutex::new(VecDeque::new())),
            visited: Arc::new(Mutex::new(HashSet::new())),
        })
    }

    pub async fn seed(&self, urls: Vec<String>) {
        let mut queue = self.queue.lock().await;
        for url in urls {
            queue.push_back(url);
        }
    }

    pub async fn run(&self) -> Result<()> {
        info!("Spider started.");
        
        // MVP: Single consumer loop. 
        // Real implementation: Worker pool consuming from queue.
        loop {
            let url_opt = {
                let mut queue = self.queue.lock().await;
                queue.pop_front()
            };

            if let Some(url) = url_opt {
                // Check visited
                {
                    let mut visited = self.visited.lock().await;
                    if visited.contains(&url) {
                        continue;
                    }
                    visited.insert(url.clone());
                }

                self.process_url(&url).await?;
                
                // Be polite
                tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
            } else {
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
                // Break or continue polling?
                // break; 
            }
        }
    }

    async fn process_url(&self, url: &str) -> Result<()> {
        info!("Processing: {}", url);
        match self.fetcher.fetch(url).await {
            Ok((status, body)) => {
                if status.is_success() {
                    let parsed = self.parser.parse(&body, url)?;
                    
                    info!("Parsed title: {}", parsed.title);
                    
                    self.storage.save_document(url, &parsed.title, &parsed.text_content).await?;
                    
                    // Add new links to queue
                    let mut queue = self.queue.lock().await;
                    for link in parsed.links {
                        queue.push_back(link);
                    }
                } else {
                    warn!("Failed to fetch {}: Status {}", url, status);
                }
            }
            Err(e) => {
                error!("Error processing {}: {}", url, e);
            }
        }
        Ok(())
    }
}
