import React from 'react';
import { CELL_COORDS, CellValue, PlayerSymbol } from '../utils/gameLogic';

interface GameBoardProps {
  board: CellValue[];
  playerSymbol: PlayerSymbol;
  winningLine: [number, number, number] | null;
  winningLineIndex: number | null;
  winner: PlayerSymbol | 'DRAW' | null;
  isPlayerTurn: boolean;
  isDisabled: boolean;
  lastMoveIndex: number | null;
  onCellClick: (index: number) => void;
}

const STRIKE_COORDS: Record<number, { x1: number; y1: number; x2: number; y2: number }> = {
  0: { x1: 22, y1: 47, x2: 278, y2: 47 },
  1: { x1: 22, y1: 150, x2: 278, y2: 150 },
  2: { x1: 22, y1: 253, x2: 278, y2: 253 },
  3: { x1: 47, y1: 22, x2: 47, y2: 278 },
  4: { x1: 150, y1: 22, x2: 150, y2: 278 },
  5: { x1: 253, y1: 22, x2: 253, y2: 278 },
  6: { x1: 26, y1: 26, x2: 274, y2: 274 },
  7: { x1: 274, y1: 26, x2: 26, y2: 274 },
};

function MarkSvg({
  symbol,
  isGhost = false,
  isWinning = false,
}: {
  symbol: PlayerSymbol;
  isGhost?: boolean;
  isWinning?: boolean;
}) {
  if (symbol === 'X') {
    const strokeColor = isGhost
      ? 'stroke-rose-500/30'
      : isWinning
        ? 'stroke-rose-600'
        : 'stroke-rose-600';

    return (
      <svg
        viewBox="0 0 64 64"
        className={`w-12 h-12 sm:w-14 sm:h-14 ${strokeColor}`}
        fill="none"
        aria-hidden="true"
      >
        <line
          x1="16"
          y1="16"
          x2="48"
          y2="48"
          strokeWidth="6.5"
          strokeLinecap="round"
          className={isGhost ? '' : 'animate-stroke-draw'}
        />
        <line
          x1="48"
          y1="16"
          x2="16"
          y2="48"
          strokeWidth="6.5"
          strokeLinecap="round"
          className={isGhost ? '' : 'animate-stroke-draw'}
        />
      </svg>
    );
  }

  const strokeColor = isGhost
    ? 'stroke-blue-600/30'
    : isWinning
      ? 'stroke-blue-600'
      : 'stroke-blue-600';

  return (
    <svg
      viewBox="0 0 64 64"
      className={`w-12 h-12 sm:w-14 sm:h-14 ${strokeColor}`}
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="32"
        cy="32"
        r="17"
        strokeWidth="6.5"
        strokeLinecap="round"
        className={isGhost ? '' : 'animate-stroke-draw'}
      />
    </svg>
  );
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  playerSymbol,
  winningLine,
  winningLineIndex,
  winner,
  isPlayerTurn,
  isDisabled,
  lastMoveIndex,
  onCellClick,
}) => {
  const strike = winningLineIndex !== null ? STRIKE_COORDS[winningLineIndex] : null;
  const strikeStroke =
    winner === 'X'
      ? '#e11d48'
      : winner === 'O'
        ? '#2563eb'
        : '#059669';

  return (
    <div className="relative w-full max-w-[380px] sm:max-w-[420px] aspect-square mx-auto select-none">
      <div
        role="grid"
        aria-label="Tic-Tac-Toe 3 by 3 board"
        className="grid grid-cols-3 grid-rows-3 gap-3 w-full h-full p-3.5 bg-slate-200/80 rounded-2xl border border-slate-300/80 shadow-sm"
      >
        {board.map((cell, index) => {
          const isWinningCell = winningLine?.includes(index) ?? false;
          const isLastMove = lastMoveIndex === index && !winner;
          const canClick = cell === null && isPlayerTurn && !isDisabled;

          let cellBg = 'bg-white hover:bg-slate-50 border-slate-200/90';
          if (isWinningCell) {
            cellBg =
              winner === 'X'
                ? 'bg-rose-50 border-rose-300'
                : 'bg-blue-50 border-blue-300';
          } else if (cell !== null) {
            cellBg = isLastMove
              ? 'bg-white border-slate-400 ring-1 ring-slate-300'
              : 'bg-white border-slate-200';
          } else if (!canClick) {
            cellBg = 'bg-white/90 border-slate-200/70';
          }

          return (
            <button
              key={index}
              type="button"
              disabled={!canClick}
              onClick={() => onCellClick(index)}
              aria-label={`Square ${CELL_COORDS[index]}, key ${index + 1}, ${
                cell ? `occupied by ${cell}` : 'empty'
              }`}
              className={`group relative flex items-center justify-center rounded-xl border transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 ${cellBg} ${
                canClick ? 'cursor-pointer active:scale-[0.97]' : 'cursor-default'
              }`}
            >
              <span
                aria-hidden="true"
                className="absolute top-1.5 left-2 text-[10px] font-mono-tabular text-slate-400 pointer-events-none"
              >
                {index + 1}
              </span>

              {cell !== null ? (
                <MarkSvg symbol={cell} isWinning={isWinningCell} />
              ) : canClick ? (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                  <MarkSvg symbol={playerSymbol} isGhost />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {strike && (
        <svg
          viewBox="0 0 300 300"
          className="absolute inset-0 w-full h-full p-3.5 pointer-events-none"
          aria-hidden="true"
        >
          <line
            x1={strike.x1}
            y1={strike.y1}
            x2={strike.x2}
            y2={strike.y2}
            stroke={strikeStroke}
            strokeWidth="7"
            strokeLinecap="round"
            className="animate-line-strike"
          />
        </svg>
      )}
    </div>
  );
};
