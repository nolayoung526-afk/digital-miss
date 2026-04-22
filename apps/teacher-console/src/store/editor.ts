'use client';

import { create } from 'zustand';

export type SceneStatus = 'approved' | 'editing' | 'draft';

export interface SceneLite {
  sceneId: string;
  title: string;
  type: string;
  status: SceneStatus;
  ttsText?: string;
  variantCount?: number;
}

export interface Variant {
  id: string;
  name: string;
  when: string;
  ttsText: string;
  ruleMatched?: string;
  tag: 'default' | 'confused' | 'high' | 'asr';
}

interface EditorState {
  scriptTitle: string;
  scriptVersion: string;
  scenes: SceneLite[];
  currentSceneId: string;
  variants: Variant[];
  setCurrentScene: (id: string) => void;
  updateSceneTts: (text: string) => void;
  addVariant: (v: Variant) => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  scriptTitle: '二年级 · 加法王国 · 第 5 课',
  scriptVersion: 'v1.2.0 草稿',
  scenes: [
    { sceneId: 'sc_01', title: '开场白', type: 'intro', status: 'approved' },
    { sceneId: 'sc_02', title: '讲解', type: 'teach', status: 'approved' },
    { sceneId: 'sc_03', title: '板书演示', type: 'teach', status: 'approved' },
    { sceneId: 'sc_12', title: '提问', type: 'quiz', status: 'editing', variantCount: 3, ttsText: '小明,你来试试,3 加 5 等于几呀?' },
    { sceneId: 'sc_13', title: '鼓励反馈', type: 'praise', status: 'approved' },
    { sceneId: 'sc_14', title: '练习', type: 'quiz', status: 'draft' },
    { sceneId: 'sc_15', title: '挑战', type: 'quiz', status: 'draft' },
    { sceneId: 'sc_16', title: '小结', type: 'summary', status: 'draft' },
  ],
  currentSceneId: 'sc_12',
  variants: [
    { id: 'v1', name: '默认版本', when: '所有学员', ttsText: '小明,3 加 5 等于几呀?', tag: 'default' },
    { id: 'v2', name: '困惑学员辅助', when: 'confused_ratio > 0.25', ttsText: '我们用手指数:3 根 + 5 根 = ?', ruleMatched: 'R_CONFUSED_HOTSPOT', tag: 'confused' },
    { id: 'v3', name: '高能学员挑战', when: 'correct_rate > 0.9', ttsText: '3 + 5 等于 8,那再加 2 呢?', ruleMatched: 'R_HIGH_PERFORMER', tag: 'high' },
    { id: 'v4', name: 'ASR 不友好学员', when: 'asr_success < 0.7 OR age < 6', ttsText: '切选择题:A.7 B.8 C.9 D.10', ruleMatched: 'R_ASR_UNFRIENDLY', tag: 'asr' },
  ],
  setCurrentScene: (id) => set({ currentSceneId: id }),
  updateSceneTts: (text) =>
    set((st) => ({
      scenes: st.scenes.map((s) =>
        s.sceneId === st.currentSceneId ? { ...s, ttsText: text } : s
      ),
    })),
  addVariant: (v) => set((st) => ({ variants: [...st.variants, v] })),
}));
