export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface PotionColorSpec {
  id: number;
  namePt: string;
  nameEn: string;
  symbol: string; // For colorblind accessibility
  body: RGB;
  top: RGB;
  order1: RGB;
  order2: RGB;
  order3: RGB;
  hexBody: string;
  hexTop: string;
}

function rgbToHex({ r, g, b }: RGB): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

const COLOR_LIST_TOP: RGB[] = [
  { r: 255, g: 147, b: 30 },
  { r: 172, g: 224, b: 39 },
  { r: 255, g: 220, b: 50 },
  { r: 183, g: 70, b: 65 },
  { r: 60, g: 207, b: 255 },
  { r: 255, g: 155, b: 245 },
  { r: 248, g: 65, b: 68 },
  { r: 56, g: 86, b: 209 },
  { r: 29, g: 117, b: 37 },
  { r: 141, g: 156, b: 228 },
  { r: 158, g: 48, b: 237 },
  { r: 178, g: 24, b: 134 },
  { r: 0, g: 232, b: 197 },
  { r: 200, g: 123, b: 255 },
  { r: 196, g: 157, b: 101 },
];

const COLOR_LIST: RGB[] = [
  { r: 228, g: 89, b: 0 },
  { r: 98, g: 165, b: 2 },
  { r: 245, g: 185, b: 0 },
  { r: 113, g: 50, b: 43 },
  { r: 0, g: 152, b: 215 },
  { r: 255, g: 102, b: 213 },
  { r: 204, g: 4, b: 0 },
  { r: 28, g: 30, b: 203 },
  { r: 8, g: 90, b: 16 },
  { r: 96, g: 104, b: 171 },
  { r: 99, g: 27, b: 151 },
  { r: 162, g: 6, b: 118 },
  { r: 0, g: 165, b: 140 },
  { r: 171, g: 61, b: 255 },
  { r: 142, g: 110, b: 63 },
];

const ORDER_COLOR_1: RGB[] = [
  { r: 255, g: 147, b: 30 },
  { r: 172, g: 224, b: 39 },
  { r: 255, g: 220, b: 50 },
  { r: 183, g: 70, b: 65 },
  { r: 60, g: 207, b: 255 },
  { r: 255, g: 155, b: 245 },
  { r: 248, g: 65, b: 68 },
  { r: 56, g: 86, b: 209 },
  { r: 29, g: 117, b: 37 },
  { r: 141, g: 156, b: 228 },
  { r: 158, g: 48, b: 237 },
  { r: 195, g: 37, b: 150 },
  { r: 0, g: 232, b: 197 },
  { r: 200, g: 123, b: 255 },
  { r: 196, g: 157, b: 101 },
];

const ORDER_COLOR_2: RGB[] = [
  { r: 202, g: 71, b: 0 },
  { r: 51, g: 144, b: 0 },
  { r: 220, g: 140, b: 0 },
  { r: 95, g: 36, b: 29 },
  { r: 0, g: 119, b: 181 },
  { r: 219, g: 53, b: 174 },
  { r: 172, g: 4, b: 0 },
  { r: 16, g: 18, b: 170 },
  { r: 2, g: 71, b: 8 },
  { r: 79, g: 85, b: 143 },
  { r: 84, g: 18, b: 132 },
  { r: 141, g: 0, b: 101 },
  { r: 0, g: 105, b: 89 },
  { r: 118, g: 39, b: 179 },
  { r: 99, g: 74, b: 38 },
];

const COLOR_METADATA: { namePt: string; nameEn: string; symbol: string }[] = [
  { namePt: 'Âmbar Solar', nameEn: 'Solar Amber', symbol: '☀' },
  { namePt: 'Limão Élfico', nameEn: 'Elven Lime', symbol: '🍀' },
  { namePt: 'Ouro Estelar', nameEn: 'Starlight Gold', symbol: '★' },
  { namePt: 'Raiz Antiga', nameEn: 'Ancient Root', symbol: '🌰' },
  { namePt: 'Gelo Celestial', nameEn: 'Frost Sky', symbol: '❄' },
  { namePt: 'Rosa Fada', nameEn: 'Fairy Rose', symbol: '🌸' },
  { namePt: 'Rubi Fênix', nameEn: 'Phoenix Ruby', symbol: '🔥' },
  { namePt: 'Safira Abissal', nameEn: 'Abyssal Sapphire', symbol: '💧' },
  { namePt: 'Musgo da Floresta', nameEn: 'Forest Moss', symbol: '🌲' },
  { namePt: 'Névoa Lunar', nameEn: 'Lunar Mist', symbol: '🌙' },
  { namePt: 'Ametista Arcana', nameEn: 'Arcane Amethyst', symbol: '🔮' },
  { namePt: 'Magenta Místico', nameEn: 'Mystic Magenta', symbol: '♦' },
  { namePt: 'Turquesa Sereia', nameEn: 'Mermaid Teal', symbol: '🌊' },
  { namePt: 'Lavanda Astral', nameEn: 'Astral Lavender', symbol: '✨' },
  { namePt: 'Areia do Tempo', nameEn: 'Sands of Time', symbol: '⏳' },
];

export const POTION_COLORS: PotionColorSpec[] = COLOR_LIST.map((body, idx) => ({
  id: idx,
  namePt: COLOR_METADATA[idx].namePt,
  nameEn: COLOR_METADATA[idx].nameEn,
  symbol: COLOR_METADATA[idx].symbol,
  body,
  top: COLOR_LIST_TOP[idx],
  order1: ORDER_COLOR_1[idx],
  order2: ORDER_COLOR_2[idx],
  order3: COLOR_LIST[idx],
  hexBody: rgbToHex(body),
  hexTop: rgbToHex(COLOR_LIST_TOP[idx]),
}));

export const GAME_SETTINGS = {
  USER_DEFAULT_GOLD: 200,
  USER_DEFAULT_ENERGY: 5,
  ENERGY_MAX: 5,
  ENERGY_RECOVER_CD: 900, // 15 min
  USER_DEFAULT_PROP_BACK: 3,
  USER_DEFAULT_PROP_SHUFFLE: 2,
  USER_DEFAULT_PROP_CUP: 2,
  NORMAL_REWARD_GOLD: 25,
  HARD_REWARD_GOLD: 60,
  SUPER_HARD_REWARD_GOLD: 100,
  BACK_GOLD_USE: 300,
  SHUFFLE_GOLD_USE: 300,
  CUP_GOLD_USE: 900,
  REPEAT_LEVEL_START: 50,
};

export interface JourneyTheme {
  id: number;
  unlockLevel: number;
  namePt: string;
  nameEn: string;
  chapterPt: string;
  chapterEn: string;
  gradient: string;
  accentColor: string;
  iconEmoji: string;
  ambientDescPt: string;
  ambientDescEn: string;
}

export const JOURNEY_THEMES: JourneyTheme[] = [
  {
    id: 1,
    unlockLevel: 1,
    namePt: 'Viagem Mágica',
    nameEn: 'Magic Voyage',
    chapterPt: 'Níveis 1–19',
    chapterEn: 'Levels 1–19',
    gradient: 'from-indigo-950 via-purple-900 to-slate-950',
    accentColor: '#a855f7',
    iconEmoji: '🧙‍♂️',
    ambientDescPt: 'O laboratório encantado onde os filhotes aprendizes preparam suas primeiras poções.',
    ambientDescEn: 'The enchanted laboratory where apprentice puppies brew their very first potions.',
  },
  {
    id: 2,
    unlockLevel: 20,
    namePt: 'Fio Emaranhado',
    nameEn: 'Tangled Yarn',
    chapterPt: 'Níveis 20–39',
    chapterEn: 'Levels 20–39',
    gradient: 'from-rose-950 via-pink-900 to-slate-950',
    accentColor: '#f43f5e',
    iconEmoji: '🧶',
    ambientDescPt: 'Salão de novelos mágicos e cortinas encantadas que desafiam a visão.',
    ambientDescEn: 'Hall of magic yarn balls and enchanted curtains that test your foresight.',
  },
  {
    id: 3,
    unlockLevel: 40,
    namePt: 'Estrela da Forja',
    nameEn: 'Forge Star',
    chapterPt: 'Níveis 40–59',
    chapterEn: 'Levels 40–59',
    gradient: 'from-amber-950 via-orange-900 to-slate-950',
    accentColor: '#f59e0b',
    iconEmoji: '⚒️',
    ambientDescPt: 'A forja vulcânica onde cristais líquidos brilham na bigorna estelar.',
    ambientDescEn: 'The volcanic forge where liquid crystals glow upon the starlight anvil.',
  },
  {
    id: 4,
    unlockLevel: 60,
    namePt: 'Grafite Fantasia',
    nameEn: 'Fantasy Graffiti',
    chapterPt: 'Níveis 60–79',
    chapterEn: 'Levels 60–79',
    gradient: 'from-cyan-950 via-teal-900 to-slate-950',
    accentColor: '#06b6d4',
    iconEmoji: '🎨',
    ambientDescPt: 'Ateliê cromático onde cada frasco pinta feitiços luminosos no ar.',
    ambientDescEn: 'Chromatic atelier where every flask paints luminous spells in the air.',
  },
  {
    id: 5,
    unlockLevel: 80,
    namePt: 'Império Dourado',
    nameEn: 'Golden Monopoly',
    chapterPt: 'Níveis 80–99',
    chapterEn: 'Levels 80–99',
    gradient: 'from-yellow-950 via-amber-900 to-slate-950',
    accentColor: '#eab308',
    iconEmoji: '👑',
    ambientDescPt: 'A guilda real dos mercadores caninos mais prósperos do reino.',
    ambientDescEn: 'The royal guild of the most prosperous canine merchants in the realm.',
  },
  {
    id: 6,
    unlockLevel: 100,
    namePt: 'Karting Feliz',
    nameEn: 'Happy Karting',
    chapterPt: 'Níveis 100–149',
    chapterEn: 'Levels 100–149',
    gradient: 'from-emerald-950 via-green-900 to-slate-950',
    accentColor: '#10b981',
    iconEmoji: '🏎️',
    ambientDescPt: 'Pista de corrida movida a elixires turbo de alta octanagem.',
    ambientDescEn: 'Race track powered by high-octane turbo elixirs.',
  },
  {
    id: 7,
    unlockLevel: 150,
    namePt: 'Noite da Vassoura',
    nameEn: 'Magic Broom Night',
    chapterPt: 'Níveis 150–199',
    chapterEn: 'Levels 150–199',
    gradient: 'from-violet-950 via-fuchsia-950 to-slate-950',
    accentColor: '#d946ef',
    iconEmoji: '🧹',
    ambientDescPt: 'Voo noturno sob a lua cheia entregando poções pelos telhados.',
    ambientDescEn: 'Night flight under the full moon delivering potions across rooftops.',
  },
  {
    id: 8,
    unlockLevel: 200,
    namePt: 'Grande Detetive',
    nameEn: 'Great Detective',
    chapterPt: 'Níveis 200–249',
    chapterEn: 'Levels 200–249',
    gradient: 'from-slate-900 via-blue-950 to-zinc-950',
    accentColor: '#3b82f6',
    iconEmoji: '🕵️‍♂️',
    ambientDescPt: 'Mistérios ocultos sob camadas de líquido desconhecido.',
    ambientDescEn: 'Hidden mysteries beneath layers of unknown liquid.',
  },
  {
    id: 9,
    unlockLevel: 250,
    namePt: 'Renascimento da Primavera',
    nameEn: 'Spring Revival',
    chapterPt: 'Níveis 250–299',
    chapterEn: 'Levels 250–299',
    gradient: 'from-lime-950 via-emerald-900 to-slate-950',
    accentColor: '#84cc16',
    iconEmoji: '🌸',
    ambientDescPt: 'O jardim secreto onde poções fazem florescer árvores mágicas.',
    ambientDescEn: 'The secret garden where potions bloom magical trees.',
  },
  {
    id: 10,
    unlockLevel: 300,
    namePt: 'Carrinho de Mina',
    nameEn: 'Thrilling Mine Cart',
    chapterPt: 'Níveis 300–349',
    chapterEn: 'Levels 300–349',
    gradient: 'from-stone-900 via-amber-950 to-neutral-950',
    accentColor: '#f97316',
    iconEmoji: '💎',
    ambientDescPt: 'As cavernas profundas de cristal líquido e pedras encantadas.',
    ambientDescEn: 'Deep caverns of liquid crystal and enchanted stones.',
  },
];

export interface PuppyCharacter {
  id: number;
  namePt: string;
  nameEn: string;
  titlePt: string;
  titleEn: string;
  furColor: string;
  earColor: string;
  hatColor: string;
  quotePt: string;
  quoteEn: string;
}

export const PUPPY_CHARACTERS: PuppyCharacter[] = [
  {
    id: 0,
    namePt: 'Bolinha',
    nameEn: 'Barnaby',
    titlePt: 'Corgi Alquimista',
    titleEn: 'Alchemist Corgi',
    furColor: '#f59e0b',
    earColor: '#b45309',
    hatColor: '#7c3aed',
    quotePt: 'Au! Preciso dessa poção brilhante!',
    quoteEn: 'Woof! I need that shiny potion!',
  },
  {
    id: 1,
    namePt: 'Luna',
    nameEn: 'Luna',
    titlePt: 'Poodle Astral',
    titleEn: 'Astral Poodle',
    furColor: '#f9a8d4',
    earColor: '#ec4899',
    hatColor: '#2563eb',
    quotePt: 'As estrelas pedem essa cor!',
    quoteEn: 'The stars call for this color!',
  },
  {
    id: 2,
    namePt: 'Thor',
    nameEn: 'Buster',
    titlePt: 'Husky Mago do Gelo',
    titleEn: 'Frost Mage Husky',
    furColor: '#94a3b8',
    earColor: '#475569',
    hatColor: '#0284c7',
    quotePt: 'Um elixir bem fresquinho, por favor!',
    quoteEn: 'A fresh elixir, please!',
  },
  {
    id: 3,
    namePt: 'Pipoca',
    nameEn: 'Pippin',
    titlePt: 'Golden Encantador',
    titleEn: 'Charming Golden',
    furColor: '#fcd34d',
    earColor: '#d97706',
    hatColor: '#059669',
    quotePt: 'Estou abanando o rabo de ansiedade!',
    quoteEn: 'Wagging my tail with excitement!',
  },
  {
    id: 4,
    namePt: 'Amora',
    nameEn: 'Bella',
    titlePt: 'Beagle Herbalista',
    titleEn: 'Herbalist Beagle',
    furColor: '#d97706',
    earColor: '#78350f',
    hatColor: '#dc2626',
    quotePt: 'Cheirinho de magia pura!',
    quoteEn: 'Smells like pure magic!',
  },
  {
    id: 5,
    namePt: 'Zeca',
    nameEn: 'Ziggy',
    titlePt: 'Pug Feiticeiro',
    titleEn: 'Sorcerer Pug',
    furColor: '#fde68a',
    earColor: '#451a03',
    hatColor: '#9333ea',
    quotePt: 'Rápido, minha varinha está pronta!',
    quoteEn: 'Quick, my wand is ready!',
  },
  {
    id: 6,
    namePt: 'Mel',
    nameEn: 'Honey',
    titlePt: 'Shiba Arcana',
    titleEn: 'Arcane Shiba',
    furColor: '#fb923c',
    earColor: '#c2410c',
    hatColor: '#db2777',
    quotePt: 'Que mistura mais elegante!',
    quoteEn: 'What an elegant brew!',
  },
  {
    id: 7,
    namePt: 'Floco',
    nameEn: 'Snowy',
    titlePt: 'Samoieda Místico',
    titleEn: 'Mystic Samoyed',
    furColor: '#f8fafc',
    earColor: '#cbd5e1',
    hatColor: '#4f46e5',
    quotePt: 'Brilhante como a neve mágica!',
    quoteEn: 'Bright as magic snow!',
  },
];
