export interface CrosswordWordEntry {
  number: number;
  direction: "across" | "down";
  startRow: number;
  startCol: number;
  length: number;
  clue: string;
  chars: string[];
  answer: string[];
}

export interface CrosswordPuzzleData {
  title: string;
  puzzleIndex: number;
  grid: boolean[][];
  words: CrosswordWordEntry[];
}

// Layout A: 5 × 2-char words across
// W W . W W / blank / W W . W W / blank / W W . . .
const gridA: boolean[][] = [
  [true,  true,  false, true,  true],
  [false, false, false, false, false],
  [true,  true,  false, true,  true],
  [false, false, false, false, false],
  [true,  true,  false, false, false],
];

// Layout B: 4-char + 4-char + 2+2
// W W W W . / blank / W W W W . / blank / W W . W W
const gridB: boolean[][] = [
  [true,  true,  true,  true,  false],
  [false, false, false, false, false],
  [true,  true,  true,  true,  false],
  [false, false, false, false, false],
  [true,  true,  false, true,  true],
];

// Layout C: 4-char + 2+2 + 3-char
// W W W W . / blank / W W . W W / blank / W W W . .
const gridC: boolean[][] = [
  [true,  true,  true,  true,  false],
  [false, false, false, false, false],
  [true,  true,  false, true,  true],
  [false, false, false, false, false],
  [true,  true,  true,  false, false],
];

// Layout D: 2+2 + 2+2 + 3-char
// W W . W W / blank / W W . W W / blank / W W W . .
const gridD: boolean[][] = [
  [true,  true,  false, true,  true],
  [false, false, false, false, false],
  [true,  true,  false, true,  true],
  [false, false, false, false, false],
  [true,  true,  true,  false, false],
];

// Layout E: 4-char + 4-char + 3-char
// W W W W . / blank / W W W W . / blank / W W W . .
const gridE: boolean[][] = [
  [true,  true,  true,  true,  false],
  [false, false, false, false, false],
  [true,  true,  true,  true,  false],
  [false, false, false, false, false],
  [true,  true,  true,  false, false],
];

export const SEED_PUZZLES: CrosswordPuzzleData[] = [
  // ─── Puzzle 1: Chinese Cities I ──────────────────────────────────────────
  {
    title: "Chinese Cities I",
    puzzleIndex: 0,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Capital of China", chars: ["北", "京"], answer: ["bei", "jing"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "China's largest city", chars: ["上", "海"], answer: ["shang", "hai"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Sichuan city, home of giant pandas", chars: ["成", "都"], answer: ["cheng", "du"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Largest city in Guangdong province", chars: ["广", "州"], answer: ["guang", "zhou"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Ancient capital meaning 'Southern Capital'", chars: ["南", "京"], answer: ["nan", "jing"] },
    ],
  },

  // ─── Puzzle 2: Fruits ─────────────────────────────────────────────────────
  {
    title: "Fruits",
    puzzleIndex: 1,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Apple", chars: ["苹", "果"], answer: ["ping", "guo"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "Watermelon", chars: ["西", "瓜"], answer: ["xi", "gua"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Banana", chars: ["香", "蕉"], answer: ["xiang", "jiao"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Mandarin orange / Tangerine", chars: ["橘", "子"], answer: ["ju", "zi"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Grape", chars: ["葡", "萄"], answer: ["pu", "tao"] },
    ],
  },

  // ─── Puzzle 3: Famous Figures I ───────────────────────────────────────────
  {
    title: "Famous Figures I",
    puzzleIndex: 2,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Tang dynasty poet, 'The Poet Immortal'", chars: ["李", "白"], answer: ["li", "bai"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "Tang dynasty poet, 'The Poet Sage'", chars: ["杜", "甫"], answer: ["du", "fu"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Ancient philosopher known in English as Confucius", chars: ["孔", "子"], answer: ["kong", "zi"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Father of modern Chinese literature", chars: ["鲁", "迅"], answer: ["lu", "xun"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Kung fu movie star known in the West as Jackie Chan", chars: ["成", "龙"], answer: ["cheng", "long"] },
    ],
  },

  // ─── Puzzle 4: Greetings ──────────────────────────────────────────────────
  {
    title: "Greetings",
    puzzleIndex: 3,
    grid: gridD,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Hello / Hi", chars: ["你", "好"], answer: ["ni", "hao"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "Thank you", chars: ["谢", "谢"], answer: ["xie", "xie"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Goodbye / See you later", chars: ["再", "见"], answer: ["zai", "jian"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Come on! / Keep it up! / Go!", chars: ["加", "油"], answer: ["jia", "you"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 3, clue: "Sorry / I apologize", chars: ["对", "不", "起"], answer: ["dui", "bu", "qi"] },
    ],
  },

  // ─── Puzzle 5: Lunar New Year ─────────────────────────────────────────────
  {
    title: "Lunar New Year",
    puzzleIndex: 4,
    grid: gridB,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 4, clue: "Happy New Year! (Lunar New Year greeting)", chars: ["新", "年", "快", "乐"], answer: ["xin", "nian", "kuai", "le"] },
      { number: 2, direction: "across", startRow: 2, startCol: 0, length: 4, clue: "Wishing you prosperity! (Chinese New Year greeting)", chars: ["恭", "喜", "发", "财"], answer: ["gong", "xi", "fa", "cai"] },
      { number: 3, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Chinese Spring Festival / Lunar New Year", chars: ["春", "节"], answer: ["chun", "jie"] },
      { number: 4, direction: "across", startRow: 4, startCol: 3, length: 2, clue: "Sweet sticky rice ball eaten at the Lantern Festival", chars: ["元", "宵"], answer: ["yuan", "xiao"] },
    ],
  },

  // ─── Puzzle 6: Vegetables ─────────────────────────────────────────────────
  {
    title: "Vegetables",
    puzzleIndex: 5,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Napa cabbage / Chinese cabbage", chars: ["白", "菜"], answer: ["bai", "cai"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "Potato", chars: ["土", "豆"], answer: ["tu", "dou"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Cucumber", chars: ["黄", "瓜"], answer: ["huang", "gua"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Corn / Maize", chars: ["玉", "米"], answer: ["yu", "mi"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Tomato", chars: ["番", "茄"], answer: ["fan", "qie"] },
    ],
  },

  // ─── Puzzle 7: Chinese Cities II ──────────────────────────────────────────
  {
    title: "Chinese Cities II",
    puzzleIndex: 6,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Tech hub near Hong Kong", chars: ["深", "圳"], answer: ["shen", "zhen"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "City famous for West Lake", chars: ["杭", "州"], answer: ["hang", "zhou"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Ancient capital, home of the Terracotta Army", chars: ["西", "安"], answer: ["xi", "an"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Major city in central China", chars: ["武", "汉"], answer: ["wu", "han"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Coastal city near Beijing", chars: ["天", "津"], answer: ["tian", "jin"] },
    ],
  },

  // ─── Puzzle 8: Ancient Philosophers ─────────────────────────────────────
  {
    title: "Ancient Philosophers",
    puzzleIndex: 7,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Ancient philosopher (Confucius)", chars: ["孔", "子"], answer: ["kong", "zi"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "Confucian scholar known in English as Mencius", chars: ["孟", "子"], answer: ["meng", "zi"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Founder of Taoism (Laozi)", chars: ["老", "子"], answer: ["lao", "zi"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Taoist philosopher, author of 'Zhuangzi'", chars: ["庄", "子"], answer: ["zhuang", "zi"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Sun Tzu, author of 'The Art of War'", chars: ["孙", "子"], answer: ["sun", "zi"] },
    ],
  },

  // ─── Puzzle 9: Chinese Food ───────────────────────────────────────────────
  {
    title: "Chinese Food",
    puzzleIndex: 8,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Dumpling — eaten at Chinese New Year", chars: ["饺", "子"], answer: ["jiao", "zi"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "Hotpot — popular communal Chinese dish", chars: ["火", "锅"], answer: ["huo", "guo"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Noodles", chars: ["面", "条"], answer: ["mian", "tiao"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Tofu / Bean curd", chars: ["豆", "腐"], answer: ["dou", "fu"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Cooked rice", chars: ["米", "饭"], answer: ["mi", "fan"] },
    ],
  },

  // ─── Puzzle 10: Common Phrases ────────────────────────────────────────────
  {
    title: "Common Phrases",
    puzzleIndex: 9,
    grid: gridE,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 4, clue: "May all your wishes come true (blessing)", chars: ["万", "事", "如", "意"], answer: ["wan", "shi", "ru", "yi"] },
      { number: 2, direction: "across", startRow: 2, startCol: 0, length: 4, clue: "Happy Birthday!", chars: ["生", "日", "快", "乐"], answer: ["sheng", "ri", "kuai", "le"] },
      { number: 3, direction: "across", startRow: 4, startCol: 0, length: 3, clue: "No problem / It's fine", chars: ["没", "问", "题"], answer: ["mei", "wen", "ti"] },
    ],
  },

  // ─── Puzzle 11: Chinese Cities III ───────────────────────────────────────
  {
    title: "Chinese Cities III",
    puzzleIndex: 10,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Mountain city famous for spicy hotpot", chars: ["重", "庆"], answer: ["chong", "qing"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "City known for Tsingtao beer", chars: ["青", "岛"], answer: ["qing", "dao"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Coastal city in northeastern China", chars: ["大", "连"], answer: ["da", "lian"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "City in Shanxi province known for vinegar", chars: ["太", "原"], answer: ["tai", "yuan"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "City in Yunnan with famous flower markets", chars: ["昆", "明"], answer: ["kun", "ming"] },
    ],
  },

  // ─── Puzzle 12: Animals ───────────────────────────────────────────────────
  {
    title: "Animals",
    puzzleIndex: 11,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "China's beloved black-and-white bear", chars: ["熊", "猫"], answer: ["xiong", "mao"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "Striped big cat, symbol of strength", chars: ["老", "虎"], answer: ["lao", "hu"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Fluffy long-eared animal", chars: ["兔", "子"], answer: ["tu", "zi"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Popular orange pet fish", chars: ["金", "鱼"], answer: ["jin", "yu"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Reptile with a shell, symbol of longevity", chars: ["乌", "龟"], answer: ["wu", "gui"] },
    ],
  },

  // ─── Puzzle 13: Famous Figures II ────────────────────────────────────────
  {
    title: "Famous Figures II",
    puzzleIndex: 12,
    grid: gridA,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 2, clue: "Iconic Chinese pop singer, 'Queen of Mandopop'", chars: ["王", "菲"], answer: ["wang", "fei"] },
      { number: 2, direction: "across", startRow: 0, startCol: 3, length: 2, clue: "World-famous Chinese classical pianist", chars: ["郎", "朗"], answer: ["lang", "lang"] },
      { number: 3, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Tennis champion, first Chinese Grand Slam singles winner", chars: ["李", "娜"], answer: ["li", "na"] },
      { number: 4, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Action movie star, director of Wolf Warrior", chars: ["吴", "京"], answer: ["wu", "jing"] },
      { number: 5, direction: "across", startRow: 4, startCol: 0, length: 2, clue: "Mandopop singer famous for 'Winter Fire'", chars: ["费", "翔"], answer: ["fei", "xiang"] },
    ],
  },

  // ─── Puzzle 14: Idioms & Mix ──────────────────────────────────────────────
  {
    title: "Idioms & Mix",
    puzzleIndex: 13,
    grid: gridC,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 4, clue: "So-so / Just okay (very common Chinese idiom)", chars: ["马", "马", "虎", "虎"], answer: ["ma", "ma", "hu", "hu"] },
      { number: 2, direction: "across", startRow: 2, startCol: 0, length: 2, clue: "Hong Kong — means 'Fragrant Harbour'", chars: ["香", "港"], answer: ["xiang", "gang"] },
      { number: 3, direction: "across", startRow: 2, startCol: 3, length: 2, clue: "Island off China's southeastern coast", chars: ["台", "湾"], answer: ["tai", "wan"] },
      { number: 4, direction: "across", startRow: 4, startCol: 0, length: 3, clue: "It's okay / Never mind", chars: ["没", "关", "系"], answer: ["mei", "guan", "xi"] },
    ],
  },
];

export async function seedCrosswords(): Promise<void> {
  const { db } = await import("./db");
  const { dailyCrosswords } = await import("@shared/schema");
  const existing = await db.select().from(dailyCrosswords).limit(1);
  if (existing.length > 0) {
    console.log("[Crossword] Puzzles already seeded, skipping.");
    return;
  }
  for (const puzzle of SEED_PUZZLES) {
    await db.insert(dailyCrosswords).values({
      puzzleIndex: puzzle.puzzleIndex,
      title: puzzle.title,
      grid: puzzle.grid as unknown as Record<string, unknown>,
      words: puzzle.words as unknown as Record<string, unknown>[],
    });
  }
  console.log(`[Crossword] Seeded ${SEED_PUZZLES.length} puzzles.`);
}
