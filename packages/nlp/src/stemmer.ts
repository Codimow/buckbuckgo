/**
 * Nepali Suffix-Stripping Stemmer
 * 
 * This is a lightweight implementation that removes common post-positions
 * and plural suffixes to reach the root word.
 */

const SUFFIXES = [
    "हरूमा", "हरूले", "हरूको", "हरूलाई",
    "हरू", "मा", "ले", "को", "लाई", "बाट", "देखि",
    "सँग", "तिर", "भित्र", "बाहिर", "माथि", "मुनि",
    "ज्यू", "साथी", "कहाँ"
];

// Sort suffixes by length descending to match longest first (e.g., 'हरूमा' before 'मा')
const SORTED_SUFFIXES = [...SUFFIXES].sort((a, b) => b.length - a.length);

export const stemNepali = (word: string): string => {
    if (!word || word.length < 3) return word;

    let stemmed = word;

    for (const suffix of SORTED_SUFFIXES) {
        if (stemmed.endsWith(suffix)) {
            // Basic check: don't strip if word becomes too short
            // (Devanagari characters are multi-byte but String.length works on code units)
            if (stemmed.length - suffix.length >= 2) {
                stemmed = stemmed.slice(0, -suffix.length);
                // Single pass usually enough for simple search, 
                // but we could recursive-call if we wanted to strip 'हरू' then 'को'
                break;
            }
        }
    }

    return stemmed;
};

/**
 * Stem a full string of text (tokens)
 */
export const stemText = (text: string): string => {
    return text
        .split(/\s+/)
        .map(word => stemNepali(word))
        .join(" ");
};
