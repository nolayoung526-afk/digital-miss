'use client';

import { useEffect, useRef, useState } from 'react';
import { BARGEIN_DEFAULTS } from '@digital-teacher/shared-types';

type DTState = 'idle' | 'speaking' | 'listening' | 'thinking' | 'responding' | 'paused';

interface LogEntry {
  ts: string;
  text: string;
  color: string;
}

const STATE_COLORS: Record<DTState, string> = {
  idle: 'bg-slate-700',
  speaking: 'bg-emerald-500 animate-pulse-green',
  listening: 'bg-amber-500 animate-pulse-amber',
  thinking: 'bg-purple-500',
  responding: 'bg-sky-500',
  paused: 'bg-red-500',
};

const STATE_EMOJI: Record<DTState, string> = {
  idle: '😌',
  speaking: '👩‍🏫',
  listening: '🤔',
  thinking: '💭',
  responding: '😊',
  paused: '😯',
};

const SCRIPTS = {
  short: { id: 'sc_12', text: '小明,3 加 5 等于几呀?', board: '3 + 5 = ?' },
  long: {
    id: 'sc_11',
    text: '小朋友们大家好呀,今天我们一起来学习加法。先看这道题:3 个苹果再加上 5 个苹果,一共是几个苹果呢?我们可以用手指数一数,大家跟着豆豆老师一起来,三根手指加上五根手指,一起数数看。',
    board: '3 苹果 + 5 苹果 = ?',
  },
};

export default function BargeInPoc() {
  const [dtState, setDtState] = useState<DTState>('idle');
  const [subtitle, setSubtitle] = useState<{ spoken: string; remaining: string }>({
    spoken: '',
    remaining: '等待播放...',
  });
  const [board, setBoard] = useState('');
  const [micOn, setMicOn] = useState(false);
  const [dbfs, setDbfs] = useState<number | null>(null);
  const [metrics, setMetrics] = useState({
    bargeInCount: 0,
    fadeLatency: '--',
    resumeLatency: '--',
    breakpoint: '--',
  });
  const [logs, setLogs] = useState<LogEntry[]>([
    { ts: '', text: '// 等待事件...', color: 'text-slate-500' },
  ]);

  const dtStateRef = useRef<DTState>('idle');
  const currentScriptRef = useRef<typeof SCRIPTS.short | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const lastBreakpointRef = useRef<{ sceneId: string; charOffset: number; ts: number } | null>(null);
  const bargeInInProgressRef = useRef(false);
  const bargeInFiredTsRef = useRef(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const vadStartTsRef = useRef(0);
  const silenceStartTsRef = useRef(0);
  const lastVadStateRef = useRef<'silence' | 'speech'>('silence');
  const rafRef = useRef<number | null>(null);

  // keep ref in sync with state
  useEffect(() => { dtStateRef.current = dtState; }, [dtState]);

  const log = (text: string, color = 'text-slate-300') => {
    const ts = new Date().toISOString().substring(11, 23);
    setLogs((prev) => [...prev, { ts, text, color }].slice(-150));
  };

  // ========== TTS ==========
  const speak = (text: string, startOffset = 0, onEnd?: () => void) => {
    const displayText = text.substring(startOffset);
    if (!displayText) { onEnd?.(); return; }

    const u = new SpeechSynthesisUtterance(displayText);
    u.lang = 'zh-CN';
    u.rate = 0.95;
    u.pitch = 1.1;
    const zh = speechSynthesis.getVoices().find((v) => v.lang.startsWith('zh'));
    if (zh) u.voice = zh;

    u.onstart = () => {
      log(`🔊 TTS 开始 · char_offset=${startOffset}`, 'text-emerald-400');
      setDtState(startOffset > 0 ? 'responding' : 'speaking');
      if (startOffset > 0) setTimeout(() => {
        if (dtStateRef.current === 'responding') setDtState('speaking');
      }, 600);
    };

    u.onboundary = (ev: SpeechSynthesisEvent) => {
      const globalOffset = startOffset + ev.charIndex;
      setSubtitle({
        spoken: text.substring(0, globalOffset),
        remaining: text.substring(globalOffset),
      });
      (u as SpeechSynthesisUtterance & { _lastOffset?: number })._lastOffset = globalOffset;
    };

    u.onend = () => {
      log('✅ TTS 结束', 'text-slate-400');
      if (dtStateRef.current === 'speaking' || dtStateRef.current === 'responding') {
        setDtState('idle');
      }
      currentUtteranceRef.current = null;
      onEnd?.();
    };

    currentUtteranceRef.current = u;
    speechSynthesis.speak(u);
  };

  const fadeOutTTS = () => {
    const t0 = performance.now();
    const u = currentUtteranceRef.current as
      | (SpeechSynthesisUtterance & { _lastOffset?: number })
      | null;
    if (u && currentScriptRef.current) {
      const lastOffset = u._lastOffset ?? 0;
      if (lastOffset < currentScriptRef.current.text.length) {
        lastBreakpointRef.current = {
          sceneId: currentScriptRef.current.id,
          charOffset: lastOffset,
          ts: Date.now(),
        };
        setMetrics((m) => ({ ...m, breakpoint: String(lastOffset) }));
      }
    }
    speechSynthesis.cancel();
    currentUtteranceRef.current = null;
    return performance.now() - t0;
  };

  // ========== Barge-in ==========
  const triggerBargeIn = () => {
    if (bargeInInProgressRef.current) return;
    bargeInInProgressRef.current = true;
    bargeInFiredTsRef.current = performance.now();

    setMetrics((m) => {
      const next = { ...m, bargeInCount: m.bargeInCount + 1 };
      return next;
    });

    log(`🎙 触发 Barge-in (VAD ≥ ${BARGEIN_DEFAULTS.min_speech_ms}ms)`, 'text-amber-400');

    const fadeMs = performance.now() - bargeInFiredTsRef.current;
    fadeOutTTS();
    const fadeLatency = performance.now() - bargeInFiredTsRef.current;
    setMetrics((m) => ({ ...m, fadeLatency: `${fadeLatency.toFixed(0)}ms` }));
    log(
      `   淡出时延: ${fadeLatency.toFixed(0)}ms ${fadeLatency <= 500 ? '✓' : '✗'}`,
      fadeLatency <= 500 ? 'text-emerald-400' : 'text-red-400'
    );

    setDtState('listening');
    setSubtitle({ spoken: '', remaining: '老师正在听...' });

    if (lastBreakpointRef.current) {
      log(
        `   记录断点: scene=${lastBreakpointRef.current.sceneId} char=${lastBreakpointRef.current.charOffset}`,
        'text-slate-400'
      );
    }
  };

  const endBargeIn = () => {
    if (!bargeInInProgressRef.current) return;
    log(`🔇 学员结束(静默 ≥ ${BARGEIN_DEFAULTS.silence_end_ms}ms)`, 'text-slate-300');
    log('   [Mock] 意图分类 = noise · 忽略并续播', 'text-purple-300');

    setDtState('thinking');
    setTimeout(() => {
      const bp = lastBreakpointRef.current;
      const script = currentScriptRef.current;
      if (!bp || !script) {
        setDtState('idle');
        bargeInInProgressRef.current = false;
        return;
      }
      const t0 = performance.now();
      log(`▶ 从断点续播 · char_offset=${bp.charOffset}`, 'text-sky-400');
      const transition = '好,我们继续...';
      speak(transition + script.text.substring(bp.charOffset), 0, () => {
        bargeInInProgressRef.current = false;
      });
      const resumeLatency = performance.now() - t0;
      setMetrics((m) => ({ ...m, resumeLatency: `${resumeLatency.toFixed(0)}ms` }));
      log(
        `   续播起讲: ${resumeLatency.toFixed(0)}ms ${resumeLatency <= 1500 ? '✓' : '⚠'}`,
        resumeLatency <= 1500 ? 'text-emerald-400' : 'text-amber-400'
      );
    }, 400);
  };

  // ========== VAD ==========
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      });
      const ctx = new AudioContext();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      micStreamRef.current = stream;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setMicOn(true);
      log('🎙 麦克风启动(AEC/ANS/AGC 开)', 'text-emerald-400');

      const loop = () => {
        if (!analyserRef.current) return;
        const buf = new Float32Array(analyserRef.current.fftSize);
        analyserRef.current.getFloatTimeDomainData(buf);
        let sumSq = 0;
        for (let i = 0; i < buf.length; i++) sumSq += buf[i] * buf[i];
        const rms = Math.sqrt(sumSq / buf.length);
        const db = 20 * Math.log10(rms + 1e-10);
        setDbfs(db);

        const now = performance.now();
        const isSpeech = db > BARGEIN_DEFAULTS.vad_threshold_dbfs;
        if (isSpeech) {
          if (lastVadStateRef.current === 'silence') {
            vadStartTsRef.current = now;
            lastVadStateRef.current = 'speech';
          }
          silenceStartTsRef.current = 0;
          if (
            !bargeInInProgressRef.current &&
            dtStateRef.current === 'speaking' &&
            now - vadStartTsRef.current >= BARGEIN_DEFAULTS.min_speech_ms
          ) {
            triggerBargeIn();
          }
        } else {
          if (lastVadStateRef.current === 'speech') {
            silenceStartTsRef.current = now;
            lastVadStateRef.current = 'silence';
          }
          if (
            bargeInInProgressRef.current &&
            silenceStartTsRef.current &&
            now - silenceStartTsRef.current >= BARGEIN_DEFAULTS.silence_end_ms
          ) {
            silenceStartTsRef.current = 0;
            endBargeIn();
          }
        }

        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      log(`❌ 麦克风失败: ${(e as Error).message}`, 'text-red-400');
    }
  };

  const stopMic = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    micStreamRef.current = null;
    setMicOn(false);
    setDbfs(null);
    log('🔇 麦克风关闭', 'text-slate-400');
  };

  const playShort = () => {
    currentScriptRef.current = SCRIPTS.short;
    setBoard(SCRIPTS.short.board);
    bargeInInProgressRef.current = false;
    speak(SCRIPTS.short.text);
  };
  const playLong = () => {
    currentScriptRef.current = SCRIPTS.long;
    setBoard(SCRIPTS.long.board);
    bargeInInProgressRef.current = false;
    speak(SCRIPTS.long.text);
  };
  const stop = () => {
    speechSynthesis.cancel();
    setDtState('idle');
    setSubtitle({ spoken: '', remaining: '等待播放...' });
    log('⏹ 手动停止', 'text-slate-400');
  };

  useEffect(() => {
    log('🚀 Barge-in PoC 启动 · Mock 模式', 'text-emerald-400');
    log(
      `   VAD阈值=${BARGEIN_DEFAULTS.vad_threshold_dbfs}dBFS · 最小持续=${BARGEIN_DEFAULTS.min_speech_ms}ms · 静默结束=${BARGEIN_DEFAULTS.silence_end_ms}ms`,
      'text-slate-400'
    );
    return () => { stopMic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dbfsPct = dbfs !== null ? Math.max(0, Math.min(100, ((dbfs + 60) / 60) * 100)) : 0;

  return (
    <main className="min-h-screen bg-slate-900 text-white">
      <header className="border-b border-slate-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-slate-900">PoC</span>
          <div>
            <h1 className="text-sm font-semibold">声网 Barge-in 优雅打断 · PoC</h1>
            <p className="text-xs text-slate-400">W0 · 验证打断响应 ≤ 500ms · 断点续播</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-4 p-4">
        <section className="col-span-7 space-y-4">
          <div className="bg-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300">数字人</h2>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${STATE_COLORS[dtState]}`}>{dtState}</div>
            </div>
            <div className="aspect-video bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl flex items-center justify-center relative">
              <div className="text-[120px]">{STATE_EMOJI[dtState]}</div>
              <div className="absolute bottom-4 left-4 right-4 text-center">
                <div className="inline-block max-w-[80%] px-4 py-2 rounded-xl bg-black/60 text-sm">
                  <span className="text-emerald-300">{subtitle.spoken}</span>
                  {subtitle.remaining}
                </div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <button onClick={playShort} className="py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold">▶ 播放短句</button>
              <button onClick={playLong} className="py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold">▶ 播放长段</button>
              <button onClick={stop} className="py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-sm font-semibold">■ 停止</button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-300">学员麦克风(VAD)</h2>
              <div className={`px-3 py-1 rounded-full text-xs font-semibold ${micOn ? 'bg-emerald-500 animate-pulse-green' : 'bg-slate-700'}`}>
                {micOn ? '运行中' : '未启动'}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => (micOn ? stopMic() : startMic())}
                className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${micOn ? 'bg-red-500 hover:bg-red-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
              >
                🎙
              </button>
              <div className="flex-1">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>音量</span>
                  <span className="font-mono">{dbfs !== null ? `${dbfs.toFixed(1)} dBFS` : '-- dBFS'}</span>
                </div>
                <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-100 ${dbfs !== null && dbfs > BARGEIN_DEFAULTS.vad_threshold_dbfs ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${dbfsPct}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  VAD 阈值: <span className="font-mono">-42 dBFS</span> · 最小持续: <span className="font-mono">300ms</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 text-slate-900 rounded-2xl p-4 min-h-[80px]">
            <div className="text-xs font-semibold text-amber-700 uppercase tracking-wider">🖊 板书</div>
            <div className="mt-2 text-xl font-bold">{board}</div>
          </div>
        </section>

        <aside className="col-span-5 space-y-4">
          <div className="bg-slate-800 rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3">⚡ 实时指标</h3>
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-xl bg-slate-900">
                <div className="text-2xl font-bold text-amber-400">{metrics.bargeInCount}</div>
                <div className="text-[10px] text-slate-400 mt-1">打断次数</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900">
                <div className="text-2xl font-bold text-emerald-400">{metrics.fadeLatency}</div>
                <div className="text-[10px] text-slate-400 mt-1">淡出时延(最新)</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900">
                <div className="text-2xl font-bold text-sky-400">{metrics.resumeLatency}</div>
                <div className="text-[10px] text-slate-400 mt-1">续播起讲</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900">
                <div className="text-2xl font-bold text-purple-400">{metrics.breakpoint}</div>
                <div className="text-[10px] text-slate-400 mt-1">断点字符位</div>
              </div>
            </div>
            <div className="mt-3 p-3 rounded-xl bg-slate-900">
              <div className="text-[10px] text-slate-500 mb-1">目标阈值</div>
              <ul className="text-xs text-slate-300 space-y-1">
                <li>· 淡出时延 ≤ 500ms</li>
                <li>· 续播起讲 ≤ 1500ms</li>
                <li>· 打断/分钟 ≤ 6(超过触发 FP-05)</li>
              </ul>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-300">📜 事件日志</h3>
              <button
                onClick={() => setLogs([{ ts: '', text: '// 已清空', color: 'text-slate-500' }])}
                className="text-[10px] text-slate-400 hover:text-white"
              >清空</button>
            </div>
            <div className="font-mono text-[11px] space-y-1 max-h-[360px] overflow-y-auto bg-slate-950 rounded-lg p-3">
              {logs.map((l, i) => (
                <div key={i} className={l.color}>
                  {l.ts && <span className="text-slate-500">[{l.ts}] </span>}
                  {l.text}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-indigo-950/50 border border-indigo-800 rounded-2xl p-4 text-xs">
            <div className="font-semibold text-indigo-300 mb-2">🧪 如何测试</div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300">
              <li>点击 &quot;▶ 播放长段&quot; 启动 TTS</li>
              <li>点击 🎙 打开麦克风</li>
              <li>TTS 播放中,对麦克风说 &quot;老师老师&quot;</li>
              <li>观察:数字人 300ms 内切 listening,字幕淡出</li>
              <li>停止说话,观察:从断点续讲,加过渡句</li>
            </ol>
          </div>
        </aside>
      </div>
    </main>
  );
}
