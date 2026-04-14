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

// I-beam layout: row 0 + row 4 are full ACROSS words; col 2 is a full DOWN word.
// Intersections: (0,2) and (4,2).
// Word 1 = ACROSS (row 0), Word 2 = DOWN (col 2), Word 3 = ACROSS (row 4)
// Constraint: Word1.chars[2] === Word2.chars[0] and Word3.chars[2] === Word2.chars[4]
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

  // Constraint check: across1.chars[2]===down.chars[0], across3.chars[2]===down.chars[4]

  // 0 — Numbers (DOWN: 一二三四五)
  makePuzzle(0, "Numbers",
    { clue: "Let's go together today",
      chars: ["今","天","一","起","去"], answer: ["jin","tian","yi","qi","qu"] },
    { clue: "Count from one to five",
      chars: ["一","二","三","四","五"], answer: ["yi","er","san","si","wu"] },
    { clue: "Friday afternoon",
      chars: ["星","期","五","下","午"], answer: ["xing","qi","wu","xia","wu"] },
  ),

  // 1 — Colors (DOWN: 红橙黄绿蓝)
  makePuzzle(1, "Colors",
    { clue: "A red flower in bloom",
      chars: ["一","朵","红","花","开"], answer: ["yi","duo","hong","hua","kai"] },
    { clue: "Five rainbow colors: red, orange, yellow, green, blue",
      chars: ["红","橙","黄","绿","蓝"], answer: ["hong","cheng","huang","lv","lan"] },
    { clue: "The blue sky is beautiful today",
      chars: ["今","天","蓝","天","美"], answer: ["jin","tian","lan","tian","mei"] },
  ),

  // 2 — Family (DOWN: 爸妈哥姐弟)
  makePuzzle(2, "Family",
    { clue: "My dad is great",
      chars: ["我","的","爸","爸","好"], answer: ["wo","de","ba","ba","hao"] },
    { clue: "Five family members: dad, mom, older brother, older sister, younger brother",
      chars: ["爸","妈","哥","姐","弟"], answer: ["ba","ma","ge","jie","di"] },
    { clue: "Do I have a younger brother?",
      chars: ["我","有","弟","弟","吗"], answer: ["wo","you","di","di","ma"] },
  ),

  // 3 — Long Time No See (DOWN: 好久不见面)
  makePuzzle(3, "Reunions",
    { clue: "Everyone, good morning today!",
      chars: ["大","家","好","今","天"], answer: ["da","jia","hao","jin","tian"] },
    { clue: "Long time no see (hao jiu bu jian mian)",
      chars: ["好","久","不","见","面"], answer: ["hao","jiu","bu","jian","mian"] },
    { clue: "Let me eat some noodles",
      chars: ["我","吃","面","条","吧"], answer: ["wo","chi","mian","tiao","ba"] },
  ),

  // 4 — Asking for Directions (DOWN: 请问在哪里)
  makePuzzle(4, "Getting Around",
    { clue: "Let's treat everyone to a meal today",
      chars: ["今","日","请","客","吧"], answer: ["jin","ri","qing","ke","ba"] },
    { clue: "Excuse me, where is it? (qing wen zai na li)",
      chars: ["请","问","在","哪","里"], answer: ["qing","wen","zai","na","li"] },
    { clue: "Is there anyone home?",
      chars: ["你","家","里","有","人"], answer: ["ni","jia","li","you","ren"] },
  ),

  // 5 — Animals (DOWN: 猫狗鸟鱼龙)
  makePuzzle(5, "Animals",
    { clue: "I keep a cat and a dog",
      chars: ["我","养","猫","和","狗"], answer: ["wo","yang","mao","he","gou"] },
    { clue: "Five creatures: cat, dog, bird, fish, dragon",
      chars: ["猫","狗","鸟","鱼","龙"], answer: ["mao","gou","niao","yu","long"] },
    { clue: "Chinese dragon culture",
      chars: ["中","华","龙","文","化"], answer: ["zhong","hua","long","wen","hua"] },
  ),

  // 6 — Food (DOWN: 饭面粥汤饺)
  makePuzzle(6, "Food",
    { clue: "Let's go to the restaurant",
      chars: ["去","吃","饭","馆","吧"], answer: ["qu","chi","fan","guan","ba"] },
    { clue: "Five Chinese foods: rice, noodles, congee, soup, dumplings",
      chars: ["饭","面","粥","汤","饺"], answer: ["fan","mian","zhou","tang","jiao"] },
    { clue: "Dumplings are so delicious",
      chars: ["好","吃","饺","子","哦"], answer: ["hao","chi","jiao","zi","o"] },
  ),

  // 7 — Weather (DOWN: 晴雨雪风云)
  makePuzzle(7, "Weather",
    { clue: "It is sunny today",
      chars: ["今","天","晴","天","了"], answer: ["jin","tian","qing","tian","le"] },
    { clue: "Five types of weather: sunny, rain, snow, wind, cloud",
      chars: ["晴","雨","雪","风","云"], answer: ["qing","yu","xue","feng","yun"] },
    { clue: "Floating, floating clouds in the sky",
      chars: ["飘","飘","云","彩","啊"], answer: ["piao","piao","yun","cai","a"] },
  ),

  // 8 — School (DOWN: 书笔纸班学)
  makePuzzle(8, "School",
    { clue: "I bought a new schoolbag",
      chars: ["我","买","书","包","了"], answer: ["wo","mai","shu","bao","le"] },
    { clue: "Five school items: book, pen, paper, class, study",
      chars: ["书","笔","纸","班","学"], answer: ["shu","bi","zhi","ban","xue"] },
    { clue: "Study Chinese hard",
      chars: ["好","好","学","中","文"], answer: ["hao","hao","xue","zhong","wen"] },
  ),

  // 9 — Time of Day (DOWN: 早午晚今明)
  makePuzzle(9, "Time of Day",
    { clue: "Wake up early every day",
      chars: ["每","天","早","起","床"], answer: ["mei","tian","zao","qi","chuang"] },
    { clue: "Parts of the day: morning, noon, evening, today, tomorrow",
      chars: ["早","午","晚","今","明"], answer: ["zao","wu","wan","jin","ming"] },
    { clue: "Goodbye, see you tomorrow",
      chars: ["再","见","明","天","见"], answer: ["zai","jian","ming","tian","jian"] },
  ),

  // 10 — Directions (DOWN: 东西南北中)
  makePuzzle(10, "Directions",
    { clue: "Walk to the east side",
      chars: ["走","到","东","边","去"], answer: ["zou","dao","dong","bian","qu"] },
    { clue: "Five compass directions: east, west, south, north, center",
      chars: ["东","西","南","北","中"], answer: ["dong","xi","nan","bei","zhong"] },
    { clue: "Are you studying Chinese?",
      chars: ["学","习","中","文","吗"], answer: ["xue","xi","zhong","wen","ma"] },
  ),

  // 11 — Seasons (DOWN: 春夏秋冬暖)
  makePuzzle(11, "Seasons",
    { clue: "I love spring so much",
      chars: ["我","爱","春","天","啊"], answer: ["wo","ai","chun","tian","a"] },
    { clue: "Four seasons plus warm: spring, summer, autumn, winter, warm",
      chars: ["春","夏","秋","冬","暖"], answer: ["chun","xia","qiu","dong","nuan"] },
    { clue: "The warm breeze of spring",
      chars: ["风","吹","暖","春","天"], answer: ["feng","chui","nuan","chun","tian"] },
  ),

  // 12 — Fruits (DOWN: 苹橙香梨芒)
  makePuzzle(12, "Fruits",
    { clue: "I love apples so much",
      chars: ["我","爱","苹","果","啊"], answer: ["wo","ai","ping","guo","a"] },
    { clue: "First characters of five fruits: apple, orange, banana, pear, mango",
      chars: ["苹","橙","香","梨","芒"], answer: ["ping","cheng","xiang","li","mang"] },
    { clue: "This mango is really sweet",
      chars: ["这","个","芒","果","甜"], answer: ["zhe","ge","mang","guo","tian"] },
  ),

  // 13 — Chinese Cities (DOWN: 京沪广深津)
  makePuzzle(13, "Chinese Cities",
    { clue: "Are you going to the capital city?",
      chars: ["你","去","京","城","吗"], answer: ["ni","qu","jing","cheng","ma"] },
    { clue: "Short names for five major cities: Beijing, Shanghai, Guangzhou, Shenzhen, Tianjin",
      chars: ["京","沪","广","深","津"], answer: ["jing","hu","guang","shen","jin"] },
    { clue: "I live in Tianjin",
      chars: ["我","在","津","城","住"], answer: ["wo","zai","jin","cheng","zhu"] },
  ),

];

export async function seedCrosswords(): Promise<void> {
  const { db } = await import("./db");
  const { dailyCrosswords } = await import("@shared/schema");
  const { sql } = await import("drizzle-orm");

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
