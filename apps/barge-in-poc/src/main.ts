/**
 * 声网 Barge-in 优雅打断 · PoC 核心逻辑
 *
 * 本 PoC 实现两种模式:
 * 1. Mock 模式(默认):Web Audio API VAD + speechSynthesis TTS,零依赖本地可跑
 * 2. Real 模式(checkbox):声网 RTC SDK + AINS(需 VITE_AGORA_APP_ID)
 *
 * 控制器状态机:
 *   idle → speaking → listening → thinking → responding → speaking ...
 *
 * 关键参数见 shared-types BARGEIN_DEFAULTS:
 *   vad_threshold_dbfs: -42
 *   min_speech_ms: 300
 *   silence_end_ms: 700
 *   fade_out_ms: 200
 */

import { BARGEIN_DEFAULTS } from '@digital-teacher/shared-types';

// ============ 类型 ============
type DTState = 'idle' | 'speaking' | 'listening' | 'thinking' | 'responding' | 'paused';

interface Breakpoint {
  scene_id: string;
  char_offset: number;
  ts: number;
}

// ============ DOM ============
const $ = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;

const el = {
  dtState: $('dtState'),
  dtAvatar: $('dtAvatar'),
  subtitle: $('subtitleText'),
  board: $('board'),
  btnPlayShort: $<HTMLButtonElement>('btnPlayShort'),
  btnPlayLong: $<HTMLButtonElement>('btnPlayLong'),
  btnStop: $<HTMLButtonElement>('btnStop'),
  btnMic: $<HTMLButtonElement>('btnMic'),
  micState: $('micState'),
  vadBar: $('vadBar'),
  vadReading: $('vadReading'),
  metricBargeInCount: $('metricBargeInCount'),
  metricFadeLatency: $('metricFadeLatency'),
  metricResumeLatency: $('metricResumeLatency'),
  metricBreakpoint: $('metricBreakpoint'),
  log: $('log'),
  btnClearLog: $<HTMLButtonElement>('btnClearLog'),
  modeReal: $<HTMLInputElement>('modeReal'),
};

// ============ 脚本素材(模拟教研脚本) ============
const SCRIPTS = {
  short: {
    id: 'sc_12',
    text: '小明,3 加 5 等于几呀?',
    board: '3 + 5 = ?',
  },
  long: {
    id: 'sc_11',
    text: '小朋友们大家好呀,今天我们一起来学习加法。先看这道题:3 个苹果再加上 5 个苹果,一共是几个苹果呢?我们可以用手指数一数,大家跟着豆豆老师一起来,三根手指加上五根手指,一起数数看。',
    board: '3 苹果 + 5 苹果 = ?',
  },
};

// ============ 状态 ============
let dtState: DTState = 'idle';
let currentScript: typeof SCRIPTS.short | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let bargeInCount = 0;
let lastBreakpoint: Breakpoint | null = null;

// VAD 状态
let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let micStream: MediaStream | null = null;
let vadActive = false;
let vadStartTs = 0; // 人声开始时间戳
let silenceStartTs = 0; // 静音开始时间戳
let lastVadState: 'silence' | 'speech' = 'silence';
let bargeInInProgress = false;
let bargeInFiredTs = 0; // 打断触发时间

// ============ 工具 ============
function log(msg: string, color = 'text-slate-300') {
  const ts = new Date().toISOString().substring(11, 23);
  const line = document.createElement('div');
  line.className = color;
  line.innerHTML = `<span class="text-slate-500">[${ts}]</span> ${msg}`;
  el.log.appendChild(line);
  el.log.scrollTop = el.log.scrollHeight;
  console.log(`[${ts}]`, msg);
}

function setDTState(next: DTState) {
  dtState = next;
  el.dtState.textContent = next;
  const colors: Record<DTState, string> = {
    idle: 'bg-slate-700',
    speaking: 'bg-emerald-500 pulse-green',
    listening: 'bg-amber-500 pulse-amber',
    thinking: 'bg-purple-500',
    responding: 'bg-sky-500',
    paused: 'bg-red-500',
  };
  el.dtState.className = `px-3 py-1 rounded-full text-xs font-semibold ${colors[next]}`;

  // 表情变化
  const avatars: Record<DTState, string> = {
    idle: '😌',
    speaking: '👩‍🏫',
    listening: '🤔',
    thinking: '💭',
    responding: '😊',
    paused: '😯',
  };
  el.dtAvatar.textContent = avatars[next];
}

function setSubtitle(text: string, muted = false) {
  el.subtitle.textContent = text || '...';
  el.subtitle.className = muted
    ? 'inline-block max-w-[80%] px-4 py-2 rounded-xl bg-black/40 text-sm opacity-50'
    : 'inline-block max-w-[80%] px-4 py-2 rounded-xl bg-black/60 text-sm';
}

// ============ TTS 控制 ============
function speak(text: string, startCharOffset = 0, onEnd?: () => void) {
  const displayText = text.substring(startCharOffset);
  if (!displayText) {
    onEnd?.();
    return;
  }

  // 用浏览器 SpeechSynthesis(Mock 模式)· Real 模式替换为 Agora + TTS 服务
  const u = new SpeechSynthesisUtterance(displayText);
  u.lang = 'zh-CN';
  u.rate = 0.95;
  u.pitch = 1.1;

  // 选中文音色
  const voices = speechSynthesis.getVoices();
  const zh = voices.find(v => v.lang.startsWith('zh'));
  if (zh) u.voice = zh;

  u.onstart = () => {
    log(`🔊 TTS 开始播放 · char_offset=${startCharOffset}`, 'text-emerald-400');
    setDTState(startCharOffset > 0 ? 'responding' : 'speaking');
    // 延迟切回 speaking(续播时短暂显示 responding)
    if (startCharOffset > 0) {
      setTimeout(() => { if (dtState === 'responding') setDTState('speaking'); }, 600);
    }
  };

  // 用 boundary 事件跟踪当前字符位置(用于断点记录)
  u.onboundary = (ev: SpeechSynthesisEvent) => {
    if (ev.name === 'word' || ev.name === 'sentence') {
      // charIndex 是本次 utterance 的相对位置,加上起始 offset 得到全局位置
      const globalOffset = startCharOffset + ev.charIndex;
      // 更新显示的字幕,保留已读部分
      const spoken = text.substring(0, globalOffset);
      const remaining = text.substring(globalOffset);
      el.subtitle.innerHTML = `<span class="text-emerald-300">${spoken}</span>${remaining}`;
      // 记录最新位置(万一被打断可取用)
      (u as any)._lastOffset = globalOffset;
    }
  };

  u.onend = () => {
    log(`✅ TTS 播放结束`, 'text-slate-400');
    if (dtState === 'speaking' || dtState === 'responding') {
      setDTState('idle');
    }
    currentUtterance = null;
    onEnd?.();
  };

  u.onerror = (e) => {
    // 主动 cancel 也会走 onerror,不当 bug
    if (e.error !== 'canceled' && e.error !== 'interrupted') {
      log(`❌ TTS 错误: ${e.error}`, 'text-red-400');
    }
  };

  currentUtterance = u;
  speechSynthesis.speak(u);
}

function fadeOutTTS(): number {
  // 浏览器 SpeechSynthesis 没有原生 fade,只能 cancel
  // 真实场景下 Agora + 后端 TTS 可实现包络淡出
  const t0 = performance.now();
  if (currentUtterance) {
    const lastOffset = (currentUtterance as any)._lastOffset || 0;
    if (currentScript && lastOffset < currentScript.text.length) {
      lastBreakpoint = {
        scene_id: currentScript.id,
        char_offset: lastOffset,
        ts: Date.now(),
      };
      el.metricBreakpoint.textContent = String(lastOffset);
    }
  }
  speechSynthesis.cancel();
  currentUtterance = null;
  return performance.now() - t0;
}

// ============ Barge-in 控制器 ============
function triggerBargeIn() {
  if (bargeInInProgress) return;
  bargeInInProgress = true;
  bargeInFiredTs = performance.now();
  bargeInCount++;
  el.metricBargeInCount.textContent = String(bargeInCount);

  log(`🎙 触发 Barge-in (VAD 持续 ≥ ${BARGEIN_DEFAULTS.min_speech_ms}ms)`, 'text-amber-400');

  // ① 淡出 TTS
  const fadeMs = fadeOutTTS();
  const fadeLatency = performance.now() - bargeInFiredTs;
  el.metricFadeLatency.textContent = `${fadeLatency.toFixed(0)}ms`;
  log(`   淡出时延: ${fadeLatency.toFixed(0)}ms ${fadeLatency <= 500 ? '✓' : '✗'}`,
      fadeLatency <= 500 ? 'text-emerald-400' : 'text-red-400');

  // ② 切 listening
  setDTState('listening');
  setSubtitle('老师正在听...', true);

  if (lastBreakpoint) {
    log(`   记录断点: scene=${lastBreakpoint.scene_id} char=${lastBreakpoint.char_offset}`,
        'text-slate-400');
  }
}

function endBargeIn() {
  if (!bargeInInProgress) return;

  log(`🔇 学员发言结束(静默 ≥ ${BARGEIN_DEFAULTS.silence_end_ms}ms)`, 'text-slate-300');

  // 简化:Mock 模式跳过 ASR + 意图分类,直接判定为 noise (无意义打断)
  // 真实场景:这里调用 ASR + 意图分类 → question/answer/noise
  log(`   [Mock] 意图分类 = noise · 忽略并续播`, 'text-purple-300');

  setDTState('thinking');

  // ④ 从断点续播,加过渡句
  setTimeout(() => {
    if (!lastBreakpoint || !currentScript) {
      setDTState('idle');
      bargeInInProgress = false;
      return;
    }
    const resumeStartTs = performance.now();
    log(`▶ 从断点续播 · char_offset=${lastBreakpoint.char_offset}`, 'text-sky-400');

    // 过渡句 + 断点后文本
    const transition = '好,我们继续...';
    speak(transition + currentScript.text.substring(lastBreakpoint.char_offset),
      0, // 这里 offset 从 0 开始(因为拼接了过渡句),不再是原脚本的 offset
      () => {
        bargeInInProgress = false;
      }
    );

    const resumeLatency = performance.now() - resumeStartTs;
    el.metricResumeLatency.textContent = `${resumeLatency.toFixed(0)}ms`;
    log(`   续播起讲: ${resumeLatency.toFixed(0)}ms ${resumeLatency <= 1500 ? '✓' : '⚠'}`,
        resumeLatency <= 1500 ? 'text-emerald-400' : 'text-amber-400');
  }, 400);
}

// ============ VAD 检测(Web Audio API) ============
async function startMic() {
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });
    audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(micStream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);

    el.micState.textContent = '运行中';
    el.micState.className = 'px-3 py-1 rounded-full bg-emerald-500 text-xs font-semibold pulse-green';
    el.btnMic.className = 'w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-2xl font-bold';

    log(`🎙 麦克风已启动(AEC/ANS/AGC 已开启)`, 'text-emerald-400');

    requestAnimationFrame(vadLoop);
  } catch (e: any) {
    log(`❌ 麦克风启动失败: ${e.message}`, 'text-red-400');
  }
}

function stopMic() {
  micStream?.getTracks().forEach(t => t.stop());
  audioCtx?.close();
  audioCtx = null;
  analyser = null;
  micStream = null;
  el.micState.textContent = '未启动';
  el.micState.className = 'px-3 py-1 rounded-full bg-slate-700 text-xs font-semibold';
  el.btnMic.className = 'w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 flex items-center justify-center text-2xl font-bold';
  el.vadBar.style.width = '0%';
  el.vadReading.textContent = '-- dBFS';
  log(`🔇 麦克风已关闭`, 'text-slate-400');
}

function vadLoop() {
  if (!analyser) return;
  const buf = new Float32Array(analyser.fftSize);
  analyser.getFloatTimeDomainData(buf);

  // 计算 RMS → dBFS
  let sumSq = 0;
  for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
  const rms = Math.sqrt(sumSq / buf.length);
  const dbfs = 20 * Math.log10(rms + 1e-10);

  // 更新 UI
  const pct = Math.max(0, Math.min(100, ((dbfs + 60) / 60) * 100));
  el.vadBar.style.width = `${pct}%`;
  el.vadReading.textContent = `${dbfs.toFixed(1)} dBFS`;

  // 变色
  if (dbfs > BARGEIN_DEFAULTS.vad_threshold_dbfs) {
    el.vadBar.className = 'h-full bg-amber-500';
  } else {
    el.vadBar.className = 'h-full bg-emerald-500';
  }

  // VAD 状态机
  const now = performance.now();
  const isSpeech = dbfs > BARGEIN_DEFAULTS.vad_threshold_dbfs;

  if (isSpeech) {
    if (lastVadState === 'silence') {
      vadStartTs = now;
      lastVadState = 'speech';
    }
    silenceStartTs = 0;
    // 持续时长达到最小值 → 触发打断(仅在 DT speaking 时)
    if (!bargeInInProgress
        && dtState === 'speaking'
        && now - vadStartTs >= BARGEIN_DEFAULTS.min_speech_ms) {
      triggerBargeIn();
    }
  } else {
    if (lastVadState === 'speech') {
      silenceStartTs = now;
      lastVadState = 'silence';
    }
    // 静默达到阈值 → 结束打断
    if (bargeInInProgress && silenceStartTs && now - silenceStartTs >= BARGEIN_DEFAULTS.silence_end_ms) {
      silenceStartTs = 0;
      endBargeIn();
    }
  }

  requestAnimationFrame(vadLoop);
}

// ============ 事件绑定 ============
el.btnPlayShort.addEventListener('click', () => {
  currentScript = SCRIPTS.short;
  el.board.textContent = currentScript.board;
  bargeInInProgress = false;
  speak(currentScript.text);
});

el.btnPlayLong.addEventListener('click', () => {
  currentScript = SCRIPTS.long;
  el.board.textContent = currentScript.board;
  bargeInInProgress = false;
  speak(currentScript.text);
});

el.btnStop.addEventListener('click', () => {
  speechSynthesis.cancel();
  setDTState('idle');
  setSubtitle('等待播放...');
  log(`⏹ 手动停止`, 'text-slate-400');
});

el.btnMic.addEventListener('click', () => {
  if (micStream) stopMic();
  else startMic();
});

el.btnClearLog.addEventListener('click', () => {
  el.log.innerHTML = '<div class="text-slate-500">// 已清空</div>';
});

el.modeReal.addEventListener('change', () => {
  if (el.modeReal.checked) {
    log(`⚠️  Real 模式需要 VITE_AGORA_APP_ID · 当前为 Mock(仍可演示 Barge-in 逻辑)`, 'text-amber-400');
    log(`   TODO: 集成 agora-rtc-sdk-ng 替换 Web Audio API 与 speechSynthesis`, 'text-slate-400');
    el.modeReal.checked = false;
  }
});

// ============ 初始化 ============
setDTState('idle');
log(`🚀 Barge-in PoC 启动 · 默认 Mock 模式`, 'text-emerald-400');
log(`   参数:VAD阈值=${BARGEIN_DEFAULTS.vad_threshold_dbfs}dBFS · 最小持续=${BARGEIN_DEFAULTS.min_speech_ms}ms · 静默结束=${BARGEIN_DEFAULTS.silence_end_ms}ms`, 'text-slate-400');

// 预加载 TTS 音色
speechSynthesis.onvoiceschanged = () => {
  const voices = speechSynthesis.getVoices();
  const zh = voices.filter(v => v.lang.startsWith('zh'));
  log(`🎤 可用中文音色: ${zh.length} 个 (${zh.slice(0,3).map(v=>v.name).join(', ')})`, 'text-slate-400');
};
