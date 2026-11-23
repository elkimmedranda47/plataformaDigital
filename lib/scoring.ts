import type { EnglishLevel } from "./types";

export const APPROVAL_THRESHOLD = 75;

const ENGLISH_BONUS: Record<EnglishLevel, number> = {
  "B2+": 40,
  B1: 30,
  "A1-A2": 15,
};

export function computeScore(codeQuality: number, english: EnglishLevel): number {
  return codeQuality * 0.6 + ENGLISH_BONUS[english];
}

export function isApproved(score: number): boolean {
  return score >= APPROVAL_THRESHOLD;
}
