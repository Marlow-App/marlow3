import { pinyin } from "pinyin-pro";

export interface ToneChar {
  char: string;
  tone: 1 | 2 | 3 | 4 | 0;
  pinyin: string;
  wordStart?: boolean;
}

export type PhraseLevel = "Absolute Beginner" | "Beginner" | "Intermediate" | "Difficult";

export interface Phrase {
  characters: ToneChar[];
  english: string;
  level: PhraseLevel;
}

interface CompactPhrase {
  words: string;
  english: string;
  level: PhraseLevel;
}

const PUNCTUATION = new Set(["，", "。", "！", "？", "、", "；", "：", "…", "—"]);

function extractTone(py: string): 1 | 2 | 3 | 4 | 0 {
  if (/[āēīōūǖ]/.test(py)) return 1;
  if (/[áéíóúǘ]/.test(py)) return 2;
  if (/[ǎěǐǒǔǚ]/.test(py)) return 3;
  if (/[àèìòùǜ]/.test(py)) return 4;
  return 0;
}

export function toToneChars(words: string): ToneChar[] {
  const result: ToneChar[] = [];
  const tokens = words.split(" ");
  for (const token of tokens) {
    if (!token) continue;
    if (PUNCTUATION.has(token)) {
      result.push({ char: token, tone: 0, pinyin: "" });
      continue;
    }
    const chars = Array.from(token);
    const pinyinList = pinyin(token, { toneType: "symbol", type: "array" });
    for (let i = 0; i < chars.length; i++) {
      const char = chars[i];
      let py = (pinyinList[i] as string | undefined) ?? "";
      let tone = extractTone(py);
      if (char === "一") { tone = 1; py = "yī"; }
      else if (char === "不") { tone = 4; py = "bù"; }
      const tc: ToneChar = { char, tone, pinyin: py };
      if (i > 0) tc.wordStart = false;
      result.push(tc);
    }
  }
  return result;
}

const COMPACT_PHRASES: CompactPhrase[] = [
  // ── ABSOLUTE BEGINNER ─────────────────────────────────────────────────────
  { words: "你好", english: "Hello.", level: "Absolute Beginner" },
  { words: "你好吗", english: "How are you?", level: "Absolute Beginner" },
  { words: "我很好", english: "I'm doing well.", level: "Absolute Beginner" },
  { words: "还不错", english: "Not bad.", level: "Absolute Beginner" },
  { words: "谢谢", english: "Thank you.", level: "Absolute Beginner" },
  { words: "不客气", english: "You're welcome.", level: "Absolute Beginner" },
  { words: "对不起", english: "Sorry.", level: "Absolute Beginner" },
  { words: "没关系", english: "It's okay.", level: "Absolute Beginner" },
  { words: "再见", english: "Goodbye.", level: "Absolute Beginner" },
  { words: "明天见", english: "See you tomorrow.", level: "Absolute Beginner" },
  { words: "好久不见", english: "Long time no see.", level: "Absolute Beginner" },
  { words: "早上好", english: "Good morning.", level: "Absolute Beginner" },
  { words: "晚上好", english: "Good evening.", level: "Absolute Beginner" },
  { words: "晚安", english: "Good night.", level: "Absolute Beginner" },
  { words: "你叫什么名字", english: "What is your name?", level: "Absolute Beginner" },
  { words: "我叫 王明", english: "My name is Wang Ming.", level: "Absolute Beginner" },
  { words: "很高兴 认识你", english: "Nice to meet you.", level: "Absolute Beginner" },
  { words: "我是 美国人", english: "I am American.", level: "Absolute Beginner" },
  { words: "你从哪里来", english: "Where are you from?", level: "Absolute Beginner" },
  { words: "我从 英国 来", english: "I'm from England.", level: "Absolute Beginner" },
  { words: "他是 我的 老师", english: "He is my teacher.", level: "Absolute Beginner" },
  { words: "她是 我的 朋友", english: "She is my friend.", level: "Absolute Beginner" },
  { words: "我们是 同学", english: "We are classmates.", level: "Absolute Beginner" },
  { words: "你几岁了", english: "How old are you?", level: "Absolute Beginner" },
  { words: "我 二十岁", english: "I am twenty years old.", level: "Absolute Beginner" },
  { words: "你吃饭了吗", english: "Have you eaten?", level: "Absolute Beginner" },
  { words: "我 肚子 饿了", english: "I'm hungry.", level: "Absolute Beginner" },
  { words: "我渴了", english: "I'm thirsty.", level: "Absolute Beginner" },
  { words: "我累了", english: "I'm tired.", level: "Absolute Beginner" },
  { words: "太好了", english: "That's great!", level: "Absolute Beginner" },
  { words: "生日快乐", english: "Happy birthday!", level: "Absolute Beginner" },
  { words: "新年快乐", english: "Happy New Year!", level: "Absolute Beginner" },
  { words: "她很漂亮", english: "She is very beautiful.", level: "Absolute Beginner" },
  { words: "这是什么", english: "What is this?", level: "Absolute Beginner" },
  { words: "那是什么", english: "What is that?", level: "Absolute Beginner" },
  { words: "这个 多少钱", english: "How much is this?", level: "Absolute Beginner" },
  { words: "太贵了", english: "Too expensive.", level: "Absolute Beginner" },
  { words: "很便宜", english: "Very cheap.", level: "Absolute Beginner" },
  { words: "我不知道", english: "I don't know.", level: "Absolute Beginner" },
  { words: "我 听不懂", english: "I don't understand.", level: "Absolute Beginner" },
  { words: "请 再说 一遍", english: "Please say that again.", level: "Absolute Beginner" },
  { words: "你说什么", english: "What did you say?", level: "Absolute Beginner" },
  { words: "太热了", english: "It's too hot.", level: "Absolute Beginner" },
  { words: "太冷了", english: "It's too cold.", level: "Absolute Beginner" },
  { words: "很好吃", english: "Very delicious.", level: "Absolute Beginner" },
  { words: "太辣了", english: "It's too spicy.", level: "Absolute Beginner" },
  { words: "不好意思", english: "Excuse me.", level: "Absolute Beginner" },
  { words: "请进", english: "Please come in.", level: "Absolute Beginner" },
  { words: "请坐", english: "Please sit down.", level: "Absolute Beginner" },
  { words: "这是我的", english: "This is mine.", level: "Absolute Beginner" },
  { words: "那是你的", english: "That is yours.", level: "Absolute Beginner" },
  { words: "我 想买 这个", english: "I want to buy this.", level: "Absolute Beginner" },
  { words: "有没有", english: "Do you have it?", level: "Absolute Beginner" },
  { words: "没有", english: "There isn't any.", level: "Absolute Beginner" },
  { words: "我有 一只 猫", english: "I have a cat.", level: "Absolute Beginner" },
  { words: "我有 一条 狗", english: "I have a dog.", level: "Absolute Beginner" },
  { words: "我有 一个 妹妹", english: "I have a younger sister.", level: "Absolute Beginner" },
  { words: "我是 独生子", english: "I'm an only child.", level: "Absolute Beginner" },
  { words: "我很 开心", english: "I'm very happy.", level: "Absolute Beginner" },
  { words: "我很 伤心", english: "I'm very sad.", level: "Absolute Beginner" },
  { words: "我很忙", english: "I'm very busy.", level: "Absolute Beginner" },
  { words: "我在家", english: "I'm at home.", level: "Absolute Beginner" },
  { words: "我 回家了", english: "I'm going home.", level: "Absolute Beginner" },
  { words: "你去哪里", english: "Where are you going?", level: "Absolute Beginner" },
  { words: "我去 学校", english: "I'm going to school.", level: "Absolute Beginner" },
  { words: "我去 超市", english: "I'm going to the supermarket.", level: "Absolute Beginner" },
  { words: "加油", english: "Keep it up!", level: "Absolute Beginner" },
  { words: "好的", english: "Okay.", level: "Absolute Beginner" },
  { words: "是的", english: "Yes, that's right.", level: "Absolute Beginner" },
  { words: "不是", english: "No, that's not right.", level: "Absolute Beginner" },
  { words: "我喜欢你", english: "I like you.", level: "Absolute Beginner" },
  { words: "我爱你", english: "I love you.", level: "Absolute Beginner" },
  { words: "我不喜欢", english: "I don't like it.", level: "Absolute Beginner" },
  { words: "很好", english: "Very good.", level: "Absolute Beginner" },
  { words: "现在 几点了", english: "What time is it now?", level: "Absolute Beginner" },
  { words: "今天 星期几", english: "What day is today?", level: "Absolute Beginner" },
  { words: "今天几号", english: "What's today's date?", level: "Absolute Beginner" },
  { words: "今天很热", english: "It's hot today.", level: "Absolute Beginner" },
  { words: "今天很冷", english: "It's cold today.", level: "Absolute Beginner" },
  { words: "我 生病了", english: "I'm sick.", level: "Absolute Beginner" },
  { words: "好好休息", english: "Rest well.", level: "Absolute Beginner" },
  { words: "我喜欢 音乐", english: "I like music.", level: "Absolute Beginner" },
  { words: "他很高", english: "He is very tall.", level: "Absolute Beginner" },
  { words: "我 饱了", english: "I'm full.", level: "Absolute Beginner" },
  { words: "你是 哪里人", english: "Where are you from?", level: "Absolute Beginner" },
  { words: "我是 中国人", english: "I'm Chinese.", level: "Absolute Beginner" },
  { words: "我是 学生", english: "I'm a student.", level: "Absolute Beginner" },
  { words: "他是 医生", english: "He is a doctor.", level: "Absolute Beginner" },
  { words: "我住在 北京", english: "I live in Beijing.", level: "Absolute Beginner" },
  { words: "我去 图书馆", english: "I'm going to the library.", level: "Absolute Beginner" },
  { words: "你喜欢什么", english: "What do you like?", level: "Absolute Beginner" },
  { words: "我不太好", english: "I'm not so well.", level: "Absolute Beginner" },
  { words: "你也是", english: "Same to you.", level: "Absolute Beginner" },
  { words: "我有两个 弟弟", english: "I have two younger brothers.", level: "Absolute Beginner" },
  { words: "她很矮", english: "She is very short.", level: "Absolute Beginner" },
  { words: "多少钱", english: "How much?", level: "Absolute Beginner" },
  { words: "我去 工作", english: "I'm going to work.", level: "Absolute Beginner" },
  { words: "我在 学校", english: "I'm at school.", level: "Absolute Beginner" },
  { words: "我很 健康", english: "I'm very healthy.", level: "Absolute Beginner" },
  { words: "谢谢 你的 帮助", english: "Thank you for your help.", level: "Absolute Beginner" },

  // ── BEGINNER ──────────────────────────────────────────────────────────────
  { words: "你好 ， 很高兴 认识你", english: "Hello, nice to meet you.", level: "Beginner" },
  { words: "请问 ， 洗手间 在哪里", english: "Excuse me, where is the restroom?", level: "Beginner" },
  { words: "今天 天气 很好", english: "The weather is very nice today.", level: "Beginner" },
  { words: "我想喝 一杯 咖啡", english: "I want to drink a cup of coffee.", level: "Beginner" },
  { words: "你 会说 英语 吗", english: "Can you speak English?", level: "Beginner" },
  { words: "我不太 明白", english: "I don't quite understand.", level: "Beginner" },
  { words: "你在做 什么", english: "What are you doing?", level: "Beginner" },
  { words: "我住在 上海", english: "I live in Shanghai.", level: "Beginner" },
  { words: "我可以 试试 吗", english: "Can I try it?", level: "Beginner" },
  { words: "你 工作 忙吗", english: "Are you busy with work?", level: "Beginner" },
  { words: "外面 下雨了", english: "It's raining outside.", level: "Beginner" },
  { words: "我的 中文 不好", english: "My Chinese isn't good.", level: "Beginner" },
  { words: "慢慢说 ， 好吗", english: "Speak slowly, okay?", level: "Beginner" },
  { words: "请 给我 一杯水", english: "Please give me a glass of water.", level: "Beginner" },
  { words: "这本书 很好看", english: "This book is very good.", level: "Beginner" },
  { words: "我们 一起去 吧", english: "Let's go together.", level: "Beginner" },
  { words: "我有 一个 问题", english: "I have a question.", level: "Beginner" },
  { words: "我们是 好朋友", english: "We are good friends.", level: "Beginner" },
  { words: "我 喜欢吃 中国菜", english: "I like eating Chinese food.", level: "Beginner" },
  { words: "这个菜 有点辣", english: "This dish is a bit spicy.", level: "Beginner" },
  { words: "外面 下雪了", english: "It's snowing outside.", level: "Beginner" },
  { words: "我想 休息 一下", english: "I want to rest for a bit.", level: "Beginner" },
  { words: "这条路 很远", english: "This road is very far.", level: "Beginner" },
  { words: "我喜欢 喝茶", english: "I like drinking tea.", level: "Beginner" },
  { words: "你的 名字 怎么写", english: "How do you write your name?", level: "Beginner" },
  { words: "这里 很安静", english: "It's very quiet here.", level: "Beginner" },
  { words: "我不 太舒服", english: "I'm not feeling so well.", level: "Beginner" },
  { words: "我头疼", english: "I have a headache.", level: "Beginner" },
  { words: "我喝太多了", english: "I drank too much.", level: "Beginner" },
  { words: "他跑得很快", english: "He runs very fast.", level: "Beginner" },
  { words: "这本书 多少钱", english: "How much is this book?", level: "Beginner" },
  { words: "你 住在 哪里", english: "Where do you live?", level: "Beginner" },
  { words: "我 喜欢看 电影", english: "I like watching movies.", level: "Beginner" },
  { words: "我 喜欢 听音乐", english: "I like listening to music.", level: "Beginner" },
  { words: "你 喜欢 什么 运动", english: "What sport do you like?", level: "Beginner" },
  { words: "我 喜欢 打篮球", english: "I like playing basketball.", level: "Beginner" },
  { words: "我 喜欢 踢足球", english: "I like playing football.", level: "Beginner" },
  { words: "你 有没有 兄弟姐妹", english: "Do you have siblings?", level: "Beginner" },
  { words: "他 是我 哥哥", english: "He is my older brother.", level: "Beginner" },
  { words: "我 要去 买东西", english: "I need to go shopping.", level: "Beginner" },
  { words: "你 今天 有空 吗", english: "Are you free today?", level: "Beginner" },
  { words: "我们 一起 吃饭 吧", english: "Let's eat together.", level: "Beginner" },
  { words: "他的 工作 很忙", english: "His work is very busy.", level: "Beginner" },
  { words: "我 坐地铁 上班", english: "I take the subway to work.", level: "Beginner" },
  { words: "你 喜欢 旅游 吗", english: "Do you like travelling?", level: "Beginner" },
  { words: "这里 有 地铁站 吗", english: "Is there a subway station here?", level: "Beginner" },
  { words: "我的 手机 没电了", english: "My phone is out of battery.", level: "Beginner" },
  { words: "我们 去 爬山 吧", english: "Let's go hiking.", level: "Beginner" },
  { words: "今天 是 我的 生日", english: "Today is my birthday.", level: "Beginner" },
  { words: "你 在哪里 工作", english: "Where do you work?", level: "Beginner" },
  { words: "我在 公司 工作", english: "I work at a company.", level: "Beginner" },
  { words: "你 学过 中文 吗", english: "Have you studied Chinese before?", level: "Beginner" },
  { words: "我 学中文 两年了", english: "I've been studying Chinese for two years.", level: "Beginner" },
  { words: "你 有 微信 吗", english: "Do you have WeChat?", level: "Beginner" },
  { words: "我 加你 微信 吧", english: "Let me add you on WeChat.", level: "Beginner" },
  { words: "我 不会 游泳", english: "I don't know how to swim.", level: "Beginner" },
  { words: "我 最近 很忙", english: "I've been very busy lately.", level: "Beginner" },
  { words: "你 喜欢 什么 音乐", english: "What kind of music do you like?", level: "Beginner" },
  { words: "我 喜欢 流行音乐", english: "I like pop music.", level: "Beginner" },
  { words: "他 是 我 同事", english: "He is my coworker.", level: "Beginner" },
  { words: "我 饿了 ， 吃什么好", english: "I'm hungry, what should we eat?", level: "Beginner" },
  { words: "这 附近 有 餐厅 吗", english: "Is there a restaurant nearby?", level: "Beginner" },
  { words: "我们 点 什么 菜", english: "What dishes should we order?", level: "Beginner" },
  { words: "买单", english: "Check, please.", level: "Beginner" },
  { words: "你 喝 什么", english: "What would you like to drink?", level: "Beginner" },
  { words: "我 要 一杯 水", english: "I'd like a glass of water.", level: "Beginner" },
  { words: "这里 能 刷卡 吗", english: "Can I pay by card here?", level: "Beginner" },
  { words: "我 要 打车", english: "I need to take a cab.", level: "Beginner" },
  { words: "请问 怎么走", english: "Excuse me, how do I get there?", level: "Beginner" },
  { words: "往 右边 走", english: "Turn right.", level: "Beginner" },
  { words: "往 左边 走", english: "Turn left.", level: "Beginner" },
  { words: "直走 就到了", english: "Just go straight, you'll be there.", level: "Beginner" },
  { words: "你 吃 早饭了 吗", english: "Did you eat breakfast?", level: "Beginner" },
  { words: "我 喜欢 吃 水果", english: "I like eating fruit.", level: "Beginner" },
  { words: "苹果 多少钱 一斤", english: "How much are apples per jin?", level: "Beginner" },
  { words: "你 最近 怎么样", english: "How have you been lately?", level: "Beginner" },
  { words: "还是 老样子", english: "Same as always.", level: "Beginner" },
  { words: "这 件 衣服 好看 吗", english: "Does this piece of clothing look good?", level: "Beginner" },
  { words: "这 件 太小了", english: "This one is too small.", level: "Beginner" },
  { words: "有 大 一点的 吗", english: "Do you have a bigger one?", level: "Beginner" },
  { words: "你 打算 干什么", english: "What are you planning to do?", level: "Beginner" },
  { words: "我 不确定", english: "I'm not sure.", level: "Beginner" },
  { words: "你 说得对", english: "You're right.", level: "Beginner" },
  { words: "我 同意", english: "I agree.", level: "Beginner" },
  { words: "我 不同意", english: "I disagree.", level: "Beginner" },
  { words: "真的 假的", english: "Really? No way.", level: "Beginner" },
  { words: "不可能", english: "Impossible.", level: "Beginner" },
  { words: "我 也是", english: "Me too.", level: "Beginner" },
  { words: "当然", english: "Of course.", level: "Beginner" },
  { words: "随便", english: "Whatever / Up to you.", level: "Beginner" },
  { words: "我不在乎", english: "I don't mind.", level: "Beginner" },
  { words: "小心", english: "Be careful.", level: "Beginner" },
  { words: "你 好好 照顾 自己", english: "Take good care of yourself.", level: "Beginner" },
  { words: "祝你 好运", english: "Good luck to you.", level: "Beginner" },
  { words: "请多关照", english: "Please take care of me / I'm in your care.", level: "Beginner" },
  { words: "你 有没有 推荐 的 餐厅", english: "Do you have a restaurant recommendation?", level: "Beginner" },
  { words: "我 最近 在 学 做饭", english: "I've been learning to cook lately.", level: "Beginner" },
  { words: "你 会 骑 自行车 吗", english: "Can you ride a bicycle?", level: "Beginner" },
  { words: "这个 价格 太高了", english: "This price is too high.", level: "Beginner" },
  { words: "这里 有 地铁站 吗", english: "Is there a subway station here?", level: "Beginner" },

  // ── INTERMEDIATE ──────────────────────────────────────────────────────────
  { words: "我 要去 北京 学习 中文", english: "I want to go to Beijing to study Chinese.", level: "Intermediate" },
  { words: "你 能再说 一遍 吗", english: "Can you say that again?", level: "Intermediate" },
  { words: "对不起 ， 我 来晚了", english: "Sorry, I'm late.", level: "Intermediate" },
  { words: "我觉得 很有意思", english: "I think it's very interesting.", level: "Intermediate" },
  { words: "我 每天 早上 跑步", english: "I go jogging every morning.", level: "Intermediate" },
  { words: "中文 很难 学", english: "Chinese is very hard to learn.", level: "Intermediate" },
  { words: "我 已经 吃过了", english: "I've already eaten.", level: "Intermediate" },
  { words: "周末 你 有空 吗", english: "Are you free this weekend?", level: "Intermediate" },
  { words: "我 最喜欢 夏天", english: "I like summer the most.", level: "Intermediate" },
  { words: "我 需要 一个 翻译", english: "I need a translator.", level: "Intermediate" },
  { words: "这个 地方 真美", english: "This place is really beautiful.", level: "Intermediate" },
  { words: "你 去过 长城 吗", english: "Have you been to the Great Wall?", level: "Intermediate" },
  { words: "这条路 怎么走", english: "How do I get there?", level: "Intermediate" },
  { words: "你 家有 几口人", english: "How many people are in your family?", level: "Intermediate" },
  { words: "你 喜欢 什么 颜色", english: "What color do you like?", level: "Intermediate" },
  { words: "我的 爱好 是 读书", english: "My hobby is reading.", level: "Intermediate" },
  { words: "这里 有没有 地铁站", english: "Is there a subway station here?", level: "Intermediate" },
  { words: "我的 手机 没电了", english: "My phone is out of battery.", level: "Intermediate" },
  { words: "我在 学习 做 中国菜", english: "I'm learning to cook Chinese food.", level: "Intermediate" },
  { words: "我 打算 明年 去 中国", english: "I plan to go to China next year.", level: "Intermediate" },
  { words: "能不能 便宜 一点", english: "Can you make it a bit cheaper?", level: "Intermediate" },
  { words: "他们 在 公园里 散步", english: "They are taking a walk in the park.", level: "Intermediate" },
  { words: "你的 普通话 说得 很好", english: "Your Mandarin is very good.", level: "Intermediate" },
  { words: "我 昨天 看了 一部 电影", english: "I watched a movie yesterday.", level: "Intermediate" },
  { words: "我 学了 两年 中文", english: "I've studied Chinese for two years.", level: "Intermediate" },
  { words: "路上 小心", english: "Be careful on the road.", level: "Intermediate" },
  { words: "吃得 太饱了", english: "I ate too much.", level: "Intermediate" },
  { words: "你 想喝茶 还是 咖啡", english: "Would you like tea or coffee?", level: "Intermediate" },
  { words: "别 担心 ， 没问题", english: "Don't worry, no problem.", level: "Intermediate" },
  { words: "春节 快乐", english: "Happy Spring Festival!", level: "Intermediate" },
  { words: "你 有 微信 吗", english: "Do you have WeChat?", level: "Intermediate" },
  { words: "我 打算 周末 去 爬山", english: "I plan to go hiking this weekend.", level: "Intermediate" },
  { words: "这家 餐厅 的菜 很好吃", english: "The food at this restaurant is delicious.", level: "Intermediate" },
  { words: "你 对 中国 文化 感兴趣 吗", english: "Are you interested in Chinese culture?", level: "Intermediate" },
  { words: "我 刚刚 到 北京", english: "I just arrived in Beijing.", level: "Intermediate" },
  { words: "他 今年 三十岁", english: "He is thirty years old this year.", level: "Intermediate" },
  { words: "我 上个月 去了 上海", english: "I went to Shanghai last month.", level: "Intermediate" },
  { words: "你 下次 来 中国 是 什么时候", english: "When are you next coming to China?", level: "Intermediate" },
  { words: "我 不擅长 唱歌", english: "I'm not good at singing.", level: "Intermediate" },
  { words: "你 会 弹 钢琴 吗", english: "Can you play the piano?", level: "Intermediate" },
  { words: "我 小时候 在 农村 长大", english: "I grew up in the countryside.", level: "Intermediate" },
  { words: "这 部 电影 非常 精彩", english: "This movie is really excellent.", level: "Intermediate" },
  { words: "你 最近 睡眠 怎么样", english: "How is your sleep lately?", level: "Intermediate" },
  { words: "我 昨晚 没睡好", english: "I didn't sleep well last night.", level: "Intermediate" },
  { words: "天气 预报说 明天 会 下雨", english: "The forecast says it will rain tomorrow.", level: "Intermediate" },
  { words: "你 什么时候 来 找我", english: "When will you come and visit me?", level: "Intermediate" },
  { words: "我 明天 下午 有空", english: "I'm free tomorrow afternoon.", level: "Intermediate" },
  { words: "这个 超市 东西 很全", english: "This supermarket has everything.", level: "Intermediate" },
  { words: "他们 公司 福利 不错", english: "Their company has good benefits.", level: "Intermediate" },
  { words: "我 最近 在 学 画画", english: "I've been learning to paint lately.", level: "Intermediate" },
  { words: "你 最喜欢 哪个 城市", english: "Which city do you like the most?", level: "Intermediate" },
  { words: "我 觉得 上海 和 北京 各有 特色", english: "I think Shanghai and Beijing each have their own charm.", level: "Intermediate" },
  { words: "我 不太 喜欢 辣的 食物", english: "I don't really like spicy food.", level: "Intermediate" },
  { words: "这道菜 有点 咸", english: "This dish is a bit salty.", level: "Intermediate" },
  { words: "我们 应该 多 运动", english: "We should exercise more.", level: "Intermediate" },
  { words: "我 每天 走路 上班", english: "I walk to work every day.", level: "Intermediate" },
  { words: "你 学 中文 多久了", english: "How long have you been studying Chinese?", level: "Intermediate" },
  { words: "你 中文 进步 很快", english: "Your Chinese is improving quickly.", level: "Intermediate" },
  { words: "我 在 上 汉语 课", english: "I'm taking Mandarin classes.", level: "Intermediate" },
  { words: "这个 词 怎么 读", english: "How do you read this word?", level: "Intermediate" },
  { words: "这个 字 是什么 意思", english: "What does this character mean?", level: "Intermediate" },
  { words: "我 想 请你 帮个忙", english: "I'd like to ask you a favor.", level: "Intermediate" },
  { words: "你 能 帮我 看看 吗", english: "Can you help me take a look?", level: "Intermediate" },
  { words: "这个 任务 很有 挑战性", english: "This task is very challenging.", level: "Intermediate" },
  { words: "我们 下周 见面 吧", english: "Let's meet up next week.", level: "Intermediate" },
  { words: "你 对这里 熟悉 吗", english: "Are you familiar with this area?", level: "Intermediate" },
  { words: "我 第一次 来 这里", english: "This is my first time here.", level: "Intermediate" },
  { words: "这里 的 风景 真 漂亮", english: "The scenery here is truly beautiful.", level: "Intermediate" },
  { words: "你 有 什么 建议 吗", english: "Do you have any suggestions?", level: "Intermediate" },
  { words: "这个 方法 很 有效", english: "This method is very effective.", level: "Intermediate" },
  { words: "我 同意 你的 看法", english: "I agree with your opinion.", level: "Intermediate" },
  { words: "我们 得 想个 办法", english: "We need to think of a solution.", level: "Intermediate" },
  { words: "情况 比 我想象的 复杂", english: "The situation is more complicated than I thought.", level: "Intermediate" },
  { words: "你 最近 压力 大 吗", english: "Have you been under a lot of pressure lately?", level: "Intermediate" },
  { words: "压力 越来越 大", english: "The pressure is getting greater and greater.", level: "Intermediate" },
  { words: "我 需要 好好 放松 一下", english: "I need to relax properly.", level: "Intermediate" },
  { words: "这个 假期 你 打算 怎么过", english: "How do you plan to spend this holiday?", level: "Intermediate" },
  { words: "我 打算 去 旅游", english: "I plan to go travelling.", level: "Intermediate" },
  { words: "你 去过 日本 吗", english: "Have you been to Japan?", level: "Intermediate" },
  { words: "我 去年 去过 泰国", english: "I went to Thailand last year.", level: "Intermediate" },
  { words: "这 趟 旅行 让我 很 开心", english: "This trip made me very happy.", level: "Intermediate" },
  { words: "你 有没有 推荐 的 景点", english: "Do you have any recommended attractions?", level: "Intermediate" },
  { words: "这个 地方 很值得 一来", english: "This place is well worth a visit.", level: "Intermediate" },
  { words: "我 不小心 把 手机 弄丢了", english: "I accidentally lost my phone.", level: "Intermediate" },
  { words: "你 有没有 看到 我的 钱包", english: "Have you seen my wallet?", level: "Intermediate" },
  { words: "我们 聊了 很长 时间", english: "We talked for a very long time.", level: "Intermediate" },
  { words: "时间 过得 真快", english: "Time flies by so fast.", level: "Intermediate" },
  { words: "我 还有 工作 要做", english: "I still have work to do.", level: "Intermediate" },
  { words: "再聊 一会儿 吧", english: "Let's talk for a bit more.", level: "Intermediate" },
  { words: "我 要 先走了", english: "I need to leave now.", level: "Intermediate" },
  { words: "下次 见", english: "See you next time.", level: "Intermediate" },
  { words: "保持 联系 哦", english: "Stay in touch.", level: "Intermediate" },
  { words: "有空 来找我", english: "Come visit me when you're free.", level: "Intermediate" },
  { words: "我 很想念 你", english: "I miss you very much.", level: "Intermediate" },
  { words: "我们 好久 没见面了", english: "We haven't seen each other for a long time.", level: "Intermediate" },
  { words: "你 最近 过得 怎么样", english: "How have you been lately?", level: "Intermediate" },
  { words: "一切 都 很好", english: "Everything is going well.", level: "Intermediate" },
  { words: "他 已经 习惯了 中国 的 生活", english: "He has already gotten used to life in China.", level: "Intermediate" },
  { words: "学 外语 需要 很大的 耐心", english: "Learning a foreign language requires great patience.", level: "Intermediate" },
  { words: "我 有时候 会 想念 家乡 的 食物", english: "Sometimes I miss the food from my hometown.", level: "Intermediate" },

  // ── DIFFICULT ─────────────────────────────────────────────────────────────
  { words: "我想 请你 吃饭", english: "I'd like to treat you to a meal.", level: "Difficult" },
  { words: "你的 普通话 说得 非常 流利", english: "Your Mandarin is extremely fluent.", level: "Difficult" },
  { words: "别担心 ， 没问题", english: "Don't worry, no problem at all.", level: "Difficult" },
  { words: "你 想喝茶 还是 喝 咖啡", english: "Would you like tea or coffee?", level: "Difficult" },
  { words: "我 昨天 看了 一部 电影", english: "I watched a movie yesterday.", level: "Difficult" },
  { words: "吃得 太饱了", english: "I'm absolutely stuffed.", level: "Difficult" },
  { words: "路上 小心点儿", english: "Take care on the road.", level: "Difficult" },
  { words: "我 学了 两年 中文了", english: "I've been studying Chinese for two years now.", level: "Difficult" },
  { words: "他们 在 公园里 散步", english: "They are taking a stroll in the park.", level: "Difficult" },
  { words: "能不能 便宜 一点", english: "Can you make it a bit cheaper?", level: "Difficult" },
  { words: "这部 电影 让我 感动 极了", english: "This movie moved me deeply.", level: "Difficult" },
  { words: "你 有没有 考虑过 换工作", english: "Have you ever considered changing jobs?", level: "Difficult" },
  { words: "这个 问题 真的 很 复杂", english: "This problem is truly very complex.", level: "Difficult" },
  { words: "我们 应该 从 长计议", english: "We should take our time to plan carefully.", level: "Difficult" },
  { words: "这件事 你 怎么看", english: "What do you think about this matter?", level: "Difficult" },
  { words: "我 觉得 我们 需要 重新 考虑", english: "I think we need to reconsider.", level: "Difficult" },
  { words: "他 说话 很 直接", english: "He is very direct in his speech.", level: "Difficult" },
  { words: "这 件事 需要 慎重 处理", english: "This matter needs to be handled carefully.", level: "Difficult" },
  { words: "请 不要 打断 我", english: "Please don't interrupt me.", level: "Difficult" },
  { words: "我 对这件事 有 不同的 看法", english: "I have a different view on this matter.", level: "Difficult" },
  { words: "我们 应该 互相 尊重", english: "We should respect each other.", level: "Difficult" },
  { words: "这个 观点 很 有 道理", english: "This point of view makes a lot of sense.", level: "Difficult" },
  { words: "你 说得 有道理 ， 我 同意", english: "You make a good point, I agree.", level: "Difficult" },
  { words: "我们 应该 换个 角度 来看", english: "We should look at it from a different angle.", level: "Difficult" },
  { words: "解决 这个 问题 需要 时间", english: "Solving this problem takes time.", level: "Difficult" },
  { words: "我们 得 共同 努力", english: "We need to work together.", level: "Difficult" },
  { words: "这个 项目 非常 重要", english: "This project is very important.", level: "Difficult" },
  { words: "我们 必须 按时 完成", english: "We must complete it on time.", level: "Difficult" },
  { words: "你 觉得 这个 方案 可行 吗", english: "Do you think this plan is feasible?", level: "Difficult" },
  { words: "我 不太 确定 这 是否 可行", english: "I'm not quite sure if this is feasible.", level: "Difficult" },
  { words: "这 份 报告 写得 非常 详细", english: "This report is written in great detail.", level: "Difficult" },
  { words: "我 对 自己的 工作 很 满意", english: "I'm very satisfied with my work.", level: "Difficult" },
  { words: "他 承受了 很大的 压力", english: "He was under a great deal of pressure.", level: "Difficult" },
  { words: "我 需要 进一步 了解 情况", english: "I need to understand the situation further.", level: "Difficult" },
  { words: "这个 计划 还需要 完善", english: "This plan still needs to be refined.", level: "Difficult" },
  { words: "你 对 未来 有什么 打算", english: "What are your plans for the future?", level: "Difficult" },
  { words: "我 希望 能够 出国 深造", english: "I hope to be able to study abroad.", level: "Difficult" },
  { words: "学习 是 一辈子的 事", english: "Learning is a lifelong endeavour.", level: "Difficult" },
  { words: "读万卷书 不如 行万里路", english: "Reading ten thousand books is not as good as travelling ten thousand miles.", level: "Difficult" },
  { words: "失败 是 成功的 母亲", english: "Failure is the mother of success.", level: "Difficult" },
  { words: "活到老 学到老", english: "Live and learn — keep learning till old age.", level: "Difficult" },
  { words: "没有 付出 就没有 收获", english: "No pain, no gain.", level: "Difficult" },
  { words: "机会 是 留给 有准备的人", english: "Opportunity favours the prepared.", level: "Difficult" },
  { words: "时间 就是 金钱", english: "Time is money.", level: "Difficult" },
  { words: "细节 决定 成败", english: "Details determine success or failure.", level: "Difficult" },
  { words: "一步一个脚印", english: "Step by step, leave footprints as you go.", level: "Difficult" },
  { words: "不怕 慢 ， 只怕站", english: "Don't fear going slow; fear standing still.", level: "Difficult" },
  { words: "这次 会议 的 议程 是 什么", english: "What is the agenda for this meeting?", level: "Difficult" },
  { words: "请 问一下 ， 这个 合同 签了 吗", english: "May I ask, has this contract been signed?", level: "Difficult" },
  { words: "我们 已经 达成了 共识", english: "We have reached a consensus.", level: "Difficult" },
  { words: "这个 条款 需要 再 商量", english: "This clause needs further discussion.", level: "Difficult" },
  { words: "我 希望 合作 愉快", english: "I hope for a pleasant collaboration.", level: "Difficult" },
  { words: "请 允许 我 自我介绍 一下", english: "Please allow me to introduce myself.", level: "Difficult" },
  { words: "很荣幸 能够 参加 这次 活动", english: "It is an honour to participate in this event.", level: "Difficult" },
  { words: "感谢 大家 的 支持 和 帮助", english: "Thank you all for your support and help.", level: "Difficult" },
  { words: "请 多多 指教", english: "Please give me your guidance.", level: "Difficult" },
  { words: "我们 对 未来 充满 信心", english: "We are full of confidence in the future.", level: "Difficult" },
  { words: "这家 公司 发展 非常 迅速", english: "This company is developing very rapidly.", level: "Difficult" },
  { words: "市场 竞争 越来越 激烈", english: "Market competition is becoming increasingly fierce.", level: "Difficult" },
  { words: "我们 需要 不断 创新", english: "We need to keep innovating.", level: "Difficult" },
  { words: "环保 是 全社会的 责任", english: "Environmental protection is the responsibility of all society.", level: "Difficult" },
  { words: "节约 资源 从 我做起", english: "Saving resources starts with me.", level: "Difficult" },
  { words: "他 做事情 非常 认真 负责", english: "He is very serious and responsible in his work.", level: "Difficult" },
  { words: "这次 经历 让我 受益 匪浅", english: "This experience benefited me greatly.", level: "Difficult" },
  { words: "我们 需要 加强 沟通", english: "We need to strengthen communication.", level: "Difficult" },
  { words: "只要 努力 ， 一定 能 成功", english: "As long as you work hard, you will surely succeed.", level: "Difficult" },
  { words: "他 花了 很多 时间 研究 这个 问题", english: "He spent a lot of time researching this issue.", level: "Difficult" },
  { words: "我 认为 这个 决策 是 正确的", english: "I believe this decision is correct.", level: "Difficult" },
  { words: "我们 要 以 大局为重", english: "We must prioritize the bigger picture.", level: "Difficult" },
  { words: "这种 做法 值得 借鉴", english: "This approach is worth learning from.", level: "Difficult" },
  { words: "双方 都 做出了 让步", english: "Both sides made concessions.", level: "Difficult" },
  { words: "经过 努力 ， 终于 成功了", english: "After great effort, we finally succeeded.", level: "Difficult" },
  { words: "一分耕耘 一分收获", english: "You reap what you sow.", level: "Difficult" },
  { words: "他 越来越 有 经验了", english: "He is getting more and more experienced.", level: "Difficult" },
  { words: "我们 应该 善用 时间", english: "We should make good use of our time.", level: "Difficult" },
  { words: "这条 建议 非常 有 参考价值", english: "This suggestion is very valuable as a reference.", level: "Difficult" },
  { words: "你 能 说得 更 具体 一些 吗", english: "Could you be more specific?", level: "Difficult" },
  { words: "这个 事情 有点 出乎 意料", english: "This matter is somewhat unexpected.", level: "Difficult" },
  { words: "我们 应该 吸取 教训", english: "We should learn from the lesson.", level: "Difficult" },
  { words: "这 是 个 非常 宝贵的 机会", english: "This is a very precious opportunity.", level: "Difficult" },
  { words: "我们 的 目标 是 实现 共赢", english: "Our goal is to achieve a win-win outcome.", level: "Difficult" },
  { words: "保持 积极的 心态 很 重要", english: "Maintaining a positive attitude is very important.", level: "Difficult" },
  { words: "这 件事 已经 水落石出了", english: "This matter has finally come to light.", level: "Difficult" },
  { words: "我 愿意 承担 这个 责任", english: "I am willing to take on this responsibility.", level: "Difficult" },
  { words: "感谢 你们 的 信任", english: "Thank you for your trust.", level: "Difficult" },
  { words: "这件事 还有 很多 不确定因素", english: "There are still many uncertainties in this matter.", level: "Difficult" },
  { words: "我们 需要 更多的 数据 支持", english: "We need more data to support this.", level: "Difficult" },
  { words: "这次 合作 非常 顺利", english: "This collaboration went very smoothly.", level: "Difficult" },
  { words: "希望 我们 能 长期 合作", english: "I hope we can cooperate over the long term.", level: "Difficult" },
  { words: "请 保持 耐心", english: "Please be patient.", level: "Difficult" },
  { words: "成功 需要 坚持 不懈", english: "Success requires persistent effort.", level: "Difficult" },
  { words: "我们 团队 配合 得 很 默契", english: "Our team works in great harmony.", level: "Difficult" },
  { words: "这 是 百年 难遇的 好机会", english: "This is a once-in-a-century opportunity.", level: "Difficult" },
  { words: "我们 已经 取得了 阶段性 成果", english: "We have already achieved phased results.", level: "Difficult" },
  { words: "天下 没有 免费的 午餐", english: "There's no such thing as a free lunch.", level: "Difficult" },
  { words: "实践 是 检验 真理的 唯一 标准", english: "Practice is the sole criterion for testing truth.", level: "Difficult" },
  { words: "这个 挑战 对我来说 是 很好的 锻炼", english: "This challenge is a great exercise for me.", level: "Difficult" },
  { words: "我 相信 只要 坚持 就 一定 能 做到", english: "I believe that as long as you persist, you can do it.", level: "Difficult" },
  { words: "这次 经验 让我 更加 了解 自己", english: "This experience made me understand myself better.", level: "Difficult" },
  { words: "我 对 未来 充满了 期待", english: "I'm full of anticipation for the future.", level: "Difficult" },
];

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const PHRASE_BANK: Phrase[] = COMPACT_PHRASES.map(p => ({
  characters: toToneChars(p.words),
  english: p.english,
  level: p.level,
}));

export function getDailyPhrases(count: number = 10): Phrase[] {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = dayOfYear + today.getFullYear() * 366;
  const rng = mulberry32(seed);

  const shuffled = [...PHRASE_BANK];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

export function getPhrasesForLevel(level: string, count: number = 10): Phrase[] {
  const validLevels: PhraseLevel[] = ["Absolute Beginner", "Beginner", "Intermediate", "Difficult"];
  const mapped = level === "Advanced" ? "Difficult" : level;
  const effectiveLevel: PhraseLevel = validLevels.includes(mapped as PhraseLevel)
    ? (mapped as PhraseLevel)
    : "Beginner";

  const levelPhrases = PHRASE_BANK.filter(p => p.level === effectiveLevel);

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = dayOfYear + today.getFullYear() * 366;

  let hash = seed;
  for (let i = 0; i < effectiveLevel.length; i++) {
    hash = ((hash << 5) - hash + effectiveLevel.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);

  const rng = mulberry32(hash);
  const shuffled = [...levelPhrases];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled.slice(0, count);
}

export function phraseToText(phrase: Phrase): string {
  return phrase.characters.map(c => c.char).join("");
}

export function phraseToPinyinText(phrase: Phrase): string {
  return phrase.characters
    .filter(c => c.pinyin)
    .map(c => c.pinyin)
    .join(" ");
}

export function getDailyChallenge(level: string): Phrase {
  const validLevels: PhraseLevel[] = ["Absolute Beginner", "Beginner", "Intermediate", "Difficult"];
  const mapped = level === "Advanced" ? "Difficult" : level;
  const effectiveLevel: PhraseLevel = validLevels.includes(mapped as PhraseLevel)
    ? (mapped as PhraseLevel)
    : "Beginner";

  const levelPhrases = PHRASE_BANK.filter(p => p.level === effectiveLevel);

  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const seed = dayOfYear + today.getFullYear() * 366;

  let hash = seed;
  for (let i = 0; i < effectiveLevel.length; i++) {
    hash = ((hash << 5) - hash + effectiveLevel.charCodeAt(i)) | 0;
  }
  hash = Math.abs(hash);

  const index = hash % levelPhrases.length;
  return levelPhrases[index];
}
