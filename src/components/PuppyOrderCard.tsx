import React from 'react';
import { PUPPY_CHARACTERS, POTION_COLORS } from '../data/constants';
import { PuppyOrder } from '../utils/levelEngine';
import { LangCode } from '../data/i18n';
import { Check, Sparkles } from 'lucide-react';

interface PuppyOrderCardProps {
  order: PuppyOrder;
  lang: LangCode;
  colorblindMode: boolean;
  isHighlighted: boolean;
}

export const PuppyOrderCard: React.FC<PuppyOrderCardProps> = ({
  order,
  lang,
  colorblindMode,
  isHighlighted,
}) => {
  const puppy = PUPPY_CHARACTERS[order.puppyId % PUPPY_CHARACTERS.length];
  const colorSpec =
    order.targetColor !== null ? POTION_COLORS[order.targetColor] : null;

  if (order.targetColor === null || !colorSpec) {
    return (
      <div className="relative flex flex-col items-center justify-center h-20 sm:h-24 rounded-2xl bg-slate-900/50 border border-slate-700/40 p-1.5 opacity-60 transition-all">
        <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-0.5">
          <Check className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-bold text-slate-400 text-center">
          {lang === 'pt' ? 'Satisfeito!' : 'Served!'}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col items-center justify-between h-20 sm:h-24 rounded-2xl p-1.5 sm:p-2 transition-all duration-300 border shadow-lg overflow-hidden ${
        order.isDelivering
          ? 'scale-105 ring-2 ring-amber-300 bg-amber-950/60 border-amber-400'
          : isHighlighted
          ? 'ring-2 ring-amber-400/80 bg-slate-800/90 border-amber-300/80'
          : 'bg-slate-900/85 border-slate-700/70 hover:border-slate-500/80'
      }`}
    >
      {/* Top ambient glow in potion color */}
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-24 h-14 rounded-full blur-xl opacity-35 pointer-events-none"
        style={{ backgroundColor: colorSpec.hexTop }}
      />

      {/* Puppy Avatar SVG with Wizard Hat */}
      <div className="relative z-10 flex items-center gap-1.5 w-full">
        <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0 animate-dogBounce">
          <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow">
            {/* Wizard Hat Brim & Cone */}
            <path
              d="M12 24 L32 3 L52 24 Z"
              fill={puppy.hatColor}
              stroke="#fde047"
              strokeWidth="1.5"
            />
            <ellipse
              cx="32"
              cy="24"
              rx="22"
              ry="5"
              fill={puppy.hatColor}
              stroke="#fde047"
              strokeWidth="1.5"
            />
            <circle cx="32" cy="14" r="2.5" fill="#fde047" />

            {/* Floppy Ears */}
            <ellipse
              cx="15"
              cy="37"
              rx="6"
              ry="11"
              transform="rotate(15 15 37)"
              fill={puppy.earColor}
            />
            <ellipse
              cx="49"
              cy="37"
              rx="6"
              ry="11"
              transform="rotate(-15 49 37)"
              fill={puppy.earColor}
            />

            {/* Puppy Head */}
            <circle cx="32" cy="39" r="15" fill={puppy.furColor} />

            {/* Cute Cheeks */}
            <circle cx="22" cy="43" r="3" fill="#f43f5e" opacity="0.45" />
            <circle cx="42" cy="43" r="3" fill="#f43f5e" opacity="0.45" />

            {/* Eyes */}
            <circle cx="26" cy="37" r="2.6" fill="#0f172a" />
            <circle cx="25.2" cy="36.2" r="0.9" fill="#ffffff" />
            <circle cx="38" cy="37" r="2.6" fill="#0f172a" />
            <circle cx="37.2" cy="36.2" r="0.9" fill="#ffffff" />

            {/* Snout & Nose */}
            <ellipse cx="32" cy="43" rx="6" ry="4.5" fill="#fffbeb" />
            <ellipse cx="32" cy="41.5" rx="2.8" ry="2" fill="#1e293b" />
            <path
              d="M29 44.5 Q32 47 35 44.5"
              stroke="#1e293b"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-extrabold text-white truncate">
            {lang === 'pt' ? puppy.namePt : puppy.nameEn}
          </span>
          <span className="text-[10px] text-slate-300 truncate leading-tight">
            {lang === 'pt' ? colorSpec.namePt : colorSpec.nameEn}
          </span>
        </div>
      </div>

      {/* Requested Potion Box / Tray */}
      <div
        className="relative z-10 w-full rounded-xl px-2.5 py-1.5 flex items-center justify-between border shadow-inner transition-transform"
        style={{
          background: `linear-gradient(135deg, ${colorSpec.hexTop} 0%, ${colorSpec.hexBody} 100%)`,
          borderColor: 'rgba(255,255,255,0.45)',
        }}
      >
        <div className="flex items-center gap-1.5">
          {/* Mini Potion Bottle Icon */}
          <div className="w-5 h-5 rounded-md bg-black/25 flex items-center justify-center text-xs font-bold text-white shadow-sm">
            {colorblindMode ? colorSpec.symbol : '🧪'}
          </div>
          <span className="text-[11px] font-black text-white drop-shadow-sm uppercase tracking-wider">
            {colorblindMode
              ? `${colorSpec.symbol} #${colorSpec.id + 1}`
              : lang === 'pt'
              ? 'Pedido'
              : 'Order'}
          </span>
        </div>

        <Sparkles className="w-3.5 h-3.5 text-white/90 animate-pulse" />
      </div>
    </div>
  );
};
