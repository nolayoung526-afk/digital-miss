# 预案库 · YAML 清单

> 启动时由 [`PlaybookRegistry`](../../java/com/wandou/fallback/service/PlaybookRegistry.java) 自动扫描加载。
> 生产阶段将迁移到 MySQL · 教研后台可视化编辑(见 PRD 卷二 §2.7 G4)。

## 12 条清单

| YAML | trigger | severity | 最长执行 | 升级目标 |
|---|---|---|---|---|
| fp-01-tts-failure.yaml | tts_primary_failure | high | 10s | assistant |
| fp-02-lip-sync-error.yaml | lip_sync_error | high | 30s | assistant |
| fp-03-asr-repeated-failure.yaml | asr_repeated_failure | mid | 全程 | 降题型 |
| fp-04-student-offline.yaml | student_offline | low | 60s | 补课 |
| fp-05-multi-speak.yaml | multi_speak | mid | 全程 | SFU 限麦 |
| fp-06-courseware-load-fail.yaml | courseware_load_fail | high | 120s | assistant |
| fp-07-network-jitter.yaml | network_jitter | mid | 60s | 降码率 |
| fp-08-emotion-model-fail.yaml | emotion_model_fail | low | 全程 | 静默 |
| fp-09-assistant-offline.yaml | assistant_offline | mid | 30s | 兜底池 |
| fp-10-branch-miss.yaml | branch_miss | low | 即刻 | 教研上报 |
| fp-11-self-check-error.yaml | self_check_error | low | 即刻 | 插入纠正 |
| fp-12-platform-failure.yaml | platform_failure | high | 5min | abort |

## MVP 已入库

本仓库已提供 **4 条关键预案**(FP-01 / FP-05 / FP-09 / FP-12)作为示范。其余 8 条话术全文见 [飞书 PRD 卷六 §6.3](https://www.feishu.cn/docx/PcMzdDXEroncOcxnio0cnGO0nBc),Sprint 1 Day 4 前需完成全部 12 条的 YAML 化 + 合规审核。

## 格式约定

- 每个 YAML 根节点使用 `!!com.wandou.fallback.domain.Playbook` 标签,让 SnakeYAML 直接反序列化
- `personaVariants` 为可选字段 · 不同 Persona 的差异化话术
- `systemAction` 是字符串列表 · 由 FallbackExecutor 路由到具体能力(switch_tts_channel_backup 等)
- 变量占位符 `{{xxx}}` 在执行时由数字人渲染服务替换(如 `{{first_student}}` / `{{正确内容}}`)

## 新增预案流程

1. 教研起草 YAML
2. 学科主管 + 合规 二级审核
3. 合并到仓库 · CI 校验 YAML 语法 + 字段完整性
4. 灰度发布(先 5% 班级启用,无告警后扩全量)

## 热更新

生产环境需支持不重启服务热加载新预案。MVP 阶段通过 `POST /api/v1/fallback/reload` 管理接口触发(TODO · Sprint 1)。
