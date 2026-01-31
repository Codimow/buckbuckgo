use sqlx::postgres::{PgPool, PgPoolOptions};
use sqlx::Error;
use crate::stemmer::NepaliNlp;

#[derive(Clone)]
pub struct Storage {
    pool: PgPool,
}

impl Storage {
    pub async fn new(database_url: &str) -> Result<Self, Error> {
        let pool = PgPoolOptions::new()
            .max_connections(50)
            .connect(database_url)
            .await?;
            
        Ok(Self { pool })
    }

    pub async fn insert_document(&self, url: &str, title: &str, content: &str, language: Option<&str>) -> Result<(), Error> {
        let searchable_text = NepaliNlp::process_text(content);
        
        // Upsert based on URL
        // Using sqlx::query instead of sqlx::query! to avoid build-time DB requirement
        sqlx::query(
            r#"
            INSERT INTO documents (url, title, content_text, searchable_text, language)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (url) 
            DO UPDATE SET 
                title = EXCLUDED.title,
                content_text = EXCLUDED.content_text,
                searchable_text = EXCLUDED.searchable_text,
                language = EXCLUDED.language,
                crawled_at = NOW()
            "#,
        )
        .bind(url)
        .bind(title)
        .bind(content)
        .bind(searchable_text)
        .bind(language)
        .execute(&self.pool)
        .await?;

        Ok(())
    }
    
    // Check if URL exists (frontier optimization)
    pub async fn url_exists(&self, url: &str) -> Result<bool, Error> {
        let row = sqlx::query(
            "SELECT 1 FROM documents WHERE url = $1 LIMIT 1"
        )
        .bind(url)
        .fetch_optional(&self.pool)
        .await?;
        
        Ok(row.is_some())
    }
}
