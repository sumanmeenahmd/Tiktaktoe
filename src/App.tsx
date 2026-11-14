import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  Cpu,
  HelpCircle,
  Minus,
  RotateCcw,
  Undo2,
  User,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { GameBoard } from './components/GameBoard';
import { RulesModal } from './components/RulesModal';
import {
  CELL_COORDS,
  COPY,
  CellValue,
  Difficulty,
  Language,
  MoveRecord,
  PlayerSymbol,
  ScoreBoard,
  computeComputerMove,
  evaluateBoard,
} from './utils/gameLogic';
import { soundFx } from './utils/soundFx';

const EMPTY_BOARD: CellValue[] = Array(9).fill(null);
const STORAGE_KEY = 'tik_tay_toy_state_v1';

interface SavedPrefs {
  scores: ScoreBoard;
  difficulty: Difficulty;
  language: Language;
  soundEnabled: boolean;
}

function loadSavedPrefs(): SavedPrefs {
  const fallback: SavedPrefs = {
    scores: { player: 0, computer: 0, draws: 0, streak: 0 },
    difficulty: 'medium',
    language: 'en',
    soundEnabled: true,
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<SavedPrefs>;
    return {
      scores: {
        player: typeof parsed.scores?.player === 'number' ? parsed.scores.player : 0,
        computer: typeof parsed.scores?.computer === 'number' ? parsed.scores.computer : 0,
        draws: typeof parsed.scores?.draws === 'number' ? parsed.scores.draws : 0,
        streak: typeof parsed.scores?.streak === 'number' ? parsed.scores.streak : 0,
      },
      difficulty:
        parsed.difficulty === 'easy' ||
        parsed.difficulty === 'medium' ||
        parsed.difficulty === 'unbeatable'
          ? parsed.difficulty
          : 'medium',
      language: parsed.language === 'hinglish' ? 'hinglish' : 'en',
      soundEnabled: typeof parsed.soundEnabled === 'boolean' ? parsed.soundEnabled : true,
    };
  } catch {
    return fallback;
  }
}

export default function App() {
  const initialPrefs = useMemo(() => loadSavedPrefs(), []);

  const [board, setBoard] = useState<CellValue[]>(EMPTY_BOARD);
  const [playerSymbol, setPlayerSymbol] = useState<PlayerSymbol>('X');
  const [turnSymbol, setTurnSymbol] = useState<PlayerSymbol>('X');
  const [difficulty, setDifficulty] = useState<Difficulty>(initialPrefs.difficulty);
  const [language, setLanguage] = useState<Language>(initialPrefs.language);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(initialPrefs.soundEnabled);
  const [scores, setScores] = useState<ScoreBoard>(initialPrefs.scores);
  const [moves, setMoves] = useState<MoveRecord[]>([]);
  const [isRulesOpen, setIsRulesOpen] = useState<boolean>(false);

  const scoredRoundRef = useRef<boolean>(false);

  const aiSymbol: PlayerSymbol = playerSymbol === 'X' ? 'O' : 'X';
  const winResult = useMemo(() => evaluateBoard(board), [board]);
  const isRoundOver = winResult.winner !== null;
  const isComputerTurn = !isRoundOver && turnSymbol === aiSymbol;
  const isPlayerTurn = !isRoundOver && turnSymbol === playerSymbol;
  const lastMoveIndex = moves.length > 0 ? moves[moves.length - 1].cellIndex : null;

  const t = COPY[language];

  // Sync audio preference
  useEffect(() => {
    soundFx.setEnabled(soundEnabled);
  }, [soundEnabled]);

  // Persist scoreboard and preferences
  useEffect(() => {
    try {
      const payload: SavedPrefs = {
        scores,
        difficulty,
        language,
        soundEnabled,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota issues
    }
  }, [scores, difficulty, language, soundEnabled]);

  // Score update & result chime when a round concludes
  useEffect(() => {
    if (!winResult.winner || scoredRoundRef.current) return;
    scoredRoundRef.current = true;

    if (winResult.winner === playerSymbol) {
      soundFx.playWin();
      setScores((prev) => ({
        ...prev,
        player: prev.player + 1,
        streak: prev.streak + 1,
      }));
    } else if (winResult.winner === aiSymbol) {
      soundFx.playLoss();
      setScores((prev) => ({
        ...prev,
        computer: prev.computer + 1,
        streak: 0,
      }));
    } else {
      soundFx.playDraw();
      setScores((prev) => ({
        ...prev,
        draws: prev.draws + 1,
      }));
    }
  }, [winResult.winner, playerSymbol, aiSymbol]);

  // Computer turn automation with realistic thinking delay
  useEffect(() => {
    if (!isComputerTurn) return;

    const delayMs = moves.length === 0 ? 420 : 540;
    const timer = window.setTimeout(() => {
      const chosenCell = computeComputerMove(board, difficulty, aiSymbol);
      if (chosenCell === null) return;

      setBoard((prev) => {
        if (prev[chosenCell] !== null) return prev;
        const next = [...prev];
        next[chosenCell] = aiSymbol;
        return next;
      });
      setMoves((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          actor: 'computer',
          symbol: aiSymbol,
          cellIndex: chosenCell,
          coord: CELL_COORDS[chosenCell],
        },
      ]);
      setTurnSymbol(playerSymbol);
      soundFx.playComputerMove();
    }, delayMs);

    return () => window.clearTimeout(timer);
  }, [isComputerTurn, board, difficulty, aiSymbol, playerSymbol, moves.length]);

  const startNewRound = useCallback(
    (nextPlayerSymbol: PlayerSymbol = playerSymbol) => {
      scoredRoundRef.current = false;
      setBoard(EMPTY_BOARD);
      setMoves([]);
      setTurnSymbol('X'); // X always goes first in Tic-Tac-Toe
      if (nextPlayerSymbol !== playerSymbol) {
        setPlayerSymbol(nextPlayerSymbol);
      }
      soundFx.playReset();
    },
    [playerSymbol]
  );

  const handlePlayerMove = useCallback(
    (index: number) => {
      if (!isPlayerTurn || board[index] !== null) return;

      setBoard((prev) => {
        if (prev[index] !== null) return prev;
        const next = [...prev];
        next[index] = playerSymbol;
        return next;
      });
      setMoves((prev) => [
        ...prev,
        {
          step: prev.length + 1,
          actor: 'player',
          symbol: playerSymbol,
          cellIndex: index,
          coord: CELL_COORDS[index],
        },
      ]);
      setTurnSymbol(aiSymbol);
      soundFx.playPlayerMove();
    },
    [isPlayerTurn, board, playerSymbol, aiSymbol]
  );

  const handleUndoTurn = useCallback(() => {
    if (isRoundOver || isComputerTurn) return;
    const lastPlayerMoveIdx = [...moves]
      .reverse()
      .findIndex((m) => m.actor === 'player');
    if (lastPlayerMoveIdx === -1) return;

    const cutIndex = moves.length - 1 - lastPlayerMoveIdx;
    const keptMoves = moves.slice(0, cutIndex);
    const rebuiltBoard: CellValue[] = Array(9).fill(null);
    for (const move of keptMoves) {
      rebuiltBoard[move.cellIndex] = move.symbol;
    }

    setBoard(rebuiltBoard);
    setMoves(keptMoves);
    setTurnSymbol(playerSymbol);
    soundFx.playReset();
  }, [isRoundOver, isComputerTurn, moves, playerSymbol]);

  const handleDifficultyChange = (nextDiff: Difficulty) => {
    if (nextDiff === difficulty) return;
    setDifficulty(nextDiff);
    if (moves.length > 0 || isRoundOver) {
      startNewRound(playerSymbol);
    }
  };

  const handleSideChange = (nextSide: PlayerSymbol) => {
    if (nextSide === playerSymbol) return;
    startNewRound(nextSide);
  };

  const handleResetScores = () => {
    setScores({ player: 0, computer: 0, draws: 0, streak: 0 });
    soundFx.playReset();
  };

  // Keyboard shortcuts 1-9 for squares
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isRulesOpen) return;
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (event.key >= '1' && event.key <= '9') {
        const cellIdx = Number(event.key) - 1;
        handlePlayerMove(cellIdx);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handlePlayerMove, isRulesOpen]);

  const canUndo =
    !isRoundOver && !isComputerTurn && moves.some((m) => m.actor === 'player');

  // Determine clear non-hue-only status banner state
  let statusText: string = t.yourTurn;
  let statusTone = 'bg-white border-slate-200 text-slate-900';
  let statusIcon = <User className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />;

  if (winResult.winner === playerSymbol) {
    statusText = t.youWin;
    statusTone = 'bg-emerald-50 border-emerald-300 text-emerald-900';
    statusIcon = <Award className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />;
  } else if (winResult.winner === aiSymbol) {
    statusText = t.computerWins;
    statusTone = 'bg-rose-50 border-rose-300 text-rose-900';
    statusIcon = <Cpu className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />;
  } else if (winResult.winner === 'DRAW') {
    statusText = t.drawResult;
    statusTone = 'bg-amber-50 border-amber-300 text-amber-900';
    statusIcon = <Minus className="w-4 h-4 text-amber-700 shrink-0" aria-hidden="true" />;
  } else if (isComputerTurn) {
    statusText = t.computerThinking;
    statusTone = 'bg-slate-100 border-slate-300 text-slate-800';
    statusIcon = <Cpu className="w-4 h-4 text-slate-700 shrink-0" aria-hidden="true" />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f4f5f7] text-slate-900">
      {/* Top Bar: Strict 3-zone contract */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          <a
            href="#top"
            className="font-display text-xl font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0"
          >
            {t.brand}
          </a>

          <nav aria-label="Primary" className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setIsRulesOpen(true)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-slate-900"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span>{t.howToPlay}</span>
            </button>
          </nav>

          <div className="shrink-0">
            <button
              type="button"
              onClick={() => startNewRound(playerSymbol)}
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
            >
              {t.newMatch}
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Arena */}
      <main id="top" className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* Left / Focal Column: Status, 3x3 Board, Round Actions */}
          <section
            aria-label="Game Arena"
            className="lg:col-span-7 flex flex-col items-center lg:items-stretch"
          >
            <div className="w-full max-w-[420px] mx-auto">
              <div className="mb-5">
                <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 text-balance">
                  {t.brand}
                </h1>
                <p className="mt-1.5 text-[15px] text-slate-600 leading-relaxed">
                  {t.subtitle}
                </p>
              </div>

              {/* Explicit Turn / Outcome Banner */}
              <div
                role="status"
                aria-live="polite"
                className={`mb-5 px-4 py-3 rounded-xl border flex items-center justify-between gap-3 transition-colors duration-150 ${statusTone}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {statusIcon}
                  <span className="text-sm font-semibold truncate">{statusText}</span>
                </div>
                <span className="font-mono-tabular text-xs font-medium text-slate-500 whitespace-nowrap shrink-0">
                  {playerSymbol} vs {aiSymbol}
                </span>
              </div>

              {/* Precision 3x3 Board */}
              <GameBoard
                board={board}
                playerSymbol={playerSymbol}
                winningLine={winResult.line}
                winningLineIndex={winResult.lineIndex}
                winner={winResult.winner}
                isPlayerTurn={isPlayerTurn}
                isDisabled={isRoundOver || isComputerTurn}
                lastMoveIndex={lastMoveIndex}
                onCellClick={handlePlayerMove}
              />

              {/* Primary Round Actions */}
              <div className="mt-5 flex items-center justify-between gap-3">
                {isRoundOver ? (
                  <button
                    type="button"
                    onClick={() => startNewRound(playerSymbol)}
                    className="w-full py-3 px-5 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    <span>{t.playAgain}</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!canUndo}
                      onClick={handleUndoTurn}
                      className="flex-1 py-2.5 px-4 inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                      <Undo2 className="w-4 h-4" aria-hidden="true" />
                      <span>{t.undoMove}</span>
                    </button>

                    <button
                      type="button"
                      disabled={moves.length === 0}
                      onClick={() => startNewRound(playerSymbol)}
                      className="flex-1 py-2.5 px-4 inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-800 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 disabled:opacity-45 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
                    >
                      <RotateCcw className="w-4 h-4" aria-hidden="true" />
                      <span>{t.newMatch}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Right Column: Single-Elevation Control & Telemetry Panel */}
          <aside
            aria-label="Match Controls and Scoreboard"
            className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6"
          >
            {/* 1. Scoreboard */}
            <div>
              <div className="flex items-center justify-between gap-4 mb-3">
                <h2 className="text-sm font-semibold text-slate-900">
                  {t.scoreboardLabel}
                </h2>
                <button
                  type="button"
                  onClick={handleResetScores}
                  disabled={
                    scores.player === 0 && scores.computer === 0 && scores.draws === 0
                  }
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-40 disabled:pointer-events-none transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {t.resetScores}
                </button>
              </div>

              <div className="grid grid-cols-3 divide-x divide-slate-200 py-2 border-y border-slate-200">
                <div className="pr-3">
                  <div className="text-xs text-slate-500">
                    {t.you} ({playerSymbol})
                  </div>
                  <div
                    className={`mt-1 font-mono-tabular text-2xl font-semibold ${
                      playerSymbol === 'X' ? 'text-rose-600' : 'text-blue-600'
                    }`}
                  >
                    {scores.player}
                  </div>
                </div>

                <div className="px-3 text-center">
                  <div className="text-xs text-slate-500">{t.draws}</div>
                  <div className="mt-1 font-mono-tabular text-2xl font-semibold text-slate-800">
                    {scores.draws}
                  </div>
                </div>

                <div className="pl-3 text-right">
                  <div className="text-xs text-slate-500">
                    {t.computer} ({aiSymbol})
                  </div>
                  <div
                    className={`mt-1 font-mono-tabular text-2xl font-semibold ${
                      aiSymbol === 'X' ? 'text-rose-600' : 'text-blue-600'
                    }`}
                  >
                    {scores.computer}
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
                <span>{t.winStreak}</span>
                <span className="font-mono-tabular font-semibold text-slate-800">
                  {scores.streak}
                </span>
              </div>
            </div>

            {/* 2. Computer Difficulty */}
            <div className="pt-5 border-t border-slate-200">
              <label className="block text-sm font-semibold text-slate-900 mb-2.5">
                {t.difficultyLabel}
              </label>
              <div
                role="group"
                aria-label={t.difficultyLabel}
                className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl"
              >
                {(['easy', 'medium', 'unbeatable'] as Difficulty[]).map((level) => {
                  const active = difficulty === level;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => handleDifficultyChange(level)}
                      aria-pressed={active}
                      className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {t.difficulties[level]}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                {t.difficultyHint[difficulty]}
              </p>
            </div>

            {/* 3. Play As Side */}
            <div className="pt-5 border-t border-slate-200">
              <label className="block text-sm font-semibold text-slate-900 mb-2.5">
                {t.sideLabel}
              </label>
              <div
                role="group"
                aria-label={t.sideLabel}
                className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl"
              >
                <button
                  type="button"
                  onClick={() => handleSideChange('X')}
                  aria-pressed={playerSymbol === 'X'}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 ${
                    playerSymbol === 'X'
                      ? 'bg-white text-rose-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  X · {t.goesFirst}
                </button>
                <button
                  type="button"
                  onClick={() => handleSideChange('O')}
                  aria-pressed={playerSymbol === 'O'}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900 ${
                    playerSymbol === 'O'
                      ? 'bg-white text-blue-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  O · {t.goesSecond}
                </button>
              </div>
            </div>

            {/* 4. Language & Sound */}
            <div className="pt-5 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap">
              <div
                role="group"
                aria-label={t.languageLabel}
                className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg"
              >
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  aria-pressed={language === 'en'}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    language === 'en'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('hinglish')}
                  aria-pressed={language === 'hinglish'}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    language === 'hinglish'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hinglish
                </button>
              </div>

              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                aria-pressed={soundEnabled}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-slate-900"
              >
                {soundEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                )}
                <span>{soundEnabled ? t.soundOn : t.soundOff}</span>
              </button>
            </div>

            {/* 5. Current Round Move Log */}
            <div className="pt-5 border-t border-slate-200">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <h2 className="text-sm font-semibold text-slate-900">
                  {t.moveLogLabel}
                </h2>
                <span className="font-mono-tabular text-xs text-slate-500">
                  {moves.length}/9
                </span>
              </div>

              {moves.length === 0 ? (
                <p className="text-xs text-slate-500 leading-relaxed">{t.noMovesYet}</p>
              ) : (
                <ol className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                  {moves.map((move) => (
                    <li
                      key={move.step}
                      className="flex items-center justify-between py-1 border-b border-slate-100 text-slate-700"
                    >
                      <span className="truncate">
                        <span className="font-mono-tabular text-slate-400 mr-1.5">
                          0{move.step}.
                        </span>
                        {move.actor === 'player' ? t.you : t.computer}
                      </span>
                      <span
                        className={`font-mono-tabular font-semibold shrink-0 ${
                          move.symbol === 'X' ? 'text-rose-600' : 'text-blue-600'
                        }`}
                      >
                        {move.symbol} · {move.coord}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </aside>
        </div>
      </main>

      <RulesModal
        isOpen={isRulesOpen}
        language={language}
        onClose={() => setIsRulesOpen(false)}
      />
    </div>
  );
}
