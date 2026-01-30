/**
 * Nepali NLP for Convex
 */

export const normalizeNepali = (text: string): string => {
    if (!text) return "";
    return text
        .normalize("NFC")
        .replace(/[\u0964\u0965\u002C\u002E\u003F\u0021\u003A\u003B\u0022\u0027]/g, " ")
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        .trim()
        .replace(/\s+/g, " ");
};

const SUFFIXES = [
    "हरूमा", "हरूले", "हरूको", "हरूलाई",
    "हरू", "मा", "ले", "को", "लाई", "बाट", "देखि",
    "सँग", "तिर", "भित्र", "बाहिर", "माथि", "मुनि",
    "ज्यू", "साथी", "कहाँ"
];
const SORTED_SUFFIXES = [...SUFFIXES].sort((a, b) => b.length - a.length);

export const stemNepali = (word: string): string => {
    if (!word || word.length < 3) return word;
    let stemmed = word;
    for (const suffix of SORTED_SUFFIXES) {
        if (stemmed.endsWith(suffix)) {
            if (stemmed.length - suffix.length >= 2) {
                stemmed = stemmed.slice(0, -suffix.length);
                break;
            }
        }
    }
    return stemmed;
};

export const stemText = (text: string): string => {
    return text.split(/\s+/).map(word => stemNepali(word)).join(" ");
};

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

export const removeStopwords = (text: string): string => {
    return text.split(/\s+/).filter(word => !NEPALI_STOPWORDS.has(word)).join(" ");
};

export const processNepaliText = (text: string): string => {
    const normalized = normalizeNepali(text);
    const withoutStopwords = removeStopwords(normalized);
    return stemText(withoutStopwords);
};
