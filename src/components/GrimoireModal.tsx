import React from 'react';
import { PUPPY_CHARACTERS, POTION_COLORS } from '../data/constants';
import { LangCode } from '../data/i18n';
import { BookOpen, Shield, Sparkles } from 'lucide-react';

interface GrimoireModalProps {
  lang: LangCode;
  servedCountByPuppy: Record<number, number>;
  onClose: () => void;
}

export const GrimoireModal: React.FC<GrimoireModalProps> = ({
  lang,
  servedCountByPuppy,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl bg-slate-900 border-2 border-amber-500/40 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-amber-950 via-purple-950 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-amber-400" />
            <div>
              <h2 className="text-xl font-black text-white">
                {lang === 'pt'
                  ? 'Grimório dos Cachorrinhos & Alquimia'
                  : 'Puppy Grimoire & Alchemy Guide'}
              </h2>
              <p className="text-xs text-amber-200/80">
                {lang === 'pt'
                  ? 'Conheça seus clientes caninos, as 15 poções mágicas e os obstáculos do jogo!'
                  : 'Meet your puppy customers, the 15 magic potions, and obstacle mechanics!'}
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Section 1: Obstacles Guide */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 mb-3 flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              {lang === 'pt'
                ? 'Guia de Mecânicas e Obstáculos'
                : 'Mechanics & Obstacles Guide'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="font-black text-white mb-1">
                  👑 {lang === 'pt' ? 'Garrafa Gigante (13 Camadas)' : 'Giant Bottle (13 Layers)'}
                </div>
                <p className="text-slate-300">
                  {lang === 'pt'
                    ? 'Aparece a partir do Nível 2! Acumula 13 camadas da mesma cor antes de ser coletada.'
                    : 'Appears starting Level 2! Holds 13 matching layers before being collected.'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="font-black text-white mb-1">
                  🎭 {lang === 'pt' ? 'Cortina Mágica Numerada' : 'Numbered Magic Curtain'}
                </div>
                <p className="text-slate-300">
                  {lang === 'pt'
                    ? 'Bloqueia a garrafa. Sirva pedidos da cor indicada na cortina (ou qualquer cor se cinza) para abri-la!'
                    : 'Blocks the bottle. Complete orders matching the curtain color to unveil it!'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="font-black text-white mb-1">
                  🪨 {lang === 'pt' ? 'Pedestal de Argila & Gesso' : 'Clay Pedestal & Plaster Shell'}
                </div>
                <p className="text-slate-300">
                  {lang === 'pt'
                    ? 'A argila impede que a garrafa seja erguida até ser completada. O gesso quebra quando uma garrafa vizinha é fechada!'
                    : 'Clay prevents lifting until filled. Plaster shatters when an adjacent bottle is completed!'}
                </p>
              </div>
              <div className="p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="font-black text-white mb-1">
                  ❓ {lang === 'pt' ? 'Líquido Misterioso Oculto' : 'Hidden Mystery Liquid'}
                </div>
                <p className="text-slate-300">
                  {lang === 'pt'
                    ? 'Camadas escuras com "?" só revelam sua verdadeira cor quando a camada acima delas é despejada!'
                    : 'Dark "?" layers only reveal their true color once the layer above them is poured out!'}
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Puppy Customers */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-purple-300 mb-3 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              {lang === 'pt' ? 'Clientes Cachorrinhos Mágicos' : 'Wizard Puppy Customers'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PUPPY_CHARACTERS.map((p) => {
                const served = servedCountByPuppy[p.id] || 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-800/90 border border-slate-700/80"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-white/20 shadow-inner"
                      style={{ backgroundColor: p.hatColor }}
                    >
                      🐶
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-white text-sm">
                          {lang === 'pt' ? p.namePt : p.nameEn}
                        </span>
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                          {served} {lang === 'pt' ? 'servidos' : 'served'}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-purple-300">
                        {lang === 'pt' ? p.titlePt : p.titleEn}
                      </div>
                      <p className="text-[11px] text-slate-400 italic mt-0.5 truncate">
                        "{lang === 'pt' ? p.quotePt : p.quoteEn}"
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: 15 Potion Colors */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-emerald-300 mb-3">
              🧪 {lang === 'pt' ? 'Catálogo das 15 Poções Alquímicas' : '15 Alchemical Potions Catalog'}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {POTION_COLORS.map((c) => (
                <div
                  key={c.id}
                  className="flex flex-col items-center p-2 rounded-xl bg-slate-800/70 border border-slate-700/70 text-center"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shadow mb-1 border border-white/40"
                    style={{
                      background: `linear-gradient(135deg, ${c.hexTop}, ${c.hexBody})`,
                    }}
                  >
                    {c.symbol}
                  </div>
                  <span className="text-[10px] font-bold text-slate-200 leading-tight">
                    {lang === 'pt' ? c.namePt : c.nameEn}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
