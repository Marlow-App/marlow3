export interface ToneChar {
  char: string;
  tone: 1 | 2 | 3 | 4 | 0;
  pinyin: string;
}

export interface Phrase {
  characters: ToneChar[];
  english: string;
}

export const PHRASE_BANK: Phrase[] = [
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "好", tone: 3, pinyin: "hǎo" },
      { char: "，", tone: 0, pinyin: "" },
      { char: "很", tone: 3, pinyin: "hěn" },
      { char: "高", tone: 1, pinyin: "gāo" },
      { char: "兴", tone: 4, pinyin: "xìng" },
      { char: "认", tone: 4, pinyin: "rèn" },
      { char: "识", tone: 0, pinyin: "shi" },
      { char: "你", tone: 3, pinyin: "nǐ" },
    ],
    english: "Hello, nice to meet you.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "要", tone: 4, pinyin: "yào" },
      { char: "去", tone: 4, pinyin: "qù" },
      { char: "北", tone: 3, pinyin: "běi" },
      { char: "京", tone: 1, pinyin: "jīng" },
      { char: "学", tone: 2, pinyin: "xué" },
      { char: "习", tone: 2, pinyin: "xí" },
      { char: "中", tone: 1, pinyin: "zhōng" },
      { char: "文", tone: 2, pinyin: "wén" },
    ],
    english: "I want to go to Beijing to study Chinese.",
  },
  {
    characters: [
      { char: "请", tone: 3, pinyin: "qǐng" },
      { char: "问", tone: 4, pinyin: "wèn" },
      { char: "，", tone: 0, pinyin: "" },
      { char: "洗", tone: 3, pinyin: "xǐ" },
      { char: "手", tone: 3, pinyin: "shǒu" },
      { char: "间", tone: 1, pinyin: "jiān" },
      { char: "在", tone: 4, pinyin: "zài" },
      { char: "哪", tone: 3, pinyin: "nǎ" },
      { char: "里", tone: 3, pinyin: "lǐ" },
    ],
    english: "Excuse me, where is the restroom?",
  },
  {
    characters: [
      { char: "这", tone: 4, pinyin: "zhè" },
      { char: "个", tone: 0, pinyin: "ge" },
      { char: "菜", tone: 4, pinyin: "cài" },
      { char: "有", tone: 3, pinyin: "yǒu" },
      { char: "点", tone: 3, pinyin: "diǎn" },
      { char: "辣", tone: 4, pinyin: "là" },
    ],
    english: "This dish is a bit spicy.",
  },
  {
    characters: [
      { char: "今", tone: 1, pinyin: "jīn" },
      { char: "天", tone: 1, pinyin: "tiān" },
      { char: "天", tone: 1, pinyin: "tiān" },
      { char: "气", tone: 4, pinyin: "qì" },
      { char: "很", tone: 3, pinyin: "hěn" },
      { char: "好", tone: 3, pinyin: "hǎo" },
    ],
    english: "The weather is very nice today.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "想", tone: 3, pinyin: "xiǎng" },
      { char: "喝", tone: 1, pinyin: "hē" },
      { char: "一", tone: 4, pinyin: "yì" },
      { char: "杯", tone: 1, pinyin: "bēi" },
      { char: "咖", tone: 1, pinyin: "kā" },
      { char: "啡", tone: 1, pinyin: "fēi" },
    ],
    english: "I want to drink a cup of coffee.",
  },
  {
    characters: [
      { char: "谢", tone: 4, pinyin: "xiè" },
      { char: "谢", tone: 0, pinyin: "xie" },
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "的", tone: 0, pinyin: "de" },
      { char: "帮", tone: 1, pinyin: "bāng" },
      { char: "助", tone: 4, pinyin: "zhù" },
    ],
    english: "Thank you for your help.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "是", tone: 4, pinyin: "shì" },
      { char: "美", tone: 3, pinyin: "měi" },
      { char: "国", tone: 2, pinyin: "guó" },
      { char: "人", tone: 2, pinyin: "rén" },
    ],
    english: "I am American.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "会", tone: 4, pinyin: "huì" },
      { char: "说", tone: 1, pinyin: "shuō" },
      { char: "英", tone: 1, pinyin: "yīng" },
      { char: "语", tone: 3, pinyin: "yǔ" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Can you speak English?",
  },
  {
    characters: [
      { char: "多", tone: 1, pinyin: "duō" },
      { char: "少", tone: 0, pinyin: "shao" },
      { char: "钱", tone: 2, pinyin: "qián" },
    ],
    english: "How much does it cost?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "不", tone: 4, pinyin: "bù" },
      { char: "太", tone: 4, pinyin: "tài" },
      { char: "明", tone: 2, pinyin: "míng" },
      { char: "白", tone: 2, pinyin: "bái" },
    ],
    english: "I don't quite understand.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "能", tone: 2, pinyin: "néng" },
      { char: "再", tone: 4, pinyin: "zài" },
      { char: "说", tone: 1, pinyin: "shuō" },
      { char: "一", tone: 2, pinyin: "yí" },
      { char: "遍", tone: 4, pinyin: "biàn" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Can you say that again?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "喜", tone: 3, pinyin: "xǐ" },
      { char: "欢", tone: 1, pinyin: "huān" },
      { char: "吃", tone: 1, pinyin: "chī" },
      { char: "中", tone: 1, pinyin: "zhōng" },
      { char: "国", tone: 2, pinyin: "guó" },
      { char: "菜", tone: 4, pinyin: "cài" },
    ],
    english: "I like eating Chinese food.",
  },
  {
    characters: [
      { char: "他", tone: 1, pinyin: "tā" },
      { char: "是", tone: 4, pinyin: "shì" },
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "的", tone: 0, pinyin: "de" },
      { char: "老", tone: 3, pinyin: "lǎo" },
      { char: "师", tone: 1, pinyin: "shī" },
    ],
    english: "He is my teacher.",
  },
  {
    characters: [
      { char: "明", tone: 2, pinyin: "míng" },
      { char: "天", tone: 1, pinyin: "tiān" },
      { char: "见", tone: 4, pinyin: "jiàn" },
    ],
    english: "See you tomorrow.",
  },
  {
    characters: [
      { char: "对", tone: 4, pinyin: "duì" },
      { char: "不", tone: 4, pinyin: "bù" },
      { char: "起", tone: 3, pinyin: "qǐ" },
      { char: "，", tone: 0, pinyin: "" },
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "来", tone: 2, pinyin: "lái" },
      { char: "晚", tone: 3, pinyin: "wǎn" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "Sorry, I'm late.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "在", tone: 4, pinyin: "zài" },
      { char: "做", tone: 4, pinyin: "zuò" },
      { char: "什", tone: 2, pinyin: "shén" },
      { char: "么", tone: 0, pinyin: "me" },
    ],
    english: "What are you doing?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "住", tone: 4, pinyin: "zhù" },
      { char: "在", tone: 4, pinyin: "zài" },
      { char: "上", tone: 4, pinyin: "shàng" },
      { char: "海", tone: 3, pinyin: "hǎi" },
    ],
    english: "I live in Shanghai.",
  },
  {
    characters: [
      { char: "这", tone: 4, pinyin: "zhè" },
      { char: "里", tone: 3, pinyin: "lǐ" },
      { char: "有", tone: 3, pinyin: "yǒu" },
      { char: "没", tone: 2, pinyin: "méi" },
      { char: "有", tone: 3, pinyin: "yǒu" },
      { char: "地", tone: 4, pinyin: "dì" },
      { char: "铁", tone: 3, pinyin: "tiě" },
      { char: "站", tone: 4, pinyin: "zhàn" },
    ],
    english: "Is there a subway station here?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "的", tone: 0, pinyin: "de" },
      { char: "手", tone: 3, pinyin: "shǒu" },
      { char: "机", tone: 1, pinyin: "jī" },
      { char: "没", tone: 2, pinyin: "méi" },
      { char: "电", tone: 4, pinyin: "diàn" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "My phone is out of battery.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "吃", tone: 1, pinyin: "chī" },
      { char: "饭", tone: 4, pinyin: "fàn" },
      { char: "了", tone: 0, pinyin: "le" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Have you eaten?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "觉", tone: 2, pinyin: "jué" },
      { char: "得", tone: 0, pinyin: "de" },
      { char: "很", tone: 3, pinyin: "hěn" },
      { char: "有", tone: 3, pinyin: "yǒu" },
      { char: "意", tone: 4, pinyin: "yì" },
      { char: "思", tone: 1, pinyin: "sī" },
    ],
    english: "I think it's very interesting.",
  },
  {
    characters: [
      { char: "请", tone: 3, pinyin: "qǐng" },
      { char: "给", tone: 3, pinyin: "gěi" },
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "一", tone: 4, pinyin: "yì" },
      { char: "杯", tone: 1, pinyin: "bēi" },
      { char: "水", tone: 3, pinyin: "shuǐ" },
    ],
    english: "Please give me a glass of water.",
  },
  {
    characters: [
      { char: "她", tone: 1, pinyin: "tā" },
      { char: "很", tone: 3, pinyin: "hěn" },
      { char: "漂", tone: 4, pinyin: "piào" },
      { char: "亮", tone: 0, pinyin: "liang" },
    ],
    english: "She is very beautiful.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "每", tone: 3, pinyin: "měi" },
      { char: "天", tone: 1, pinyin: "tiān" },
      { char: "早", tone: 3, pinyin: "zǎo" },
      { char: "上", tone: 0, pinyin: "shang" },
      { char: "跑", tone: 3, pinyin: "pǎo" },
      { char: "步", tone: 4, pinyin: "bù" },
    ],
    english: "I go jogging every morning.",
  },
  {
    characters: [
      { char: "中", tone: 1, pinyin: "zhōng" },
      { char: "文", tone: 2, pinyin: "wén" },
      { char: "很", tone: 3, pinyin: "hěn" },
      { char: "难", tone: 2, pinyin: "nán" },
      { char: "学", tone: 2, pinyin: "xué" },
    ],
    english: "Chinese is very hard to learn.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "可", tone: 3, pinyin: "kě" },
      { char: "以", tone: 3, pinyin: "yǐ" },
      { char: "试", tone: 4, pinyin: "shì" },
      { char: "试", tone: 0, pinyin: "shi" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Can I try it?",
  },
  {
    characters: [
      { char: "现", tone: 4, pinyin: "xiàn" },
      { char: "在", tone: 4, pinyin: "zài" },
      { char: "几", tone: 3, pinyin: "jǐ" },
      { char: "点", tone: 3, pinyin: "diǎn" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "What time is it now?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "想", tone: 3, pinyin: "xiǎng" },
      { char: "买", tone: 3, pinyin: "mǎi" },
      { char: "这", tone: 4, pinyin: "zhè" },
      { char: "个", tone: 0, pinyin: "ge" },
    ],
    english: "I want to buy this.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "叫", tone: 4, pinyin: "jiào" },
      { char: "什", tone: 2, pinyin: "shén" },
      { char: "么", tone: 0, pinyin: "me" },
      { char: "名", tone: 2, pinyin: "míng" },
      { char: "字", tone: 4, pinyin: "zì" },
    ],
    english: "What is your name?",
  },
  {
    characters: [
      { char: "这", tone: 4, pinyin: "zhè" },
      { char: "本", tone: 3, pinyin: "běn" },
      { char: "书", tone: 1, pinyin: "shū" },
      { char: "很", tone: 3, pinyin: "hěn" },
      { char: "好", tone: 3, pinyin: "hǎo" },
      { char: "看", tone: 4, pinyin: "kàn" },
    ],
    english: "This book is very good.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "不", tone: 4, pinyin: "bú" },
      { char: "知", tone: 1, pinyin: "zhī" },
      { char: "道", tone: 4, pinyin: "dào" },
    ],
    english: "I don't know.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "家", tone: 1, pinyin: "jiā" },
      { char: "有", tone: 3, pinyin: "yǒu" },
      { char: "几", tone: 3, pinyin: "jǐ" },
      { char: "口", tone: 3, pinyin: "kǒu" },
      { char: "人", tone: 2, pinyin: "rén" },
    ],
    english: "How many people are in your family?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "在", tone: 4, pinyin: "zài" },
      { char: "学", tone: 2, pinyin: "xué" },
      { char: "做", tone: 4, pinyin: "zuò" },
      { char: "中", tone: 1, pinyin: "zhōng" },
      { char: "国", tone: 2, pinyin: "guó" },
      { char: "菜", tone: 4, pinyin: "cài" },
    ],
    english: "I'm learning to cook Chinese food.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "去", tone: 4, pinyin: "qù" },
      { char: "过", tone: 0, pinyin: "guo" },
      { char: "长", tone: 2, pinyin: "cháng" },
      { char: "城", tone: 2, pinyin: "chéng" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Have you been to the Great Wall?",
  },
  {
    characters: [
      { char: "这", tone: 4, pinyin: "zhè" },
      { char: "条", tone: 2, pinyin: "tiáo" },
      { char: "路", tone: 4, pinyin: "lù" },
      { char: "怎", tone: 3, pinyin: "zěn" },
      { char: "么", tone: 0, pinyin: "me" },
      { char: "走", tone: 3, pinyin: "zǒu" },
    ],
    english: "How do I get there?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "想", tone: 3, pinyin: "xiǎng" },
      { char: "请", tone: 3, pinyin: "qǐng" },
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "吃", tone: 1, pinyin: "chī" },
      { char: "饭", tone: 4, pinyin: "fàn" },
    ],
    english: "I'd like to treat you to a meal.",
  },
  {
    characters: [
      { char: "外", tone: 4, pinyin: "wài" },
      { char: "面", tone: 0, pinyin: "mian" },
      { char: "下", tone: 4, pinyin: "xià" },
      { char: "雨", tone: 3, pinyin: "yǔ" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "It's raining outside.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "的", tone: 0, pinyin: "de" },
      { char: "中", tone: 1, pinyin: "zhōng" },
      { char: "文", tone: 2, pinyin: "wén" },
      { char: "不", tone: 4, pinyin: "bù" },
      { char: "好", tone: 3, pinyin: "hǎo" },
    ],
    english: "My Chinese isn't good.",
  },
  {
    characters: [
      { char: "慢", tone: 4, pinyin: "màn" },
      { char: "慢", tone: 4, pinyin: "màn" },
      { char: "说", tone: 1, pinyin: "shuō" },
      { char: "，", tone: 0, pinyin: "" },
      { char: "好", tone: 3, pinyin: "hǎo" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Speak slowly, okay?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "已", tone: 3, pinyin: "yǐ" },
      { char: "经", tone: 1, pinyin: "jīng" },
      { char: "吃", tone: 1, pinyin: "chī" },
      { char: "过", tone: 0, pinyin: "guo" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "I've already eaten.",
  },
  {
    characters: [
      { char: "周", tone: 1, pinyin: "zhōu" },
      { char: "末", tone: 4, pinyin: "mò" },
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "有", tone: 3, pinyin: "yǒu" },
      { char: "空", tone: 4, pinyin: "kòng" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Are you free this weekend?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "最", tone: 4, pinyin: "zuì" },
      { char: "喜", tone: 3, pinyin: "xǐ" },
      { char: "欢", tone: 1, pinyin: "huān" },
      { char: "夏", tone: 4, pinyin: "xià" },
      { char: "天", tone: 1, pinyin: "tiān" },
    ],
    english: "I like summer the most.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "的", tone: 0, pinyin: "de" },
      { char: "普", tone: 3, pinyin: "pǔ" },
      { char: "通", tone: 1, pinyin: "tōng" },
      { char: "话", tone: 4, pinyin: "huà" },
      { char: "说", tone: 1, pinyin: "shuō" },
      { char: "得", tone: 0, pinyin: "de" },
      { char: "很", tone: 3, pinyin: "hěn" },
      { char: "好", tone: 3, pinyin: "hǎo" },
    ],
    english: "Your Mandarin is very good.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "需", tone: 1, pinyin: "xū" },
      { char: "要", tone: 4, pinyin: "yào" },
      { char: "一", tone: 2, pinyin: "yí" },
      { char: "个", tone: 0, pinyin: "ge" },
      { char: "翻", tone: 1, pinyin: "fān" },
      { char: "译", tone: 4, pinyin: "yì" },
    ],
    english: "I need a translator.",
  },
  {
    characters: [
      { char: "这", tone: 4, pinyin: "zhè" },
      { char: "个", tone: 0, pinyin: "ge" },
      { char: "地", tone: 4, pinyin: "dì" },
      { char: "方", tone: 1, pinyin: "fāng" },
      { char: "真", tone: 1, pinyin: "zhēn" },
      { char: "美", tone: 3, pinyin: "měi" },
    ],
    english: "This place is really beautiful.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "想", tone: 3, pinyin: "xiǎng" },
      { char: "喝", tone: 1, pinyin: "hē" },
      { char: "茶", tone: 2, pinyin: "chá" },
      { char: "还", tone: 2, pinyin: "hái" },
      { char: "是", tone: 4, pinyin: "shì" },
      { char: "咖", tone: 1, pinyin: "kā" },
      { char: "啡", tone: 1, pinyin: "fēi" },
    ],
    english: "Would you like tea or coffee?",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "的", tone: 0, pinyin: "de" },
      { char: "爱", tone: 4, pinyin: "ài" },
      { char: "好", tone: 4, pinyin: "hào" },
      { char: "是", tone: 4, pinyin: "shì" },
      { char: "读", tone: 2, pinyin: "dú" },
      { char: "书", tone: 1, pinyin: "shū" },
    ],
    english: "My hobby is reading.",
  },
  {
    characters: [
      { char: "别", tone: 4, pinyin: "bié" },
      { char: "担", tone: 1, pinyin: "dān" },
      { char: "心", tone: 1, pinyin: "xīn" },
      { char: "，", tone: 0, pinyin: "" },
      { char: "没", tone: 2, pinyin: "méi" },
      { char: "问", tone: 4, pinyin: "wèn" },
      { char: "题", tone: 2, pinyin: "tí" },
    ],
    english: "Don't worry, no problem.",
  },
  {
    characters: [
      { char: "春", tone: 1, pinyin: "chūn" },
      { char: "节", tone: 2, pinyin: "jié" },
      { char: "快", tone: 4, pinyin: "kuài" },
      { char: "乐", tone: 4, pinyin: "lè" },
    ],
    english: "Happy Spring Festival!",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "们", tone: 0, pinyin: "men" },
      { char: "一", tone: 4, pinyin: "yì" },
      { char: "起", tone: 3, pinyin: "qǐ" },
      { char: "去", tone: 4, pinyin: "qù" },
      { char: "吧", tone: 0, pinyin: "ba" },
    ],
    english: "Let's go together.",
  },
  {
    characters: [
      { char: "生", tone: 1, pinyin: "shēng" },
      { char: "日", tone: 4, pinyin: "rì" },
      { char: "快", tone: 4, pinyin: "kuài" },
      { char: "乐", tone: 4, pinyin: "lè" },
    ],
    english: "Happy birthday!",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "有", tone: 3, pinyin: "yǒu" },
      { char: "一", tone: 2, pinyin: "yí" },
      { char: "个", tone: 0, pinyin: "ge" },
      { char: "问", tone: 4, pinyin: "wèn" },
      { char: "题", tone: 2, pinyin: "tí" },
    ],
    english: "I have a question.",
  },
  {
    characters: [
      { char: "太", tone: 4, pinyin: "tài" },
      { char: "好", tone: 3, pinyin: "hǎo" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "That's great!",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "们", tone: 0, pinyin: "men" },
      { char: "是", tone: 4, pinyin: "shì" },
      { char: "好", tone: 3, pinyin: "hǎo" },
      { char: "朋", tone: 2, pinyin: "péng" },
      { char: "友", tone: 3, pinyin: "yǒu" },
    ],
    english: "We are good friends.",
  },
  {
    characters: [
      { char: "请", tone: 3, pinyin: "qǐng" },
      { char: "坐", tone: 4, pinyin: "zuò" },
      { char: "，", tone: 0, pinyin: "" },
      { char: "请", tone: 3, pinyin: "qǐng" },
      { char: "坐", tone: 4, pinyin: "zuò" },
    ],
    english: "Please sit down.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "昨", tone: 2, pinyin: "zuó" },
      { char: "天", tone: 1, pinyin: "tiān" },
      { char: "看", tone: 4, pinyin: "kàn" },
      { char: "了", tone: 0, pinyin: "le" },
      { char: "一", tone: 2, pinyin: "yí" },
      { char: "部", tone: 4, pinyin: "bù" },
      { char: "电", tone: 4, pinyin: "diàn" },
      { char: "影", tone: 3, pinyin: "yǐng" },
    ],
    english: "I watched a movie yesterday.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "几", tone: 3, pinyin: "jǐ" },
      { char: "岁", tone: 4, pinyin: "suì" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "How old are you?",
  },
  {
    characters: [
      { char: "吃", tone: 1, pinyin: "chī" },
      { char: "得", tone: 0, pinyin: "de" },
      { char: "太", tone: 4, pinyin: "tài" },
      { char: "饱", tone: 3, pinyin: "bǎo" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "I'm too full.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "工", tone: 1, pinyin: "gōng" },
      { char: "作", tone: 4, pinyin: "zuò" },
      { char: "忙", tone: 2, pinyin: "máng" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Are you busy with work?",
  },
  {
    characters: [
      { char: "路", tone: 4, pinyin: "lù" },
      { char: "上", tone: 0, pinyin: "shang" },
      { char: "小", tone: 3, pinyin: "xiǎo" },
      { char: "心", tone: 1, pinyin: "xīn" },
    ],
    english: "Be careful on the road.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "学", tone: 2, pinyin: "xué" },
      { char: "了", tone: 0, pinyin: "le" },
      { char: "两", tone: 3, pinyin: "liǎng" },
      { char: "年", tone: 2, pinyin: "nián" },
      { char: "中", tone: 1, pinyin: "zhōng" },
      { char: "文", tone: 2, pinyin: "wén" },
    ],
    english: "I've studied Chinese for two years.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "喜", tone: 3, pinyin: "xǐ" },
      { char: "欢", tone: 1, pinyin: "huān" },
      { char: "什", tone: 2, pinyin: "shén" },
      { char: "么", tone: 0, pinyin: "me" },
      { char: "颜", tone: 2, pinyin: "yán" },
      { char: "色", tone: 4, pinyin: "sè" },
    ],
    english: "What color do you like?",
  },
  {
    characters: [
      { char: "他", tone: 1, pinyin: "tā" },
      { char: "们", tone: 0, pinyin: "men" },
      { char: "在", tone: 4, pinyin: "zài" },
      { char: "公", tone: 1, pinyin: "gōng" },
      { char: "园", tone: 2, pinyin: "yuán" },
      { char: "里", tone: 3, pinyin: "lǐ" },
      { char: "散", tone: 4, pinyin: "sàn" },
      { char: "步", tone: 4, pinyin: "bù" },
    ],
    english: "They are taking a walk in the park.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "打", tone: 3, pinyin: "dǎ" },
      { char: "算", tone: 4, pinyin: "suàn" },
      { char: "明", tone: 2, pinyin: "míng" },
      { char: "年", tone: 2, pinyin: "nián" },
      { char: "去", tone: 4, pinyin: "qù" },
      { char: "中", tone: 1, pinyin: "zhōng" },
      { char: "国", tone: 2, pinyin: "guó" },
    ],
    english: "I plan to go to China next year.",
  },
  {
    characters: [
      { char: "能", tone: 2, pinyin: "néng" },
      { char: "不", tone: 4, pinyin: "bù" },
      { char: "能", tone: 2, pinyin: "néng" },
      { char: "便", tone: 2, pinyin: "pián" },
      { char: "宜", tone: 2, pinyin: "yí" },
      { char: "一", tone: 4, pinyin: "yì" },
      { char: "点", tone: 3, pinyin: "diǎn" },
    ],
    english: "Can you make it a bit cheaper?",
  },
  {
    characters: [
      { char: "早", tone: 3, pinyin: "zǎo" },
      { char: "上", tone: 0, pinyin: "shang" },
      { char: "好", tone: 3, pinyin: "hǎo" },
    ],
    english: "Good morning.",
  },
  {
    characters: [
      { char: "晚", tone: 3, pinyin: "wǎn" },
      { char: "安", tone: 1, pinyin: "ān" },
    ],
    english: "Good night.",
  },
  {
    characters: [
      { char: "我", tone: 3, pinyin: "wǒ" },
      { char: "肚", tone: 4, pinyin: "dù" },
      { char: "子", tone: 0, pinyin: "zi" },
      { char: "饿", tone: 4, pinyin: "è" },
      { char: "了", tone: 0, pinyin: "le" },
    ],
    english: "I'm hungry.",
  },
  {
    characters: [
      { char: "你", tone: 3, pinyin: "nǐ" },
      { char: "有", tone: 3, pinyin: "yǒu" },
      { char: "微", tone: 1, pinyin: "wēi" },
      { char: "信", tone: 4, pinyin: "xìn" },
      { char: "吗", tone: 0, pinyin: "ma" },
    ],
    english: "Do you have WeChat?",
  },
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

export function phraseToText(phrase: Phrase): string {
  return phrase.characters.map(c => c.char).join("");
}

export function phraseToPinyinText(phrase: Phrase): string {
  return phrase.characters
    .filter(c => c.pinyin)
    .map(c => c.pinyin)
    .join(" ");
}
