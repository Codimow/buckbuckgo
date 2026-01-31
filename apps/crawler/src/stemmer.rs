use std::collections::HashSet;

const SUFFIXES: &[&str] = &[
    "हरूमा", "हरूले", "हरूको", "हरूलाई",
    "हरू", "मा", "ले", "को", "लाई", "बाट", "देखि",
    "सँग", "तिर", "भित्र", "बाहिर", "माथि", "मुनि",
    "ज्यू", "साथी", "कहाँ"
];

const STOPWORDS: &[&str] = &[
    "र", "को", "मा", "का", "ले", "त", "नै", "पनि", "भने", "छ", "हो", "भए", "यस", "त्यस", "जस", "कहाँ", "बाट", "कि", "तर", "जो", "गरे", "गर्ने", "गर्छिन्", "भएको", "गरेको", "हुन्छ", "हुन्न", "थियो", "भयो", "यही", "त्यही", "सारा", "सबै", "धेरै", "अलि", "मात्र", "शायद", "पक्कै", "आदि", "इत्यादि", "क्रमशः", "प्रायः", "सधैं", "कहिले", "जहिले", "अहिले", "तहिले", "पछि", "अघि", "फेरि", "समेत", "लािग", "लागि", "निम्ति", "मार्फत", "द्वारा", "गर्दै", "गरिरहेको", "गरिएको", "भनिने", "भन्ने"
];

pub struct NepaliNlp;

impl NepaliNlp {
    pub fn stem(word: &str) -> String {
        if word.chars().count() < 3 {
            return word.to_string();
        }

        let mut sorted_suffixes = SUFFIXES.to_vec();
        sorted_suffixes.sort_by(|a, b| b.len().cmp(&a.len()));

        let mut stemmed = word.to_string();
        
        for suffix in sorted_suffixes {
            if stemmed.ends_with(suffix) {
                // Check length (naive chars count, approximation)
                if stemmed.chars().count().saturating_sub(suffix.chars().count()) >= 2 {
                    let len = stemmed.len();
                    let suffix_len = suffix.len();
                    stemmed.truncate(len - suffix_len);
                    break;
                }
            }
        }
        
        stemmed
    }

    pub fn process_text(text: &str) -> String {
        let stopwords: HashSet<&str> = STOPWORDS.iter().cloned().collect();
        let normalized_text = Self::normalize(text);
        
        let mut processed = normalized_text.split_whitespace()
            .map(|word| {
                let clean_word = word.trim_matches(|c: char| !c.is_alphanumeric());
                if clean_word.is_empty() {
                    return String::new();
                }
                clean_word.to_string()
            })
            .filter(|word| !word.is_empty())
            .filter(|word| !stopwords.contains(&word.as_str()))
            .map(|word| Self::stem(&word))
            .collect::<Vec<String>>()
            .join(" ");

        // Append transliterated text for Latin-script search support
        let transliterated = Self::transliterate(text);
        if !transliterated.is_empty() {
            processed.push_str(" ");
            processed.push_str(&transliterated);
        }
        
        processed
    }

    /// Transliterates Devanagari to Roman script (naive mapping)
    pub fn transliterate(text: &str) -> String {
        let mut result = String::new();
        for c in text.chars() {
            let latin = match c {
                'अ' => "a", 'आ' => "aa", 'इ' => "i", 'ई' => "ee", 'उ' => "u", 'ऊ' => "uu",
                'ऋ' => "ri", 'ए' => "e", 'ऐ' => "ai", 'ओ' => "o", 'औ' => "au",
                'क' => "ka", 'ख' => "kha", 'ग' => "ga", 'घ' => "gha", 'ङ' => "nga",
                'च' => "cha", 'छ' => "chha", 'ज' => "ja", 'झ' => "jha", 'ञ' => "nya",
                'ट' => "ta", 'ठ' => "tha", 'ड' => "da", 'ढ' => "dha", 'ण' => "na",
                'त' => "ta", 'थ' => "tha", 'द' => "da", 'ध' => "dha", 'न' => "na",
                'प' => "pa", 'फ' => "pha", 'ब' => "ba", 'भ' => "bha", 'म' => "ma",
                'य' => "ya", 'र' => "ra", 'ल' => "la", 'व' => "va", 'श' => "sha", 'ष' => "sha", 'स' => "sa", 'ह' => "ha",
                'ा' => "aa", 'ि' => "i", 'ी' => "ee", 'ु' => "u", 'ू' => "uu", 'ृ' => "ri", 'े' => "e", 'ै' => "ai", 'ो' => "o", 'ौ' => "au",
                'ं' => "m", 'ँ' => "n", '्' => "", 
                _ => {
                    result.push(c);
                    continue;
                }
            };
            result.push_str(latin);
        }
        result
    }

    /// Normalizes Nepali text to handle common spelling variations
    pub fn normalize(text: &str) -> String {
        text.chars().map(|c| match c {
            'श' | 'ष' => 'स',
            'ई' | 'ी' => 'इ',
            'ऊ' | 'ू' => 'उ',
            'ण' => 'न',
            _ => c
        }).collect()
    }
}
