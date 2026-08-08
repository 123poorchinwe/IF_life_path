import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ProfileCard } from "@/types/profile";
type Effect = {
  energy: number;
  time: number;
  money: number;
  info: number;
  support: number;
};
export type MissionOutcome = {
  missionId: string;
  endingId: string;
  title: string;
  completedAt: string;
  evidence: string[];
};
export type NPCMemory = {
  id: string;
  npcId: string;
  placeId: string;
  summary: string;
  playerLine?: string;
  npcLine?: string;
  createdAt: string;
};
type State = {
  round: number;
  energy: number;
  time: number;
  money: number;
  info: number;
  support: number;
  history: string[];
  activeMissionId: string;
  worldEvidence: string[];
  missionOutcomes: Record<string, MissionOutcome>;
  placeVisits: Record<string, number>;
  missionMemories: Record<string, string[]>;
  profileCards: ProfileCard[];
  npcMemories: Record<string, NPCMemory[]>;
  choose: (text: string, e: Effect) => void;
  startMission: (id: string) => void;
  collectEvidence: (id: string) => void;
  visitPlace: (id: string) => void;
  completeMission: (outcome: MissionOutcome) => void;
  setProfileCards: (cards: ProfileCard[]) => void;
  rememberNPC: (memory: Omit<NPCMemory, "id" | "createdAt">) => void;
  reset: () => void;
};
const initial = {
  round: 1,
  energy: 7,
  time: 8,
  money: 5,
  info: 3,
  support: 4,
  history: [],
  activeMissionId: "scope_and_credit",
  worldEvidence: [],
  missionOutcomes: {},
  placeVisits: {},
  missionMemories: {},
  profileCards: [],
  npcMemories: {},
};
export const useGameStore = create<State>()(
  persist(
    (set) => ({
      ...initial,
      choose: (text, e) =>
        set((s) => ({
          round: s.round + 1,
          energy: Math.max(0, Math.min(10, s.energy + e.energy)),
          time: Math.max(0, Math.min(10, s.time + e.time)),
          money: Math.max(0, Math.min(10, s.money + e.money)),
          info: Math.max(0, Math.min(10, s.info + e.info)),
          support: Math.max(0, Math.min(10, s.support + e.support)),
          history: [...s.history, text],
        })),
      startMission: (id) => set({ activeMissionId: id }),
      collectEvidence: (id) =>
        set((s) => ({
          worldEvidence: s.worldEvidence.includes(id)
            ? s.worldEvidence
            : [...s.worldEvidence, id],
        })),
      visitPlace: (id) =>
        set((s) => ({
          placeVisits: {
            ...(s.placeVisits || {}),
            [id]: (s.placeVisits?.[id] || 0) + 1,
          },
        })),
      completeMission: (outcome) =>
        set((s) => {
          const firstCompletion = !s.missionOutcomes[outcome.missionId];
          return {
            round: firstCompletion ? Math.min(6, s.round + 1) : s.round,
            missionOutcomes: {
              ...s.missionOutcomes,
              [outcome.missionId]: outcome,
            },
            worldEvidence: [
              ...new Set([...s.worldEvidence, ...outcome.evidence]),
            ],
            history: [...s.history, `任务结局：${outcome.title}`],
            missionMemories: {
              ...(s.missionMemories || {}),
              [outcome.missionId]: [
                ...(s.missionMemories?.[outcome.missionId] || []).slice(-4),
                `玩家完成调查，形成结论：${outcome.title}`,
              ],
            },
          };
        }),
      setProfileCards: (profileCards) => set({ profileCards }),
      rememberNPC: (memory) =>
        set((state) => {
          const memoryMap = state.npcMemories || {};
          const previous = memoryMap[memory.npcId] || [];
          const next: NPCMemory = {
            ...memory,
            id: `${memory.npcId}-${Date.now()}`,
            createdAt: new Date().toISOString(),
          };
          return {
            npcMemories: {
              ...memoryMap,
              [memory.npcId]: [...previous.slice(-11), next],
            },
          };
        }),
      reset: () => set(initial),
    }),
    { name: "if-life-path-state-v2" },
  ),
);
