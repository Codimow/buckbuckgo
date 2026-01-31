use crate::fetcher::Fetcher;
use robots_txt::Robots;
use dashmap::DashMap;
use std::sync::Arc;
use url::Url;
use tracing::debug;
use governor::{Quota, RateLimiter, state::NotKeyed, state::InMemoryState, clock::DefaultClock};
use std::num::NonZeroU32;

pub struct RobotsManager {
    fetcher: Fetcher,
    cache: DashMap<String, String>,
    user_agent: String,
}

impl RobotsManager {
    pub fn new(fetcher: Fetcher, user_agent: String) -> Self {
        Self {
            fetcher,
            cache: DashMap::new(),
            user_agent,
        }
    }

    pub async fn can_fetch(&self, url_str: &str) -> bool {
        let url = match Url::parse(url_str) {
            Ok(u) => u,
            Err(_) => return false,
        };

        let domain = match url.host_str() {
            Some(d) => d,
            None => return false,
        };

        let robots_text = if let Some(r) = self.cache.get(domain) {
            r.clone()
        } else {
            let robots_url = format!("{}://{}/robots.txt", url.scheme(), domain);
            match self.fetcher.fetch(&robots_url).await {
                Ok((_, body)) => {
                    self.cache.insert(domain.to_string(), body.clone());
                    body
                }
                Err(e) => {
                    debug!("No robots.txt found for {}: {}", domain, e);
                    return true; 
                }
            }
        };

        let robots = Robots::from_str_lossy(&robots_text);
        robots.allowed(url.as_str(), &self.user_agent)
    }
}

pub struct PolitenessManager {
    robots: RobotsManager,
    limiters: DashMap<String, Arc<RateLimiter<NotKeyed, InMemoryState, DefaultClock>>>,
    rate_per_sec: u32,
}

impl PolitenessManager {
    pub fn new(fetcher: Fetcher, user_agent: String, rate_per_sec: u32) -> Self {
        Self {
            robots: RobotsManager::new(fetcher, user_agent),
            limiters: DashMap::new(),
            rate_per_sec,
        }
    }

    pub async fn check_and_wait(&self, url_str: &str) -> bool {
        if !self.robots.can_fetch(url_str).await {
            return false;
        }

        let url = match Url::parse(url_str) {
            Ok(u) => u,
            Err(_) => return false,
        };

        let domain = match url.host_str() {
            Some(d) => d,
            None => return false,
        };

        let limiter = self.limiters.entry(domain.to_string()).or_insert_with(|| {
            Arc::new(RateLimiter::direct(Quota::per_second(NonZeroU32::new(self.rate_per_sec).unwrap())))
        }).clone();

        limiter.until_ready().await;
        true
    }
}
