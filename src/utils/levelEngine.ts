import { LEVELS_DATA, RawLevelConfig } from '../data/levels';
import { GAME_SETTINGS } from '../data/constants';

export interface WaterLayer {
  color: number;
  isHide: boolean;
}

export interface BottleModel {
  id: number;
  index: number;
  pos: { x: number; y: number };
  layers: WaterLayer[];
  maxLayers: number;
  // Obstacles & Special States
  isCloth: boolean;       // Type 4: single curtain
  colorCloth: boolean;    // Type 5: numbered curtain
  clothColor: number;     // 0 = any color, >0 = specific color
  clothNum: number;       // Remaining orders to unlock curtain
  isStone: boolean;       // Type 6: clay pedestal (cannot pour OUT until broken)
  isParcel: boolean;      // Type 7: plaster shell (adjacent completion breaks it)
  isLocked: boolean;      // Type 8: locked extra tube
  isHuge: boolean;        // Type 9: giant bottle (capacity 13)
  // Runtime Status
  isComplete: boolean;
  isDelivered: boolean;
}

export interface PuppyOrder {
  slotIndex: number;
  puppyId: number;
  targetColor: number | null; // null if no more orders left
  isDelivering: boolean;
}

export interface ParsedLevelState {
  levelNumber: number;
  rawId: number;
  isHard: boolean;
  isSuperHard: boolean;
  group: number[];
  bottles: BottleModel[];
  orders: PuppyOrder[];
  remainingOrderBoxList: number[];
  hugeColors: Set<number>;
  freedPositions: { index: number; x: number; y: number }[];
}

export function createSeedRandom(seed: number): () => number {
  let t = seed;
  const r = 2147483648;
  return function () {
    t = (1103515245 * t + 12345) % r;
    return t / r;
  };
}

export function getLevelConfig(levelNumber: number): RawLevelConfig {
  const total = LEVELS_DATA.length;
  let realIdx = levelNumber - 1;
  if (realIdx >= total) {
    const repeatStart = Math.min(GAME_SETTINGS.REPEAT_LEVEL_START, total - 20);
    realIdx = repeatStart + ((realIdx - total) % (total - repeatStart));
  }
  return LEVELS_DATA[Math.max(0, Math.min(total - 1, realIdx))];
}

export function buildLevelState(levelNumber: number, keepLockedTubes: boolean = true): ParsedLevelState {
  const cfg = getLevelConfig(levelNumber);
  const posParts = cfg.pos.split('|');
  const mapParts = cfg.map.split('|');

  const rawBottles: BottleModel[] = mapParts.map((mStr, idx) => {
    const layerTokens = mStr.split(',');
    const layers: WaterLayer[] = [];
    for (const tok of layerTokens) {
      const [hideStr, colorStr] = tok.split('_');
      const flag = Number(hideStr);
      const color = Number(colorStr);
      if (flag === 1 && color >= 0) {
        layers.push({ isHide: true, color });
      } else if (flag === 0 && color >= 0) {
        layers.push({ isHide: false, color });
      }
    }
    const posStr = posParts[idx] || '0,0';
    const [px, py] = posStr.split(',').map((v) => parseInt(v, 10) || 0);
    return {
      id: idx,
      index: idx,
      pos: { x: px, y: py },
      layers,
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
    };
  });

  // Apply types ("cupIdx_typeCode_clothColor_num")
  for (const tStr of cfg.types) {
    if (!tStr) continue;
    const [idxS, typeS, colorS, numS] = tStr.split('_').map(Number);
    const b = rawBottles[idxS];
    if (!b) continue;
    switch (typeS) {
      case 4: // Cloth
        b.isCloth = true;
        b.clothColor = colorS;
        b.clothNum = 1;
        break;
      case 5: // ColorCloth
        b.colorCloth = true;
        b.clothColor = colorS;
        b.clothNum = numS || 1;
        break;
      case 6: // BStone (Clay Pedestal)
        b.isStone = true;
        break;
      case 7: // Parcel (Plaster)
        b.isParcel = true;
        break;
      case 8: // AD / Extra Locked Tube
        if (keepLockedTubes) {
          b.isLocked = true;
        }
        break;
      case 9: // Huge Bottle (13 capacity)
        b.isHuge = true;
        b.maxLayers = 13;
        break;
    }
  }

  // Ensure topmost layer of each bottle is not hidden initially
  for (const b of rawBottles) {
    if (b.layers.length > 0) {
      b.layers[b.layers.length - 1].isHide = false;
    }
  }

  // Deterministic shuffle of normal bottles on level > 1 (preserving positions!)
  if (levelNumber !== 1) {
    const rng = createSeedRandom(levelNumber);
    const randVal = rng();
    for (let a = rawBottles.length - 1; a > 0; a--) {
      const s = Math.floor(randVal * (a + 1));
      const ba = rawBottles[a];
      const bs = rawBottles[s];
      const aSpecial =
        ba.isCloth || ba.colorCloth || ba.isStone || ba.isParcel || ba.isLocked || ba.isHuge || ba.layers.length === 0;
      const sSpecial =
        bs.isCloth || bs.colorCloth || bs.isStone || bs.isParcel || bs.isLocked || bs.isHuge || bs.layers.length === 0;
      if (!aSpecial && !sSpecial) {
        // Swap their contents while keeping their visual pos/index coherent
        const tempLayers = ba.layers;
        ba.layers = bs.layers;
        bs.layers = tempLayers;
      }
    }
  }

  // Re-index
  rawBottles.forEach((b, i) => {
    b.id = i;
    b.index = i;
  });

  // Compute Huge Colors and Order Box List (exact replica of initBoxList)
  const hugeColors = new Set<number>();
  for (const b of rawBottles) {
    if (b.isHuge) {
      for (const l of b.layers) {
        if (l.color >= 0) hugeColors.add(l.color);
      }
    }
  }

  const colorCounts = new Map<number, number>();
  const priorityClothMap = new Map<number, number>();

  for (const b of rawBottles) {
    if (!b.isHuge) {
      for (const l of b.layers) {
        if (l.color >= 0 && !hugeColors.has(l.color)) {
          colorCounts.set(l.color, (colorCounts.get(l.color) || 0) + 1);
        }
      }
      if (b.colorCloth && b.clothColor > 0) {
        const prev = priorityClothMap.get(b.clothColor) || 0;
        priorityClothMap.set(b.clothColor, Math.max(prev, b.clothNum));
      }
      if (b.isCloth && b.clothColor > 0) {
        const prev = priorityClothMap.get(b.clothColor) || 0;
        priorityClothMap.set(b.clothColor, Math.max(prev, 1));
      }
    }
  }

  const priorityList: number[] = [];
  priorityClothMap.forEach((count, color) => {
    for (let i = 0; i < count; i++) {
      priorityList.push(color);
    }
  });

  for (const col of priorityList) {
    if (colorCounts.has(col)) {
      const rem = (colorCounts.get(col) || 0) - 4;
      if (rem > 0) colorCounts.set(col, rem);
      else colorCounts.delete(col);
    }
  }

  const normalOrderList: number[] = [];
  colorCounts.forEach((totalUnits, color) => {
    const fullBottles = Math.floor(totalUnits / 4);
    for (let i = 0; i < fullBottles; i++) {
      normalOrderList.push(color);
    }
  });

  const boxList = [...priorityList, ...normalOrderList];

  // Append huge bottle color at the end of boxList just like GameManager.getLevelData
  for (const b of rawBottles) {
    if (b.isHuge && b.layers.length > 0) {
      const col = b.layers[0].color;
      if (col >= 0) {
        boxList.push(col);
      }
    }
  }

  // Initialize 4 active Puppy Customer Orders
  const orders: PuppyOrder[] = [];
  for (let slot = 0; slot < 4; slot++) {
    const nextColor = boxList.length > 0 ? boxList.shift()! : null;
    orders.push({
      slotIndex: slot,
      puppyId: (levelNumber * 3 + slot) % 8,
      targetColor: nextColor,
      isDelivering: false,
    });
  }

  return {
    levelNumber,
    rawId: cfg.id,
    isHard: cfg.isHard === 1,
    isSuperHard: cfg.isSuperHard === 1,
    group: cfg.group || [],
    bottles: rawBottles,
    orders,
    remainingOrderBoxList: boxList,
    hugeColors,
    freedPositions: [],
  };
}

// Helper: can bottle exist as a touchable/selectable target?
export function isBottleTouchable(b: BottleModel): boolean {
  return !(
    b.isCloth ||
    b.colorCloth ||
    b.isParcel ||
    b.isLocked ||
    b.isComplete ||
    b.isDelivered
  );
}

// Get top consecutive visible layers of the same color from a source bottle
export function getPourableWaterList(source: BottleModel, maxSpaceInTarget: number): number[] {
  if (
    maxSpaceInTarget <= 0 ||
    source.isComplete ||
    source.isDelivered ||
    source.layers.length === 0 ||
    source.isStone ||
    source.isHuge ||
    !isBottleTouchable(source)
  ) {
    return [];
  }
  const topColor = source.layers[source.layers.length - 1].color;
  const result: number[] = [];
  for (let i = source.layers.length - 1; i >= 0; i--) {
    const l = source.layers[i];
    const isTopmost = i === source.layers.length - 1;
    if (l.color !== topColor || (l.isHide && !isTopmost)) {
      break;
    }
    result.push(l.color);
    if (result.length >= maxSpaceInTarget) {
      break;
    }
  }
  return result;
}

// Validate if pouring from source to target is legal
export function canPour(
  source: BottleModel,
  target: BottleModel,
  allBottles: BottleModel[]
): { valid: boolean; count: number; color: number; reason?: string } {
  if (source.id === target.id) return { valid: false, count: 0, color: -1 };
  if (!isBottleTouchable(source) || !isBottleTouchable(target)) {
    return { valid: false, count: 0, color: -1 };
  }
  if (source.isStone || source.isHuge || source.layers.length === 0) {
    return { valid: false, count: 0, color: -1 };
  }
  const space = target.maxLayers - target.layers.length;
  if (space <= 0) {
    return { valid: false, count: 0, color: -1 };
  }

  const topSourceColor = source.layers[source.layers.length - 1].color;
  if (target.layers.length > 0) {
    const topTargetColor = target.layers[target.layers.length - 1].color;
    if (topTargetColor !== topSourceColor) {
      return { valid: false, count: 0, color: -1 };
    }
  }

  // Check Stone Pedestal priority rule from GameLayer.ts:
  // If there is a Stone bottle whose top water matches topSourceColor,
  // and target is ALSO a stone bottle, target must be that matching stone bottle.
  if (target.isStone) {
    const targetStone = allBottles.find(
      (b) =>
        !b.isDelivered &&
        b.isStone &&
        b.layers.length > 0 &&
        b.layers[b.layers.length - 1].color === topSourceColor
    );
    if (targetStone && targetStone.id !== target.id) {
      return { valid: false, count: 0, color: -1 };
    }
  }

  const outList = getPourableWaterList(source, space);
  if (outList.length === 0) {
    return { valid: false, count: 0, color: -1 };
  }

  return { valid: true, count: outList.length, color: topSourceColor };
}

// Check if bottle is monochromatic and full (with all layers revealed)
export function checkBottleFullSameColor(b: BottleModel): boolean {
  if (b.layers.length !== b.maxLayers) return false;
  const firstColor = b.layers[0].color;
  return b.layers.every((l) => l.color === firstColor && !l.isHide);
}

// Find a smart hint move (AI Oracle Solver)
export function findBestHintMove(
  bottles: BottleModel[],
  orders: PuppyOrder[],
  hugeColors: Set<number>
): { fromId: number; toId: number } | null {
  const activeOrderColors = new Set(
    orders.filter((o) => o.targetColor !== null).map((o) => o.targetColor!)
  );

  let bestMove: { fromId: number; toId: number; score: number } | null = null;

  for (const src of bottles) {
    if (!isBottleTouchable(src) || src.isStone || src.isHuge || src.layers.length === 0) {
      continue;
    }
    const isSrcPure = src.layers.every(
      (l) => l.color === src.layers[0].color && !l.isHide
    );

    for (const dst of bottles) {
      const check = canPour(src, dst, bottles);
      if (!check.valid) continue;

      // Avoid pointless pouring of a pure bottle into an empty normal bottle
      if (isSrcPure && dst.layers.length === 0 && !dst.isHuge) {
        continue;
      }

      // Avoid splitting a contiguous stack if it doesn't fit entirely into dst (unless dst is Huge)
      const totalTopRun = getPourableWaterList(src, src.maxLayers).length;
      if (check.count < totalTopRun && !dst.isHuge && dst.layers.length > 0) {
        // Still legal, but lower priority
      }

      let score = 10;

      // High priority: pouring into Giant Bottle
      if (dst.isHuge) score += 100;

      // High priority: completes a bottle!
      if (dst.layers.length + check.count === dst.maxLayers) {
        const willBePure = dst.layers.every((l) => l.color === check.color && !l.isHide);
        if (willBePure) score += 85;
      }

      // High priority: reveals a hidden '?' layer in src or empties src!
      const remainingInSrc = src.layers.length - check.count;
      if (remainingInSrc === 0) {
        score += 50;
      } else if (src.layers[remainingInSrc - 1].isHide) {
        score += 65;
      }

      // Priority if color matches an active puppy order
      if (activeOrderColors.has(check.color)) {
        score += 30;
      }

      // Priority if pouring into a non-empty bottle rather than using up an empty bottle
      if (dst.layers.length > 0) {
        score += 25;
      } else if (hugeColors.has(check.color)) {
        score -= 5;
      }

      if (!bestMove || score > bestMove.score) {
        bestMove = { fromId: src.id, toId: dst.id, score };
      }
    }
  }

  return bestMove ? { fromId: bestMove.fromId, toId: bestMove.toId } : null;
}

// Check if no valid moves exist (Deadlock detection replica of GameLayer.checkFail)
export function isDeadlocked(bottles: BottleModel[]): boolean {
  const activeBottles = bottles.filter((b) => !b.isDelivered && !b.isComplete);
  // If any usable empty bottle exists, not deadlocked
  const hasEmptyTouchable = activeBottles.some(
    (b) => isBottleTouchable(b) && b.layers.length === 0
  );
  if (hasEmptyTouchable) return false;

  for (const src of activeBottles) {
    for (const dst of activeBottles) {
      if (canPour(src, dst, activeBottles).valid) {
        return false;
      }
    }
  }
  return activeBottles.length > 0;
}
