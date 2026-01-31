use crate::fetcher::Fetcher;
use texting_robots::Robot;
use dashmap::DashMap;
use std::sync::Arc;
use url::Url;
use tracing::debug;
use governor::{Quota, RateLimiter, state::NotKeyed, state::InMemoryState, clock::DefaultClock};
use std::num::NonZeroU32;

pub struct RobotsManager {
    fetcher: Fetcher,
    cache: DashMap<String, Arc<Robot>>,
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

        let robot = if let Some(r) = self.cache.get(domain) {
            r.clone()
        } else {
            let robots_url = format!("{}://{}/robots.txt", url.scheme(), domain);
            match self.fetcher.fetch(&robots_url).await {
                Ok((_, body)) => {
                    match Robot::new(&self.user_agent, body.as_bytes()) {
                        Ok(r) => {
                            let arc_r = Arc::new(r);
                            self.cache.insert(domain.to_string(), arc_r.clone());
                            arc_r
                        }
                        Err(e) => {
                            debug!("Failed to parse robots.txt for {}: {}", domain, e);
                            return true;
                        }
                    }
                }
                Err(e) => {
                    debug!("No robots.txt found for {}: {}", domain, e);
                    // Default allowance if robots.txt is missing
                    return true;
                }
            }
        };

        // texting_robots::Robot::allowed(path)
        robot.allowed(url.path())
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
