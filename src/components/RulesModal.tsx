import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { COPY, Language } from '../utils/gameLogic';

interface RulesModalProps {
  isOpen: boolean;
  language: Language;
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ isOpen, language, onClose }) => {
  const t = COPY[language];

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rules-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
          <h2 id="rules-modal-title" className="font-display text-2xl font-bold text-slate-900">
            {t.rulesTitle}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="p-2 -mr-2 -mt-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors focus-visible:outline-2 focus-visible:outline-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ol className="mt-5 space-y-3.5 text-[15px] leading-relaxed text-slate-700">
          {t.rulesSteps.map((step, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <span className="font-mono-tabular text-xs font-semibold text-slate-500 pt-1 shrink-0">
                0{idx + 1}.
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>

        <p className="mt-6 pt-4 border-t border-slate-200 text-xs text-slate-500">
          {t.keyboardTip}
        </p>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
