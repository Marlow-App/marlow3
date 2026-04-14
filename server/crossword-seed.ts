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

// Plus/cross layout: 1 down word (col 2) + 1 across word (row 2), intersecting at (2,2).
// This is the grid used for all 14 puzzles — genuine NYT-mini-style interlocking.
const CROSS: boolean[][] = [
  [false, false, true,  false, false],
  [false, false, true,  false, false],
  [true,  true,  true,  true,  true],
  [false, false, true,  false, false],
  [false, false, true,  false, false],
];

// Helper to build a puzzle entry (always plus-cross layout)
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

  // Puzzle  0 — intersection: 再 (zai)
  makePuzzle(0, "Greetings",
    { clue: "Five greeting words: you · good · again · thanks · morning", chars: ["你","好","再","谢","早"], answer: ["ni","hao","zai","xie","zao"] },
    { clue: "See you again tomorrow? (common farewell phrase)",          chars: ["明","天","再","见","吗"], answer: ["ming","tian","zai","jian","ma"] },
  ),

  // Puzzle  1 — intersection: 蓝 (lan)
  makePuzzle(1, "Colours",
    { clue: "Five colours: white · green · blue · yellow · red", chars: ["白","绿","蓝","黄","红"], answer: ["bai","lü","lan","huang","hong"] },
    { clue: "I love blue skies and the sea (scenic phrase)",    chars: ["我","爱","蓝","天","海"], answer: ["wo","ai","lan","tian","hai"] },
  ),

  // Puzzle  2 — intersection: 成 (cheng)
  makePuzzle(2, "Famous Figures",
    { clue: "May all things succeed! (成功 = succeed, common blessing)", chars: ["万","事","成","功","好"], answer: ["wan","shi","cheng","gong","hao"] },
    { clue: "Is he Jackie Chan? (成龙 is Jackie Chan's Chinese name)",   chars: ["他","是","成","龙","吗"], answer: ["ta","shi","cheng","long","ma"] },
  ),

  // Puzzle  3 — intersection: 北 (bei)
  makePuzzle(3, "Directions",
    { clue: "Sizes + cardinal directions: big · small · north · south · east", chars: ["大","小","北","南","东"], answer: ["da","xiao","bei","nan","dong"] },
    { clue: "Hello, Beijing person! (friendly greeting to a Beijinger)",        chars: ["你","好","北","京","人"], answer: ["ni","hao","bei","jing","ren"] },
  ),

  // Puzzle  4 — intersection: 广 (guang)
  makePuzzle(4, "Chinese Cities",
    { clue: "China's four tier-1 cities: 北京/上海/广州/深圳 + 市 (city)", chars: ["北","上","广","深","市"], answer: ["bei","shang","guang","shen","shi"] },
    { clue: "I'm going to Guangzhou to have fun (travel phrase)",          chars: ["我","去","广","州","玩"], answer: ["wo","qu","guang","zhou","wan"] },
  ),

  // Puzzle  5 — intersection: 面 (mian)
  makePuzzle(5, "Chinese Food",
    { clue: "Five Chinese staples: rice · cooked-rice · noodles · soup · congee", chars: ["米","饭","面","汤","粥"], answer: ["mi","fan","mian","tang","zhou"] },
    { clue: "Zha jiang mian is the best! (famous Beijing noodle dish)",           chars: ["炸","酱","面","最","棒"], answer: ["zha","jiang","mian","zui","bang"] },
  ),

  // Puzzle  6 — intersection: 香 (xiang)
  makePuzzle(6, "Fruits",
    { clue: "First character of five fruits: 苹果/葡萄/香蕉/梨/芒果", chars: ["苹","葡","香","梨","芒"], answer: ["ping","pu","xiang","li","mang"] },
    { clue: "I'll buy some bananas (shopping phrase)",                  chars: ["我","买","香","蕉","吧"], answer: ["wo","mai","xiang","jiao","ba"] },
  ),

  // Puzzle  7 — intersection: 豆 (dou)
  makePuzzle(7, "Vegetables",
    { clue: "Napa cabbage and tofu are delicious! (two classic Chinese ingredients)", chars: ["白","菜","豆","腐","好"], answer: ["bai","cai","dou","fu","hao"] },
    { clue: "I love tofu soup (popular home-cooked dish)",                            chars: ["我","爱","豆","腐","汤"], answer: ["wo","ai","dou","fu","tang"] },
  ),

  // Puzzle  8 — intersection: 秋 (qiu)
  makePuzzle(8, "Seasons",
    { clue: "The four seasons + year: spring · summer · autumn · winter · year", chars: ["春","夏","秋","冬","年"], answer: ["chun","xia","qiu","dong","nian"] },
    { clue: "I love beautiful autumn (seasonal appreciation phrase)",              chars: ["我","爱","秋","天","美"], answer: ["wo","ai","qiu","tian","mei"] },
  ),

  // Puzzle  9 — intersection: 哥 (ge)
  makePuzzle(9, "Family",
    { clue: "Five family members: dad · mum · big brother · little brother · little sister", chars: ["爸","妈","哥","弟","妹"], answer: ["ba","ma","ge","di","mei"] },
    { clue: "I have a big brother and sisters (talking about siblings)",                     chars: ["我","有","哥","姐","妹"], answer: ["wo","you","ge","jie","mei"] },
  ),

  // Puzzle 10 — intersection: 晚 (wan)
  makePuzzle(10, "Times of Day",
    { clue: "Times + positions: morning · noon · evening · up · down",  chars: ["早","中","晚","上","下"], answer: ["zao","zhong","wan","shang","xia"] },
    { clue: "Have a good evening! (common evening greeting phrase)",     chars: ["今","天","晚","上","好"], answer: ["jin","tian","wan","shang","hao"] },
  ),

  // Puzzle 11 — intersection: 果 (guo)
  makePuzzle(11, "Drinks",
    { clue: "First character of five drinks: 水/茶/果汁/咖啡/牛奶 (water/tea/juice/coffee/milk)", chars: ["水","茶","果","咖","牛"], answer: ["shui","cha","guo","ka","niu"] },
    { clue: "This juice is delicious! (simple compliment at the table)",                        chars: ["这","个","果","汁","好"], answer: ["zhe","ge","guo","zhi","hao"] },
  ),

  // Puzzle 12 — intersection: 爱 (ai)
  makePuzzle(12, "Pronouns & Love",
    { clue: "Core pronouns + love: I · you · love · he · she", chars: ["我","你","爱","他","她"], answer: ["wo","ni","ai","ta","ta"] },
    { clue: "I also love China (heartfelt everyday phrase)",   chars: ["我","也","爱","中","国"], answer: ["wo","ye","ai","zhong","guo"] },
  ),

  // Puzzle 13 — intersection: 三 (san)
  makePuzzle(13, "Numbers & Time",
    { clue: "Counting: one · two · three · four · five",        chars: ["一","二","三","四","五"], answer: ["yi","er","san","si","wu"] },
    { clue: "Three-thirty in the morning (early wake-up time!)", chars: ["早","上","三","点","半"], answer: ["zao","shang","san","dian","ban"] },
  ),

];

export async function seedCrosswords(): Promise<void> {
  const { db } = await import("./db");
  const { dailyCrosswords } = await import("@shared/schema");
  const { eq, gt } = await import("drizzle-orm");

  const maxIndex = SEED_PUZZLES.length - 1;

  // Remove any out-of-range puzzle rows (e.g. previously added extras)
  await db.delete(dailyCrosswords).where(gt(dailyCrosswords.puzzleIndex, maxIndex));

  const existing = await db
    .select({ puzzleIndex: dailyCrosswords.puzzleIndex })
    .from(dailyCrosswords);
  const existingIndices = new Set(existing.map((p) => p.puzzleIndex));

  let added = 0;
  let updated = 0;
  for (const puzzle of SEED_PUZZLES) {
    const vals = {
      puzzleIndex: puzzle.puzzleIndex,
      title: puzzle.title,
      grid: puzzle.grid as unknown as Record<string, unknown>,
      words: puzzle.words as unknown as Record<string, unknown>[],
    };
    if (!existingIndices.has(puzzle.puzzleIndex)) {
      await db.insert(dailyCrosswords).values(vals);
      added++;
    } else {
      await db
        .update(dailyCrosswords)
        .set({ title: vals.title, grid: vals.grid, words: vals.words })
        .where(eq(dailyCrosswords.puzzleIndex, puzzle.puzzleIndex));
      updated++;
    }
  }

  console.log(
    `[Crossword] Seed done — ${added} added, ${updated} updated. Total: ${SEED_PUZZLES.length}.`,
  );
}
