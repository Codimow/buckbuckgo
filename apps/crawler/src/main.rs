use tracing::{info, Level, error};
use tracing_subscriber::FmtSubscriber;
use crawler::config::AppConfig;
use crawler::spider::Spider;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file
    dotenv::dotenv().ok();

    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("setting default subscriber failed");

    info!("BuckBuckGo Crawler starting up...");

    // Load configuration
    let config = AppConfig::new().map_err(|e| {
        error!("Failed to load configuration: {}", e);
        e
    })?;

    info!("Configuration loaded. Target: {}", config.convex_url);

    // Initialize Spider
    let spider = Spider::new(&config).await.map_err(|e| {
        error!("Failed to initialize spider: {}", e);
        e
    })?;

    // Seed initial URLs (for testing MVP)
    let seeds = vec![
        "https://www.nepal.gov.np".to_string(),
        "https://kathmandupost.com".to_string(),
    ];
    spider.seed(seeds).await;

    // Run the spider
    match spider.run().await {
        Ok(_) => info!("Spider finished successfully."),
        Err(e) => error!("Spider failed: {}", e),
    }
    
    Ok(())
}
