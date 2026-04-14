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

// I-beam layout: row 0 and row 4 are full ACROSS words; col 2 is the full DOWN word.
// Intersections: (row 0, col 2) and (row 4, col 2).
// Word 1 = ACROSS (row 0), Word 2 = DOWN (col 2), Word 3 = ACROSS (row 4)
// Constraint: Word1.chars[2] === Word2.chars[0]  AND  Word3.chars[2] === Word2.chars[4]
const I_BEAM: boolean[][] = [
  [true,  true,  true,  true,  true],
  [false, false, true,  false, false],
  [false, false, true,  false, false],
  [false, false, true,  false, false],
  [true,  true,  true,  true,  true],
];

function makePuzzle(
  puzzleIndex: number,
  title: string,
  across1: { clue: string; chars: string[]; answer: string[] },
  down:    { clue: string; chars: string[]; answer: string[] },
  across3: { clue: string; chars: string[]; answer: string[] },
): CrosswordPuzzleData {
  // Validate intersection constraints at build time
  if (across1.chars[2] !== down.chars[0]) {
    throw new Error(
      `Puzzle ${puzzleIndex}: across1.chars[2]="${across1.chars[2]}" must equal down.chars[0]="${down.chars[0]}"`,
    );
  }
  if (across3.chars[2] !== down.chars[4]) {
    throw new Error(
      `Puzzle ${puzzleIndex}: across3.chars[2]="${across3.chars[2]}" must equal down.chars[4]="${down.chars[4]}"`,
    );
  }
  return {
    title,
    puzzleIndex,
    grid: I_BEAM,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 5, ...across1 },
      { number: 2, direction: "down",   startRow: 0, startCol: 2, length: 5, ...down    },
      { number: 3, direction: "across", startRow: 4, startCol: 0, length: 5, ...across3 },
    ],
  };
}

export const SEED_PUZZLES: CrosswordPuzzleData[] = [

  // 0 — Five Tastes (DOWN: 酸甜苦辣鲜)
  // across1[2]=酸=down[0] ✓   across3[2]=鲜=down[4] ✓
  makePuzzle(0, "Five Tastes",
    { clue: "Craving this fiery, tangy noodle dish from Chongqing",
      chars: ["想","吃","酸","辣","粉"], answer: ["xiang","chi","suan","la","fen"] },
    { clue: "The five fundamental flavors of Chinese cuisine",
      chars: ["酸","甜","苦","辣","鲜"], answer: ["suan","tian","ku","la","xian"] },
    { clue: "To sample something fresh and experience a new flavor",
      chars: ["尝","尝","鲜","味","道"], answer: ["chang","chang","xian","wei","dao"] },
  ),

  // 1 — Confucian Virtues (DOWN: 仁义礼智信)
  // across1[2]=仁=down[0] ✓   across3[2]=信=down[4] ✓
  makePuzzle(1, "Confucian Virtues",
    { clue: "Broad love, benevolence, virtue, and goodness",
      chars: ["博","爱","仁","德","善"], answer: ["bo","ai","ren","de","shan"] },
    { clue: "Five Confucian virtues that form the moral foundation",
      chars: ["仁","义","礼","智","信"], answer: ["ren","yi","li","zhi","xin"] },
    { clue: "Without trust, a person cannot stand (Confucius)",
      chars: ["人","无","信","不","立"], answer: ["ren","wu","xin","bu","li"] },
  ),

  // 2 — Classical Arts (DOWN: 琴棋书画诗)
  // across1[2]=琴=down[0] ✓   across3[2]=诗=down[4] ✓
  makePuzzle(2, "Classical Arts",
    { clue: "The beautiful, resonant melody of the guqin zither",
      chars: ["悠","扬","琴","声","美"], answer: ["you","yang","qin","sheng","mei"] },
    { clue: "The five classical arts: music, chess, calligraphy, painting, poetry",
      chars: ["琴","棋","书","画","诗"], answer: ["qin","qi","shu","hua","shi"] },
    { clue: "The splendor of Chinese poetry through the ages",
      chars: ["古","今","诗","词","好"], answer: ["gu","jin","shi","ci","hao"] },
  ),

  // 3 — Shanghai Bund (DOWN: 上海外滩夜)
  // across1[2]=上=down[0] ✓   across3[2]=夜=down[4] ✓
  makePuzzle(3, "Shanghai Bund",
    { clue: "Everyone sets off for school or work in the morning",
      chars: ["大","家","上","学","去"], answer: ["da","jia","shang","xue","qu"] },
    { clue: "The iconic waterfront promenade that glows after dark",
      chars: ["上","海","外","滩","夜"], answer: ["shang","hai","wai","tan","ye"] },
    { clue: "The stunning nightscape of China's most cosmopolitan city",
      chars: ["上","海","夜","景","美"], answer: ["shang","hai","ye","jing","mei"] },
  ),

  // 4 — Four Gentlemen + Pine (DOWN: 梅兰竹菊松)
  // across1[2]=梅=down[0] ✓   across3[2]=松=down[4] ✓
  makePuzzle(4, "The Four Gentlemen",
    { clue: "A solitary plum blossom bursting into bloom",
      chars: ["一","朵","梅","花","开"], answer: ["yi","duo","mei","hua","kai"] },
    { clue: "Plum, orchid, bamboo, chrysanthemum, pine — symbols of noble character",
      chars: ["梅","兰","竹","菊","松"], answer: ["mei","lan","zhu","ju","song"] },
    { clue: "Pine and cypress stand tall and endure through the ages",
      chars: ["千","年","松","柏","常"], answer: ["qian","nian","song","bai","chang"] },
  ),

  // 5 — Great Wall (DOWN: 万里长城美)
  // across1[2]=万=down[0] ✓   across3[2]=美=down[4] ✓
  makePuzzle(5, "Great Wall",
    { clue: "Crossing thousands of mountains and rivers",
      chars: ["千","山","万","水","间"], answer: ["qian","shan","wan","shui","jian"] },
    { clue: "The ancient wonder stretching ten thousand li across China's north",
      chars: ["万","里","长","城","美"], answer: ["wan","li","chang","cheng","mei"] },
    { clue: "China's legendary cuisine, rich in variety and flavor",
      chars: ["中","国","美","食","多"], answer: ["zhong","guo","mei","shi","duo"] },
  ),

  // 6 — Chinese Meal (DOWN: 酒茶饭菜汤)
  // across1[2]=酒=down[0] ✓   across3[2]=汤=down[4] ✓
  makePuzzle(6, "Chinese Meal",
    { clue: "Raise a cup — good wine brings friends together",
      chars: ["举","杯","酒","相","逢"], answer: ["ju","bei","jiu","xiang","feng"] },
    { clue: "Staples of a Chinese meal: liquor, tea, rice, dishes, and soup",
      chars: ["酒","茶","饭","菜","汤"], answer: ["jiu","cha","fan","cai","tang"] },
    { clue: "A piping-hot bowl of noodle soup",
      chars: ["大","碗","汤","面","热"], answer: ["da","wan","tang","mian","re"] },
  ),

  // 7 — Good Fortune (DOWN: 福气满满来)
  // across1[2]=福=down[0] ✓   across3[2]=来=down[4] ✓
  makePuzzle(7, "Good Fortune",
    { clue: "May good fortune and blessings always be present",
      chars: ["但","愿","福","常","在"], answer: ["dan","yuan","fu","chang","zai"] },
    { clue: "Wishing an abundance of good luck and blessings",
      chars: ["福","气","满","满","来"], answer: ["fu","qi","man","man","lai"] },
    { clue: "Spring has arrived — a season of renewal and hope",
      chars: ["春","天","来","了","啊"], answer: ["chun","tian","lai","le","a"] },
  ),

  // 8 — Landscapes (DOWN: 山川湖海岛)
  // across1[2]=山=down[0] ✓   across3[2]=岛=down[4] ✓
  makePuzzle(8, "Landscapes",
    { clue: "The splendid beauty of China's mountains and rivers",
      chars: ["大","好","山","河","美"], answer: ["da","hao","shan","he","mei"] },
    { clue: "Natural wonders: mountains, rivers, lakes, seas, and islands",
      chars: ["山","川","湖","海","岛"], answer: ["shan","chuan","hu","hai","dao"] },
    { clue: "China's tropical paradise island in the south",
      chars: ["海","南","岛","美","丽"], answer: ["hai","nan","dao","mei","li"] },
  ),

  // 9 — Achievement (DOWN: 马到成功日)
  // across1[2]=马=down[0] ✓   across3[2]=日=down[4] ✓
  makePuzzle(9, "Achievement",
    { clue: "Streams of carriages and horses — the bustle of a thriving city",
      chars: ["车","水","马","龙","啊"], answer: ["che","shui","ma","long","a"] },
    { clue: "Success arrives as swiftly as a horse",
      chars: ["马","到","成","功","日"], answer: ["ma","dao","cheng","gong","ri"] },
    { clue: "At the very moment the sun rises each morning",
      chars: ["每","天","日","出","时"], answer: ["mei","tian","ri","chu","shi"] },
  ),

  // 10 — Compass Directions (DOWN: 东西南北中)
  // across1[2]=东=down[0] ✓   across3[2]=中=down[4] ✓
  makePuzzle(10, "Compass Directions",
    { clue: "Auspicious purple energy flowing in from the east (a sign of good fortune)",
      chars: ["紫","气","东","来","啊"], answer: ["zi","qi","dong","lai","a"] },
    { clue: "The four compass points plus the center",
      chars: ["东","西","南","北","中"], answer: ["dong","xi","nan","bei","zhong"] },
    { clue: "Soaring freely through the open sky",
      chars: ["半","空","中","翱","翔"], answer: ["ban","kong","zhong","ao","xiang"] },
  ),

  // 11 — Year of the Dragon (DOWN: 龙年春节好)
  // across1[2]=龙=down[0] ✓   across3[2]=好=down[4] ✓
  makePuzzle(11, "Year of the Dragon",
    { clue: "The Chinese dragon — national symbol and ancient totem",
      chars: ["中","国","龙","图","腾"], answer: ["zhong","guo","long","tu","teng"] },
    { clue: "Happy Spring Festival in the Year of the Dragon",
      chars: ["龙","年","春","节","好"], answer: ["long","nian","chun","jie","hao"] },
    { clue: "Feels absolutely wonderful!",
      chars: ["感","觉","好","极","了"], answer: ["gan","jue","hao","ji","le"] },
  ),

  // 12 — Tea Culture (DOWN: 茶道品味香)
  // across1[2]=茶=down[0] ✓   across3[2]=香=down[4] ✓
  makePuzzle(12, "Tea Culture",
    { clue: "Savoring the gentle fragrance of fresh green tea",
      chars: ["品","绿","茶","香","啊"], answer: ["pin","lv","cha","xiang","a"] },
    { clue: "The art and philosophy of tea: taste, aroma, and mindfulness",
      chars: ["茶","道","品","味","香"], answer: ["cha","dao","pin","wei","xiang"] },
    { clue: "Fragrant rice blossoms — a bountiful harvest is near (from a Song poem)",
      chars: ["稻","花","香","里","说"], answer: ["dao","hua","xiang","li","shuo"] },
  ),

  // 13 — Spring Festival (DOWN: 春节万象新)
  // across1[2]=春=down[0] ✓   across3[2]=新=down[4] ✓
  makePuzzle(13, "Spring Festival",
    { clue: "Like a gentle spring breeze — fresh and full of warmth",
      chars: ["恰","似","春","风","来"], answer: ["qia","si","chun","feng","lai"] },
    { clue: "Spring Festival — everything is renewed and reborn",
      chars: ["春","节","万","象","新"], answer: ["chun","jie","wan","xiang","xin"] },
    { clue: "A fresh new chapter, every single day",
      chars: ["日","日","新","气","象"], answer: ["ri","ri","xin","qi","xiang"] },
  ),

];

export async function seedCrosswords(): Promise<void> {
  const { db } = await import("./db");
  const { dailyCrosswords } = await import("@shared/schema");

  let upserted = 0;
  for (const puzzle of SEED_PUZZLES) {
    await db
      .insert(dailyCrosswords)
      .values({
        puzzleIndex: puzzle.puzzleIndex,
        title: puzzle.title,
        grid: puzzle.grid as unknown as Record<string, unknown>,
        words: puzzle.words as unknown as Record<string, unknown>[],
      })
      .onConflictDoUpdate({
        target: dailyCrosswords.puzzleIndex,
        set: {
          title: puzzle.title,
          grid: puzzle.grid as unknown as Record<string, unknown>,
          words: puzzle.words as unknown as Record<string, unknown>[],
        },
      });
    upserted++;
  }

  console.log(`[Crossword] Seed done — ${upserted} puzzles upserted.`);
}
