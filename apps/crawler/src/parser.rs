use scraper::{Html, Selector};
use url::Url;
use crate::error::Result;
use std::collections::HashSet;

#[derive(Debug)]
pub struct ParsedPage {
    pub title: String,
    pub links: Vec<String>,
    pub text_content: String,
}

#[derive(Clone)]
pub struct Parser {
    // Selectors can be pre-compiled here if needed
}

impl Parser {
    pub fn new() -> Self {
        Self {}
    }

    pub fn parse(&self, html_content: &str, base_url: &str) -> Result<ParsedPage> {
        let fragment = Html::parse_document(html_content);
        
        // Extract Title
        let title_selector = Selector::parse("title").unwrap();
        let title = fragment.select(&title_selector).next()
            .map(|el| el.text().collect::<Vec<_>>().join(" "))
            .unwrap_or_default();

        // Extract Links
        let link_selector = Selector::parse("a[href]").unwrap();
        let base = Url::parse(base_url).map_err(|e| crate::error::CrawlerError::Parse(e.to_string()))?;
        
        let mut links = HashSet::new();
        for element in fragment.select(&link_selector) {
            if let Some(href) = element.value().attr("href") {
                if let Ok(url) = base.join(href) {
                     // Basic filter: Only http/https
                     if url.scheme() == "http" || url.scheme() == "https" {
                         links.insert(url.to_string());
                     }
                }
            }
        }

        // Extract Text Content (naive approach for now)
        let body_selector = Selector::parse("body").unwrap();
        let text_content = fragment.select(&body_selector).next()
             .map(|el| el.text().collect::<Vec<_>>().join(" "))
             .unwrap_or_default()
             .split_whitespace()
             .collect::<Vec<_>>()
             .join(" ");

        Ok(ParsedPage {
            title,
            links: links.into_iter().collect(),
            text_content,
        })
    }
}
