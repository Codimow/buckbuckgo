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
        // News & Media
        "https://www.nepal.gov.np".to_string(),
        "https://kathmandupost.com".to_string(),
        "https://ekantipur.com".to_string(),
        "https://thehimalayantimes.com".to_string(),
        "https://myrepublica.nagariknetwork.com".to_string(),
        "https://onlinekhabar.com".to_string(),
        "https://ratopati.com".to_string(),
        "https://setopati.com".to_string(),
        "https://nepalitimes.com".to_string(),
        "https://www.bbcnepali.com".to_string(),
        
        // Government & Institutions
        "https://mofa.gov.np".to_string(),
        "https://mof.gov.np".to_string(),
        "https://psc.gov.np".to_string(),
        "https://www.tu.edu.np".to_string(),
        "https://ku.edu.np".to_string(),
        
        // Tech & Business
        "https://techpana.com".to_string(),
        "https://www.sharesansar.com".to_string(),
        "https://merolagani.com".to_string(),
        "https://www.gadgetbytenepal.com".to_string(),
        "https://ictframe.com".to_string(),
        
        // Tourism & Culture
        "https://ntb.gov.np".to_string(),
        "https://www.welcomenepal.com".to_string(),
        "https://ecs.com.np".to_string(),
        
        // Jobs & Others
        "https://merojob.com".to_string(),
        "https://jobsnepal.com".to_string(),
        "https://hamrobazaar.com".to_string(),
        "https://daraz.com.np".to_string(),
        "https://sastodeal.com".to_string(),
    ];
    // Run the spider with seeds
    match spider.run(seeds).await {
        Ok(_) => info!("Spider finished successfully."),
        Err(e) => error!("Spider failed: {}", e),
    }
    
    Ok(())
}
