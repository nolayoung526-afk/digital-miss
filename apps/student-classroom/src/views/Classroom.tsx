'use client';

import { useEffect, useState } from 'react';
import DigitalTeacherView from '@/components/DigitalTeacherView';
import StudentGrid from '@/components/StudentGrid';
import BoardArea from '@/components/BoardArea';
import AnswerPanel from '@/components/AnswerPanel';
import BottomBar from '@/components/BottomBar';
import { useClassroomStore } from '@/store/classroom';
import type { RemoteMedia } from '@/lib/agora';

type RtcStatus = 'idle' | 'joining' | 'connected' | 'error' | 'mock';

export default function Classroom() {
  const { stars, setSubtitle, setBoardText, setDTState, callOn, clearCall } = useClassroomStore();
  const [rtcStatus, setRtcStatus] = useState<RtcStatus>('idle');
  const [rtcError, setRtcError] = useState<string>('');
  const [remotes, setRemotes] = useState<RemoteMedia[]>([]);

  // 真实 RTC 连接 · 只在 AppID + Token 都配齐时触发
  // 动态 import 避免 Agora SDK 在 SSR 时访问 window
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
    const token = process.env.NEXT_PUBLIC_AGORA_TEMP_TOKEN;
    const channel = process.env.NEXT_PUBLIC_AGORA_CHANNEL || 'demo_classroom';
    if (!appId || !token) {
      setRtcStatus('mock');
      return;
    }
    setRtcStatus('joining');
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    (async () => {
      try {
        const { getAgoraClient } = await import('@/lib/agora');
        if (cancelled) return;
        const client = getAgoraClient();
        const off = client.onRemoteChange(setRemotes);
        const uid = `stu_${Math.floor(Math.random() * 10000)}`;
        await client.join({ appId, token, channel, uid, role: 'host' });
        if (cancelled) {
          off();
          await client.leave().catch(() => undefined);
          return;
        }
        setRtcStatus('connected');
        cleanup = () => {
          off();
          client.leave().catch(() => undefined);
        };
      } catch (e) {
        if (cancelled) return;
        setRtcStatus('error');
        setRtcError((e as Error).message);
        console.error('[Agora] join failed', e);
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // Demo:模拟一次完整的分镜 · 便于第一次启动看到效果
  // 真实场景:订阅后端 SSE/WS 获取脚本进度 + 声网远端媒体
  useEffect(() => {
    const run = async () => {
      await sleep(800);
      setDTState('speaking');
      setSubtitle('小朋友们,我们来看这道题 · 3 + 5 等于几?');
      setBoardText('3 + 5 = ?');

      await sleep(3000);
      setSubtitle('小明,你来试试!');
      callOn('stu_demo');

      await sleep(15000);
      clearCall();
      setSubtitle('大家都回答得很棒,我们继续!');
      setDTState('responding');

      await sleep(2500);
      setDTState('idle');
      setSubtitle('准备下一题...');
    };
    run();
  }, []);

  return (
    <div className="h-screen flex flex-col">
      {/* 顶栏 */}
      <header className="px-5 py-2.5 bg-slate-950/90 backdrop-blur flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-xs font-semibold">AI 老师</span>
          <div>
            <div className="text-sm font-semibold">原型:王老师</div>
            <div className="text-[10px] text-slate-400">加法王国 · 第 5 课</div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div
            className={`px-2 py-0.5 rounded-full font-semibold ${
              rtcStatus === 'connected'
                ? 'bg-emerald-500/20 text-emerald-300'
                : rtcStatus === 'joining'
                  ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                  : rtcStatus === 'error'
                    ? 'bg-red-500/20 text-red-300'
                    : 'bg-slate-700 text-slate-400'
            }`}
            title={rtcError || rtcStatus}
          >
            RTC · {rtcStatus === 'connected'
              ? `已入频道 · 远端 ${remotes.length}`
              : rtcStatus === 'joining'
                ? '入频道中...'
                : rtcStatus === 'error'
                  ? `失败:${rtcError.slice(0, 40)}`
                  : rtcStatus === 'mock'
                    ? 'Mock 模式'
                    : '待连'}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-300">网络良好 · 98ms</span>
          </div>
          <div className="text-amber-400 font-semibold">⏱ 剩余 22:13</div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-300">
            <span>⭐</span>
            <span className="font-bold">{stars}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-3 p-3 min-h-0">
        <section className="col-span-8 flex flex-col gap-3 min-h-0">
          <DigitalTeacherView />
          <BoardArea />
        </section>
        <aside className="col-span-4 flex flex-col gap-3 min-h-0">
          <StudentGrid />
          <AnswerPanel />
        </aside>
      </main>

      <BottomBar />
    </div>
  );
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
