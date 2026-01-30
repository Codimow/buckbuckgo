/**
 * Nepali Text Normalizer
 * Standardizes Devanagari text for better search matching.
 */

export const normalizeNepali = (text: string): string => {
    if (!text) return "";

    return text
        // 1. Unicode NFC Normalization
        .normalize("NFC")
        // 2. Remove common Devanagari punctuation and symbols
        .replace(/[\u0964\u0965\u002C\u002E\u003F\u0021\u003A\u003B\u0022\u0027]/g, " ")
        // 3. Normalize ZWJ (Zero Width Joiner) and ZWNJ (Zero Width Non-Joiner)
        // These are often used in Nepali but can interfere with search matching if inconsistent
        .replace(/[\u200B-\u200D\uFEFF]/g, "")
        // 4. Handle Nuktas (normalize variations of characters with dots)
        // For extreme production usage, we might decompose or recompose specifically
        // but NFC handles most cases.
        // 5. Trim and collapse whitespace
        .trim()
        .replace(/\s+/g, " ");
};
