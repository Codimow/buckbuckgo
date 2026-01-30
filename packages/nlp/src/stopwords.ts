/**
 * Nepali Stopwords
 * Common words that are usually filtered out during indexing or search.
 */

export const NEPALI_STOPWORDS = new Set([
    "छ", "छन्", "छैन", "हो", "होइन", "हुन्", "थियो", "थिए", "हुने", "गरे", "गरेका",
    "र", "पनि", "अनि", "तर", "वा", "भने", "भनेर", "भन्ने",
    "म", "हामी", "तँ", "तिमी", "तपाईं", "ऊ", "उनीहरू", "यो", "त्यो",
    "को", "ले", "मा", "लाई", "बाट", "देखि", "द्वारा",
    "का", "की", "के", "कसरी", "किन", "कति", "कहिले", "कहाँ",
    "मेरो", "हाम्रो", "तेरो", "तिम्रो", "उसको", "उनीहरूको",
    "सबै", "धेरै", "थोरै", "अलिकति", "निकै",
    "भएको", "गरेको", "सक्ने", "चाहने", "लाग्ने"
]);

/**
 * Remove stopwords from a string of text
 */
export const removeStopwords = (text: string): string => {
    return text
        .split(/\s+/)
        .filter(word => !NEPALI_STOPWORDS.has(word))
        .join(" ");
};
