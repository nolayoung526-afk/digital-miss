import { NextResponse } from 'next/server';
import { RtcTokenBuilder, RtcRole } from 'agora-access-token';

export const runtime = 'nodejs';

/**
 * 本地开发用 · Agora RTC Token 自签接口
 *
 * App Certificate 放 .env.local 的 AGORA_APP_CERTIFICATE(服务端环境变量)
 * 不暴露到浏览器 bundle。生产环境应走 class-orchestrator 的同名接口。
 */
export async function POST(req: Request) {
  const appId = process.env.NEXT_PUBLIC_AGORA_APP_ID;
  const appCert = process.env.AGORA_APP_CERTIFICATE;

  if (!appId) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_AGORA_APP_ID 未配置' }, { status: 500 });
  }
  if (!appCert) {
    return NextResponse.json(
      { error: 'AGORA_APP_CERTIFICATE 未配置 · 放 apps/student-classroom/.env.local' },
      { status: 500 },
    );
  }

  const body = (await req.json().catch(() => ({}))) as {
    channel?: string;
    uid?: string;
    role?: string;
  };
  const channel = body.channel || 'demo_classroom';
  const uid = body.uid || '0';
  const role = body.role === 'audience' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;

  const ttlSeconds = Number(process.env.AGORA_TOKEN_TTL ?? 7200);
  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + ttlSeconds;

  const token = RtcTokenBuilder.buildTokenWithAccount(
    appId,
    appCert,
    channel,
    uid,
    role,
    privilegeExpiredTs,
  );

  return NextResponse.json({
    data: {
      appId,
      channel,
      uid,
      token,
      ttlSeconds,
      role: body.role || 'host',
    },
  });
}
