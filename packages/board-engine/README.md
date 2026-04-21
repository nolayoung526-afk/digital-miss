# 板书引擎(Board Engine)

> 📅 **启动**:Sprint 1(W1-W2) · 负责人:前端 L3 + 算法 L3

## 职责

按脚本 `BoardAction[]` 指令驱动 **拟人化手写动画**,达到真人老师 60% 板书密度。

## 核心能力(MVP)

- `write_text` · 文字手写动画(字符级 stroke-dasharray 渐现)
- `rect` · 红圈 / 蓝框 圈画(SVG path animation)
- `line` / `arrow` · 连线 / 箭头
- `clear` · 渐隐清屏
- `undo` · 口误自检 → 撤销上一笔

## 非 MVP(V1.1)

- `gesture point_to` · 数字人手指联动
- 模板库(竖式 / 表格 / 思维导图)

## 技术栈

- Canvas 2D + SVG(混合)
- 支持 Worker 离屏渲染(性能优化)
- 纯 TypeScript 库,无 React 依赖(可供学员端 / 教研后台 / 预览工具复用)

## 接口设计

```ts
import { BoardEngine } from '@digital-teacher/board-engine';

const board = new BoardEngine(canvas, { width: 800, height: 300 });

await board.execute([
  { type: 'write_text', pos: [100, 150], content: '3 + 5 = ?', duration_ms: 1500 },
  { type: 'rect',       pos: [90, 130, 200, 180], color: 'red', duration_ms: 500 },
  { type: 'clear',      duration_ms: 800 },
]);

// 打断时:
board.pauseAt(500); // 暂停 + 记录断点
board.resumeFrom(breakpoint);
```

## 目标指标(卷七 §7.2)

- 板书动作 ≥ 48 次/节(MVP)· 真人 60% 密度
- 清屏 ≥ 28 次/节
- 单动作渲染 ≤ 16ms(60fps 无卡顿)
