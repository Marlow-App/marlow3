import type { ToneChar } from "@/data/phrases";

export interface SandhiChar {
  char: string;
  tone: 1 | 2 | 3 | 4 | 0;
  pinyin: string;
  originalTone: 1 | 2 | 3 | 4 | 0;
  originalPinyin: string;
  changed: boolean;
}

const TONE_MARKS: Record<number, Record<string, string>> = {
  0: { a: "a", e: "e", i: "i", o: "o", u: "u", ü: "ü" },
  1: { a: "ā", e: "ē", i: "ī", o: "ō", u: "ū", ü: "ǖ" },
  2: { a: "á", e: "é", i: "í", o: "ó", u: "ú", ü: "ǘ" },
  3: { a: "ǎ", e: "ě", i: "ǐ", o: "ǒ", u: "ǔ", ü: "ǚ" },
  4: { a: "à", e: "è", i: "ì", o: "ò", u: "ù", ü: "ǜ" },
};

const ALL_MARKED: Record<string, string> = {};
for (const tone of [0, 1, 2, 3, 4]) {
  for (const [, marked] of Object.entries(TONE_MARKS[tone])) {
    ALL_MARKED[marked] = marked;
  }
}

function stripToneMark(ch: string): { base: string; vowel: string } | null {
  for (const tone of [1, 2, 3, 4]) {
    for (const [base, marked] of Object.entries(TONE_MARKS[tone])) {
      if (ch === marked) return { base, vowel: base };
    }
  }
  return null;
}

export function changePinyinTone(py: string, newTone: 0 | 1 | 2 | 3 | 4): string {
  if (!py) return py;
  const chars = Array.from(py);
  for (let i = 0; i < chars.length; i++) {
    const stripped = stripToneMark(chars[i]);
    if (stripped) {
      chars[i] = TONE_MARKS[newTone][stripped.vowel] || stripped.vowel;
      return chars.join("");
    }
    if ("aeiouü".includes(chars[i]) && newTone > 0) {
      const remaining = py.slice(i);
      const vowelIdx = findToneVowelIndex(remaining);
      if (vowelIdx >= 0) {
        const absIdx = i + vowelIdx;
        const base = chars[absIdx];
        if (TONE_MARKS[newTone][base]) {
          chars[absIdx] = TONE_MARKS[newTone][base];
          return chars.join("");
        }
      }
    }
  }
  return py;
}

function findToneVowelIndex(s: string): number {
  for (let i = 0; i < s.length; i++) {
    if (s[i] === "a" || s[i] === "e") return i;
  }
  const ouIdx = s.indexOf("ou");
  if (ouIdx >= 0) return ouIdx;
  for (let i = s.length - 1; i >= 0; i--) {
    if ("iouü".includes(s[i])) return i;
  }
  return -1;
}

const COMMON_WORDS = new Set([
  "你好","高兴","认识","北京","学习","中文","请问","洗手间","哪里",
  "今天","天气","谢谢","帮助","美国","英语","多少","明白","喜欢",
  "中国","老师","明天","对不起","什么","上海","地铁","手机","吃饭",
  "觉得","意思","漂亮","每天","早上","跑步","普通话","可以","试试",
  "现在","名字","好看","知道","需要","翻译","地方","还是","咖啡",
  "爱好","读书","担心","问题","没问题","春节","快乐","一起","生日",
  "朋友","昨天","电影","工作","小心","颜色","公园","散步","打算",
  "明年","便宜","微信","肚子","周末","夏天","已经","路上",
  "老虎","水果","手表","可能","以后","以前","有点","一点",
  "马上","起来","下去","出来","回来","过来","开始","准备",
  "睡觉","起床","洗澡","吃饭","上班","下班","回家","出去",
  "进来","过去","上来","下来","告诉","所以","但是","因为",
  "如果","虽然","而且","或者","然后","这里","那里","大家",
  "自己","别人","怎么","为什么","这个","那个","哪个","几个",
  "一些","有些","很多","非常","特别","真的","当然","一定",
  "可能","应该","需要","愿意","希望","觉得","认为","了解",
  "发现","感觉","相信","同意","决定","参加","旅游","考试",
  "毕业","结婚","离开","到达","回去","出发","休息","运动",
  "游泳","唱歌","跳舞","画画","听说","学会","看见","找到",
  "买到","吃完","做完","写完","说完","走路","开车","坐车",
  "飞机","火车","公共汽车","出租车","地铁站","医院","学校",
  "商店","超市","餐厅","银行","邮局","图书馆","博物馆",
  "机场","酒店","公司","办公室","教室","厨房","卧室","客厅",
  "洗手","打扫","收拾","整理","选择","比较","影响","解决",
  "表示","代表","包括","属于","产生","存在","提供","保护",
  "支持","反对","同意","满意","高兴","难过","生气","着急",
  "紧张","放心","小心","注意","了不起","差不多","来不及",
  "受不了","对不住","说不定","忍不住","怪不得","免不了",
  "舍不得","想不到","买不起","看不懂","听不懂","吃不了",
  "老鼠","语法","口语","考虑","讨论","管理","处理","表演",
  "展览","演讲","比赛","练习","复习","预习","提高","降低",
  "增加","减少","改变","发展","进步","成功","失败","努力",
  "坚持","放弃","麻烦","容易","困难","简单","复杂","重要",
  "必须","应当","不得不","不一定","没关系","有意思","没意思",
  "好吃","好看","好听","好玩","好用","难吃","难看","难听",
  "可爱","美丽","漂亮","帅气","温柔","善良","聪明","勇敢",
  "礼貌","热情","冷淡","诚实","骄傲","谦虚",
  "一下","一会","一半","一样","一共","一直","一般","一边",
  "不过","不但","不管","不论","不如","不必","不用","不行",
  "不错","不少","不够","不久","不止","不断","不然","不仅",
  "能不能","会不会","好不好","行不行","要不要","是不是",
  "有没有","对不对","可不可以",
]);

function segmentWords(chars: { char: string }[]): number[][] {
  const text = chars.map(c => c.char).join("");
  const segments: number[][] = [];
  let i = 0;
  while (i < chars.length) {
    let bestLen = 1;
    for (let len = Math.min(4, chars.length - i); len >= 2; len--) {
      const word = text.slice(i, i + len);
      if (COMMON_WORDS.has(word)) {
        bestLen = len;
        break;
      }
    }
    const seg: number[] = [];
    for (let j = i; j < i + bestLen; j++) seg.push(j);
    segments.push(seg);
    i += bestLen;
  }
  return segments;
}

const YI_ORDINAL_CHARS = new Set(["号", "月", "年", "日", "楼", "层", "次", "名", "等", "班", "组", "排", "册", "集", "季", "期", "版", "届"]);

const NEUTRAL_UNDERLYING_TONES: Record<string, 1 | 2 | 3 | 4> = {
  "个": 4, "了": 3, "的": 4, "得": 2, "地": 4,
  "着": 2, "过": 4, "们": 2, "子": 3, "头": 2, "上": 4,
  "下": 4, "里": 3, "面": 4, "边": 1, "些": 1,
  "吗": 3, "呢": 2, "吧": 4, "啊": 1,
};

function getEffectiveTone(char: string, storedTone: 0 | 1 | 2 | 3 | 4): 0 | 1 | 2 | 3 | 4 {
  if (storedTone !== 0) return storedTone;
  const underlying = NEUTRAL_UNDERLYING_TONES[char];
  return underlying !== undefined ? underlying : 0;
}

export function applyToneSandhi(chars: ToneChar[]): SandhiChar[] {
  const result: SandhiChar[] = chars.map(c => ({
    char: c.char,
    tone: c.tone,
    pinyin: c.pinyin,
    originalTone: c.tone,
    originalPinyin: c.pinyin,
    changed: false,
  }));

  const segments = segmentWords(chars);

  for (const seg of segments) {
    const tones = seg.map(i => result[i].tone);
    if (tones.length === 2 && tones[0] === 3 && tones[1] === 3) {
      const idx = seg[0];
      result[idx].tone = 2;
      result[idx].pinyin = changePinyinTone(result[idx].originalPinyin, 2);
      result[idx].changed = true;
    } else if (tones.length === 3 && tones.every(t => t === 3)) {
      const idx0 = seg[0];
      const idx1 = seg[1];
      result[idx0].tone = 2;
      result[idx0].pinyin = changePinyinTone(result[idx0].originalPinyin, 2);
      result[idx0].changed = true;
      result[idx1].tone = 2;
      result[idx1].pinyin = changePinyinTone(result[idx1].originalPinyin, 2);
      result[idx1].changed = true;
    } else if (tones.length >= 4) {
      for (let k = 0; k < tones.length - 1; k++) {
        if (result[seg[k]].tone === 3 && result[seg[k + 1]].tone === 3) {
          result[seg[k]].tone = 2;
          result[seg[k]].pinyin = changePinyinTone(result[seg[k]].originalPinyin, 2);
          result[seg[k]].changed = true;
        }
      }
    }
  }

  for (let s = 0; s < segments.length - 1; s++) {
    const lastIdx = segments[s][segments[s].length - 1];
    const nextFirstIdx = segments[s + 1][0];
    if (result[lastIdx].tone === 3 && result[nextFirstIdx].tone === 3) {
      result[lastIdx].tone = 2;
      result[lastIdx].pinyin = changePinyinTone(result[lastIdx].originalPinyin, 2);
      result[lastIdx].changed = true;
    }
  }

  for (let i = 0; i < result.length; i++) {
    if (result[i].char !== "不") continue;
    if (i + 1 < result.length) {
      const nextEffective = getEffectiveTone(result[i + 1].char, result[i + 1].tone as 0 | 1 | 2 | 3 | 4);
      if (nextEffective === 4) {
        result[i].tone = 2;
        result[i].pinyin = changePinyinTone("bù", 2);
        result[i].changed = true;
      }
    }
  }

  for (let i = 0; i < result.length; i++) {
    if (result[i].char !== "一") continue;
    if (i + 1 < result.length && YI_ORDINAL_CHARS.has(result[i + 1].char)) {
      continue;
    }
    if (i + 1 < result.length) {
      const nextEffective = getEffectiveTone(result[i + 1].char, result[i + 1].tone as 0 | 1 | 2 | 3 | 4);
      if (nextEffective === 4) {
        result[i].tone = 2;
        result[i].pinyin = changePinyinTone("yī", 2);
        result[i].changed = true;
      } else if (nextEffective === 1 || nextEffective === 2 || nextEffective === 3) {
        result[i].tone = 4;
        result[i].pinyin = changePinyinTone("yī", 4);
        result[i].changed = true;
      }
    }
  }

  return result;
}

export function hasSandhiChanges(chars: ToneChar[]): boolean {
  return applyToneSandhi(chars).some(c => c.changed);
}

export function pinyinCharsToToneChars(pinyinChars: { char: string; py: string; tone: number }[]): ToneChar[] {
  return pinyinChars.map(p => ({
    char: p.char,
    tone: (p.tone >= 0 && p.tone <= 4 ? p.tone : 0) as 0 | 1 | 2 | 3 | 4,
    pinyin: p.py,
  }));
}
