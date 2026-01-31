use std::collections::VecDeque;
use std::sync::Arc;
use tokio::sync::{mpsc, broadcast};
use tracing::{info, debug, warn, error};
use crate::config::AppConfig;
use crate::fetcher::Fetcher;
use crate::parser::Parser;
use crate::storage::Storage;
use crate::error::Result;
use crate::politeness::PolitenessManager;
use fred::prelude::*;

pub struct Spider {
    config: AppConfig,
    fetcher: Fetcher,
    parser: Parser,
    storage: Storage,
    politeness: Arc<PolitenessManager>,
    redis: Client,
    shutdown: broadcast::Sender<()>,
}

impl Spider {
    pub async fn new(config: &AppConfig) -> Result<Self> {
        let fetcher = Fetcher::new(config)?;
        let parser = Parser::new();
        let storage = Storage::new(&config.database_url).await?;
        let politeness = Arc::new(PolitenessManager::new(
            fetcher.clone(),
            config.user_agent.clone(),
            config.rate_limit_per_domain,
        ));

        // Redis configuration for fred v10
        let redis_config = Config::from_url(&config.redis_url)
            .map_err(|e| crate::error::CrawlerError::Redis(format!("Config error: {}", e)))?;
        let redis = Client::new(redis_config, None, None, None);
        let _ = redis.connect();
        let _ = redis.wait_for_connect().await
            .map_err(|e| crate::error::CrawlerError::Redis(format!("Connection error: {}", e)))?;

        let (shutdown, _) = broadcast::channel(1);

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

    pub async fn run(&self, seeds: Vec<String>) -> Result<()> {
        let mut pending_queue = VecDeque::from(seeds);
        let mut active_tasks = 0;
        let (res_tx, mut res_rx) = mpsc::channel(100);
        let mut shutdown_rx = self.shutdown.subscribe();

        info!("Starting crawl loop with {} seeds...", pending_queue.len());

        loop {
            tokio::select! {
                _ = shutdown_rx.recv() => {
                    info!("Spider shutting down...");
                    break;
                }
                
                // Spawn tasks if we have URLs and haven't exceeded concurrency
                _ = async {}, if active_tasks < self.config.crawler_concurrency && !pending_queue.is_empty() => {
                    if let Some(url) = pending_queue.pop_front() {
                        active_tasks += 1;
                        let spider = self.clone();
                        let res_tx = res_tx.clone();
                        
                        tokio::spawn(async move {
                            match spider.process_url(&url).await {
                                Ok(new_links) => {
                                    let _ = res_tx.send(new_links).await;
                                }
                                Err(e) => {
                                    error!("Error processing {}: {}", url, e);
                                    let _ = res_tx.send(vec![]).await;
                                }
                            }
                        });
                    }
                }

                // Process results from workers
                Some(new_links) = res_rx.recv() => {
                    active_tasks -= 1;
                    for link in new_links {
                        let redis = self.redis.clone();
                        let res_tx_worker = res_tx.clone();
                        let link_clone = link.clone();
                        
                        // Async check for visited URL in Redis
                        tokio::spawn(async move {
                            let key = format!("visited:{}", link_clone);
                            // fred v10: redis.exists() is an async method returning R: FromRedis
                            // Borrow the key to avoid move
                            match redis.exists::<i64, _>(&key).await {
                                Ok(count) if count == 0 => {
                                    // Not visited
                                    if let Ok(_) = redis.set::<(), _, _>(&key, "1", None, None, false).await {
                                        let _ = res_tx_worker.send(vec![link_clone]).await;
                                    }
                                }
                                _ => {} // Already visited or error
                            }
                        });
                    }
                }

                // Break if everything is done
                else => {
                    if active_tasks == 0 && pending_queue.is_empty() {
                        info!("Crawl finished.");
                        break;
                    }
                }
            }
        }

        Ok(())
    }

    pub fn shutdown(&self) {
        let _ = self.shutdown.send(());
    }

    async fn process_url(&self, url: &str) -> Result<Vec<String>> {
        // Politeness check (Robots + Rate Limit)
        if !self.politeness.check_and_wait(url).await {
            debug!("Skipping disallowed or limited URL: {}", url);
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
