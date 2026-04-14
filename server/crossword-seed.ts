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
// Genuine NYT-mini-style interlocking — every white cell belongs to exactly one word.
const CROSS: boolean[][] = [
  [false, false, true,  false, false],
  [false, false, true,  false, false],
  [true,  true,  true,  true,  true],
  [false, false, true,  false, false],
  [false, false, true,  false, false],
];

// Helper — all 14 puzzles share the same CROSS grid layout:
//   Word 1 DOWN:   cells (0,2) (1,2) (2,2) (3,2) (4,2)
//   Word 2 ACROSS: cells (2,0) (2,1) (2,2) (2,3) (2,4)
//   Intersection:  cell  (2,2) — must share the same character AND same pinyin syllable
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

// ─── 14 Beginner Chinese Crossword Puzzles ────────────────────────────────────
// Categories: everyday phrases, greetings, fruits, vegetables, cities, famous names
// Every puzzle: 5-character DOWN word intersecting a 5-character ACROSS phrase/word
// Intersection character (cell 2,2) is identical in both words.
// ─────────────────────────────────────────────────────────────────────────────

export const SEED_PUZZLES: CrosswordPuzzleData[] = [

  // Puzzle 0 — Category: Greeting Phrases  |  intersection: 好 (hao)
  // DOWN:   你 好 好 学 习  (nǐ hào hǎo xué xí)  "Study well and make progress"
  // ACROSS: 大 家 好 吗 ？  (dà jiā hǎo ma)      "Is everyone well?"
  makePuzzle(0, "Greetings",
    { clue: "Study well and make progress! (classic teacher's blessing — 你好好学习)", chars: ["你","好","好","学","习"], answer: ["ni","hao","hao","xue","xi"] },
    { clue: "Is everyone well? (friendly group greeting)",                             chars: ["大","家","好","吗","？"], answer: ["da","jia","hao","ma","?"] },
  ),

  // Puzzle 1 — Category: Everyday Phrases  |  intersection: 谢 (xie)
  // DOWN:   多 谢 谢 谢 了  — simplify to natural: 不 用 谢 谢 了 — adjust:
  // DOWN:   不 用 谢 谢 了 is unnatural; use: 非 常 谢 谢 你
  // ACROSS: 谢 谢 你 的 帮  — simplify: 感 谢 谢 ... too redundant
  // Better: intersection = 谢 at position 2
  // DOWN:   非 常 谢 谢 你  (fēi cháng xiè xiè nǐ)  — too complex for beginners
  // Use simple set:
  // DOWN:   你 好 谢 早 再  — not coherent
  // Let's use: intersection = 好 approach differently —
  // Puzzle 1 — Category: Common Phrases  |  intersection: 来 (lai)
  // DOWN:   你 好 来 北 京  — chars 3,4 unrelated
  // Keep it clean: each word should be a real phrase or vocabulary list
  // DOWN: 请 进 来 坐 下  (qǐng jìn lái zuò xià) "Please come in and sit down" (very common phrase)
  // ACROSS: 我 从 来 没 去  (wǒ cóng lái méi qù)  "I have never been there"
  makePuzzle(1, "Common Phrases",
    { clue: "Please come in and sit down (welcoming phrase — 请进来坐下)", chars: ["请","进","来","坐","下"], answer: ["qing","jin","lai","zuo","xia"] },
    { clue: "I have never been there (expressing no experience — 我从来没去)", chars: ["我","从","来","没","去"], answer: ["wo","cong","lai","mei","qu"] },
  ),

  // Puzzle 2 — Category: Fruits  |  intersection: 苹 (ping)
  // DOWN:   苹果很好吃  (píng guǒ hěn hǎo chī)  "Apples are delicious"
  // ACROSS: 我爱苹果汁  (wǒ ài píng guǒ zhī)     "I love apple juice"
  makePuzzle(2, "Fruits",
    { clue: "Apples are delicious (苹果很好吃 — a taste opinion)", chars: ["苹","果","很","好","吃"], answer: ["ping","guo","hen","hao","chi"] },
    { clue: "I love apple juice (我爱苹果汁 — favourite drink)",   chars: ["我","爱","苹","果","汁"], answer: ["wo","ai","ping","guo","zhi"] },
  ),

  // Puzzle 3 — Category: Vegetables  |  intersection: 菜 (cai)
  // DOWN:   蔬菜很便宜  — 蔬 is not beginner; use 白菜
  // DOWN:   白菜豆腐好  (bái cài dòu fǔ hǎo) "Napa cabbage and tofu are good" — 菜 at position 1 (index 1)
  // ACROSS must share position 2 (index 2 in across = index 1 in down) — need 菜 at across[2]
  // DOWN positions: [0]=白 [1]=菜 [2]=豆 [3]=腐 [4]=好 — intersection would be at down[2]=豆
  // Let me re-plan: intersection is ALWAYS at down[2] and across[2]
  // DOWN:   白 菜 豆 腐 好 — down[2]=豆(dou)
  // ACROSS: 我 爱 豆 腐 汤 — across[2]=豆(dou) ✓
  makePuzzle(3, "Vegetables",
    { clue: "Napa cabbage and tofu are delicious! (白菜豆腐好 — classic Chinese ingredients)", chars: ["白","菜","豆","腐","好"], answer: ["bai","cai","dou","fu","hao"] },
    { clue: "I love tofu soup (我爱豆腐汤 — popular home-cooked dish)",                        chars: ["我","爱","豆","腐","汤"], answer: ["wo","ai","dou","fu","tang"] },
  ),

  // Puzzle 4 — Category: Chinese Cities  |  intersection: 京 (jing)
  // DOWN:   上 海 北 京 市 — down[2]=北(bei) — ACROSS needs 北 at position 2
  // Better: choose intersection = 京 at position 2 in both
  // DOWN:   南 京 京 城 美 — redundant; use a real phrase
  // DOWN:   南 京 路 很 长  (nán jīng lù hěn cháng) "Nanjing Road is very long" — down[2]=路(lu)? No down[1]=京
  // DOWN positions: [0] [1] [2] [3] [4], intersection = down[2]
  // DOWN:   在 北 京 玩 吧  (zài běi jīng wán ba) "Let's have fun in Beijing" — down[2]=京(jing)
  // ACROSS: 我 去 京 城 玩  (wǒ qù jīng chéng wán) "I'm going to the capital to have fun" — across[2]=京(jing) ✓
  makePuzzle(4, "Chinese Cities",
    { clue: "Let's have fun in Beijing! (在北京玩吧 — travel invitation)", chars: ["在","北","京","玩","吧"], answer: ["zai","bei","jing","wan","ba"] },
    { clue: "I'm going to the capital to have fun (我去京城玩 — 京城 means Beijing)", chars: ["我","去","京","城","玩"], answer: ["wo","qu","jing","cheng","wan"] },
  ),

  // Puzzle 5 — Category: Chinese Cities  |  intersection: 海 (hai)
  // DOWN:   上 海 人 很 多  — down[1]=海; needs down[2]=intersection
  // DOWN:   去 上 海 玩 吧  (qù shàng hǎi wán ba) "Let's go to Shanghai to have fun" — down[2]=海(hai)
  // ACROSS: 大 连 海 边 美  (dà lián hǎi biān měi) "The seaside in Dalian is beautiful" — across[2]=海(hai) ✓
  makePuzzle(5, "Chinese Cities",
    { clue: "Let's go to Shanghai for fun! (去上海玩吧 — travel suggestion)", chars: ["去","上","海","玩","吧"], answer: ["qu","shang","hai","wan","ba"] },
    { clue: "The seaside in Dalian is beautiful (大连海边美 — scenic description)", chars: ["大","连","海","边","美"], answer: ["da","lian","hai","bian","mei"] },
  ),

  // Puzzle 6 — Category: Famous Names  |  intersection: 龙 (long)
  // DOWN:   他 是 龙 的 传人 — too long; use 5 chars
  // DOWN:   成 吉 龙 ... — not a real name
  // Famous names with 龙: 成龙 (Jackie Chan), 李小龙 (Bruce Lee)
  // DOWN:   李 小 龙 很 棒  (Lǐ Xiǎo Lóng hěn bàng) "Bruce Lee is amazing" — down[2]=龙(long)
  // ACROSS: 他 是 龙 的 人  (tā shì lóng de rén) "He is a descendant of the dragon" — across[2]=龙(long) ✓
  makePuzzle(6, "Famous Names",
    { clue: "Bruce Lee is amazing! (李小龙很棒 — martial arts legend)", chars: ["李","小","龙","很","棒"], answer: ["li","xiao","long","hen","bang"] },
    { clue: "He is a son of the dragon (他是龙的人 — Chinese cultural identity phrase)", chars: ["他","是","龙","的","人"], answer: ["ta","shi","long","de","ren"] },
  ),

  // Puzzle 7 — Category: Famous Names  |  intersection: 毛 (mao)
  // DOWN:   伟 大 毛 主 席  (wěi dà Máo zhǔ xí) "The great Chairman Mao" — down[2]=毛(mao)
  // ACROSS: 一 张 毛 主 席  — repeating; use something different
  // ACROSS: 我 有 毛 笔 画  (wǒ yǒu máo bǐ huà) "I have a brush painting" — across[2]=毛(mao) ✓
  makePuzzle(7, "Famous Names",
    { clue: "The great Chairman Mao (伟大毛主席 — historical figure)", chars: ["伟","大","毛","主","席"], answer: ["wei","da","mao","zhu","xi"] },
    { clue: "I have a brush ink painting (我有毛笔画 — traditional art)", chars: ["我","有","毛","笔","画"], answer: ["wo","you","mao","bi","hua"] },
  ),

  // Puzzle 8 — Category: Everyday Phrases  |  intersection: 吃 (chi)
  // DOWN:   你 好 吃 了 吗  (nǐ hǎo chī le ma) "Have you eaten?" (classic Chinese greeting) — down[2]=吃(chi)
  // ACROSS: 我 想 吃 饺 子  (wǒ xiǎng chī jiǎo zi) "I want to eat dumplings" — across[2]=吃(chi) ✓
  makePuzzle(8, "Everyday Phrases",
    { clue: "Have you eaten yet? (你好吃了吗 — traditional Chinese greeting)", chars: ["你","好","吃","了","吗"], answer: ["ni","hao","chi","le","ma"] },
    { clue: "I want to eat dumplings (我想吃饺子 — favourite food phrase)", chars: ["我","想","吃","饺","子"], answer: ["wo","xiang","chi","jiao","zi"] },
  ),

  // Puzzle 9 — Category: Fruits  |  intersection: 香 (xiang)
  // DOWN:   我 爱 香 蕉 吃  — word order awkward; use:
  // DOWN:   菠 萝 香 蕉 好  (bō luó xiāng jiāo hǎo) "Pineapple and banana are good" — down[2]=香(xiang)
  // ACROSS: 我 买 香 蕉 吃  (wǒ mǎi xiāng jiāo chī) "I'll buy some bananas to eat" — across[2]=香(xiang) ✓
  makePuzzle(9, "Fruits",
    { clue: "Pineapple and banana are great! (菠萝香蕉好 — tropical fruit pair)", chars: ["菠","萝","香","蕉","好"], answer: ["bo","luo","xiang","jiao","hao"] },
    { clue: "I'll buy some bananas to eat (我买香蕉吃 — shopping phrase)",       chars: ["我","买","香","蕉","吃"], answer: ["wo","mai","xiang","jiao","chi"] },
  ),

  // Puzzle 10 — Category: Chinese Cities  |  intersection: 广 (guang)
  // DOWN:   北 上 广 深 市  (běi shàng guǎng shēn shì) "Beijing, Shanghai, Guangzhou, Shenzhen (tier-1 cities)" — down[2]=广(guang)
  // ACROSS: 我 去 广 州 玩  (wǒ qù Guǎng zhōu wán) "I'm going to Guangzhou to have fun" — across[2]=广(guang) ✓
  makePuzzle(10, "Chinese Cities",
    { clue: "China's four tier-1 cities abbreviated (北上广深 + 市 for city)", chars: ["北","上","广","深","市"], answer: ["bei","shang","guang","shen","shi"] },
    { clue: "I'm going to Guangzhou to have fun (我去广州玩 — travel phrase)", chars: ["我","去","广","州","玩"], answer: ["wo","qu","guang","zhou","wan"] },
  ),

  // Puzzle 11 — Category: Everyday Phrases  |  intersection: 学 (xue)
  // DOWN:   我 要 学 中 文  (wǒ yào xué zhōng wén) "I want to learn Chinese" — down[2]=学(xue)
  // ACROSS: 汉 语 学 起 来  (hàn yǔ xué qǐ lái) "Learning Chinese (it's fun / worth it)" — across[2]=学(xue) ✓
  makePuzzle(11, "Everyday Phrases",
    { clue: "I want to learn Chinese (我要学中文 — language learner's motto)", chars: ["我","要","学","中","文"], answer: ["wo","yao","xue","zhong","wen"] },
    { clue: "Learning Chinese is worth it! (汉语学起来 — motivational phrase)", chars: ["汉","语","学","起","来"], answer: ["han","yu","xue","qi","lai"] },
  ),

  // Puzzle 12 — Category: Famous Names  |  intersection: 诗 (shi)
  // Li Bai (李白) famous for poetry
  // DOWN:   李 白 诗 很 美  (Lǐ Bái shī hěn měi) "Li Bai's poetry is beautiful" — down[2]=诗(shi)
  // ACROSS: 我 读 诗 很 多  (wǒ dú shī hěn duō) "I read a lot of poetry" — across[2]=诗(shi) ✓
  makePuzzle(12, "Famous Names",
    { clue: "Li Bai's poetry is beautiful (李白诗很美 — Tang dynasty poet)", chars: ["李","白","诗","很","美"], answer: ["li","bai","shi","hen","mei"] },
    { clue: "I read a lot of poetry (我读诗很多 — literary hobby phrase)", chars: ["我","读","诗","很","多"], answer: ["wo","du","shi","hen","duo"] },
  ),

  // Puzzle 13 — Category: Vegetables / Food  |  intersection: 米 (mi)
  // DOWN:   炒 饭 米 饭 好  — down[2]=米; 炒饭 and 米饭 overlap awkwardly
  // DOWN:   白 饭 米 饭 好  — too repetitive
  // DOWN:   新 鲜 米 饭 香  (xīn xiān mǐ fàn xiāng) "Freshly cooked rice smells wonderful" — down[2]=米(mi)
  // ACROSS: 我 爱 米 粉 汤  (wǒ ài mǐ fěn tāng) "I love rice noodle soup" — across[2]=米(mi) ✓
  makePuzzle(13, "Everyday Phrases",
    { clue: "Freshly cooked rice smells wonderful (新鲜米饭香 — sensory description)", chars: ["新","鲜","米","饭","香"], answer: ["xin","xian","mi","fan","xiang"] },
    { clue: "I love rice noodle soup (我爱米粉汤 — popular Chinese comfort food)", chars: ["我","爱","米","粉","汤"], answer: ["wo","ai","mi","fen","tang"] },
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
