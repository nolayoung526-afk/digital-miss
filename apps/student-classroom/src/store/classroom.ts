import { create } from 'zustand';
import { AINSMode } from '@/lib/agora';

export interface Student {
  id: string;
  nickname: string;
  avatar?: string;
  onMic: boolean;
  calledOn: boolean;
}

interface ClassroomState {
  classId: string | null;
  studentSelf: Student | null;
  classmates: Student[];
  subtitle: string;
  boardText: string;
  dtState: 'idle' | 'speaking' | 'listening' | 'responding' | 'paused';
  remainingSec: number;
  stars: number;
  ainsMode: AINSMode;

  setClass: (id: string) => void;
  setStudentSelf: (s: Student) => void;
  setSubtitle: (s: string) => void;
  setBoardText: (s: string) => void;
  setDTState: (s: ClassroomState['dtState']) => void;
  addStars: (n: number) => void;
  setAins: (m: AINSMode) => void;
  callOn: (studentId: string) => void;
  clearCall: () => void;
}

export const useClassroomStore = create<ClassroomState>((set) => ({
  classId: null,
  studentSelf: {
    id: 'stu_demo',
    nickname: '小明',
    onMic: false,
    calledOn: false,
  },
  classmates: [
    { id: 'stu_002', nickname: '乐乐', onMic: false, calledOn: false },
    { id: 'stu_003', nickname: '朵朵', onMic: false, calledOn: false },
    { id: 'stu_004', nickname: '小豆', onMic: false, calledOn: false },
  ],
  subtitle: '等待开课...',
  boardText: '',
  dtState: 'idle',
  remainingSec: 40 * 60,
  stars: 28,
  ainsMode: 'balanced',

  setClass: (id) => set({ classId: id }),
  setStudentSelf: (s) => set({ studentSelf: s }),
  setSubtitle: (s) => set({ subtitle: s }),
  setBoardText: (s) => set({ boardText: s }),
  setDTState: (s) => set({ dtState: s }),
  addStars: (n) => set((st) => ({ stars: st.stars + n })),
  setAins: (m) => set({ ainsMode: m }),
  callOn: (id) =>
    set((st) => ({
      studentSelf: st.studentSelf && st.studentSelf.id === id
        ? { ...st.studentSelf, calledOn: true, onMic: true }
        : st.studentSelf,
      classmates: st.classmates.map((c) =>
        c.id === id ? { ...c, calledOn: true, onMic: true } : c
      ),
    })),
  clearCall: () =>
    set((st) => ({
      studentSelf: st.studentSelf ? { ...st.studentSelf, calledOn: false, onMic: false } : null,
      classmates: st.classmates.map((c) => ({ ...c, calledOn: false, onMic: false })),
    })),
}));
