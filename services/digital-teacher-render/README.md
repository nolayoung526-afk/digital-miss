# 数字人渲染服务(Digital Teacher Render)

> 📅 **启动**:Sprint 1(W1-W2) · 负责人:算法 L1 + 后端 L1
> 🚨 **关键路径**:GPU 密集,决定 MVP 上限

## 职责

服务端渲染数字人音视频流,作为 **Agora Broadcaster 虚拟发布端** 推入课堂房间。

## 输入 → 输出

```
输入:  脚本 JSON(含话术/板书/情绪/手势)
       +  学员画像(策略引擎下发的 K3_tts_speed 等参数)
       ↓
    ┌─────────────────┐
    │ TTS 双通道(主自研+备火山)│   → 音频 PCM 48kHz
    ├─────────────────┤
    │ 唇形驱动(Wav2Lip + 自研口型库)│  → 唇形关键帧
    ├─────────────────┤
    │ 表情/手势动画(Live2D)│  → 视频帧 15fps 1280×720
    ├─────────────────┤
    │ 板书引擎合成(Canvas → 视频叠加)│
    └─────────────────┘
       ↓
输出:  Agora RTC 推流(音频 48kHz + 视频 720p15)
       +  脚本进度回调(char_offset · 用于 Barge-in 断点)
```

## 技术栈

- **语言**:Python 3.11
- **深度学习**:PyTorch 2.x + ONNX Runtime(INT8 量化部署)
- **推流**:Agora Server SDK(Linux)
- **容器**:Docker + NVIDIA Container Toolkit
- **编排**:Kubernetes(GPU Pool · A10/A100 混部)

## 性能目标(卷四 §4.5)

| 指标 | 目标 |
|---|---|
| 端到端音频延迟 | ≤ 400ms (P95) |
| 唇形-音频偏差 | ≤ 80ms |
| TTS 淡出时延 | ≤ 200ms(需暴露 `fadeOut()` 原子接口) |
| GPU 单节成本 | ≤ ¥6(MVP 基线)→ ≤ ¥2.8(P0 优化后) |

## 降本三招(卷七 §7.8.2 P0)

1. Persona 共享渲染池(同 Persona 多班复用实例)· -25%
2. 帧率动态降级(讲解 30fps / 听学员 15fps / 等待 10fps)· -30%
3. Wav2Lip INT8 量化(精度损失 < 2%)· -20% 算力

## 🚀 快速启动

```bash
cd services/digital-teacher-render

# 本机开发(CPU Mock)
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8084

# 文档
open http://localhost:8084/docs
```

## 📁 工程结构

```
digital-teacher-render/
├── pyproject.toml
├── Dockerfile
├── README.md
├── app/
│   ├── main.py                     # FastAPI 入口
│   ├── settings.py                 # GPU / Agora / TTS 配置
│   ├── models/schemas.py           # BoardAction / Scene / RenderRequest
│   ├── services/
│   │   ├── tts.py                  # 双通道 TTS(主自研 + 备火山)
│   │   ├── lip_sync.py             # Wav2Lip INT8 量化(占位)
│   │   ├── board_renderer.py       # 板书指令 → 视频叠加
│   │   ├── agora_publisher.py      # Agora Server SDK 封装
│   │   └── render_pipeline.py      # 主流水线编排
│   └── api/
│       └── render_router.py        # 内部 API(orchestrator 调用)
└── tests/
```

## 📡 核心 API

| 接口 | 说明 |
|---|---|
| `POST /internal/v1/render/start` | 开始渲染(异步)· 入频道 + 按序播分镜 |
| `POST /internal/v1/render/fade-out` | Barge-in 淡出 · 返回断点 |
| `POST /internal/v1/render/resume` | 从断点续播 |

## 🎯 Sprint 1 待补

- [ ] 真 Wav2Lip ONNX 权重部署 + GPU 推理
- [ ] agora-python-server-sdk 私服接入
- [ ] skia-python 板书渲染 · 60fps 手写动画
- [ ] FP-01 / FP-02 触发逻辑(TTS 失败 / 唇形错位)

## 🎯 降本路径(卷七 §7.8 · GPU 占总成本 60%+)

| # | 手段 | 预期 |
|---|---|---|
| P0-1 | Persona 共享渲染池 | -25% |
| P0-2 | 帧率降级(speaking 30fps · listening 15fps · idle 10fps) | -30% |
| P0-3 | Wav2Lip INT8 量化 | -20% 算力 |
| P1-1 | 静态场景缓存(倾听态复用帧池) | -15% |
| P1-2 | 动作复用库(鼓掌 / 指向 预渲染) | -20% |
| P1-3 | Spot 实例混部 | -30% 单价 |
