import { normalizeNepali } from "./normalizer.js";
import { removeStopwords } from "./stopwords.js";
import { stemText } from "./stemmer.js";

/**
 * Full Nepali NLP Pipeline
 * 1. Normalize
 * 2. Remove Stopwords
 * 3. Stem
 */
export const processNepaliText = (text: string): string => {
    if (!text) return "";
    const normalized = normalizeNepali(text);
    const withoutStopwords = removeStopwords(normalized);
    return stemText(withoutStopwords);
};

export * from "./normalizer.js";
export * from "./stemmer.js";
export * from "./stopwords.js";
