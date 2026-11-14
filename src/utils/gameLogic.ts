export type PlayerSymbol = 'X' | 'O';
export type CellValue = PlayerSymbol | null;
export type Difficulty = 'easy' | 'medium' | 'unbeatable';
export type Language = 'en' | 'hinglish';
export type GamePhase = 'PLAYING' | 'ROUND_OVER';

export interface WinResult {
  winner: PlayerSymbol | 'DRAW' | null;
  line: [number, number, number] | null;
  lineIndex: number | null;
}

export interface MoveRecord {
  step: number;
  actor: 'player' | 'computer';
  symbol: PlayerSymbol;
  cellIndex: number;
  coord: string;
}

export interface ScoreBoard {
  player: number;
  computer: number;
  draws: number;
  streak: number;
}

export const WIN_LINES: [number, number, number][] = [
  [0, 1, 2], // Top row
  [3, 4, 5], // Middle row
  [6, 7, 8], // Bottom row
  [0, 3, 6], // Left column
  [1, 4, 7], // Center column
  [2, 5, 8], // Right column
  [0, 4, 8], // Diagonal TL-BR
  [2, 4, 6], // Diagonal TR-BL
];

export const CELL_COORDS = ['A1', 'B1', 'C1', 'A2', 'B2', 'C2', 'A3', 'B3', 'C3'] as const;

export function evaluateBoard(board: CellValue[]): WinResult {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return {
        winner: board[a],
        line: [a, b, c],
        lineIndex: i,
      };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { winner: 'DRAW', line: null, lineIndex: null };
  }

  return { winner: null, line: null, lineIndex: null };
}

export function getAvailableCells(board: CellValue[]): number[] {
  const indices: number[] = [];
  for (let i = 0; i < board.length; i++) {
    if (board[i] === null) indices.push(i);
  }
  return indices;
}

function findImmediateWinningMove(board: CellValue[], symbol: PlayerSymbol): number | null {
  const available = getAvailableCells(board);
  for (const idx of available) {
    const next = [...board];
    next[idx] = symbol;
    if (evaluateBoard(next).winner === symbol) {
      return idx;
    }
  }
  return null;
}

function pickRandom<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function minimax(
  board: CellValue[],
  depth: number,
  isMaximizing: boolean,
  aiSymbol: PlayerSymbol,
  humanSymbol: PlayerSymbol,
  alpha: number,
  beta: number
): number {
  const { winner } = evaluateBoard(board);
  if (winner === aiSymbol) return 10 - depth;
  if (winner === humanSymbol) return depth - 10;
  if (winner === 'DRAW') return 0;

  const available = getAvailableCells(board);

  if (isMaximizing) {
    let best = -Infinity;
    for (const idx of available) {
      board[idx] = aiSymbol;
      const score = minimax(board, depth + 1, false, aiSymbol, humanSymbol, alpha, beta);
      board[idx] = null;
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  } else {
    let best = Infinity;
    for (const idx of available) {
      board[idx] = humanSymbol;
      const score = minimax(board, depth + 1, true, aiSymbol, humanSymbol, alpha, beta);
      board[idx] = null;
      best = Math.min(best, score);
      beta = Math.min(beta, best);
      if (beta <= alpha) break;
    }
    return best;
  }
}

export function computeComputerMove(
  board: CellValue[],
  difficulty: Difficulty,
  aiSymbol: PlayerSymbol
): number | null {
  const available = getAvailableCells(board);
  if (available.length === 0) return null;

  const humanSymbol: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';

  if (difficulty === 'easy') {
    // Easy: takes an immediate win 40% of the time, otherwise plays randomly
    const winningMove = findImmediateWinningMove(board, aiSymbol);
    if (winningMove !== null && Math.random() < 0.4) {
      return winningMove;
    }
    return pickRandom(available);
  }

  if (difficulty === 'medium') {
    // Medium: always takes winning move, blocks human 75% of the time, prefers center/corners
    const winningMove = findImmediateWinningMove(board, aiSymbol);
    if (winningMove !== null) return winningMove;

    const blockMove = findImmediateWinningMove(board, humanSymbol);
    if (blockMove !== null && Math.random() < 0.75) {
      return blockMove;
    }

    if (board[4] === null && Math.random() < 0.65) return 4;
    const corners = [0, 2, 6, 8].filter((c) => board[c] === null);
    if (corners.length > 0 && Math.random() < 0.6) {
      return pickRandom(corners);
    }
    return pickRandom(available);
  }

  // Unbeatable: if board is completely empty, pick center or a corner for instant speed + variety
  if (available.length === 9) {
    return pickRandom([0, 2, 4, 6, 8]);
  }

  const workingBoard = [...board];
  let bestScore = -Infinity;
  let bestMoves: number[] = [];

  for (const idx of available) {
    workingBoard[idx] = aiSymbol;
    const score = minimax(workingBoard, 0, false, aiSymbol, humanSymbol, -Infinity, Infinity);
    workingBoard[idx] = null;

    if (score > bestScore) {
      bestScore = score;
      bestMoves = [idx];
    } else if (score === bestScore) {
      bestMoves.push(idx);
    }
  }

  return pickRandom(bestMoves);
}

export const COPY = {
  en: {
    brand: 'Tik Tay Toy',
    howToPlay: 'How to Play',
    newMatch: 'New Round',
    subtitle: 'Classic 3x3 strategy against an adaptive computer opponent.',
    yourTurn: 'Your turn — place your mark',
    computerThinking: 'Computer is thinking...',
    youWin: 'You won this round!',
    computerWins: 'Computer won this round',
    drawResult: 'Round ended in a draw',
    playAgain: 'Play Again',
    undoMove: 'Undo Turn',
    resetScores: 'Reset Scores',
    difficultyLabel: 'Computer Difficulty',
    difficulties: {
      easy: 'Easy',
      medium: 'Medium',
      unbeatable: 'Unbeatable',
    },
    difficultyHint: {
      easy: 'Relaxed play with occasional mistakes.',
      medium: 'Blocks obvious threats and takes openings.',
      unbeatable: 'Optimal Minimax play — win is impossible, draw is your best.',
    },
    sideLabel: 'Play As',
    goesFirst: 'Goes first',
    goesSecond: 'Computer starts',
    scoreboardLabel: 'Match Scoreboard',
    you: 'You',
    draws: 'Draws',
    computer: 'Computer',
    winStreak: 'Win Streak',
    moveLogLabel: 'Round Moves',
    noMovesYet: 'Make your opening move on the board or press keys 1–9.',
    soundOn: 'Sound On',
    soundOff: 'Muted',
    languageLabel: 'Language',
    rulesTitle: 'How to Play Tik Tay Toy',
    rulesSteps: [
      'Choose your side (X always moves first, O lets the Computer open) and pick a difficulty.',
      'Click any empty square on the 3x3 grid — or press number keys 1 to 9 — to place your mark.',
      'Align three of your marks horizontally, vertically, or diagonally before the Computer does.',
      'Use Undo Turn to step back a full round-trip if you want to test a different strategy.',
    ],
    close: 'Close',
    keyboardTip: 'Tip: Keys 1–9 map directly to squares A1–C3.',
  },
  hinglish: {
    brand: 'Tik Tay Toy',
    howToPlay: 'Khelne Ke Niyam',
    newMatch: 'Naya Round',
    subtitle: 'Computer ke saath classic 3x3 Tic-Tac-Toe kheliye.',
    yourTurn: 'Aapki baari — apna nishaan lagayein',
    computerThinking: 'Computer soch raha hai...',
    youWin: 'Badhai ho! Aap jeet gaye!',
    computerWins: 'Computer jeet gaya',
    drawResult: 'Match draw ho gaya',
    playAgain: 'Phir Se Khelein',
    undoMove: 'Peechhe Jayein',
    resetScores: 'Score Reset Karein',
    difficultyLabel: 'Computer Level',
    difficulties: {
      easy: 'Aasaan',
      medium: 'Madhyam',
      unbeatable: 'Mushkil',
    },
    difficultyHint: {
      easy: 'Aasaan level — computer kabhi kabhi galti karega.',
      medium: 'Smart level — aapki jeet rokne ki koshish karega.',
      unbeatable: 'Sabse tez AI — jeetna namumkin hai, draw karna target rakhein.',
    },
    sideLabel: 'Aapka Nishaan',
    goesFirst: 'Pehli chaal aapki',
    goesSecond: 'Pehli chaal computer ki',
    scoreboardLabel: 'Match Scoreboard',
    you: 'Aap',
    draws: 'Draw',
    computer: 'Computer',
    winStreak: 'Jeet Ki Streak',
    moveLogLabel: 'Is Round Ki Chaalein',
    noMovesYet: 'Board par click karein ya 1–9 dabakar shuru karein.',
    soundOn: 'Sound Chalu',
    soundOff: 'Mute',
    languageLabel: 'Bhasha',
    rulesTitle: 'Tik Tay Toy Kaise Khelein',
    rulesSteps: [
      'Apna nishaan chunein (X hamesha pehle chalta hai, O chunne par Computer shuru karega) aur level set karein.',
      'Khali dabbe par click karein ya keyboard par 1 se 9 number dabayein.',
      'Computer se pehle apni 3 X ya O ki line (seedhi, aadi, ya tirchi) banayein.',
      'Nayi strategy try karne ke liye Peechhe Jayein (Undo) button ka istemal kar sakte hain.',
    ],
    close: 'Band Karein',
    keyboardTip: 'Tip: Keyboard ki 1–9 keys seedha A1–C3 dabbon se judi hain.',
  },
} as const;
