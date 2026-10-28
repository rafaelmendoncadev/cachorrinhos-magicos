import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  GAME_SETTINGS,
  JOURNEY_THEMES,
  POTION_COLORS,
} from './data/constants';
import { LangCode, t } from './data/i18n';
import {
  BottleModel,
  buildLevelState,
  canPour,
  checkBottleFullSameColor,
  findBestHintMove,
  isBottleTouchable,
  isDeadlocked,
  PuppyOrder,
} from './utils/levelEngine';
import { soundFX } from './utils/sound';
import { PuppyOrderCard } from './components/PuppyOrderCard';
import { PotionBottleView } from './components/PotionBottleView';
import { JourneyModal } from './components/JourneyModal';
import { GrimoireModal } from './components/GrimoireModal';
import {
  RotateCcw,
  Shuffle,
  PlusCircle,
  Sparkles,
  Settings,
  Map,
  BookOpen,
  Coins,
  Volume2,
  VolumeX,
  Eye,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Trophy,
  AlertTriangle,
  Flame,
} from 'lucide-react';

interface UndoSnapshot {
  bottles: BottleModel[];
  orders: PuppyOrder[];
  remainingBoxList: number[];
  freedPositions: { index: number; x: number; y: number }[];
}

export function App() {
  // Persistent User Progression
  const [lang, setLang] = useState<LangCode>(() => {
    const saved = localStorage.getItem('wp_lang');
    return (saved === 'en' || saved === 'pt') ? saved : 'pt';
  });
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('wp_level') || '1', 10) || 1;
  });
  const [maxUnlockedLevel, setMaxUnlockedLevel] = useState<number>(() => {
    return parseInt(localStorage.getItem('wp_max_level') || '1', 10) || 1;
  });
  const [gold, setGold] = useState<number>(() => {
    const saved = localStorage.getItem('wp_gold');
    return saved !== null ? parseInt(saved, 10) : GAME_SETTINGS.USER_DEFAULT_GOLD;
  });
  const [propUndo, setPropUndo] = useState<number>(() => {
    const saved = localStorage.getItem('wp_prop_undo');
    return saved !== null ? parseInt(saved, 10) : GAME_SETTINGS.USER_DEFAULT_PROP_BACK;
  });
  const [propShuffle, setPropShuffle] = useState<number>(() => {
    const saved = localStorage.getItem('wp_prop_shuffle');
    return saved !== null ? parseInt(saved, 10) : GAME_SETTINGS.USER_DEFAULT_PROP_SHUFFLE;
  });
  const [propCup, setPropCup] = useState<number>(() => {
    const saved = localStorage.getItem('wp_prop_cup');
    return saved !== null ? parseInt(saved, 10) : GAME_SETTINGS.USER_DEFAULT_PROP_CUP;
  });
  const [selectedThemeId, setSelectedThemeId] = useState<number>(() => {
    return parseInt(localStorage.getItem('wp_theme') || '1', 10) || 1;
  });
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [colorblindMode, setColorblindMode] = useState<boolean>(false);
  const [servedByPuppy, setServedByPuppy] = useState<Record<number, number>>(() => {
    try {
      return JSON.parse(localStorage.getItem('wp_served_puppies') || '{}');
    } catch {
      return {};
    }
  });

  // Active Level State
  const [bottles, setBottles] = useState<BottleModel[]>([]);
  const [orders, setOrders] = useState<PuppyOrder[]>([]);
  const [remainingBoxList, setRemainingBoxList] = useState<number[]>([]);
  const [hugeColors, setHugeColors] = useState<Set<number>>(new Set());
  const [freedPositions, setFreedPositions] = useState<
    { index: number; x: number; y: number }[]
  >([]);
  const [selectedBottleId, setSelectedBottleId] = useState<number | null>(null);
  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);
  const [isShuffleMode, setIsShuffleMode] = useState<boolean>(false);
  const [hintMove, setHintMove] = useState<{ fromId: number; toId: number } | null>(
    null
  );
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [comboCount, setComboCount] = useState<number>(0);
  const lastServeTimeRef = useRef<number>(0);

  // Modals
  const [gameStatus, setGameStatus] = useState<'playing' | 'victory' | 'fail'>(
    'playing'
  );
  const [showJourneyModal, setShowJourneyModal] = useState<boolean>(false);
  const [showGrimoireModal, setShowGrimoireModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Sync settings to localStorage
  useEffect(() => {
    localStorage.setItem('wp_lang', lang);
  }, [lang]);
  useEffect(() => {
    localStorage.setItem('wp_level', String(currentLevel));
    if (currentLevel > maxUnlockedLevel) {
      setMaxUnlockedLevel(currentLevel);
      localStorage.setItem('wp_max_level', String(currentLevel));
    }
  }, [currentLevel, maxUnlockedLevel]);
  useEffect(() => {
    localStorage.setItem('wp_gold', String(gold));
  }, [gold]);
  useEffect(() => {
    localStorage.setItem('wp_prop_undo', String(propUndo));
    localStorage.setItem('wp_prop_shuffle', String(propShuffle));
    localStorage.setItem('wp_prop_cup', String(propCup));
  }, [propUndo, propShuffle, propCup]);
  useEffect(() => {
    localStorage.setItem('wp_theme', String(selectedThemeId));
  }, [selectedThemeId]);
  useEffect(() => {
    soundFX.enabled = soundEnabled;
  }, [soundEnabled]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const timer = setTimeout(() => setToastMsg(null), 2800);
    return () => clearTimeout(timer);
  }, [toastMsg]);

  // Load or reset a level
  const loadLevel = useCallback((lvl: number) => {
    const parsed = buildLevelState(lvl, true);
    setBottles(parsed.bottles);
    setOrders(parsed.orders);
    setRemainingBoxList(parsed.remainingOrderBoxList);
    setHugeColors(parsed.hugeColors);
    setFreedPositions([]);
    setSelectedBottleId(null);
    setUndoStack([]);
    setIsShuffleMode(false);
    setHintMove(null);
    setComboCount(0);
    setGameStatus('playing');

    // Auto-select chapter theme if crossing a milestone
    const matchingTheme = [...JOURNEY_THEMES]
      .reverse()
      .find((th) => lvl >= th.unlockLevel);
    if (matchingTheme) {
      setSelectedThemeId(matchingTheme.id);
    }
  }, []);

  useEffect(() => {
    loadLevel(currentLevel);
  }, [currentLevel, loadLevel]);

  // Clone state helper for Undo stack
  const cloneStateSnapshot = useCallback((): UndoSnapshot => {
    return {
      bottles: bottles.map((b) => ({
        ...b,
        pos: { ...b.pos },
        layers: b.layers.map((l) => ({ ...l })),
      })),
      orders: orders.map((o) => ({ ...o })),
      remainingBoxList: [...remainingBoxList],
      freedPositions: freedPositions.map((fp) => ({ ...fp })),
    };
  }, [bottles, orders, remainingBoxList, freedPositions]);

  // Process Completed Bottles -> Deliver to Puppy Orders or Check Victory
  const processCompletionsAndOrders = useCallback(
    (
      nextBottles: BottleModel[],
      nextOrders: PuppyOrder[],
      nextBoxList: number[],
      nextFreed: { index: number; x: number; y: number }[]
    ) => {
      let anyOrderServed = false;

      for (const b of nextBottles) {
        if (b.isDelivered) continue;

        if (!b.isComplete && checkBottleFullSameColor(b)) {
          const pureColor = b.layers[0].color;
          // Special Rule from CupItem.ts:
          // If this is a regular 4-layer bottle, but its color belongs to a Giant Bottle (hugeColors),
          // it does NOT cork! Instead, the player must pour it into the Giant Bottle!
          if (!b.isHuge && hugeColors.has(pureColor)) {
            showToast(t(lang, 'game.pour_huge_bottle'));
            continue;
          }

          // Otherwise, bottle is completed & corked!
          b.isComplete = true;
          soundFX.playCorkAndComplete();

          // If this bottle had a Clay Pedestal (isStone), completing it breaks the pedestal!
          if (b.isStone) {
            b.isStone = false;
            soundFX.playObstacleBreak();
          }
        }

        // If bottle is complete, check if any active Puppy Order wants this color
        if (b.isComplete && !b.isDelivered) {
          const completedColor = b.layers[0].color;
          const matchingOrder = nextOrders.find(
            (o) => o.targetColor === completedColor
          );

          if (matchingOrder) {
            b.isDelivered = true;
            b.layers = [];
            nextFreed.push({ index: b.index, x: b.pos.x, y: b.pos.y });
            anyOrderServed = true;

            // Update puppy stats
            setServedByPuppy((prev) => {
              const updated = {
                ...prev,
                [matchingOrder.puppyId]: (prev[matchingOrder.puppyId] || 0) + 1,
              };
              localStorage.setItem('wp_served_puppies', JSON.stringify(updated));
              return updated;
            });

            // Trigger obstacle unlocks (Curtains & Adjacent Plaster) just like CupBig.onCupComplete!
            for (const other of nextBottles) {
              if (other.isDelivered) continue;
              // 1. Single Curtain (isCloth)
              if (other.isCloth && (other.clothColor === 0 || other.clothColor === completedColor)) {
                other.isCloth = false;
                soundFX.playObstacleBreak();
              }
              // 2. Numbered Curtain (colorCloth)
              if (
                other.colorCloth &&
                (other.clothColor === 0 || other.clothColor === completedColor)
              ) {
                other.clothNum -= 1;
                if (other.clothNum <= 0) {
                  other.colorCloth = false;
                  soundFX.playObstacleBreak();
                }
              }
              // 3. Adjacent Plaster Shell (isParcel)
              if (
                other.isParcel &&
                (other.index === b.index - 1 || other.index === b.index + 1)
              ) {
                other.isParcel = false;
                soundFX.playObstacleBreak();
              }
            }

            // Pull next order color from nextBoxList
            const replacementColor =
              nextBoxList.length > 0 ? nextBoxList.shift()! : null;
            matchingOrder.targetColor = replacementColor;
            matchingOrder.puppyId = (matchingOrder.puppyId + 1) % 8;
          }
        }
      }

      if (anyOrderServed) {
        soundFX.playOrderServed();
        // Clear undo stack on bottle collection (same as original GameManager.cleanOpeChain)
        setUndoStack([]);

        // Check Combo
        const now = Date.now();
        if (now - lastServeTimeRef.current < 9000) {
          setComboCount((c) => {
            const nextC = c + 1;
            const bonus = nextC * 5;
            setGold((g) => g + bonus);
            showToast(`${t(lang, 'game.combo', nextC)} (+${bonus} 🪙)`);
            return nextC;
          });
        } else {
          setComboCount(1);
        }
        lastServeTimeRef.current = now;

        // Second pass: what if another already-complete bottle was waiting for the newly pulled order color?
        for (const b of nextBottles) {
          if (b.isComplete && !b.isDelivered && b.layers.length > 0) {
            const c = b.layers[0].color;
            const ord = nextOrders.find((o) => o.targetColor === c);
            if (ord) {
              b.isDelivered = true;
              b.layers = [];
              nextFreed.push({ index: b.index, x: b.pos.x, y: b.pos.y });
              ord.targetColor =
                nextBoxList.length > 0 ? nextBoxList.shift()! : null;
            }
          }
        }
      }

      // Check Victory Condition (every bottle is delivered, complete, empty, or locked)
      const allCleared = nextBottles.every(
        (b) =>
          b.isDelivered ||
          b.isComplete ||
          b.layers.length === 0
      );

      if (allCleared) {
        soundFX.playWinFanfare();
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
        });
        setGold((g) => g + GAME_SETTINGS.NORMAL_REWARD_GOLD);
        setGameStatus('victory');
        return;
      }

      // Check Deadlock
      if (isDeadlocked(nextBottles)) {
        soundFX.playFail();
        setGameStatus('fail');
      }
    },
    [hugeColors, lang, showToast]
  );

  // Handle Bottle Click
  const handleBottleClick = (clicked: BottleModel) => {
    if (gameStatus !== 'playing') return;
    setHintMove(null);

    // 1. If bottle is a Locked Extra Tube (Type 8), unlock it!
    if (clicked.isLocked) {
      if (propCup > 0) {
        setPropCup((p) => p - 1);
      } else if (gold >= 100) {
        setGold((g) => g - 100);
      }
      soundFX.playObstacleBreak();
      const nextBottles = bottles.map((b) =>
        b.id === clicked.id ? { ...b, isLocked: false } : b
      );
      setBottles(nextBottles);
      return;
    }

    // 2. If in Shuffle Mode, shuffle the clicked bottle!
    if (isShuffleMode) {
      if (
        !isBottleTouchable(clicked) ||
        clicked.isHuge ||
        clicked.layers.length <= 1
      ) {
        return;
      }
      soundFX.playPour(2);
      const nextBottles = bottles.map((b) => {
        if (b.id !== clicked.id) return b;
        const shuffled = [...b.layers].sort(() => Math.random() - 0.5);
        // Ensure top layer is visible
        shuffled[shuffled.length - 1].isHide = false;
        return { ...b, layers: shuffled };
      });
      if (propShuffle > 0) {
        setPropShuffle((p) => p - 1);
      } else {
        setGold((g) => Math.max(0, g - GAME_SETTINGS.SHUFFLE_GOLD_USE));
      }
      setBottles(nextBottles);
      setIsShuffleMode(false);
      setUndoStack([]);
      return;
    }

    // 3. Check if bottle has obstacle preventing interaction
    if (!isBottleTouchable(clicked)) {
      if (clicked.isCloth || clicked.colorCloth) {
        showToast(t(lang, 'obstacle.curtain'));
      } else if (clicked.isParcel) {
        showToast(t(lang, 'obstacle.plaster'));
      }
      return;
    }

    // 4. If no bottle is currently selected:
    if (selectedBottleId === null) {
      if (clicked.layers.length === 0) return;
      if (clicked.isStone) {
        showToast(t(lang, 'obstacle.stone'));
        return;
      }
      if (clicked.isHuge) {
        showToast(t(lang, 'obstacle.huge'));
        return;
      }
      soundFX.playBottleUp();
      setSelectedBottleId(clicked.id);
      return;
    }

    // 5. Clicking the already selected bottle deselects it
    if (selectedBottleId === clicked.id) {
      soundFX.playBottleDown();
      setSelectedBottleId(null);
      return;
    }

    // 6. Attempt to pour from selectedBottle to clicked bottle
    const sourceBottle = bottles.find((b) => b.id === selectedBottleId);
    if (!sourceBottle) {
      setSelectedBottleId(null);
      return;
    }

    const pourCheck = canPour(sourceBottle, clicked, bottles);
    if (!pourCheck.valid) {
      // If clicked bottle can be selected as a new source, switch selection immediately!
      if (
        clicked.layers.length > 0 &&
        !clicked.isStone &&
        !clicked.isHuge &&
        isBottleTouchable(clicked)
      ) {
        soundFX.playBottleUp();
        setSelectedBottleId(clicked.id);
      } else {
        soundFX.playBottleDown();
        setSelectedBottleId(null);
      }
      return;
    }

    // Valid Pour! Save snapshot for Undo
    const snapshot = cloneStateSnapshot();
    setUndoStack((prev) => [...prev, snapshot]);

    soundFX.playPour(pourCheck.count);

    const nextBottles = bottles.map((b) => ({
      ...b,
      pos: { ...b.pos },
      layers: b.layers.map((l) => ({ ...l })),
    }));
    const srcCopy = nextBottles.find((b) => b.id === sourceBottle.id)!;
    const dstCopy = nextBottles.find((b) => b.id === clicked.id)!;

    // Pop layers from source and push to target
    for (let i = 0; i < pourCheck.count; i++) {
      srcCopy.layers.pop();
      dstCopy.layers.push({ color: pourCheck.color, isHide: false });
    }

    // Reveal top layer of source if it was hidden '?'
    if (srcCopy.layers.length > 0) {
      srcCopy.layers[srcCopy.layers.length - 1].isHide = false;
    }

    const nextOrders = orders.map((o) => ({ ...o }));
    const nextBoxList = [...remainingBoxList];
    const nextFreed = [...freedPositions];

    setSelectedBottleId(null);
    processCompletionsAndOrders(nextBottles, nextOrders, nextBoxList, nextFreed);

    setBottles(nextBottles);
    setOrders(nextOrders);
    setRemainingBoxList(nextBoxList);
    setFreedPositions(nextFreed);
  };

  // Power-Up 1: Undo
  const handleUndo = () => {
    if (undoStack.length === 0) {
      showToast(t(lang, 'game.no_prev_step'));
      return;
    }
    if (propUndo <= 0 && gold < GAME_SETTINGS.BACK_GOLD_USE) {
      showToast(lang === 'pt' ? 'Moedas insuficientes!' : 'Not enough coins!');
      return;
    }
    if (propUndo > 0) {
      setPropUndo((p) => p - 1);
    } else {
      setGold((g) => g - GAME_SETTINGS.BACK_GOLD_USE);
    }

    const last = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
    setBottles(last.bottles);
    setOrders(last.orders);
    setRemainingBoxList(last.remainingBoxList);
    setFreedPositions(last.freedPositions);
    setSelectedBottleId(null);
    setHintMove(null);
    soundFX.playBottleDown();
  };

  // Power-Up 2: Toggle Shuffle Mode
  const handleToggleShuffle = () => {
    if (isShuffleMode) {
      setIsShuffleMode(false);
      return;
    }
    if (propShuffle <= 0 && gold < GAME_SETTINGS.SHUFFLE_GOLD_USE) {
      showToast(lang === 'pt' ? 'Moedas insuficientes!' : 'Not enough coins!');
      return;
    }
    soundFX.playClick();
    setSelectedBottleId(null);
    setIsShuffleMode(true);
    showToast(t(lang, 'game.shuffle_tip'));
  };

  // Power-Up 3: Add Extra Tube (Unlocks a locked tube OR spawns an empty tube in a freed slot / end of table)
  const handleAddTube = () => {
    if (propCup <= 0 && gold < GAME_SETTINGS.CUP_GOLD_USE) {
      showToast(lang === 'pt' ? 'Moedas insuficientes!' : 'Not enough coins!');
      return;
    }

    const lockedBottle = bottles.find((b) => b.isLocked && !b.isDelivered);
    if (lockedBottle) {
      if (propCup > 0) setPropCup((p) => p - 1);
      else setGold((g) => g - GAME_SETTINGS.CUP_GOLD_USE);

      soundFX.playObstacleBreak();
      setBottles((prev) =>
        prev.map((b) => (b.id === lockedBottle.id ? { ...b, isLocked: false } : b))
      );
      setGameStatus('playing');
      return;
    }

    // Or respawn a delivered bottle as an empty tube, or add a new empty bottle (up to 3 extra)
    const deliveredBottle = bottles.find((b) => b.isDelivered);
    if (deliveredBottle) {
      if (propCup > 0) setPropCup((p) => p - 1);
      else setGold((g) => g - GAME_SETTINGS.CUP_GOLD_USE);

      soundFX.playCorkAndComplete();
      setBottles((prev) =>
        prev.map((b) =>
          b.id === deliveredBottle.id
            ? {
                ...b,
                isDelivered: false,
                isComplete: false,
                layers: [],
                maxLayers: 4,
                isHuge: false,
              }
            : b
        )
      );
      setGameStatus('playing');
      return;
    }

    // Otherwise append a brand new empty bottle to the table!
    if (bottles.length >= 28) {
      showToast(t(lang, 'game.max_bottles'));
      return;
    }

    if (propCup > 0) setPropCup((p) => p - 1);
    else setGold((g) => g - GAME_SETTINGS.CUP_GOLD_USE);

    soundFX.playCorkAndComplete();
    const newId = bottles.length;
    setBottles((prev) => [
      ...prev,
      {
        id: newId,
        index: newId,
        pos: { x: 0, y: 0 },
        layers: [],
        maxLayers: 4,
        isCloth: false,
        colorCloth: false,
        clothColor: 0,
        clothNum: 0,
        isStone: false,
        isParcel: false,
        isLocked: false,
        isHuge: false,
        isComplete: false,
        isDelivered: false,
      },
    ]);
    setGameStatus('playing');
  };

  // Power-Up 4 (Enhanced Feature): AI Oracle Smart Hint
  const handleSmartHint = () => {
    soundFX.playClick();
    const best = findBestHintMove(bottles, orders, hugeColors);
    if (!best) {
      showToast(t(lang, 'game.no_hint'));
      return;
    }
    setHintMove(best);
    const srcB = bottles.find((b) => b.id === best.fromId);
    const dstB = bottles.find((b) => b.id === best.toId);
    if (srcB && dstB) {
      showToast(t(lang, 'game.hint_move', srcB.index + 1, dstB.index + 1));
    }
  };

  const activeTheme =
    JOURNEY_THEMES.find((th) => th.id === selectedThemeId) || JOURNEY_THEMES[0];

  const selectedBottle =
    selectedBottleId !== null
      ? bottles.find((b) => b.id === selectedBottleId)
      : null;
  const selectedTopColor =
    selectedBottle && selectedBottle.layers.length > 0
      ? selectedBottle.layers[selectedBottle.layers.length - 1].color
      : null;

  return (
    <div
      className={`relative w-screen h-screen overflow-hidden flex flex-col justify-between bg-gradient-to-b ${activeTheme.gradient} select-none`}
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Ambient Magical Floating Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full blur-3xl"
          style={{ backgroundColor: activeTheme.accentColor }}
        />
        <div
          className="absolute bottom-10 -right-20 w-96 h-96 rounded-full blur-3xl"
          style={{ backgroundColor: activeTheme.accentColor }}
        />
      </div>

      {/* TOP HUD BAR */}
      <header className="relative z-20 flex items-center justify-between px-3 sm:px-6 pt-3 pb-2 bg-slate-950/60 backdrop-blur-md border-b border-white/10">
        {/* Left: Brand & Level Selector */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center bg-slate-900/90 border border-purple-500/40 rounded-2xl p-1 shadow-md">
            <button
              onClick={() => {
                soundFX.playClick();
                if (currentLevel > 1) setCurrentLevel((l) => l - 1);
              }}
              disabled={currentLevel <= 1}
              className="p-1.5 rounded-xl hover:bg-slate-800 disabled:opacity-30 text-purple-300 transition"
              title="Nível Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="px-2.5 text-center">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 leading-none">
                {activeTheme.iconEmoji}{' '}
                {lang === 'pt' ? activeTheme.namePt : activeTheme.nameEn}
              </div>
              <div className="text-sm sm:text-base font-black text-white leading-tight">
                {t(lang, 'game.level', currentLevel)}
              </div>
            </div>
            <button
              onClick={() => {
                soundFX.playClick();
                if (currentLevel < 300) setCurrentLevel((l) => l + 1);
              }}
              className="p-1.5 rounded-xl hover:bg-slate-800 text-purple-300 transition"
              title="Próximo Nível"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => {
              soundFX.playClick();
              loadLevel(currentLevel);
            }}
            className="p-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 shadow transition"
            title={t(lang, 'game.restart')}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Center/Right: Gold, Combo & Navigation Modals */}
        <div className="flex items-center gap-2">
          {comboCount > 1 && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-current" />
              <span>x{comboCount}</span>
            </div>
          )}

          {/* Gold Counter */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-slate-900/90 border border-amber-400/40 shadow">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-black text-amber-300">{gold}</span>
          </div>

          {/* Journey Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              setShowJourneyModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-purple-600/80 hover:bg-purple-500 border border-purple-400/50 text-white text-xs font-extrabold shadow transition"
          >
            <Map className="w-4 h-4" />
            <span className="hidden md:inline">{t(lang, 'home.tab_journey')}</span>
          </button>

          {/* Grimoire Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              setShowGrimoireModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-amber-600/80 hover:bg-amber-500 border border-amber-400/50 text-white text-xs font-extrabold shadow transition"
          >
            <BookOpen className="w-4 h-4" />
            <span className="hidden md:inline">{t(lang, 'home.tab_grimoire')}</span>
          </button>

          {/* Colorblind Quick Toggle */}
          <button
            onClick={() => {
              soundFX.playClick();
              setColorblindMode((c) => !c);
            }}
            className={`p-2 rounded-2xl border transition ${
              colorblindMode
                ? 'bg-emerald-500 text-slate-950 border-emerald-300'
                : 'bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
            title={t(lang, 'setting.colorblind')}
          >
            <Eye className="w-4 h-4" />
          </button>

          {/* Settings Button */}
          <button
            onClick={() => {
              soundFX.playClick();
              setShowSettingsModal(true);
            }}
            className="p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 transition"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* PUPPY CUSTOMERS ORDER COUNTER (Top Stage) */}
      <section className="relative z-20 px-3 sm:px-6 pt-2 pb-2 bg-slate-950/35 border-b border-white/10 shadow-lg">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-200/90 flex items-center gap-1.5">
              🐶{' '}
              {lang === 'pt'
                ? 'Balcão de Pedidos dos Cachorrinhos'
                : 'Wizard Puppy Customer Counter'}
            </span>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-slate-900/90 text-amber-300 border border-amber-400/30">
              {t(lang, 'game.orders_left', remainingBoxList.length)}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 sm:gap-3">
            {orders.map((order) => (
              <PuppyOrderCard
                key={order.slotIndex}
                order={order}
                lang={lang}
                colorblindMode={colorblindMode}
                isHighlighted={
                  selectedTopColor !== null &&
                  order.targetColor === selectedTopColor
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* Toast Notification Banner */}
      {toastMsg && (
        <div className="fixed top-44 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-2xl bg-slate-950/95 border-2 border-amber-400 text-amber-200 text-xs sm:text-sm font-black shadow-2xl animate-bounce text-center max-w-md">
          {toastMsg}
        </div>
      )}

      {/* Shuffle Mode Banner */}
      {isShuffleMode && (
        <div className="relative z-30 mx-auto mt-2 px-4 py-1.5 rounded-full bg-fuchsia-600 text-white text-xs font-black shadow-lg flex items-center gap-2 animate-pulse">
          <Shuffle className="w-4 h-4" />
          <span>{t(lang, 'game.shuffle_tip')}</span>
          <button
            onClick={() => setIsShuffleMode(false)}
            className="ml-2 underline text-fuchsia-200 hover:text-white"
          >
            {lang === 'pt' ? 'Cancelar' : 'Cancel'}
          </button>
        </div>
      )}

      {/* MAIN ALCHEMY TABLE (Bottles Grid) */}
      <main className="relative z-10 flex-1 overflow-y-auto flex items-center justify-center p-3 sm:p-6">
        <div className="max-w-4xl w-full flex flex-wrap items-end justify-center gap-x-3 sm:gap-x-5 gap-y-5 sm:gap-y-7 py-4">
          {bottles.map((bottle) => (
            <PotionBottleView
              key={bottle.id}
              bottle={bottle}
              isSelected={selectedBottleId === bottle.id}
              isHintSource={hintMove?.fromId === bottle.id}
              isHintTarget={hintMove?.toId === bottle.id}
              isShuffleMode={isShuffleMode}
              colorblindMode={colorblindMode}
              onClick={handleBottleClick}
            />
          ))}
        </div>
      </main>

      {/* BOTTOM POWER-UPS DOCK */}
      <footer className="relative z-20 px-4 py-3 bg-slate-950/75 backdrop-blur-md border-t border-white/10">
        <div className="max-w-xl mx-auto grid grid-cols-4 gap-2.5 sm:gap-4">
          {/* 1. Undo */}
          <button
            onClick={handleUndo}
            className="relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-sky-400/60 transition shadow-lg group"
          >
            <div className="flex items-center gap-1.5 text-sky-400 group-hover:scale-110 transition-transform">
              <RotateCcw className="w-5 h-5" />
              <span className="text-xs font-black text-white">
                {t(lang, 'prop.undo')}
              </span>
            </div>
            <span className="mt-1 px-2 py-0.2 rounded-full text-[10px] font-black bg-sky-500/20 text-sky-300 border border-sky-400/30">
              {propUndo > 0 ? `${propUndo}` : `🪙 ${GAME_SETTINGS.BACK_GOLD_USE}`}
            </span>
          </button>

          {/* 2. Shuffle */}
          <button
            onClick={handleToggleShuffle}
            className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl border transition shadow-lg group ${
              isShuffleMode
                ? 'bg-fuchsia-700 border-fuchsia-300 ring-2 ring-fuchsia-400'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 hover:border-fuchsia-400/60'
            }`}
          >
            <div className="flex items-center gap-1.5 text-fuchsia-400 group-hover:scale-110 transition-transform">
              <Shuffle className="w-5 h-5" />
              <span className="text-xs font-black text-white">
                {t(lang, 'prop.shuffle')}
              </span>
            </div>
            <span className="mt-1 px-2 py-0.2 rounded-full text-[10px] font-black bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-400/30">
              {propShuffle > 0
                ? `${propShuffle}`
                : `🪙 ${GAME_SETTINGS.SHUFFLE_GOLD_USE}`}
            </span>
          </button>

          {/* 3. Add Tube */}
          <button
            onClick={handleAddTube}
            className="relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-emerald-400/60 transition shadow-lg group"
          >
            <div className="flex items-center gap-1.5 text-emerald-400 group-hover:scale-110 transition-transform">
              <PlusCircle className="w-5 h-5" />
              <span className="text-xs font-black text-white">
                {t(lang, 'prop.add_tube')}
              </span>
            </div>
            <span className="mt-1 px-2 py-0.2 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              {propCup > 0 ? `${propCup}` : `🪙 ${GAME_SETTINGS.CUP_GOLD_USE}`}
            </span>
          </button>

          {/* 4. AI Oracle Smart Hint (Free Enhancement!) */}
          <button
            onClick={handleSmartHint}
            className="relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl bg-gradient-to-b from-amber-500/20 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-400/60 transition shadow-lg group"
          >
            <div className="flex items-center gap-1.5 text-amber-300 group-hover:scale-110 transition-transform">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-black text-amber-200">
                {t(lang, 'prop.hint')}
              </span>
            </div>
            <span className="mt-1 px-2 py-0.2 rounded-full text-[10px] font-black bg-amber-400 text-slate-950">
              GRÁTIS
            </span>
          </button>
        </div>
      </footer>

      {/* VICTORY MODAL */}
      {gameStatus === 'victory' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-b from-indigo-950 via-slate-900 to-slate-950 border-2 border-amber-400/80 p-6 text-center shadow-2xl animate-float">
            <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-amber-300 shadow-lg">
              <Trophy className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              {t(lang, 'game.victory')}
            </h2>
            <p className="text-sm text-purple-200 mb-5">
              {t(lang, 'game.level', currentLevel)}{' '}
              {lang === 'pt' ? 'concluído com perfeição!' : 'completed!'}
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-white/10 mb-6 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center">
                <span className="text-xs text-slate-400 font-bold mb-1">
                  {t(lang, 'game.reward')}
                </span>
                <div className="flex items-center gap-1.5 text-lg font-black text-amber-300">
                  <Coins className="w-5 h-5 text-amber-400" />
                  <span>+{GAME_SETTINGS.NORMAL_REWARD_GOLD}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                soundFX.playClick();
                setCurrentLevel((l) => l + 1);
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:brightness-110 text-slate-950 font-black text-base shadow-xl transition"
            >
              {t(lang, 'game.next_level')} →
            </button>
          </div>
        </div>
      )}

      {/* FAIL / REVIVE MODAL */}
      {gameStatus === 'fail' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-rose-500/60 p-6 text-center shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-rose-300">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-white mb-1">
              {t(lang, 'game.fail')}
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              {t(lang, 'game.fail_desc')}
            </p>

            <div className="space-y-3">
              <button
                onClick={() => {
                  // Free revive with extra tube!
                  soundFX.playCorkAndComplete();
                  const lockedB = bottles.find((b) => b.isLocked && !b.isDelivered);
                  if (lockedB) {
                    setBottles((prev) =>
                      prev.map((b) =>
                        b.id === lockedB.id ? { ...b, isLocked: false } : b
                      )
                    );
                  } else {
                    const newId = bottles.length;
                    setBottles((prev) => [
                      ...prev,
                      {
                        id: newId,
                        index: newId,
                        pos: { x: 0, y: 0 },
                        layers: [],
                        maxLayers: 4,
                        isCloth: false,
                        colorCloth: false,
                        clothColor: 0,
                        clothNum: 0,
                        isStone: false,
                        isParcel: false,
                        isLocked: false,
                        isHuge: false,
                        isComplete: false,
                        isDelivered: false,
                      },
                    ]);
                  }
                  setGameStatus('playing');
                }}
                className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm shadow-lg transition"
              >
                🧪 {t(lang, 'game.revive_btn')} (Grátis)
              </button>

              <button
                onClick={() => {
                  soundFX.playClick();
                  loadLevel(currentLevel);
                }}
                className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm border border-slate-600 transition"
              >
                {t(lang, 'game.restart')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border-2 border-purple-500/40 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-white">
                {t(lang, 'setting.title')}
              </h2>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-3 py-1 rounded-xl bg-slate-800 text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Sound Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center gap-2.5">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-400" />
                  )}
                  <span className="text-sm font-bold text-white">
                    {t(lang, 'setting.sound')}
                  </span>
                </div>
                <button
                  onClick={() => setSoundEnabled((s) => !s)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                    soundEnabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {soundEnabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Colorblind Mode Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                <div className="flex items-center gap-2.5">
                  <Eye className="w-5 h-5 text-amber-400" />
                  <span className="text-sm font-bold text-white">
                    {t(lang, 'setting.colorblind')}
                  </span>
                </div>
                <button
                  onClick={() => setColorblindMode((c) => !c)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-black transition ${
                    colorblindMode
                      ? 'bg-amber-400 text-slate-950'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {colorblindMode ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Language Switcher */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                <span className="text-sm font-bold text-white">
                  {t(lang, 'setting.language')}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setLang('pt')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                      lang === 'pt'
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    🇧🇷 PT
                  </button>
                  <button
                    onClick={() => setLang('en')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                      lang === 'en'
                        ? 'bg-purple-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    🇺🇸 EN
                  </button>
                </div>
              </div>

              {/* Jump to Any Level (1-300) */}
              <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700">
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  {t(lang, 'setting.level_select')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={1}
                    max={195}
                    value={currentLevel}
                    onChange={(e) => setCurrentLevel(Number(e.target.value))}
                    className="flex-1 accent-amber-400"
                  />
                  <span className="text-sm font-black text-amber-300 w-12 text-right">
                    #{currentLevel}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* JOURNEY MODAL */}
      {showJourneyModal && (
        <JourneyModal
          currentLevel={currentLevel}
          selectedThemeId={selectedThemeId}
          lang={lang}
          onSelectTheme={(id) => setSelectedThemeId(id)}
          onJumpToLevel={(lv) => setCurrentLevel(lv)}
          onClose={() => setShowJourneyModal(false)}
        />
      )}

      {/* GRIMOIRE MODAL */}
      {showGrimoireModal && (
        <GrimoireModal
          lang={lang}
          servedCountByPuppy={servedByPuppy}
          onClose={() => setShowGrimoireModal(false)}
        />
      )}
    </div>
  );
}
export default App;
