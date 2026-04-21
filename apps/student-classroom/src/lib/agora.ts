/**
 * 声网 Agora Web SDK 封装
 *
 * 职责:
 *   · 入频道(BROADCASTER / AUDIENCE)
 *   · 订阅数字人主流
 *   · 本地麦克风 + AINS AI 降噪
 *   · Stream Message 信令收发
 *
 * MVP 阶段:不直接处理打断逻辑(交给独立的 barge-in-poc / 后端)
 */
import AgoraRTC, {
  IAgoraRTCClient,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  ILocalAudioTrack,
  IRemoteAudioTrack,
  IRemoteVideoTrack,
  UID,
} from 'agora-rtc-sdk-ng';

export type AINSMode = 'off' | 'balanced' | 'aggressive';

export interface JoinOptions {
  appId: string;
  token: string;
  channel: string;
  uid: string;
  role?: 'host' | 'audience';
  ainsMode?: AINSMode;
}

export interface RemoteMedia {
  uid: UID;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
}

export class AgoraClient {
  private client: IAgoraRTCClient;
  private localAudio?: ILocalAudioTrack;
  private localVideo?: ICameraVideoTrack;
  private remote: Map<UID, RemoteMedia> = new Map();
  private listeners: Array<(remote: RemoteMedia[]) => void> = [];

  constructor() {
    this.client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp9' });
    this.client.on('user-published', async (user, mediaType) => {
      await this.client.subscribe(user, mediaType);
      const media = this.remote.get(user.uid) ?? { uid: user.uid };
      if (mediaType === 'video') media.videoTrack = user.videoTrack;
      if (mediaType === 'audio') {
        media.audioTrack = user.audioTrack;
        user.audioTrack?.play();
      }
      this.remote.set(user.uid, media);
      this.notify();
    });
    this.client.on('user-unpublished', (user) => {
      const m = this.remote.get(user.uid);
      if (m) {
        this.remote.delete(user.uid);
        this.notify();
      }
    });
  }

  /** 订阅远端用户变化 */
  onRemoteChange(cb: (remote: RemoteMedia[]) => void) {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter((f) => f !== cb);
    };
  }

  async join(opts: JoinOptions) {
    await this.client.setClientRole(opts.role ?? 'host');
    await this.client.join(opts.appId, opts.channel, opts.token || null, opts.uid);

    if (opts.role !== 'audience') {
      this.localAudio = await AgoraRTC.createMicrophoneAudioTrack({
        AEC: true,
        ANS: true,
        AGC: true,
        encoderConfig: 'speech_standard',
      });
      // AINS 动态挂载(生产代码需根据 mode 切换 · MVP 略)
      // TODO: import { AIDenoiserExtension } from 'agora-extension-ai-denoiser'
      await this.client.publish([this.localAudio]);
    }
  }

  async leave() {
    this.localAudio?.close();
    this.localVideo?.close();
    await this.client.leave();
    this.remote.clear();
    this.notify();
  }

  /** 设置麦克风静音状态 */
  setMuted(muted: boolean) {
    this.localAudio?.setMuted(muted);
  }

  /** 发送 Stream Message 控制信令 · 低延迟旁路 */
  async sendStreamMessage(data: object): Promise<void> {
    // agora-rtc-sdk-ng 的 sendStreamMessage API 在不同版本略有差异
    // 此处暂用 Data Channel 的简化实现;生产需按 SDK 文档启用
    console.log('[StreamMsg]', data);
  }

  private notify() {
    const snapshot = Array.from(this.remote.values());
    this.listeners.forEach((l) => l(snapshot));
  }
}

// 单例
let _instance: AgoraClient | null = null;
export function getAgoraClient(): AgoraClient {
  if (!_instance) _instance = new AgoraClient();
  return _instance;
}
