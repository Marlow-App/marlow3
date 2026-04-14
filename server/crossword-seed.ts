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

// Plus-cross layout: 1 DOWN word (col 2) × 1 ACROSS word (row 2), intersecting at (2,2).
const CROSS: boolean[][] = [
  [false, false, true,  false, false],
  [false, false, true,  false, false],
  [true,  true,  true,  true,  true],
  [false, false, true,  false, false],
  [false, false, true,  false, false],
];

function makePuzzle(
  puzzleIndex: number,
  title: string,
  down: { clue: string; chars: string[]; answer: string[] },
  across: { clue: string; chars: string[]; answer: string[] },
): CrosswordPuzzleData {
  return {
    title,
    puzzleIndex,
    grid: CROSS,
    words: [
      { number: 1, direction: "down",   startRow: 0, startCol: 2, length: 5, ...down },
      { number: 2, direction: "across", startRow: 2, startCol: 0, length: 5, ...across },
    ],
  };
}

export const SEED_PUZZLES: CrosswordPuzzleData[] = [

  // intersection: 香 xiang
  makePuzzle(0, "Fruits",
    { clue: "First char of 5 fruits: apple 苹果 / grape 葡萄 / banana 香蕉 / pear 梨 / mango 芒果",
      chars: ["苹","葡","香","梨","芒"], answer: ["ping","pu","xiang","li","mang"] },
    { clue: "Bought some bananas! (买了香蕉吧)",
      chars: ["买","了","香","蕉","吧"], answer: ["mai","le","xiang","jiao","ba"] },
  ),

  // intersection: 豆 dou
  makePuzzle(1, "Vegetables",
    { clue: "Napa cabbage 白菜 · tofu 豆腐 · spring onion 葱 — three Chinese vegetables",
      chars: ["白","菜","豆","腐","葱"], answer: ["bai","cai","dou","fu","cong"] },
    { clue: "I drank soy milk (我喝豆浆了 — 豆浆 is made from 豆 soy beans)",
      chars: ["我","喝","豆","浆","了"], answer: ["wo","he","dou","jiang","le"] },
  ),

  // intersection: 京 jing
  makePuzzle(2, "Chinese Cities",
    { clue: "Three cities: Nanjing 南京 / Beijing 北京 / Shanghai 上海 (first 5 chars)",
      chars: ["南","北","京","上","海"], answer: ["nan","bei","jing","shang","hai"] },
    { clue: "I'm going to Beijing (the capital) for fun (我去京城玩)",
      chars: ["我","去","京","城","玩"], answer: ["wo","qu","jing","cheng","wan"] },
  ),

  // intersection: 广 guang
  makePuzzle(3, "Chinese Cities",
    { clue: "Five major cities: 北京 Beijing / 上海 Shanghai / 广州 Guangzhou / 深圳 Shenzhen / 天津 Tianjin",
      chars: ["北","上","广","深","津"], answer: ["bei","shang","guang","shen","jin"] },
    { clue: "I'm going to Guangzhou for fun (我去广州玩)",
      chars: ["我","去","广","州","玩"], answer: ["wo","qu","guang","zhou","wan"] },
  ),

  // intersection: 龙 long
  makePuzzle(4, "Famous Names",
    { clue: "Two martial-arts legends: Bruce Lee 李小龙 / Jackie Chan 成龙",
      chars: ["李","小","龙","成","龙"], answer: ["li","xiao","long","cheng","long"] },
    { clue: "He is a son of the dragon (他是龙的人)",
      chars: ["他","是","龙","的","人"], answer: ["ta","shi","long","de","ren"] },
  ),

  // intersection: 毛 mao
  makePuzzle(5, "Famous Names",
    { clue: "Two historical figures: Confucius 孔子 · Mao Zedong 毛泽东",
      chars: ["孔","子","毛","泽","东"], answer: ["kong","zi","mao","ze","dong"] },
    { clue: "He is Chairman Mao (他是毛主席)",
      chars: ["他","是","毛","主","席"], answer: ["ta","shi","mao","zhu","xi"] },
  ),

  // intersection: 诗 shi
  makePuzzle(6, "Famous Names",
    { clue: "Li Bai 李白 · poetry 诗 · Du Fu 杜甫 — two great Tang dynasty poets",
      chars: ["李","白","诗","杜","甫"], answer: ["li","bai","shi","du","fu"] },
    { clue: "I read a lot of poetry (我读诗很多)",
      chars: ["我","读","诗","很","多"], answer: ["wo","du","shi","hen","duo"] },
  ),

  // intersection: 吃 chi
  makePuzzle(7, "Common Phrases",
    { clue: "Have you eaten rice? (你好吃饭吗 — classic Chinese way of saying hello)",
      chars: ["你","好","吃","饭","吗"], answer: ["ni","hao","chi","fan","ma"] },
    { clue: "I want to eat dumplings (我想吃饺子)",
      chars: ["我","想","吃","饺","子"], answer: ["wo","xiang","chi","jiao","zi"] },
  ),

  // intersection: 好 hao
  makePuzzle(8, "Greetings",
    { clue: "Study well and make progress (你好好学习 — classic teacher's blessing)",
      chars: ["你","好","好","学","习"], answer: ["ni","hao","hao","xue","xi"] },
    { clue: "Is everyone well? (大家好吗啊)",
      chars: ["大","家","好","吗","啊"], answer: ["da","jia","hao","ma","a"] },
  ),

  // intersection: 学 xue
  makePuzzle(9, "Common Phrases",
    { clue: "I want to learn Chinese (我要学中文)",
      chars: ["我","要","学","中","文"], answer: ["wo","yao","xue","zhong","wen"] },
    { clue: "He is studying English (他在学英语)",
      chars: ["他","在","学","英","语"], answer: ["ta","zai","xue","ying","yu"] },
  ),

  // intersection: 苹 ping
  makePuzzle(10, "Fruits",
    { clue: "Five fruits: pear 梨 / mandarin 橘 / apple 苹 / peach 桃 / plum 李",
      chars: ["梨","橘","苹","桃","李"], answer: ["li","ju","ping","tao","li"] },
    { clue: "Are you buying apples? (我买苹果吗)",
      chars: ["我","买","苹","果","吗"], answer: ["wo","mai","ping","guo","ma"] },
  ),

  // intersection: 菜 cai
  makePuzzle(11, "Vegetables",
    { clue: "Five vegetables: pepper 椒 / carrot 萝 / greens 菜 / eggplant 茄 / garlic 蒜",
      chars: ["椒","萝","菜","茄","蒜"], answer: ["jiao","luo","cai","qie","suan"] },
    { clue: "I love eating cauliflower (我爱菜花吃 — 菜花 is cauliflower)",
      chars: ["我","爱","菜","花","吃"], answer: ["wo","ai","cai","hua","chi"] },
  ),

  // intersection: 谢 xie
  makePuzzle(12, "Common Phrases",
    { clue: "No need to thank me! (不用谢谢啦 — polite reply to a thank-you)",
      chars: ["不","用","谢","谢","啦"], answer: ["bu","yong","xie","xie","la"] },
    { clue: "Let me say thank you (我说谢谢吧)",
      chars: ["我","说","谢","谢","吧"], answer: ["wo","shuo","xie","xie","ba"] },
  ),

  // intersection: 海 hai
  makePuzzle(13, "Chinese Cities",
    { clue: "Go to Shanghai to travel (去上海旅游 — 上海 Shanghai)",
      chars: ["去","上","海","旅","游"], answer: ["qu","shang","hai","lv","you"] },
    { clue: "I love eating seafood (我爱海鲜吃 — 海鲜 seafood)",
      chars: ["我","爱","海","鲜","吃"], answer: ["wo","ai","hai","xian","chi"] },
  ),

];

export async function seedCrosswords(): Promise<void> {
  const { db } = await import("./db");
  const { dailyCrosswords } = await import("@shared/schema");

  // Insert-only: never overwrite admin-edited puzzle rows.
  const existing = await db
    .select({ puzzleIndex: dailyCrosswords.puzzleIndex })
    .from(dailyCrosswords);
  const existingIndices = new Set(existing.map((p) => p.puzzleIndex));

  let added = 0;
  for (const puzzle of SEED_PUZZLES) {
    if (existingIndices.has(puzzle.puzzleIndex)) continue;
    await db.insert(dailyCrosswords).values({
      puzzleIndex: puzzle.puzzleIndex,
      title: puzzle.title,
      grid: puzzle.grid as unknown as Record<string, unknown>,
      words: puzzle.words as unknown as Record<string, unknown>[],
    });
    added++;
  }

  console.log(
    `[Crossword] Seed done — ${added} puzzles added. Total in DB: ${existing.length + added}.`,
  );
}
