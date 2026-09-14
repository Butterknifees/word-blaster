// Standard English Scrabble-like distribution & point values tuned for Word Blaster

export const LETTER_VALUES: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
  J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
};

// Frequency distribution to ensure balanced hands (playable vowels & common consonants)
export const LETTER_FREQUENCIES: Record<string, number> = {
  E: 12, A: 9, I: 9, O: 8, N: 6, R: 6, T: 6, L: 4, S: 4, U: 4,
  D: 4, G: 3, B: 2, C: 2, M: 2, P: 2, F: 2, H: 2, V: 2, W: 2, Y: 2,
  K: 1, J: 1, X: 1, Q: 1, Z: 1
};

export const PLAYER_AVATARS = [
  { id: 'cute-fox', icon: '🦊', label: 'Fox' },
  { id: 'cute-panda', icon: '🐼', label: 'Panda' },
  { id: 'cute-bunny', icon: '🐰', label: 'Bunny' },
  { id: 'cute-cat', icon: '🐱', label: 'Kitty' },
  { id: 'cute-dog', icon: '🐶', label: 'Puppy' },
  { id: 'cute-bear', icon: '🐻', label: 'Bear' },
  { id: 'cute-koala', icon: '🐨', label: 'Koala' },
  { id: 'cute-duck', icon: '🐥', label: 'Chirp' },
];

export const PLAYER_COLORS = [
  { id: 'coral', hex: '#FF385C', name: 'Coral Rose', bg: 'bg-[#FFF0F2]', border: 'border-[#FF385C]' },
  { id: 'sky', hex: '#0EA5E9', name: 'Sky Blue', bg: 'bg-[#F0F9FF]', border: 'border-[#0EA5E9]' },
  { id: 'mint', hex: '#10B981', name: 'Fresh Mint', bg: 'bg-[#ECFDF5]', border: 'border-[#10B981]' },
  { id: 'purple', hex: '#8B5CF6', name: 'Lavender', bg: 'bg-[#F5F3FF]', border: 'border-[#8B5CF6]' },
  { id: 'tangerine', hex: '#F97316', name: 'Tangerine', bg: 'bg-[#FFF7ED]', border: 'border-[#F97316]' },
];

/**
 * Generates a balanced bag of starting letters (default 40 tiles).
 */
export function generateInitialTileBag(count: number = 40): string[] {
  const vowels = ['A', 'E', 'I', 'O', 'U'];
  const consonants = Object.keys(LETTER_FREQUENCIES).filter(l => !vowels.includes(l));

  const vowelBag: string[] = [];
  vowels.forEach(v => {
    for (let i = 0; i < (LETTER_FREQUENCIES[v] || 1); i++) {
      vowelBag.push(v);
    }
  });

  const consonantBag: string[] = [];
  consonants.forEach(c => {
    for (let i = 0; i < (LETTER_FREQUENCIES[c] || 1); i++) {
      consonantBag.push(c);
    }
  });

  const vowelCount = Math.round(count * 0.38); // ~15 vowels
  const consonantCount = count - vowelCount;   // ~25 consonants

  const tiles: string[] = [];

  for (let i = 0; i < vowelCount; i++) {
    const randomVowel = vowelBag[Math.floor(Math.random() * vowelBag.length)];
    tiles.push(randomVowel);
  }

  for (let i = 0; i < consonantCount; i++) {
    const randomConsonant = consonantBag[Math.floor(Math.random() * consonantBag.length)];
    tiles.push(randomConsonant);
  }

  return tiles.sort(() => Math.random() - 0.5);
}

/**
 * Calculates score for a word based on letter values, length multiplier, and duplicate penalty.
 */
export function calculateWordScore(word: string, isDuplicate: boolean): number {
  const upper = word.toUpperCase();
  let baseScore = 0;
  for (const char of upper) {
    baseScore += LETTER_VALUES[char] || 1;
  }

  // Length multipliers: 4 letters = 1.0x, 5 letters = 1.3x, 6 letters = 1.6x, 7+ letters = 2.0x
  let lengthMultiplier = 1.0;
  if (upper.length === 5) lengthMultiplier = 1.3;
  else if (upper.length === 6) lengthMultiplier = 1.6;
  else if (upper.length >= 7) lengthMultiplier = 2.0;

  let total = Math.round(baseScore * lengthMultiplier * 10);

  if (isDuplicate) {
    // If a word was already used by someone else, subtract half of those points (-50%)
    total = -Math.round(total * 0.5);
  }

  return total;
}
