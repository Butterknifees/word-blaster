// AI Bot Simulator with dynamic word scarcity scaling & human-like endgame pacing

import { findPlayableWords } from '../dictionary/words';
import { calculateWordScore } from '../config/letterDistribution';
import { submitWordPlay } from './firestoreService';
import type { GameRoom, Player } from '../types/game';

interface BotTimer {
  playerId: string;
  timeout: NodeJS.Timeout;
}

const activeBotTimers: Map<string, BotTimer> = new Map();

export function stopAllBots() {
  activeBotTimers.forEach((timer) => {
    clearTimeout(timer.timeout);
  });
  activeBotTimers.clear();
}

export function manageBotTurn(
  room: GameRoom,
  botPlayer: Player,
  isHost: boolean
) {
  // Only the host machine orchestrates bot thinking to avoid duplicates across tabs
  if (!isHost || room.status !== 'playing') {
    return;
  }

  // If a move is already scheduled and running for this bot, do NOT reset it
  if (activeBotTimers.has(botPlayer.id)) {
    return;
  }

  if (botPlayer.tilesRemaining <= 0) {
    return;
  }

  // 1. Base response times by difficulty
  let baseDelay = 7000 + Math.random() * 3000; // Easy: 7s - 10s
  if (botPlayer.botDifficulty === 'medium') {
    baseDelay = 4500 + Math.random() * 2500; // Medium: 4.5s - 7.0s
  } else if (botPlayer.botDifficulty === 'hard') {
    baseDelay = 3000 + Math.random() * 1800; // Hard: 3.0s - 4.8s
  }

  // 2. Tile Scarcity Scaling: Takes 1.5x more time if they have less than 10 tiles
  const tilesLeft = botPlayer.tilesRemaining;
  let tileScarcityMultiplier = 1.0;
  if (tilesLeft < 10) {
    tileScarcityMultiplier = 1.5; // 1.5x more time when under 10 tiles
  } else if (tilesLeft < 20) {
    tileScarcityMultiplier = 1.2;
  }

  // 3. Playable Words Scarcity: When fewer words can be made from current tiles, add extra thinking time
  const playableCheck = findPlayableWords(botPlayer.tiles, room.minWordLength, 15);
  let wordScarcityBonusMs = 0;
  if (playableCheck.length <= 2 && playableCheck.length > 0) {
    // Very few playable combinations: +2.5s to 4s extra thinking pause
    wordScarcityBonusMs = 2500 + Math.random() * 1500;
  } else if (playableCheck.length <= 5) {
    // Few combinations: +1.2s to 2s
    wordScarcityBonusMs = 1200 + Math.random() * 1000;
  }

  const finalDelay = Math.round((baseDelay * tileScarcityMultiplier) + wordScarcityBonusMs);

  const timeout = setTimeout(async () => {
    activeBotTimers.delete(botPlayer.id);

    if (room.status !== 'playing') return;

    try {
      const playable = findPlayableWords(botPlayer.tiles, room.minWordLength, 20);

      if (playable.length > 0) {
        let candidates = [...playable];

        if (botPlayer.botDifficulty === 'hard') {
          const nonDuplicates = candidates.filter((w) => !room.allWordsPlayed.includes(w.toUpperCase()));
          if (nonDuplicates.length > 0) {
            candidates = nonDuplicates;
          }
          candidates.sort((a, b) => b.length - a.length);
        } else if (botPlayer.botDifficulty === 'medium') {
          const shortWords = candidates.filter((w) => w.length <= 5);
          if (shortWords.length > 0) {
            candidates = shortWords;
          }
        } else {
          const fourLetterWords = candidates.filter((w) => w.length === 4);
          if (fourLetterWords.length > 0) {
            candidates = fourLetterWords;
          }
        }

        const selectedWord = candidates[Math.floor(Math.random() * candidates.length)];
        const isDuplicate = room.allWordsPlayed.includes(selectedWord.toUpperCase());
        const score = calculateWordScore(selectedWord, isDuplicate);

        console.log(
          `[Bot Action] ${botPlayer.name} (${tilesLeft} tiles, ${playable.length} words left, delay: ${finalDelay}ms) -> ${selectedWord} (${score} pts)`
        );
        await submitWordPlay(room.id, botPlayer.id, selectedWord, score, isDuplicate);
      }
    } catch (e) {
      console.warn('[Bot Error]:', e);
    }
  }, finalDelay);

  activeBotTimers.set(botPlayer.id, { playerId: botPlayer.id, timeout });
}
