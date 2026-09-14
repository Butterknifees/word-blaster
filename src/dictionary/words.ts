// Ultra-comprehensive English dictionary system for Word Blaster
// Combines instant built-in core words + dynamic 226,000+ word tournament list

import { RAW_WORD_LIST } from './wordList';

let dictionarySet: Set<string> | null = null;
let isLoadingFullDict = false;
let isFullDictLoaded = false;

export function getDictionary(): Set<string> {
  if (!dictionarySet) {
    dictionarySet = new Set<string>();
    for (const w of RAW_WORD_LIST) {
      if (w.length >= 4) {
        dictionarySet.add(w.toUpperCase().trim());
      }
    }
  }
  return dictionarySet;
}

/**
 * Asynchronously loads the 226,000+ word comprehensive English tournament dictionary.
 */
export async function loadFullDictionary(): Promise<number> {
  if (isFullDictLoaded && dictionarySet) {
    return dictionarySet.size;
  }
  if (isLoadingFullDict) {
    return dictionarySet ? dictionarySet.size : RAW_WORD_LIST.length;
  }

  isLoadingFullDict = true;
  const dict = getDictionary();

  try {
    const dictUrl = `${import.meta.env.BASE_URL || './'}dictionary.txt`;
    const res = await fetch(dictUrl);
    if (res.ok) {
      const text = await res.text();
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const w = lines[i].trim().toUpperCase();
        if (w.length >= 4) {
          dict.add(w);
        }
      }
      isFullDictLoaded = true;
      console.log(`[Word Blaster] Full dictionary loaded: ${dict.size.toLocaleString()} words`);
    }
  } catch (err) {
    console.warn('[Word Blaster] Could not fetch external dictionary.txt, using built-in list:', err);
  } finally {
    isLoadingFullDict = false;
  }

  return dict.size;
}

// Auto-trigger full dictionary load immediately in browser
if (typeof window !== 'undefined') {
  loadFullDictionary();
}

/**
 * Validates whether a word is a legitimate English word of >= 4 letters.
 */
export function isWordInDictionary(word: string): boolean {
  if (!word || word.length < 4) return false;
  const dict = getDictionary();
  return dict.has(word.toUpperCase().trim());
}

/**
 * Checks if a word can be formed from a list of available letter tiles.
 */
export function canFormWord(word: string, availableTiles: string[]): boolean {
  const lettersNeeded: Record<string, number> = {};
  for (const char of word.toUpperCase()) {
    lettersNeeded[char] = (lettersNeeded[char] || 0) + 1;
  }

  const tilePool: Record<string, number> = {};
  for (const tile of availableTiles) {
    const t = tile.toUpperCase();
    tilePool[t] = (tilePool[t] || 0) + 1;
  }

  for (const [char, count] of Object.entries(lettersNeeded)) {
    if ((tilePool[char] || 0) < count) {
      return false;
    }
  }

  return true;
}

/**
 * Finds valid playable words from an array of tiles (useful for AI bots and hints).
 */
export function findPlayableWords(tiles: string[], minLength: number = 4, limit: number = 10): string[] {
  if (!tiles || tiles.length < minLength) return [];

  const valid: string[] = [];
  const tileCount: Record<string, number> = {};
  for (const t of tiles) {
    const upper = t.toUpperCase();
    tileCount[upper] = (tileCount[upper] || 0) + 1;
  }

  // 1. Fast check against high-frequency RAW_WORD_LIST
  // Start from random offset for varied AI vocabulary
  const startIndex = Math.floor(Math.random() * RAW_WORD_LIST.length);
  const wordCount = RAW_WORD_LIST.length;

  for (let i = 0; i < wordCount; i++) {
    const word = RAW_WORD_LIST[(startIndex + i) % wordCount];
    if (word.length < minLength || word.length > tiles.length) continue;

    let possible = true;
    const needed: Record<string, number> = {};
    for (const char of word) {
      needed[char] = (needed[char] || 0) + 1;
      if (needed[char] > (tileCount[char] || 0)) {
        possible = false;
        break;
      }
    }

    if (possible) {
      valid.push(word);
      if (valid.length >= limit) return valid;
    }
  }

  // 2. If needed, fallback to full dictionary
  if (valid.length === 0) {
    const dict = getDictionary();
    for (const word of dict) {
      if (word.length < minLength || word.length > tiles.length) continue;

      let possible = true;
      const needed: Record<string, number> = {};
      for (const char of word) {
        needed[char] = (needed[char] || 0) + 1;
        if (needed[char] > (tileCount[char] || 0)) {
          possible = false;
          break;
        }
      }

      if (possible) {
        valid.push(word);
        if (valid.length >= limit) break;
      }
    }
  }

  return valid;
}
