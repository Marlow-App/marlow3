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
// Word 1 DOWN  — cells (0,2)(1,2)(2,2)(3,2)(4,2)
// Word 2 ACROSS — cells (2,0)(2,1)(2,2)(2,3)(2,4)
// Intersection — cell (2,2): must share the same character and pinyin syllable.
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

  // 0 — Greetings | intersection: 好 hao
  makePuzzle(0, "Greetings",
    { clue: "Study hard and make progress (你好好学习 — classic teacher's blessing)",
      chars: ["你","好","好","学","习"], answer: ["ni","hao","hao","xue","xi"] },
    { clue: "Is everyone well? (大家好吗 — friendly group greeting)",
      chars: ["大","家","好","吗","啊"], answer: ["da","jia","hao","ma","a"] },
  ),

  // 1 — Common Phrases | intersection: 来 lai
  makePuzzle(1, "Common Phrases",
    { clue: "Please come in and sit down (请进来坐下 — welcoming phrase)",
      chars: ["请","进","来","坐","下"], answer: ["qing","jin","lai","zuo","xia"] },
    { clue: "I have never been there (我从来没去 — expressing no experience)",
      chars: ["我","从","来","没","去"], answer: ["wo","cong","lai","mei","qu"] },
  ),

  // 2 — Fruits | intersection: 苹 ping
  makePuzzle(2, "Fruits",
    { clue: "Apples are very tasty (苹果很好吃 — expressing a taste opinion)",
      chars: ["苹","果","很","好","吃"], answer: ["ping","guo","hen","hao","chi"] },
    { clue: "I love apple juice (我爱苹果汁 — favourite drink phrase)",
      chars: ["我","爱","苹","果","汁"], answer: ["wo","ai","ping","guo","zhi"] },
  ),

  // 3 — Vegetables | intersection: 豆 dou
  makePuzzle(3, "Vegetables",
    { clue: "Napa cabbage and tofu are delicious (白菜豆腐好 — classic Chinese ingredients)",
      chars: ["白","菜","豆","腐","好"], answer: ["bai","cai","dou","fu","hao"] },
    { clue: "I love tofu soup (我爱豆腐汤 — popular home-cooked dish)",
      chars: ["我","爱","豆","腐","汤"], answer: ["wo","ai","dou","fu","tang"] },
  ),

  // 4 — Chinese Cities (Beijing) | intersection: 京 jing
  makePuzzle(4, "Chinese Cities",
    { clue: "Let's have fun in Beijing! (在北京玩吧 — travel invitation)",
      chars: ["在","北","京","玩","吧"], answer: ["zai","bei","jing","wan","ba"] },
    { clue: "I'm going to the capital to have fun (我去京城玩 — 京城 means Beijing)",
      chars: ["我","去","京","城","玩"], answer: ["wo","qu","jing","cheng","wan"] },
  ),

  // 5 — Chinese Cities (Shanghai) | intersection: 海 hai
  makePuzzle(5, "Chinese Cities",
    { clue: "Let's go to Shanghai for fun! (去上海玩吧 — travel suggestion)",
      chars: ["去","上","海","玩","吧"], answer: ["qu","shang","hai","wan","ba"] },
    { clue: "The seaside in Dalian is beautiful (大连海边美 — scenic description)",
      chars: ["大","连","海","边","美"], answer: ["da","lian","hai","bian","mei"] },
  ),

  // 6 — Famous Names (Bruce Lee) | intersection: 龙 long
  makePuzzle(6, "Famous Names",
    { clue: "Bruce Lee is amazing! (李小龙很棒 — 李小龙 is Bruce Lee's Chinese name)",
      chars: ["李","小","龙","很","棒"], answer: ["li","xiao","long","hen","bang"] },
    { clue: "He is a son of the dragon (他是龙的人 — Chinese cultural identity phrase)",
      chars: ["他","是","龙","的","人"], answer: ["ta","shi","long","de","ren"] },
  ),

  // 7 — Famous Names (Chairman Mao / brush art) | intersection: 毛 mao
  makePuzzle(7, "Famous Names",
    { clue: "The great Chairman Mao (伟大毛主席 — historical leader of China)",
      chars: ["伟","大","毛","主","席"], answer: ["wei","da","mao","zhu","xi"] },
    { clue: "I have a brush ink painting (我有毛笔画 — traditional Chinese art)",
      chars: ["我","有","毛","笔","画"], answer: ["wo","you","mao","bi","hua"] },
  ),

  // 8 — Everyday Phrases (food / dumplings) | intersection: 吃 chi
  makePuzzle(8, "Everyday Phrases",
    { clue: "Have you eaten yet? (你好吃了吗 — classic Chinese way of saying hello)",
      chars: ["你","好","吃","了","吗"], answer: ["ni","hao","chi","le","ma"] },
    { clue: "I want to eat dumplings (我想吃饺子 — favourite food phrase)",
      chars: ["我","想","吃","饺","子"], answer: ["wo","xiang","chi","jiao","zi"] },
  ),

  // 9 — Fruits (banana) | intersection: 香 xiang
  makePuzzle(9, "Fruits",
    { clue: "Pineapple and banana are great! (菠萝香蕉好 — tropical fruit pair)",
      chars: ["菠","萝","香","蕉","好"], answer: ["bo","luo","xiang","jiao","hao"] },
    { clue: "I'll buy some bananas to eat (我买香蕉吃 — shopping phrase)",
      chars: ["我","买","香","蕉","吃"], answer: ["wo","mai","xiang","jiao","chi"] },
  ),

  // 10 — Chinese Cities (Guangzhou) | intersection: 广 guang
  makePuzzle(10, "Chinese Cities",
    { clue: "China's four tier-1 cities abbreviated: Beijing, Shanghai, Guangzhou, Shenzhen (北上广深市)",
      chars: ["北","上","广","深","市"], answer: ["bei","shang","guang","shen","shi"] },
    { clue: "I'm going to Guangzhou to have fun (我去广州玩 — travel phrase)",
      chars: ["我","去","广","州","玩"], answer: ["wo","qu","guang","zhou","wan"] },
  ),

  // 11 — Everyday Phrases (learning Chinese) | intersection: 学 xue
  makePuzzle(11, "Everyday Phrases",
    { clue: "I want to learn Chinese (我要学中文 — language learner's goal)",
      chars: ["我","要","学","中","文"], answer: ["wo","yao","xue","zhong","wen"] },
    { clue: "Learning Chinese is worth it! (汉语学起来 — motivational phrase for learners)",
      chars: ["汉","语","学","起","来"], answer: ["han","yu","xue","qi","lai"] },
  ),

  // 12 — Famous Names (Li Bai / poetry) | intersection: 诗 shi
  makePuzzle(12, "Famous Names",
    { clue: "Li Bai's poetry is beautiful (李白诗很美 — Tang dynasty poet, 701–762 AD)",
      chars: ["李","白","诗","很","美"], answer: ["li","bai","shi","hen","mei"] },
    { clue: "I read a lot of poetry (我读诗很多 — expressing a literary hobby)",
      chars: ["我","读","诗","很","多"], answer: ["wo","du","shi","hen","duo"] },
  ),

  // 13 — Everyday Phrases (rice noodles) | intersection: 米 mi
  makePuzzle(13, "Everyday Phrases",
    { clue: "Freshly cooked rice smells wonderful (新鲜米饭香 — sensory description)",
      chars: ["新","鲜","米","饭","香"], answer: ["xin","xian","mi","fan","xiang"] },
    { clue: "I love rice noodle soup (我爱米粉汤 — popular Chinese comfort food)",
      chars: ["我","爱","米","粉","汤"], answer: ["wo","ai","mi","fen","tang"] },
  ),

];

export async function seedCrosswords(): Promise<void> {
  const { db } = await import("./db");
  const { dailyCrosswords } = await import("@shared/schema");

  // Only insert puzzles that don't already exist — never overwrite admin-edited rows.
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
