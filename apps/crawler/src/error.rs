use thiserror::Error;

#[derive(Error, Debug)]
pub enum CrawlerError {
    #[error("Configuration error: {0}")]
    Config(#[from] config::ConfigError),

    #[error("Network error: {0}")]
    Network(#[from] reqwest::Error),

    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Parsing error: {0}")]
    Parse(String),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Queue error: {0}")]
    Queue(#[from] lapin::Error),
    
    #[error("Unknown error: {0}")]
    Unknown(String),
}

pub type Result<T> = std::result::Result<T, CrawlerError>;
