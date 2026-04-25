# teacher-asset-mgr

> 🎭 数字人 Persona 与脚本资产管理 · Sprint 2 启动

## 职责

1. **Persona 克隆**:接收老师照片 + 音频样本 → 调厂商 API 生成 `vendor_avatar_id` / `vendor_voice_id` → 落库 `teacher_personas` 表
2. **授权合规**:校验肖像 + 声音授权书 URL 与有效期,过期 Persona 自动置 `suspended`
3. **多厂商适配**:`AvatarRenderAdapter` / `VoiceCloneAdapter` 接口层 · Mock(默认)/ 腾讯智影 / HeyGen / Minimax 可切换

## 快速启动(本地 · Mock 模式)

```bash
cd services/teacher-asset-mgr
mvn spring-boot:run
# → http://localhost:8082/swagger-ui.html
```

## 核心接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/v1/persona/clone` | 克隆新 Persona(同步返回,内部调厂商) |
| GET  | `/api/v1/persona/{personaId}` | 查询 Persona |
| POST | `/api/v1/persona/{personaId}/approve` | 教研审核通过 |

Mock Clone 请求示例:

```bash
curl -X POST http://localhost:8082/api/v1/persona/clone \
  -H 'Content-Type: application/json' \
  -d '{
    "realTeacherId": "T-001",
    "displayName": "王老师",
    "photoOssUrl": "oss://bucket/photos/t001.jpg",
    "voiceSampleOssUrl": "oss://bucket/voices/t001.wav",
    "licenseDocUrl": "oss://bucket/licenses/t001.pdf",
    "licenseValidUntil": "2027-12-31"
  }'
```

## 切换真实厂商

```bash
# 环境变量
ADAPTER_AVATAR=tencent_yinsu   # 切腾讯智影
ADAPTER_VOICE=minimax          # 切 Minimax TTS

# 对应的 API Key 走 Spring Secret 挂载(K8s Secret / 本地 .env)
TENCENT_YINSU_SECRET_ID=xxx
TENCENT_YINSU_SECRET_KEY=xxx
MINIMAX_API_KEY=xxx
```

> **Sprint 2 到位后**新建 `adapter/tencent/TencentYinsuAdapter.java` 和 `adapter/minimax/MinimaxVoiceAdapter.java`,加 `@ConditionalOnProperty` 匹配环境值即可,不需要改业务代码。

## 当前状态

| 能力 | 状态 |
|---|---|
| Mock Adapter(avatar + voice) | ✅ |
| Persona CRUD + 审核 | ✅ |
| 腾讯智影 Adapter | ⏳ Sprint 2 中期 |
| Minimax TTS Adapter | ⏳ Sprint 2 中期 |
| OSS 直传签名(从教研后台上传照片/音频) | ⏳ |
| 授权过期自动巡检(每日 Scheduler) | ⏳ Sprint 3 |
