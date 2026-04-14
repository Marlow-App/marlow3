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

  // 0 — Peppa Pig · Street Food · Strawberries
  // A1[2]=小=D[0] ✓  A3[2]=红=D[4] ✓
  makePuzzle(0, "Peppa, Snacks & Berries",
    { clue: "Outdoor snacks that fill the street with amazing smells",
      chars: ["街","边","小","吃","香"], answer: ["jie","bian","xiao","chi","xiang"] },
    { clue: "This cartoon pink piggy loves jumping in muddy puddles",
      chars: ["小","猪","佩","奇","红"], answer: ["xiao","zhu","pei","qi","hong"] },
    { clue: "These red berries are round, sweet, and bright red",
      chars: ["草","莓","红","彤","彤"], answer: ["cao","mei","hong","tong","tong"] },
  ),

  // 1 — Video Games · Basketball · Great Feeling
  // A1[2]=打=D[0] ✓  A3[2]=爽=D[4] ✓
  makePuzzle(1, "Games, Hoops & Feelings",
    { clue: "What kids do after school on phones, consoles, and computers",
      chars: ["他","们","打","游","戏"], answer: ["ta","men","da","you","xi"] },
    { clue: "Shooting hoops with friends on the court",
      chars: ["打","篮","球","很","爽"], answer: ["da","lan","qiu","hen","shuang"] },
    { clue: "How you feel after acing a test or winning a game",
      chars: ["感","觉","爽","极","了"], answer: ["gan","jue","shuang","ji","le"] },
  ),

  // 2 — Watching Crowds · Cinema · Happy Mood
  // A1[2]=看=D[0] ✓  A3[2]=心=D[4] ✓
  makePuzzle(2, "Cinema, Crowds & Moods",
    { clue: "When something exciting happens, a crowd gathers to watch",
      chars: ["大","家","看","热","闹"], answer: ["da","jia","kan","re","nao"] },
    { clue: "Saturday night activity with popcorn and a big screen",
      chars: ["看","电","影","开","心"], answer: ["kan","dian","ying","kai","xin"] },
    { clue: "When your spirits are high and everything feels good",
      chars: ["快","乐","心","情","好"], answer: ["kuai","le","xin","qing","hao"] },
  ),

  // 3 — Little Dog · Running · PE Class
  // A1[2]=跑=D[0] ✓  A3[2]=体=D[4] ✓
  makePuzzle(3, "Dogs, Running & PE",
    { clue: "A small furry four-legged pet going at full speed",
      chars: ["小","狗","跑","得","快"], answer: ["xiao","gou","pao","de","kuai"] },
    { clue: "This exercise makes your body healthier and stronger",
      chars: ["跑","步","强","身","体"], answer: ["pao","bu","qiang","shen","ti"] },
    { clue: "The school subject where you play sports and move around",
      chars: ["每","天","体","育","课"], answer: ["mei","tian","ti","yu","ke"] },
  ),

  // 4 — Fish · Amusement Park · Computer Games
  // A1[2]=游=D[0] ✓  A3[2]=玩=D[4] ✓
  makePuzzle(4, "Fish, Parks & Games",
    { clue: "These underwater creatures glide silently through rivers and seas",
      chars: ["鱼","儿","游","水","中"], answer: ["yu","er","you","shui","zhong"] },
    { clue: "A park full of roller coasters, rides, and attractions",
      chars: ["游","乐","园","好","玩"], answer: ["you","le","yuan","hao","wan"] },
    { clue: "What you do when you open Minecraft, Roblox, or any game",
      chars: ["电","脑","玩","游","戏"], answer: ["dian","nao","wan","you","xi"] },
  ),

  // 5 — Mom's Love · Reading · Kung Fu
  // A1[2]=爱=D[0] ✓  A3[2]=步=D[4] ✓
  makePuzzle(5, "Mom, Books & Kung Fu",
    { clue: "A mother's warmth and affection for her child",
      chars: ["妈","妈","爱","宝","宝"], answer: ["ma","ma","ai","bao","bao"] },
    { clue: "Do this every day and you will keep getting smarter",
      chars: ["爱","读","书","进","步"], answer: ["ai","du","shu","jin","bu"] },
    { clue: "The special footwork moves in martial arts",
      chars: ["功","夫","步","法","妙"], answer: ["gong","fu","bu","fa","miao"] },
  ),

  // 6 — Teacher · Rainbow · Sparkling Eyes
  // A1[2]=画=D[0] ✓  A3[2]=亮=D[4] ✓
  makePuzzle(6, "Teacher, Rainbow & Eyes",
    { clue: "Writing and drawing on the board at the front of the classroom",
      chars: ["老","师","画","黑","板"], answer: ["lao","shi","hua","hei","ban"] },
    { clue: "The colorful arc that appears in the sky after it rains",
      chars: ["画","彩","虹","漂","亮"], answer: ["hua","cai","hong","piao","liang"] },
    { clue: "Happy, alert eyes that shine like little stars",
      chars: ["眼","睛","亮","晶","晶"], answer: ["yan","jing","liang","jing","jing"] },
  ),

  // 7 — Little Birds · Singing · Warm Feelings
  // A1[2]=唱=D[0] ✓  A3[2]=心=D[4] ✓
  makePuzzle(7, "Birds, Songs & Warmth",
    { clue: "Feathered friends who serenade everyone at dawn every morning",
      chars: ["小","鸟","唱","晨","歌"], answer: ["xiao","niao","chang","chen","ge"] },
    { clue: "This activity lets you express yourself through music and melody",
      chars: ["唱","歌","很","开","心"], answer: ["chang","ge","hen","kai","xin"] },
    { clue: "The cozy, warm feeling in your chest when something is sweet",
      chars: ["暖","暖","心","窝","里"], answer: ["nuan","nuan","xin","wo","li"] },
  ),

  // 8 — Ancient Knights · Bicycle · High Grades
  // A1[2]=骑=D[0] ✓  A3[2]=棒=D[4] ✓
  makePuzzle(8, "Knights, Bikes & Grades",
    { clue: "A brave warrior in shiny armor from a long time ago",
      chars: ["古","代","骑","士","帅"], answer: ["gu","dai","qi","shi","shuai"] },
    { clue: "A healthy, eco-friendly way to get around on two wheels",
      chars: ["骑","自","行","车","棒"], answer: ["qi","zi","xing","che","bang"] },
    { clue: "When you ace every test and make your parents super proud",
      chars: ["成","绩","棒","上","天"], answer: ["cheng","ji","bang","shang","tian"] },
  ),

  // 9 — Shuttlecock · Soccer · Summer Sweat
  // A1[2]=踢=D[0] ✓  A3[2]=汗=D[4] ✓
  makePuzzle(9, "Recess, Soccer & Summer",
    { clue: "Keeping a weighted feathered toy in the air with your feet — classic recess game",
      chars: ["课","间","踢","毽","子"], answer: ["ke","jian","ti","jian","zi"] },
    { clue: "After 90 minutes chasing the ball on the field, your shirt is soaked",
      chars: ["踢","足","球","出","汗"], answer: ["ti","zu","qiu","chu","han"] },
    { clue: "Hot temperatures and dripping foreheads in July and August",
      chars: ["夏","天","汗","水","多"], answer: ["xia","tian","han","shui","duo"] },
  ),

  // 10 — Frogs · Dancing · Joy
  // A1[2]=跳=D[0] ✓  A3[2]=心=D[4] ✓
  makePuzzle(10, "Frogs, Dancing & Joy",
    { clue: "This green amphibian leaps off the lily pad with a big splash",
      chars: ["青","蛙","跳","进","水"], answer: ["qing","wa","tiao","jin","shui"] },
    { clue: "Moving your body to music at a party, concert, or on stage",
      chars: ["跳","舞","真","开","心"], answer: ["tiao","wu","zhen","kai","xin"] },
    { clue: "Playing and laughing with friends — pure, carefree happiness",
      chars: ["开","开","心","心","玩"], answer: ["kai","kai","xin","xin","wan"] },
  ),

  // 11 — Teddy Bear · Giant Panda · Tall Classmate
  // A1[2]=熊=D[0] ✓  A3[2]=子=D[4] ✓
  makePuzzle(11, "Bears, Pandas & Classmates",
    { clue: "A huggable stuffed animal that kids sleep with at night",
      chars: ["泰","迪","熊","玩","具"], answer: ["tai","di","xiong","wan","ju"] },
    { clue: "China's famous black-and-white national treasure loves bamboo",
      chars: ["熊","猫","吃","竹","子"], answer: ["xiong","mao","chi","zhu","zi"] },
    { clue: "The really tall kid you always have to look up at in class",
      chars: ["高","个","子","同","学"], answer: ["gao","ge","zi","tong","xue"] },
  ),

  // 12 — Elephant · Bubble Tea · Flowers
  // A1[2]=喝=D[0] ✓  A3[2]=香=D[4] ✓
  makePuzzle(12, "Elephants, Tea & Flowers",
    { clue: "The biggest land animal has a long trunk and drinks gallons of water",
      chars: ["大","象","喝","水","多"], answer: ["da","xiang","he","shui","duo"] },
    { clue: "Taiwan's most popular sweet drink with chewy tapioca balls",
      chars: ["喝","奶","茶","真","香"], answer: ["he","nai","cha","zhen","xiang"] },
    { clue: "Roses and jasmine do this to make you sniff the air",
      chars: ["花","朵","香","扑","鼻"], answer: ["hua","duo","xiang","pu","bi"] },
  ),

  // 13 — Bees · Learning English · Sunny Weather
  // A1[2]=学=D[0] ✓  A3[2]=好=D[4] ✓
  makePuzzle(13, "Bees, English & Sunshine",
    { clue: "These buzzing yellow-and-black insects collect pollen and make honey",
      chars: ["蜜","蜂","学","飞","翔"], answer: ["mi","feng","xue","fei","xiang"] },
    { clue: "Studying this subject lets you communicate with people around the world",
      chars: ["学","英","语","真","好"], answer: ["xue","ying","yu","zhen","hao"] },
    { clue: "Not a cloud in the sky, warm sun, perfect day to go outside",
      chars: ["天","气","好","晴","朗"], answer: ["tian","qi","hao","qing","lang"] },
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
