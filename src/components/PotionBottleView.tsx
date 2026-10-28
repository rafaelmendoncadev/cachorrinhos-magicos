import React from 'react';
import { BottleModel } from '../utils/levelEngine';
import { POTION_COLORS } from '../data/constants';
import { Lock, HelpCircle, ShieldAlert, Crown, Shuffle } from 'lucide-react';

interface PotionBottleViewProps {
  bottle: BottleModel;
  isSelected: boolean;
  isHintSource: boolean;
  isHintTarget: boolean;
  isShuffleMode: boolean;
  colorblindMode: boolean;
  onClick: (bottle: BottleModel) => void;
}

export const PotionBottleView: React.FC<PotionBottleViewProps> = ({
  bottle,
  isSelected,
  isHintSource,
  isHintTarget,
  isShuffleMode,
  colorblindMode,
  onClick,
}) => {
  if (bottle.isDelivered) {
    return (
      <div className="w-16 sm:w-20 h-36 sm:h-40 flex items-center justify-center opacity-0 pointer-events-none" />
    );
  }

  const isCovered = bottle.isCloth || bottle.colorCloth;
  const clothSpec =
    bottle.clothColor > 0 ? POTION_COLORS[bottle.clothColor] : null;

  // Height & width classes depending on whether it's a Huge Boss Bottle (capacity 13) or standard (capacity 4)
  const containerSizeClass = bottle.isHuge
    ? 'w-24 sm:w-28 h-48 sm:h-52'
    : 'w-16 sm:w-[74px] h-36 sm:h-40';

  const canBeShuffled =
    isShuffleMode &&
    !bottle.isLocked &&
    !isCovered &&
    !bottle.isParcel &&
    !bottle.isHuge &&
    !bottle.isComplete &&
    bottle.layers.length > 1;

  return (
    <div
      onClick={() => onClick(bottle)}
      className={`relative flex flex-col items-center justify-end select-none cursor-pointer transition-all duration-200 ${containerSizeClass} ${
        isSelected
          ? '-translate-y-4 scale-105 z-30'
          : 'hover:-translate-y-1 z-10'
      } ${
        isShuffleMode && !canBeShuffled ? 'opacity-30 pointer-events-none' : ''
      }`}
    >
      {/* Hint Ring Indicator */}
      {(isHintSource || isHintTarget) && (
        <div
          className={`absolute -inset-2 rounded-3xl border-2 animate-pulse pointer-events-none z-40 ${
            isHintSource
              ? 'border-amber-400 bg-amber-400/15 shadow-[0_0_20px_rgba(251,191,36,0.5)]'
              : 'border-emerald-400 bg-emerald-400/15 shadow-[0_0_20px_rgba(52,211,153,0.5)]'
          }`}
        >
          <span
            className={`absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-slate-950 shadow ${
              isHintSource ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
          >
            {isHintSource ? 'De / From' : 'Para / To'}
          </span>
        </div>
      )}

      {/* Shuffle Mode Indicator */}
      {canBeShuffled && (
        <div className="absolute -top-3 z-40 bg-fuchsia-500 text-white rounded-full p-1 shadow-lg animate-bounce">
          <Shuffle className="w-3.5 h-3.5" />
        </div>
      )}

      {/* Bottle Number Badge */}
      <div className="absolute -top-1 right-0 z-20 px-1.5 py-0.2 rounded-full bg-slate-900/80 border border-slate-700/80 text-[9px] font-bold text-slate-300">
        #{bottle.index + 1}
      </div>

      {/* Giant Bottle Crown Badge */}
      {bottle.isHuge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] shadow-md whitespace-nowrap">
          <Crown className="w-3 h-3" />
          <span>{bottle.layers.length}/13</span>
        </div>
      )}

      {/* Cork / Stopper when Completed */}
      {bottle.isComplete && (
        <div className="w-8 h-3.5 bg-gradient-to-b from-amber-600 to-amber-800 rounded-t-md border-2 border-amber-400 shadow-md -mb-1 z-20 transition-all" />
      )}

      {/* Bottle Neck / Lip */}
      <div
        className={`${
          bottle.isHuge ? 'w-14 h-3.5' : 'w-10 h-3'
        } rounded-t-lg border-2 border-b-0 border-white/60 bg-white/15 backdrop-blur-sm z-10 shadow-inner`}
      />

      {/* Main Glass Body */}
      <div
        className={`relative w-full flex-1 rounded-b-3xl rounded-t-xl border-2 overflow-hidden flex flex-col justify-end transition-all shadow-xl ${
          isSelected
            ? 'border-amber-300 shadow-[0_10px_25px_rgba(251,191,36,0.45)]'
            : bottle.isComplete
            ? 'border-emerald-300 shadow-[0_0_20px_rgba(52,211,153,0.4)]'
            : bottle.isHuge
            ? 'border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
            : 'border-white/55'
        } bg-slate-900/45 backdrop-blur-xs`}
      >
        {/* Specular Glass Highlight (Left & Right shine) */}
        <div className="absolute inset-y-2 left-1.5 w-1.5 rounded-full bg-gradient-to-b from-white/45 via-white/20 to-transparent pointer-events-none z-20" />
        <div className="absolute inset-y-4 right-1.5 w-0.5 rounded-full bg-white/20 pointer-events-none z-20" />

        {/* Liquid Layers Stack (from bottom = index 0 to top = layers.length-1) */}
        <div className="relative w-full h-full flex flex-col-reverse p-[2px] gap-[1px]">
          {Array.from({ length: bottle.maxLayers }).map((_, slotIdx) => {
            const layer = bottle.layers[slotIdx];
            if (!layer) {
              return (
                <div
                  key={slotIdx}
                  className="w-full flex-1 rounded-xs bg-transparent"
                />
              );
            }

            const isTopOfBottle = slotIdx === bottle.layers.length - 1;
            const spec = POTION_COLORS[layer.color] || POTION_COLORS[0];

            if (layer.isHide) {
              return (
                <div
                  key={slotIdx}
                  className="relative w-full flex-1 flex items-center justify-center bg-gradient-to-b from-slate-800 to-slate-950 border-t border-slate-600/50 text-slate-300"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-amber-300/80 animate-pulse" />
                </div>
              );
            }

            return (
              <div
                key={slotIdx}
                className="relative w-full flex-1 flex items-center justify-center transition-all duration-300"
                style={{
                  background: `linear-gradient(180deg, ${spec.hexTop} 0%, ${spec.hexBody} 100%)`,
                  borderTop: isTopOfBottle
                    ? '2px solid rgba(255,255,255,0.85)'
                    : 'none',
                  borderBottomLeftRadius: slotIdx === 0 ? '18px' : '0px',
                  borderBottomRightRadius: slotIdx === 0 ? '18px' : '0px',
                }}
              >
                {colorblindMode && !bottle.isHuge && (
                  <span className="text-[11px] font-black text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] select-none">
                    {spec.symbol}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* OBSTACLE 1: Magic Curtain (isCloth / colorCloth) */}
        {isCovered && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-1.5 text-center border-2 border-amber-300/60 shadow-inner"
            style={{
              background: clothSpec
                ? `linear-gradient(160deg, ${clothSpec.hexTop}ee, ${clothSpec.hexBody}f5)`
                : 'linear-gradient(160deg, #475569f5, #1e293bf8)',
            }}
          >
            <div className="w-7 h-7 rounded-full bg-black/35 border border-white/40 flex items-center justify-center text-white font-black text-xs mb-1 shadow">
              {clothSpec && colorblindMode ? clothSpec.symbol : '🎭'}
            </div>
            <span className="text-[11px] font-black text-white drop-shadow uppercase">
              ×{bottle.clothNum || 1}
            </span>
          </div>
        )}

        {/* OBSTACLE 2: Plaster / Secret Shell (isParcel) */}
        {bottle.isParcel && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-gradient-to-b from-stone-300 via-stone-400 to-stone-500 text-stone-900 p-1.5 border-2 border-stone-200 shadow-inner">
            <ShieldAlert className="w-6 h-6 text-stone-800 mb-0.5" />
            <span className="text-[9px] font-black uppercase tracking-tighter text-center leading-tight">
              Gesso
            </span>
          </div>
        )}

        {/* OBSTACLE 3: Locked Extra Bottle (isLocked) */}
        {bottle.isLocked && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-[2px] p-1 text-amber-300 hover:bg-slate-900/75 transition-colors">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center mb-1 shadow">
              <Lock className="w-4 h-4 text-amber-300" />
            </div>
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-amber-200 text-center">
              +Tubo
            </span>
          </div>
        )}
      </div>

      {/* OBSTACLE 4: Stone / Clay Pedestal at base (isStone) */}
      {bottle.isStone && (
        <div className="w-[112%] h-5 -mt-2 z-20 rounded-lg bg-gradient-to-r from-amber-900 via-stone-700 to-amber-950 border-2 border-amber-500/70 shadow-lg flex items-center justify-center">
          <span className="text-[9px] font-black text-amber-200 uppercase tracking-widest">
            🪨 Argila
          </span>
        </div>
      )}
    </div>
  );
};
