use crate::config::AppConfig;
use crate::fetcher::Fetcher;
use crate::parser::Parser;
use crate::storage::Storage;
use crate::error::Result;
use tracing::{info, error, warn, debug};
use std::sync::Arc;
use tokio::sync::mpsc;
use dashmap::DashMap;
use std::time::Duration;

pub struct Spider {
    config: AppConfig,
    fetcher: Fetcher,
    parser: Parser,
    storage: Storage,
    visited: Arc<DashMap<String, ()>>, // DashMap for concurrent access
}

impl Spider {
    pub async fn new(config: &AppConfig) -> Result<Self> {
        let fetcher = Fetcher::new(config)?;
        let parser = Parser::new();
        let storage = Storage::new(config).await?;
        
        Ok(Self {
            config: config.clone(),
            fetcher,
            parser,
            storage,
            visited: Arc::new(DashMap::new()),
        })
    }

    pub async fn run(&self, seeds: Vec<String>) -> Result<()> {
        info!("Spider started with concurrency: {}", self.config.crawler_concurrency);

        // Shared state for workers
        let spider = Arc::new(self.clone());

        let semaphore = Arc::new(tokio::sync::Semaphore::new(self.config.crawler_concurrency));
        let (res_tx, mut res_rx) = mpsc::channel::<Vec<String>>(1000); // Channel for new links found

        // Initial tasks
        let mut active_tasks = 0;
        
        let mut pending_queue = std::collections::VecDeque::from(seeds.clone()); 
        
        // Mark seeds as visited
        for seed in &seeds {
            spider.visited.insert(seed.clone(), ());
        }

        loop {
            // Drain results
            while let Ok(new_links) = res_rx.try_recv() {
                active_tasks -= 1;
                for link in new_links {
                    if !spider.visited.contains_key(&link) {
                        spider.visited.insert(link.clone(), ());
                        pending_queue.push_back(link);
                    }
                }
            }

            // check if done
            if active_tasks == 0 && pending_queue.is_empty() {
                info!("Crawl finished!");
                break;
            }

            // Spawn tasks if capacity
            while active_tasks < self.config.crawler_concurrency && !pending_queue.is_empty() {
                if let Some(url) = pending_queue.pop_front() {
                    let permit = semaphore.clone().acquire_owned().await.unwrap();
                    let spider_worker = spider.clone();
                    let res_tx_worker = res_tx.clone();
                    
                    active_tasks += 1;
                    
                    tokio::spawn(async move {
                        let _permit = permit; // Hold permit
                        let result = spider_worker.process_url(&url).await;
                        // Send back links (or empty) to signal completion
                        match result {
                            Ok(links) => {
                                let _ = res_tx_worker.send(links).await;
                            }
                            Err(e) => {
                                error!("Task failed for {}: {}", url, e);
                                let _ = res_tx_worker.send(vec![]).await;
                            }
                        }
                    });
                }
            }
            
            // Sleep briefly to prevent tight loop if waiting
            tokio::time::sleep(Duration::from_millis(10)).await;
        }

        Ok(())
    }
    
    // Make context cloneable is expensive if structs are big.
    // Fetcher/Storage are cheap clones (Arc inside).
    
    async fn process_url(&self, url: &str) -> Result<Vec<String>> {
        debug!("Fetching: {}", url);
        match self.fetcher.fetch(url).await {
            Ok((status, body)) => {
                if status.is_success() {
                    let parsed = self.parser.parse(&body, url)?;
                    // info!("Found: {} ({})", parsed.title, url);
                    
                    // Async Save (Fire and Forget or Await?)
                    // Await to ensure data safety
                    self.storage.save_document(url, &parsed.title, &parsed.text_content).await?;
                    
                    Ok(parsed.links)
                } else {
                    warn!("HTTP {}: {}", status, url);
                    Ok(vec![])
                }
            }
            Err(e) => {
                // Don't error out the worker too hard, just log
                warn!("Fetch error {}: {}", url, e);
                Ok(vec![])
            }
        }
    }
}

// Implement Clone manually or derive if fields support it
impl Clone for Spider {
    fn clone(&self) -> Self {
        Self {
            config: self.config.clone(),
            fetcher: self.fetcher.clone(),
            parser: self.parser.clone(),
            storage: self.storage.clone(),
            visited: self.visited.clone(),
        }
    }
}
