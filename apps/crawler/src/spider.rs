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

use crate::politeness::PolitenessManager;
use fred::prelude::*;

pub struct Spider {
    config: AppConfig,
    fetcher: Fetcher,
    parser: Parser,
    storage: Storage,
    politeness: Arc<PolitenessManager>,
    redis: Client,
    shutdown: tokio::sync::broadcast::Sender<()>,
}

impl Spider {
    pub async fn new(config: &AppConfig) -> Result<Self> {
        let fetcher = Fetcher::new(config)?;
        let parser = Parser::new();
        let storage = Storage::new(&config.database_url).await?;
        let politeness = Arc::new(PolitenessManager::new(fetcher.clone(), config.user_agent.clone(), config.rate_limit_per_domain));
        
        // fred v10 configuration
        let redis_config = Config::from_url(&config.redis_url).map_err(|e| crate::error::CrawlerError::Config(e.to_string()))?;
        let redis = Client::new(redis_config, None, None, None);
        let _ = redis.connect();
        let _ = redis.wait_for_connect().await.map_err(|e: Error| crate::error::CrawlerError::Config(e.to_string()))?;
        
        let (shutdown, _) = tokio::sync::broadcast::channel(1);
        
        Ok(Self {
            config: config.clone(),
            fetcher,
            parser,
            storage,
            politeness,
            redis,
            shutdown,
        })
    }

    pub fn shutdown(&self) {
        let _ = self.shutdown.send(());
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

        let mut shutdown_rx = spider.shutdown.subscribe();

        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    info!("Shutdown signal received, draining tasks...");
                    break;
                }
                _ = tokio::time::sleep(Duration::from_millis(10)) => {
                    // Drain results
                    while let Ok(new_links) = res_rx.try_recv() {
                        active_tasks -= 1;
                        for link in new_links {
                            let redis = spider.redis.clone();
                            let link_clone = link.clone();
                            let res_tx_worker = res_tx.clone();
                            
                            // Check Redis if visited
                            tokio::spawn(async move {
                                let key = format!("visited:{}", link_clone);
                                // fred v10: redis.exists() is an async method returning R: FromRedis
                                match redis.exists::<i64, _>(key).await {
                                    Ok(count) if count == 0 => {
                                        // Not visited, mark as visited and send back to queue
                                        let _ = redis.set::<(), _, _>(format!("visited:{}", link_clone), "1", None, None, false).await;
                                        let _ = res_tx_worker.send(vec![link_clone]).await; // Send back as "new links to crawl"
                                    }
                                    _ => {} // Either error or already visited
                                }
                            });
                        }
                    }

                    // check if done
                    if active_tasks == 0 && pending_queue.is_empty() {
                        info!("Crawl finished!");
                        return Ok(());
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
                }
            }
        }

        Ok(())
    }
    
    // Make context cloneable is expensive if structs are big.
    // Fetcher/Storage are cheap clones (Arc inside).
    
    async fn process_url(&self, url: &str) -> Result<Vec<String>> {
        // Politeness check
        if !self.politeness.check_and_wait(url).await {
            debug!("Skipping disallowed or failed politeness check: {}", url);
            return Ok(vec![]);
        }

        debug!("Fetching: {}", url);
        match self.fetcher.fetch(url).await {
            Ok((status, body)) => {
                if status.is_success() {
                    let parsed = self.parser.parse(&body, url)?;
                    
                    self.storage.insert_document(url, &parsed.title, &parsed.text_content, None).await?;
                    
                    Ok(parsed.links)
                } else {
                    warn!("HTTP {}: {}", status, url);
                    Ok(vec![])
                }
            }
            Err(e) => {
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
            politeness: self.politeness.clone(),
            redis: self.redis.clone(),
            shutdown: self.shutdown.clone(),
        }
    }
}
