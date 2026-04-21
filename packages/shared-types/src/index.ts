// @digital-teacher/shared-types
// 卷三数据字典的 TypeScript 实现 · 所有服务与前端共享
// 变更需同步更新飞书 PRD 文档卷三 §3.1

// ========================================================
// 数字人与 Persona
// ========================================================

export type PersonaStatus =
  | 'collecting'
  | 'modeling'
  | 'reviewing'
  | 'approved'
  | 'suspended'
  | 'revoked';

export interface TeacherPersona {
  persona_id: string;
  real_teacher_id: string;
  display_name: string;
  avatar_asset_id: string;
  voice_profile_id: string;
  license_doc_url: string;
  license_valid_until: string; // ISO date
  status: PersonaStatus;
  style_preset: 'cartoon_2d';
}

// ========================================================
// 脚本与分镜
// ========================================================

export type SceneType = 'intro' | 'teach' | 'quiz' | 'praise' | 'summary';

export interface LipKeyframe {
  ts_ms: number;
  viseme: string; // A/I/U/E/O/M/...
}

export interface BoardAction {
  type: 'write_text' | 'rect' | 'line' | 'arrow' | 'clear' | 'undo' | 'gesture';
  pos?: [number, number, number?, number?]; // x, y, [w, h]
  content?: string;
  color?: string;
  duration_ms?: number;
}

export interface Branch {
  when: string; // 简单 DSL: "answer == correct"
  next_scene_id: string;
  tts_override?: string;
}

export interface SceneVariant {
  id: string;
  when: string; // "profile.confused_ratio > 0.25"
  tts_override?: string;
  board_actions_override?: BoardAction[];
  question_type_override?: Record<string, number>; // { choice: 0.7, voice: 0.3 }
}

export interface Scene {
  scene_id: string;
  type: SceneType;
  tts_text: string;
  lip_keyframes: LipKeyframe[];
  board_actions?: BoardAction[];
  branches?: Branch[];
  variants?: SceneVariant[];
  interaction?: {
    type: 'random_call' | 'race' | 'quiz' | 'board' | 'none';
    timeout_s: number;
    reward_policy?: string;
  };
  pacing?: {
    tts_speed?: number | string; // number 或 "profile.K3_tts_speed"
    timeout_s?: number | string;
  };
}

export interface Script {
  script_id: string;
  course_id: string;
  version: string;
  scenes: Scene[];
  audit_status: 'draft' | 'reviewing' | 'approved' | 'offline';
}

// ========================================================
// 课堂
// ========================================================

export type ClassStatus = 'scheduled' | 'warming' | 'live' | 'ended' | 'aborted';

export interface LiveClass {
  class_id: string;
  start_at: string; // ISO
  teacher_id: string; // persona_id
  assistant_id: string;
  student_ids: string[]; // 4-6 人
  script_id: string;
  rtc_room: {
    room_id: string;
    token_ttl_sec: number;
  };
  status: ClassStatus;
}

// ========================================================
// 互动事件
// ========================================================

export type InteractionType =
  // 老师发起
  | 'T_GREET' | 'T_CALL_NAME' | 'T_ASK_QUESTION' | 'T_PUSH_QUIZ'
  | 'T_INVITE_HANDSUP' | 'T_FEEDBACK_CORRECT' | 'T_FEEDBACK_WRONG'
  | 'T_ENCOURAGE' | 'T_CLARIFY' | 'T_TRANSITION' | 'T_SUMMARY'
  | 'T_BOARD_WRITE' | 'T_BOARD_CLEAR' | 'T_BOARD_UNDO'
  | 'T_OBSERVE_STUDENT' | 'T_RANDOM_CALL' | 'T_TIMER_START'
  | 'T_AWARD_ALL_STAR' | 'T_RED_PACKET_RAIN' | 'T_ONSTAGE'
  // 学员发起
  | 'S_JOIN' | 'S_LEAVE' | 'S_RAISE_HAND'
  | 'S_ANSWER_VOICE' | 'S_ANSWER_CHOICE' | 'S_ANSWER_BOARD'
  | 'S_BARGE_IN' | 'S_ASK_FREE' | 'S_APPLAUSE' | 'S_EMOJI_REACT'
  // 系统
  | 'SYS_FOCUS_HIGH' | 'SYS_DISTRACTED' | 'SYS_CONFUSED' | 'SYS_HAPPY'
  | 'SYS_NO_RESPONSE' | 'SYS_MULTI_SPEAK' | 'SYS_LOW_PARTICIPATION'
  | 'SYS_BRANCH_MISS' | 'SYS_FALLBACK_FIRED' | 'SYS_MIC_CONTROL'
  // 策略
  | 'STRAT_APPLIED' | 'STRAT_VARIANT_RENDERED'
  | 'STRAT_COMPENSATE_CALL' | 'STRAT_REWARD_REWEIGHT'
  | 'STRAT_CONFIDENCE_LOW';

export interface InteractionEvent {
  interaction_id: string;
  class_id: string;
  student_id?: string;
  type: InteractionType;
  scene_id?: string;
  result?: 'correct' | 'wrong' | 'timeout';
  latency_ms?: number;
  payload?: Record<string, any>;
  ts: string;
}

// ========================================================
// 情绪与画像
// ========================================================

export type EmotionState = 'focus' | 'confused' | 'distracted' | 'happy';

export interface EmotionSignal {
  student_id: string;
  class_id: string;
  state: EmotionState;
  confidence: number; // 0-1
  ts: string;
}

export interface StudentProfile {
  student_id: string;
  age?: number;
  grade?: number;
  avg_interactions_per_class?: number;
  speak_ratio?: number;
  correct_rate?: number;
  avg_answer_latency_ms?: number;
  asr_success_rate?: number;
  confused_ratio?: number;
  focus_ratio?: number;
  barge_in_per_min?: number;
  happy_triggers?: string[];
  knowledge_mastery?: Record<string, number>;
  recent_classes_count?: number;
  updated_at: string;
}

// ========================================================
// 策略引擎
// ========================================================

export type StrategyKnobs = Partial<{
  K1_difficulty: 'easy' | 'balanced' | 'challenge';
  K2_density: number; // 0.5-1.5
  K3_tts_speed: number; // 0.85-1.10
  K4_call_strategy: 'balanced' | 'compensate' | 'proactive';
  K4_call_weight: number;
  K5_reward_rhythm: 'per_3_questions' | 'per_5_questions' | 'by_performance';
  K6_barge_in_policy: 'conservative' | 'default' | 'open';
  K7_board_density: 'sparse' | 'medium' | 'dense';
  K8_emotion_response: 'passive' | 'proactive';
  K9_reward_weight: { star?: number; red_packet?: number; clap?: number };
  K10_question_type: { voice?: number; choice?: number; answer_device?: number };
}>;

export interface StrategyConfig {
  class_id: string;
  generated_at: string;
  class_knobs: StrategyKnobs;
  student_strategies: Array<{
    student_id: string;
    variants?: Record<string, string>;
    knobs: StrategyKnobs;
    matched_rules: string[];
  }>;
  fallback: 'default_profile';
}

// ========================================================
// FP 预案
// ========================================================

export type FPTrigger =
  | 'tts_primary_failure' | 'lip_sync_error' | 'asr_repeated_failure'
  | 'student_offline' | 'multi_speak' | 'courseware_load_fail'
  | 'network_jitter' | 'emotion_model_fail' | 'assistant_offline'
  | 'branch_miss' | 'self_check_error' | 'platform_failure';

export interface FallbackPlaybook {
  playbook_id: string; // FP-01 ~ FP-12
  trigger: FPTrigger;
  severity: 'low' | 'mid' | 'high';
  dt_script: Scene[];
  system_action: string[];
  max_duration_sec: number;
  notify?: Record<string, string[]>;
  version: string;
  audit_status: 'draft' | 'reviewing' | 'approved' | 'offline';
}

// ========================================================
// Barge-in
// ========================================================

export interface BargeInEvent {
  class_id: string;
  student_id: string;
  event: 'start' | 'end';
  vad_ms: number;
  audio_energy_dbfs?: number;
  ts: string;
}

export interface BargeInDecision {
  dt_action: 'fade_out' | 'ignore' | 'escalate';
  dt_breakpoint?: {
    scene_id: string;
    char_offset: number;
    audio_ms: number;
  };
  resume_policy: 'answer_then_resume' | 'resume_only' | 'wait';
}

export const BARGEIN_DEFAULTS = {
  vad_threshold_dbfs: -42,
  min_speech_ms: 300,
  silence_end_ms: 700,
  fade_out_ms: 200,
  max_student_speak_ms: 10000,
  cooldown_ms: 500,
  max_bargeins_per_minute: 6,
} as const;
