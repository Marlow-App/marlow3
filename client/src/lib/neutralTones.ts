/**
 * Neutral tone (轻声) override dictionary.
 *
 * Maps a Chinese word to a per-character pinyin override array.
 * - `null`   → keep the pinyin-pro result for that character
 * - string  → replace with this unmarked pinyin (no diacritical = tone 0)
 *
 * Only covers LEXICAL neutral tones (character is neutral only inside this
 * specific compound). Grammatical particles (的, 了, 们, 子 as a free suffix,
 * 头 as a free suffix, etc.) are already handled by pinyin-pro's context
 * detection and by NEUTRAL_UNDERLYING_TONES in toneSandhi.ts.
 */
const NEUTRAL_TONE_WORDS: Record<string, (string | null)[]> = {
  // ── Common disyllabic compounds ──────────────────────────────────────────
  "明白": [null, "bai"],
  "知道": [null, "dao"],
  "告诉": [null, "su"],
  "意思": [null, "si"],
  "消息": [null, "xi"],
  "东西": [null, "xi"],     // "thing" (also direction, but neutral more common)
  "先生": [null, "sheng"],
  "太太": [null, "tai"],
  "客气": [null, "qi"],
  "舒服": [null, "fu"],
  "清楚": [null, "chu"],
  "麻烦": [null, "fan"],
  "暖和": [null, "huo"],
  "葡萄": [null, "tao"],
  "玻璃": [null, "li"],
  "豆腐": [null, "fu"],
  "钥匙": [null, "shi"],
  "地方": [null, "fang"],   // "place" (colloquial)
  "地道": [null, "dao"],    // "authentic/genuine"
  "月亮": [null, "liang"],
  "马虎": [null, "hu"],
  "窗户": [null, "hu"],
  "眼睛": [null, "jing"],
  "耳朵": [null, "duo"],
  "石榴": [null, "liu"],
  "高粱": [null, "liang"],
  "结实": [null, "shi"],    // sturdy/solid
  "踏实": [null, "shi"],    // steady/reliable
  "收拾": [null, "shi"],    // tidy up
  "打扮": [null, "ban"],    // dress up
  "功夫": [null, "fu"],     // skill/kung fu
  "师傅": [null, "fu"],     // master/craftsman
  "队伍": [null, "wu"],     // team/troops
  "庄稼": [null, "jia"],    // crops
  "石头": [null, "tou"],
  "木头": [null, "tou"],
  "骨头": [null, "tou"],
  "枕头": [null, "tou"],
  "馒头": [null, "tou"],
  "苦头": [null, "tou"],
  "念头": [null, "tou"],
  "舌头": [null, "tou"],

  // ── Suffix -子 words (reliability override) ──────────────────────────────
  "名字": [null, "zi"],
  "儿子": [null, "zi"],
  "孙子": [null, "zi"],
  "脑子": [null, "zi"],
  "胡子": [null, "zi"],
  "帽子": [null, "zi"],
  "桌子": [null, "zi"],
  "椅子": [null, "zi"],
  "袜子": [null, "zi"],
  "鞋子": [null, "zi"],
  "孩子": [null, "zi"],
  "样子": [null, "zi"],
  "箱子": [null, "zi"],
  "本子": [null, "zi"],
  "柜子": [null, "zi"],
  "盘子": [null, "zi"],
  "瓶子": [null, "zi"],
  "杯子": [null, "zi"],
  "绳子": [null, "zi"],
  "刀子": [null, "zi"],
  "房子": [null, "zi"],
  "院子": [null, "zi"],
  "镜子": [null, "zi"],
  "狮子": [null, "zi"],
  "兔子": [null, "zi"],

  // ── Kinship reduplications (second syllable neutral) ─────────────────────
  "妈妈": [null, "ma"],
  "爸爸": [null, "ba"],
  "哥哥": [null, "ge"],
  "弟弟": [null, "di"],
  "姐姐": [null, "jie"],
  "妹妹": [null, "mei"],
  "爷爷": [null, "ye"],
  "奶奶": [null, "nai"],
  "叔叔": [null, "shu"],
  "舅舅": [null, "jiu"],
  "姑姑": [null, "gu"],
  "宝宝": [null, "bao"],
  "娃娃": [null, "wa"],

  // ── Verb reduplications (second syllable neutral) ─────────────────────────
  "看看": [null, "kan"],
  "想想": [null, "xiang"],
  "说说": [null, "shuo"],
  "试试": [null, "shi"],
  "走走": [null, "zou"],
  "听听": [null, "ting"],
  "坐坐": [null, "zuo"],
  "等等": [null, "deng"],
  "聊聊": [null, "liao"],
  "玩玩": [null, "wan"],
  "问问": [null, "wen"],
  "找找": [null, "zhao"],
  "学学": [null, "xue"],
  "练练": [null, "lian"],
  "读读": [null, "du"],
};

/**
 * Apply neutral tone overrides to a pinyin array for a given token.
 * Used in `toToneChars` (phrase bank, one token at a time).
 *
 * @param token     The Chinese word/token string (no spaces)
 * @param pinyinArr The pinyin array from pinyin-pro (same length as chars in token)
 * @returns         A new array with neutral overrides applied where specified
 */
export function applyNeutralToneOverrides(
  token: string,
  pinyinArr: string[],
): string[] {
  const override = NEUTRAL_TONE_WORDS[token];
  if (!override) return pinyinArr;
  return pinyinArr.map((py, i) => (override[i] !== null && override[i] !== undefined ? override[i]! : py));
}

/**
 * Scan a string of Chinese-only characters and return a Map of
 * character-index → override pinyin for characters that should be neutral tone.
 * Used in `getCharPinyin` (full user sentence, post-processing pass).
 *
 * @param chineseOnlyText  Concatenated Chinese characters from the sentence (no spaces/punctuation)
 * @returns                Map<chineseCharIndex, overridePinyin>
 */
export function getNeutralPatches(chineseOnlyText: string): Map<number, string> {
  const patches = new Map<number, string>();
  for (const [word, overrides] of Object.entries(NEUTRAL_TONE_WORDS)) {
    let pos = chineseOnlyText.indexOf(word);
    while (pos !== -1) {
      for (let i = 0; i < word.length; i++) {
        const ov = overrides[i];
        if (ov !== null && ov !== undefined) {
          patches.set(pos + i, ov);
        }
      }
      pos = chineseOnlyText.indexOf(word, pos + 1);
    }
  }
  return patches;
}
