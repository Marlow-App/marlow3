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

// Plus-cross layout shared by all 14 puzzles.
// Word 1 DOWN   — cells (0,2)(1,2)(2,2)(3,2)(4,2)
// Word 2 ACROSS — cells (2,0)(2,1)(2,2)(2,3)(2,4)
// Intersection  — cell (2,2): same character and same pinyin syllable in both words.
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

  // 0 — Greetings | intersection: 好 (hao)
  makePuzzle(0, "Greetings",
    { clue: "Study well and make progress (你好好学习)",
      chars: ["你","好","好","学","习"], answer: ["ni","hao","hao","xue","xi"] },
    { clue: "Is everyone well? (大家好吗呀)",
      chars: ["大","家","好","吗","呀"], answer: ["da","jia","hao","ma","ya"] },
  ),

  // 1 — Fruits | intersection: 苹 (ping)
  makePuzzle(1, "Fruits",
    { clue: "Let me eat an apple (我吃苹果吧)",
      chars: ["我","吃","苹","果","吧"], answer: ["wo","chi","ping","guo","ba"] },
    { clue: "She buys apples to eat (她买苹果吃)",
      chars: ["她","买","苹","果","吃"], answer: ["ta","mai","ping","guo","chi"] },
  ),

  // 2 — Vegetables | intersection: 菜 (cai)
  makePuzzle(2, "Vegetables",
    { clue: "Stir-fried cabbage smells great (炒白菜很香)",
      chars: ["炒","白","菜","很","香"], answer: ["chao","bai","cai","hen","xiang"] },
    { clue: "I love eating cauliflower (我爱菜花吃)",
      chars: ["我","爱","菜","花","吃"], answer: ["wo","ai","cai","hua","chi"] },
  ),

  // 3 — Chinese Cities | intersection: 京 (jing)
  makePuzzle(3, "Chinese Cities",
    { clue: "Nanjing and Beijing are beautiful cities (南北京城美)",
      chars: ["南","北","京","城","美"], answer: ["nan","bei","jing","cheng","mei"] },
    { clue: "I'm going to Beijing to have fun (我去京城玩)",
      chars: ["我","去","京","城","玩"], answer: ["wo","qu","jing","cheng","wan"] },
  ),

  // 4 — Chinese Cities | intersection: 海 (hai)
  makePuzzle(4, "Chinese Cities",
    { clue: "Go to Shanghai to travel (去上海旅游)",
      chars: ["去","上","海","旅","游"], answer: ["qu","shang","hai","lv","you"] },
    { clue: "I love walking by the sea (我爱海边走)",
      chars: ["我","爱","海","边","走"], answer: ["wo","ai","hai","bian","zou"] },
  ),

  // 5 — Famous Names | intersection: 龙 (long)
  makePuzzle(5, "Famous Names",
    { clue: "Bruce Lee is very cool (李小龙很帅 — 李小龙 is Bruce Lee's Chinese name)",
      chars: ["李","小","龙","很","帅"], answer: ["li","xiao","long","hen","shuai"] },
    { clue: "He is a son of the dragon (他是龙的子)",
      chars: ["他","是","龙","的","子"], answer: ["ta","shi","long","de","zi"] },
  ),

  // 6 — Famous Names | intersection: 白 (bai)
  makePuzzle(6, "Famous Names",
    { clue: "I read Bai Juyi's poems (我读白居易 — famous Tang dynasty poet)",
      chars: ["我","读","白","居","易"], answer: ["wo","du","bai","ju","yi"] },
    { clue: "Her white blouse (她的白衬衫)",
      chars: ["她","的","白","衬","衫"], answer: ["ta","de","bai","chen","shan"] },
  ),

  // 7 — Common Phrases | intersection: 吃 (chi)
  makePuzzle(7, "Common Phrases",
    { clue: "Have you eaten yet? (你好吃了吗 — classic Chinese greeting)",
      chars: ["你","好","吃","了","吗"], answer: ["ni","hao","chi","le","ma"] },
    { clue: "I want to eat dumplings (我想吃饺子)",
      chars: ["我","想","吃","饺","子"], answer: ["wo","xiang","chi","jiao","zi"] },
  ),

  // 8 — Fruits | intersection: 香 (xiang)
  makePuzzle(8, "Fruits",
    { clue: "I love eating bananas (我爱香蕉吃)",
      chars: ["我","爱","香","蕉","吃"], answer: ["wo","ai","xiang","jiao","chi"] },
    { clue: "This orange is delicious (这个香橙好)",
      chars: ["这","个","香","橙","好"], answer: ["zhe","ge","xiang","cheng","hao"] },
  ),

  // 9 — Chinese Cities | intersection: 广 (guang)
  makePuzzle(9, "Chinese Cities",
    { clue: "China's four major cities (北上广深市 — Beijing / Shanghai / Guangzhou / Shenzhen)",
      chars: ["北","上","广","深","市"], answer: ["bei","shang","guang","shen","shi"] },
    { clue: "I'm going to Guangzhou for fun (我去广州玩)",
      chars: ["我","去","广","州","玩"], answer: ["wo","qu","guang","zhou","wan"] },
  ),

  // 10 — Common Phrases | intersection: 学 (xue)
  makePuzzle(10, "Common Phrases",
    { clue: "I want to learn Chinese (我要学中文)",
      chars: ["我","要","学","中","文"], answer: ["wo","yao","xue","zhong","wen"] },
    { clue: "He is studying English (他在学英语)",
      chars: ["他","在","学","英","语"], answer: ["ta","zai","xue","ying","yu"] },
  ),

  // 11 — Vegetables | intersection: 豆 (dou)
  makePuzzle(11, "Vegetables",
    { clue: "Stir-fried dried tofu (炒花豆腐干 — popular Chinese snack)",
      chars: ["炒","花","豆","腐","干"], answer: ["chao","hua","dou","fu","gan"] },
    { clue: "I'm drinking soy milk (我喝豆浆呢)",
      chars: ["我","喝","豆","浆","呢"], answer: ["wo","he","dou","jiang","ne"] },
  ),

  // 12 — Common Phrases | intersection: 谢 (xie)
  makePuzzle(12, "Common Phrases",
    { clue: "I'm very grateful to you (很感谢您呢)",
      chars: ["很","感","谢","您","呢"], answer: ["hen","gan","xie","nin","ne"] },
    { clue: "Let me say thank you (我说谢谢吧)",
      chars: ["我","说","谢","谢","吧"], answer: ["wo","shuo","xie","xie","ba"] },
  ),

  // 13 — Famous Names | intersection: 诗 (shi)
  makePuzzle(13, "Famous Names",
    { clue: "Li Bai's poetry is beautiful (李白诗很美 — Tang dynasty poet 701–762 AD)",
      chars: ["李","白","诗","很","美"], answer: ["li","bai","shi","hen","mei"] },
    { clue: "I read a lot of poetry (我读诗很多)",
      chars: ["我","读","诗","很","多"], answer: ["wo","du","shi","hen","duo"] },
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
