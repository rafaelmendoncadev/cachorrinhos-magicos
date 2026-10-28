import React from 'react';
import { JOURNEY_THEMES } from '../data/constants';
import { LangCode, t } from '../data/i18n';
import { Lock, CheckCircle2, Sparkles, Play } from 'lucide-react';

interface JourneyModalProps {
  currentLevel: number;
  selectedThemeId: number;
  lang: LangCode;
  onSelectTheme: (themeId: number) => void;
  onJumpToLevel: (level: number) => void;
  onClose: () => void;
}

export const JourneyModal: React.FC<JourneyModalProps> = ({
  currentLevel,
  selectedThemeId,
  lang,
  onSelectTheme,
  onJumpToLevel,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-slate-900 border-2 border-purple-500/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 border-b border-purple-500/30">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-black text-white">
                {t(lang, 'home.tab_journey')} (300 {lang === 'pt' ? 'Fases' : 'Levels'})
              </h2>
              <p className="text-xs text-purple-200/80">
                {lang === 'pt'
                  ? 'Explore os capítulos mágicos, desbloqueie cenários ou salte para qualquer fase!'
                  : 'Explore magical chapters, equip themes or jump to any level!'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-bold border border-slate-600 transition"
          >
            ✕
          </button>
        </div>

        {/* Chapters List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {JOURNEY_THEMES.map((theme) => {
            const isUnlocked = currentLevel >= theme.unlockLevel;
            const isEquipped = selectedThemeId === theme.id;

            return (
              <div
                key={theme.id}
                className={`relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border transition-all bg-gradient-to-r ${
                  theme.gradient
                } ${
                  isEquipped
                    ? 'border-amber-400 ring-2 ring-amber-400/40'
                    : isUnlocked
                    ? 'border-white/20 hover:border-white/40'
                    : 'border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/20 flex items-center justify-center text-2xl shadow-inner shrink-0">
                    {theme.iconEmoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/40 text-amber-300 border border-amber-400/30">
                        {lang === 'pt' ? theme.chapterPt : theme.chapterEn}
                      </span>
                      {isUnlocked ? (
                        <span className="flex items-center gap-1 text-xs font-bold text-emerald-300">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {lang === 'pt' ? 'Desbloqueado' : 'Unlocked'}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-bold text-amber-300/80">
                          <Lock className="w-3.5 h-3.5" />
                          Lv. {theme.unlockLevel}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-black text-white mt-1">
                      {lang === 'pt' ? theme.namePt : theme.nameEn}
                    </h3>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {lang === 'pt' ? theme.ambientDescPt : theme.ambientDescEn}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      onSelectTheme(theme.id);
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-extrabold transition border ${
                      isEquipped
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow'
                        : 'bg-white/10 hover:bg-white/20 text-white border-white/25'
                    }`}
                  >
                    {isEquipped
                      ? lang === 'pt'
                        ? 'Tema Ativo'
                        : 'Active Theme'
                      : lang === 'pt'
                      ? 'Usar Tema'
                      : 'Use Theme'}
                  </button>

                  <button
                    onClick={() => {
                      onJumpToLevel(theme.unlockLevel);
                      onClose();
                    }}
                    className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Lv. {theme.unlockLevel}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
