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

// 4×4 I-beam layout:
// Row 0 = full ACROSS word (4 chars, cols 0-3)
// Col 1 = full DOWN word (4 chars, rows 0-3)
// Row 3 = full ACROSS word (4 chars, cols 0-3)
// Intersections: (row 0, col 1) and (row 3, col 1)
// Constraint: across1.chars[1] === down.chars[0]  AND  across3.chars[1] === down.chars[3]
const I_BEAM_4: boolean[][] = [
  [true,  true,  true,  true],
  [false, true,  false, false],
  [false, true,  false, false],
  [true,  true,  true,  true],
];

function makePuzzle(
  puzzleIndex: number,
  title: string,
  across1: { clue: string; chars: string[]; answer: string[] },
  down:    { clue: string; chars: string[]; answer: string[] },
  across3: { clue: string; chars: string[]; answer: string[] },
): CrosswordPuzzleData {
  if (across1.chars[1] !== down.chars[0]) {
    throw new Error(
      `Puzzle ${puzzleIndex}: across1.chars[1]="${across1.chars[1]}" must equal down.chars[0]="${down.chars[0]}"`,
    );
  }
  if (across3.chars[1] !== down.chars[3]) {
    throw new Error(
      `Puzzle ${puzzleIndex}: across3.chars[1]="${across3.chars[1]}" must equal down.chars[3]="${down.chars[3]}"`,
    );
  }
  return {
    title,
    puzzleIndex,
    grid: I_BEAM_4,
    words: [
      { number: 1, direction: "across", startRow: 0, startCol: 0, length: 4, ...across1 },
      { number: 2, direction: "down",   startRow: 0, startCol: 1, length: 4, ...down    },
      { number: 3, direction: "across", startRow: 3, startCol: 0, length: 4, ...across3 },
    ],
  };
}

export const SEED_PUZZLES: CrosswordPuzzleData[] = [

  // 0 — 第一印象 · 一路顺风 · 乘风破浪
  // A1[1]=一=D[0] ✓  A3[1]=风=D[3] ✓
  makePuzzle(0, "First Impressions",
    { clue: "The judgment you form when you meet someone for the very first time",
      chars: ["第","一","印","象"], answer: ["di","yi","yin","xiang"] },
    { clue: "A warm send-off wishing someone a smooth and safe journey",
      chars: ["一","路","顺","风"], answer: ["yi","lu","shun","feng"] },
    { clue: "To boldly overcome every challenge that stands in your way",
      chars: ["乘","风","破","浪"], answer: ["cheng","feng","po","lang"] },
  ),

  // 1 — 澳大利亚 · 大吃一惊 · 大惊失色
  // A1[1]=大=D[0] ✓  A3[1]=惊=D[3] ✓
  makePuzzle(1, "Shock & Surprise",
    { clue: "The country where kangaroos and the Great Barrier Reef are found",
      chars: ["澳","大","利","亚"], answer: ["ao","da","li","ya"] },
    { clue: "To be completely taken aback and shocked by something unexpected",
      chars: ["大","吃","一","惊"], answer: ["da","chi","yi","jing"] },
    { clue: "To turn pale with fear or shock — your face loses all colour",
      chars: ["大","惊","失","色"], answer: ["da","jing","shi","se"] },
  ),

  // 2 — 全心全意 · 心想事成 · 功成名就
  // A1[1]=心=D[0] ✓  A3[1]=成=D[3] ✓
  makePuzzle(2, "Heart & Success",
    { clue: "Putting every bit of your heart and soul into what you do",
      chars: ["全","心","全","意"], answer: ["quan","xin","quan","yi"] },
    { clue: "May everything you wish for come true — a classic blessing",
      chars: ["心","想","事","成"], answer: ["xin","xiang","shi","cheng"] },
    { clue: "To achieve great fame and success through hard work",
      chars: ["功","成","名","就"], answer: ["gong","cheng","ming","jiu"] },
  ),

  // 3 — 顶天立地 · 天长地久 · 悠久历史
  // A1[1]=天=D[0] ✓  A3[1]=久=D[3] ✓
  makePuzzle(3, "Heaven & Earth",
    { clue: "Standing tall and upright — a truly heroic and towering figure",
      chars: ["顶","天","立","地"], answer: ["ding","tian","li","di"] },
    { clue: "As eternal as heaven and earth — lasting forever without end",
      chars: ["天","长","地","久"], answer: ["tian","chang","di","jiu"] },
    { clue: "A civilisation or tradition that stretches back thousands of years",
      chars: ["悠","久","历","史"], answer: ["you","jiu","li","shi"] },
  ),

  // 4 — 最新消息 · 新年快乐 · 欢乐时光
  // A1[1]=新=D[0] ✓  A3[1]=乐=D[3] ✓
  makePuzzle(4, "New Year Joy",
    { clue: "Breaking news — the very latest update on what is happening",
      chars: ["最","新","消","息"], answer: ["zui","xin","xiao","xi"] },
    { clue: "The greeting everyone says when the lunar new year begins",
      chars: ["新","年","快","乐"], answer: ["xin","nian","kuai","le"] },
    { clue: "A wonderful period full of laughter, fun, and good memories",
      chars: ["欢","乐","时","光"], answer: ["huan","le","shi","guang"] },
  ),

  // 5 — 万马奔腾 · 马到成功 · 建功立业
  // A1[1]=马=D[0] ✓  A3[1]=功=D[3] ✓
  makePuzzle(5, "Horses & Achievement",
    { clue: "Ten thousand horses galloping — a scene of enormous energy and power",
      chars: ["万","马","奔","腾"], answer: ["wan","ma","ben","teng"] },
    { clue: "Instant success — the moment your horse arrives, victory is already won",
      chars: ["马","到","成","功"], answer: ["ma","dao","cheng","gong"] },
    { clue: "To establish a career and leave behind a legacy of great achievements",
      chars: ["建","功","立","业"], answer: ["jian","gong","li","ye"] },
  ),

  // 6 — 青春活力 · 春暖花开 · 公开比赛
  // A1[1]=春=D[0] ✓  A3[1]=开=D[3] ✓
  makePuzzle(6, "Spring & Vitality",
    { clue: "The energy, enthusiasm, and vigour that belongs to youth",
      chars: ["青","春","活","力"], answer: ["qing","chun","huo","li"] },
    { clue: "The season when the air grows warm and flowers burst into bloom",
      chars: ["春","暖","花","开"], answer: ["chun","nuan","hua","kai"] },
    { clue: "A competition open to all — anyone can sign up and take part",
      chars: ["公","开","比","赛"], answer: ["gong","kai","bi","sai"] },
  ),

  // 7 — 清风明月 · 风和日丽 · 美丽风景
  // A1[1]=风=D[0] ✓  A3[1]=丽=D[3] ✓
  makePuzzle(7, "Wind & Beauty",
    { clue: "A gentle breeze under a bright full moon — a classic poetic scene",
      chars: ["清","风","明","月"], answer: ["qing","feng","ming","yue"] },
    { clue: "A perfect day — warm sunshine, calm winds, not a cloud in sight",
      chars: ["风","和","日","丽"], answer: ["feng","he","ri","li"] },
    { clue: "A view or landscape so stunning it takes your breath away",
      chars: ["美","丽","风","景"], answer: ["mei","li","feng","jing"] },
  ),

  // 8 — 小吃文化 · 吃喝玩乐 · 娱乐活动
  // A1[1]=吃=D[0] ✓  A3[1]=乐=D[3] ✓
  makePuzzle(8, "Food & Fun",
    { clue: "The rich tradition of street snacks and local bites found across China",
      chars: ["小","吃","文","化"], answer: ["xiao","chi","wen","hua"] },
    { clue: "Eating, drinking, playing, and having fun — enjoying life to the full",
      chars: ["吃","喝","玩","乐"], answer: ["chi","he","wan","le"] },
    { clue: "Events and pastimes done for enjoyment — shows, sports, games, and more",
      chars: ["娱","乐","活","动"], answer: ["yu","le","huo","dong"] },
  ),

  // 9 — 少年时代 · 年年有余 · 业余爱好
  // A1[1]=年=D[0] ✓  A3[1]=余=D[3] ✓
  makePuzzle(9, "Youth & Hobbies",
    { clue: "The childhood and teenage years — a time of growth and discovery",
      chars: ["少","年","时","代"], answer: ["shao","nian","shi","dai"] },
    { clue: "A New Year wish: may every year bring abundance and prosperity",
      chars: ["年","年","有","余"], answer: ["nian","nian","you","yu"] },
    { clue: "Something you enjoy doing in your free time — a personal interest",
      chars: ["业","余","爱","好"], answer: ["ye","yu","ai","hao"] },
  ),

  // 10 — 春节习俗 · 节日快乐 · 音乐老师
  // A1[1]=节=D[0] ✓  A3[1]=乐=D[3] ✓
  makePuzzle(10, "Festivals & Music",
    { clue: "The traditional customs and rituals celebrated during the Spring Festival",
      chars: ["春","节","习","俗"], answer: ["chun","jie","xi","su"] },
    { clue: "The greeting you say to someone on any festive occasion or holiday",
      chars: ["节","日","快","乐"], answer: ["jie","ri","kuai","le"] },
    { clue: "The person at school who teaches you to sing, play, and read music",
      chars: ["音","乐","老","师"], answer: ["yin","yue","lao","shi"] },
  ),

  // 11 — 自学成才 · 学无止境 · 环境污染
  // A1[1]=学=D[0] ✓  A3[1]=境=D[3] ✓
  makePuzzle(11, "Learning & Environment",
    { clue: "To teach yourself and develop skills without a formal teacher",
      chars: ["自","学","成","才"], answer: ["zi","xue","cheng","cai"] },
    { clue: "The idea that there is always more to learn — knowledge never ends",
      chars: ["学","无","止","境"], answer: ["xue","wu","zhi","jing"] },
    { clue: "Damage caused to air, water, and land by waste and harmful substances",
      chars: ["环","境","污","染"], answer: ["huan","jing","wu","ran"] },
  ),

  // 12 — 踏青春游 · 青山绿水 · 饮水思源
  // A1[1]=青=D[0] ✓  A3[1]=水=D[3] ✓
  makePuzzle(12, "Nature & Gratitude",
    { clue: "A spring outing to enjoy fresh air, green scenery, and nature",
      chars: ["踏","青","春","游"], answer: ["ta","qing","chun","you"] },
    { clue: "Green mountains and clear waters — a picture of natural beauty",
      chars: ["青","山","绿","水"], answer: ["qing","shan","lv","shui"] },
    { clue: "When you drink water, remember where it comes from — don't forget your roots",
      chars: ["饮","水","思","源"], answer: ["yin","shui","si","yuan"] },
  ),

  // 13 — 黄金时代 · 金榜题名 · 著名人物
  // A1[1]=金=D[0] ✓  A3[1]=名=D[3] ✓
  makePuzzle(13, "Gold & Fame",
    { clue: "A period of great prosperity, creativity, and achievement — a golden era",
      chars: ["黄","金","时","代"], answer: ["huang","jin","shi","dai"] },
    { clue: "To pass an important exam and have your name on the honour list",
      chars: ["金","榜","题","名"], answer: ["jin","bang","ti","ming"] },
    { clue: "A well-known and celebrated person — a famous figure in history or culture",
      chars: ["著","名","人","物"], answer: ["zhu","ming","ren","wu"] },
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
