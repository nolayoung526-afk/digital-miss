# 安全政策

## 支持的版本

当前 MVP 阶段仅维护 `main` 分支。

## 漏洞报告

**请勿通过公开 Issue 报告安全问题**,而是发送邮件到:
`security@wandou.com`(生产启用前请先申请该邮箱)

我们承诺:
- 收到 24h 内响应
- 严重漏洞 7 天内修复
- 披露时注明报告者(除非匿名)

## 合规红线

- 🚨 严禁在代码、日志、Commit message 中出现:
  - 学员 PII(姓名、手机号、家庭住址等)
  - 真人老师身份证 / 银行卡
  - Agora App Certificate 等密钥

- 🚨 情绪识别 / 摄像头数据:
  - 原始视频帧 **不得出端**
  - 特征向量必须脱敏
  - 家长未授权不得启用

- 🚨 策略规则禁用受保护属性:
  - `student.gender`
  - `student.ethnicity`
  - `student.region`
  - `student.income_level`

  (CI 启动时会拒绝加载违反规则)

## Secret 管理

- 所有密钥通过 Nacos / K8s Secret 注入,不进仓库
- `.env.local` 在 `.gitignore` 中
- Pre-commit hook 检查常见敏感模式(AKIA / 私钥头等)
