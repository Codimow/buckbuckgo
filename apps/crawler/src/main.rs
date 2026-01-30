use tracing::{info, Level};
use tracing_subscriber::FmtSubscriber;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize logging
    let subscriber = FmtSubscriber::builder()
        .with_max_level(Level::INFO)
        .finish();
    tracing::subscriber::set_global_default(subscriber)
        .expect("setting default subscriber failed");

    info!("BuckBuckGo Crawler starting up...");

    // TODO: Initialize configuration
    // TODO: Connect to Postgres
    // TODO: Connect to Redis/RabbitMQ
    
    info!("Crawler initialization complete.");
    
    Ok(())
}
