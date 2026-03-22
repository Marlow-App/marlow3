export const CREDIT_PACKS = [
  { usd: 5,   credits: 15,  label: "Test pack",         highlight: null            },
  { usd: 10,  credits: 35,  label: "Regular pack",      highlight: null            },
  { usd: 20,  credits: 75,  label: "Most Popular",      highlight: "most_popular"  },
  { usd: 50,  credits: 200, label: "Large pack",         highlight: null            },
  { usd: 100, credits: 425, label: "Best Value",        highlight: "best_value"    },
] as const;

export type CreditPackUsd = typeof CREDIT_PACKS[number]["usd"];

export function countChineseChars(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (
      (code >= 0x4e00 && code <= 0x9fff) ||
      (code >= 0x3400 && code <= 0x4dbf) ||
      (code >= 0xf900 && code <= 0xfaff)
    ) {
      count++;
    }
  }
  return count;
}

export const MAX_CHARS = 10;
export const REFUND_THRESHOLD = 95;
export const SIGNUP_BONUS = 10;
export const DAILY_REWARD = 1;
export const MAX_FREE_BANK = 3;
