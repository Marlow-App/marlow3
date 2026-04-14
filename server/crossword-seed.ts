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
  // A1[2]=酸=D[0] ✓  A3[2]=鲜=D[4] ✓
  makePuzzle(0, "Five Tastes",
    { clue: "Craving this fiery, tangy noodle dish from Chongqing",
      chars: ["想","吃","酸","辣","粉"], answer: ["xiang","chi","suan","la","fen"] },
    { clue: "The five fundamental flavors of Chinese cuisine",
      chars: ["酸","甜","苦","辣","鲜"], answer: ["suan","tian","ku","la","xian"] },
    { clue: "To sample something fresh and experience a new flavor",
      chars: ["尝","尝","鲜","味","道"], answer: ["chang","chang","xian","wei","dao"] },
  ),

  // 1 — Confucian Virtues (DOWN: 仁义礼智信)
  // A1[2]=仁=D[0] ✓  A3[2]=信=D[4] ✓
  makePuzzle(1, "Confucian Virtues",
    { clue: "Broad love, benevolence, virtue, and goodness",
      chars: ["博","爱","仁","德","善"], answer: ["bo","ai","ren","de","shan"] },
    { clue: "Five Confucian virtues forming the moral foundation",
      chars: ["仁","义","礼","智","信"], answer: ["ren","yi","li","zhi","xin"] },
    { clue: "Without trust, a person cannot stand (Confucius)",
      chars: ["人","无","信","不","立"], answer: ["ren","wu","xin","bu","li"] },
  ),

  // 2 — Classical Arts (DOWN: 琴棋书画诗)
  // A1[2]=琴=D[0] ✓  A3[2]=诗=D[4] ✓
  makePuzzle(2, "Classical Arts",
    { clue: "The beautiful resonant melody of the guqin zither",
      chars: ["悠","扬","琴","声","美"], answer: ["you","yang","qin","sheng","mei"] },
    { clue: "The five classical arts: music, chess, calligraphy, painting, poetry",
      chars: ["琴","棋","书","画","诗"], answer: ["qin","qi","shu","hua","shi"] },
    { clue: "The splendor of Chinese poetry through the ages",
      chars: ["古","今","诗","词","好"], answer: ["gu","jin","shi","ci","hao"] },
  ),

  // 3 — Ancient States (DOWN: 燕赵齐鲁楚)
  // A1[2]=燕=D[0] ✓  A3[2]=楚=D[4] ✓
  // 燕赵齐鲁楚 = five great states of ancient China (Warring States period)
  makePuzzle(3, "Ancient States",
    { clue: "Spring returns, swallows fly home — swallows were the symbol of the ancient Yan state",
      chars: ["春","来","燕","子","归"], answer: ["chun","lai","yan","zi","gui"] },
    { clue: "Five great states of the Warring States period: Yan, Zhao, Qi, Lu, Chu",
      chars: ["燕","赵","齐","鲁","楚"], answer: ["yan","zhao","qi","lu","chu"] },
    { clue: "Neat and impeccably dressed (from 《诗经》)",
      chars: ["衣","冠","楚","楚","地"], answer: ["yi","guan","chu","chu","di"] },
  ),

  // 4 — Four Gentlemen + Pine (DOWN: 梅兰竹菊松)
  // A1[2]=梅=D[0] ✓  A3[2]=松=D[4] ✓
  makePuzzle(4, "The Four Gentlemen",
    { clue: "A solitary plum blossom bursting into bloom",
      chars: ["一","朵","梅","花","开"], answer: ["yi","duo","mei","hua","kai"] },
    { clue: "Plum, orchid, bamboo, chrysanthemum, pine — symbols of noble character",
      chars: ["梅","兰","竹","菊","松"], answer: ["mei","lan","zhu","ju","song"] },
    { clue: "Pine and cypress stand tall and endure through the ages",
      chars: ["千","年","松","柏","常"], answer: ["qian","nian","song","bai","chang"] },
  ),

  // 5 — Five Elements (DOWN: 金木水火土)
  // A1[2]=金=D[0] ✓  A3[2]=土=D[4] ✓
  makePuzzle(5, "Five Elements",
    { clue: "A full view of golden autumn colors",
      chars: ["满","目","金","秋","色"], answer: ["man","mu","jin","qiu","se"] },
    { clue: "The five elements of ancient Chinese cosmology",
      chars: ["金","木","水","火","土"], answer: ["jin","mu","shui","huo","tu"] },
    { clue: "The deep emotional bond with one's homeland earth",
      chars: ["故","乡","土","地","情"], answer: ["gu","xiang","tu","di","qing"] },
  ),

  // 6 — Chinese Meal (DOWN: 酒茶饭菜汤)
  // A1[2]=酒=D[0] ✓  A3[2]=汤=D[4] ✓
  makePuzzle(6, "Chinese Meal",
    { clue: "Raise a cup — good wine brings friends together",
      chars: ["举","杯","酒","相","逢"], answer: ["ju","bei","jiu","xiang","feng"] },
    { clue: "Staples of a Chinese meal: liquor, tea, rice, dishes, and soup",
      chars: ["酒","茶","饭","菜","汤"], answer: ["jiu","cha","fan","cai","tang"] },
    { clue: "A piping-hot bowl of noodle soup",
      chars: ["大","碗","汤","面","热"], answer: ["da","wan","tang","mian","re"] },
  ),

  // 7 — Good Fortune (DOWN: 福气满满来)
  // A1[2]=福=D[0] ✓  A3[2]=来=D[4] ✓
  makePuzzle(7, "Good Fortune",
    { clue: "May good fortune and blessings always be present",
      chars: ["但","愿","福","常","在"], answer: ["dan","yuan","fu","chang","zai"] },
    { clue: "Wishing an abundance of good luck and blessings",
      chars: ["福","气","满","满","来"], answer: ["fu","qi","man","man","lai"] },
    { clue: "Swallows return to herald the coming of spring",
      chars: ["燕","子","来","报","春"], answer: ["yan","zi","lai","bao","chun"] },
  ),

  // 8 — Landscapes (DOWN: 山川湖海岛)
  // A1[2]=山=D[0] ✓  A3[2]=岛=D[4] ✓
  makePuzzle(8, "Landscapes",
    { clue: "The splendid beauty of China's mountains and rivers",
      chars: ["大","好","山","河","美"], answer: ["da","hao","shan","he","mei"] },
    { clue: "Natural wonders: mountains, rivers, lakes, seas, and islands",
      chars: ["山","川","湖","海","岛"], answer: ["shan","chuan","hu","hai","dao"] },
    { clue: "China's tropical paradise island in the south",
      chars: ["海","南","岛","美","丽"], answer: ["hai","nan","dao","mei","li"] },
  ),

  // 9 — 《静夜思》(DOWN: 望穿秋水思)
  // A1[2]=望=D[0] ✓  A3[2]=思=D[4] ✓
  // Both ACROSS words are consecutive lines from Li Bai's most famous poem!
  makePuzzle(9, "Quiet Night Thoughts",
    { clue: "Raise your head and gaze at the bright moon (Li Bai, 《静夜思》)",
      chars: ["举","头","望","明","月"], answer: ["ju","tou","wang","ming","yue"] },
    { clue: "Gazing with longing through the autumn waters — connects two lines of 《静夜思》",
      chars: ["望","穿","秋","水","思"], answer: ["wang","chuan","qiu","shui","si"] },
    { clue: "Lower your head and think of home (Li Bai, 《静夜思》)",
      chars: ["低","头","思","故","乡"], answer: ["di","tou","si","gu","xiang"] },
  ),

  // 10 — Compass Directions (DOWN: 东西南北中)
  // A1[2]=东=D[0] ✓  A3[2]=中=D[4] ✓
  makePuzzle(10, "Compass Directions",
    { clue: "Walking toward the eastern side",
      chars: ["走","到","东","边","去"], answer: ["zou","dao","dong","bian","qu"] },
    { clue: "The four compass points plus the center",
      chars: ["东","西","南","北","中"], answer: ["dong","xi","nan","bei","zhong"] },
    { clue: "Soaring freely through the open sky",
      chars: ["半","空","中","翱","翔"], answer: ["ban","kong","zhong","ao","xiang"] },
  ),

  // 11 — Year of the Dragon (DOWN: 龙年春节好)
  // A1[2]=龙=D[0] ✓  A3[2]=好=D[4] ✓
  makePuzzle(11, "Year of the Dragon",
    { clue: "The Chinese dragon — national symbol and ancient totem",
      chars: ["中","国","龙","图","腾"], answer: ["zhong","guo","long","tu","teng"] },
    { clue: "Happy Spring Festival in the Year of the Dragon",
      chars: ["龙","年","春","节","好"], answer: ["long","nian","chun","jie","hao"] },
    { clue: "Feels absolutely wonderful!",
      chars: ["感","觉","好","极","了"], answer: ["gan","jue","hao","ji","le"] },
  ),

  // 12 — Tea Culture (DOWN: 茶道品味香)
  // A1[2]=茶=D[0] ✓  A3[2]=香=D[4] ✓
  makePuzzle(12, "Tea Culture",
    { clue: "Savoring the rich, fragrant aroma of fresh green tea",
      chars: ["品","绿","茶","香","浓"], answer: ["pin","lv","cha","xiang","nong"] },
    { clue: "The art and philosophy of tea: taste, aroma, and mindfulness",
      chars: ["茶","道","品","味","香"], answer: ["cha","dao","pin","wei","xiang"] },
    { clue: "Fragrant rice blossoms — a bountiful harvest is near (from Xin Qiji's 《西江月》)",
      chars: ["稻","花","香","里","说"], answer: ["dao","hua","xiang","li","shuo"] },
  ),

  // 13 — Four Seasons (DOWN: 春夏秋冬暖)
  // A1[2]=春=D[0] ✓  A3[2]=暖=D[4] ✓
  makePuzzle(13, "Four Seasons",
    { clue: "Just like a gentle spring breeze coming",
      chars: ["恰","似","春","风","来"], answer: ["qia","si","chun","feng","lai"] },
    { clue: "The four seasons plus warmth: spring, summer, autumn, winter, warm",
      chars: ["春","夏","秋","冬","暖"], answer: ["chun","xia","qiu","dong","nuan"] },
    { clue: "The sunshine is warm and cozy",
      chars: ["阳","光","暖","洋","洋"], answer: ["yang","guang","nuan","yang","yang"] },
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
