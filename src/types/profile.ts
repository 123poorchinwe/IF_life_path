export const profileCardTypes = ["事实", "能力", "推断", "资格", "限制", "偏好"] as const;

export type ProfileCardType = (typeof profileCardTypes)[number];

export interface ProfileCard {
  id: string;
  type: ProfileCardType;
  title: string;
  detail: string;
  evidence: string;
  confirmed: boolean;
}

export interface ParsedProfile {
  cards: ProfileCard[];
  sourceText: string;
  sourceName: string;
  usedAI: boolean;
}
