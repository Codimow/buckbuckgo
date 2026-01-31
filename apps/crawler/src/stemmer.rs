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
        
        text.split_whitespace()
            .map(|word| {
                // Remove basic punctuation (trim matches)
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
            .join(" ")
    }
}
