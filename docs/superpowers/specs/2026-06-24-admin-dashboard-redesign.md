# 2026-06-24 系统管理员控制台大盘重构设计文档

系统管理员控制台首页 (`/dashboard`) 需要升级为现代、高级的 Bento Grid (便当盒) 布局，并融入 Apple 风格的微磨砂玻璃质感 (Glassmorphism)。同时，通过高颜值视图切换开关，将系统统计图表与具体的活动创建/管理逻辑完美分离，保持界面的极简与专注。

## 1. 成功标准 (Success Criteria)

- **视觉升级**：全面符合 Web 设计规范，包括圆角缩放、玻璃背景（透明度、毛玻璃模糊）、微渐变背景以及平滑的 hover 阴影放大效果。
- **视图解耦**：右上角提供“系统大盘”与“活动管理”的 Segmented Control 切换开关。
  - 在“系统大盘”下，管理员仅查看系统数据指标、最新用户、分类统计与排行榜。
  - 在“活动管理”下，管理员才可发布新活动、修改或删除已有活动、管理售票情况等。
- **性能与类型安全**：页面加载数据继续使用 `Promise.all` 异步获取，所有 TypeScript 类型及现有的 Lint/Test 保证 100% 通过。

## 2. 界面设计详述

### A. 整体版面布局 (Bento Grid)
页面采用 Flexbox + Grid 混合布局。
- **头部 (Header Area)**：
  - 新增苹果风渐变高光卡片作为欢迎标语板（`bg-gradient-to-r from-brand/90 to-indigo-500/80`），显示“系统管理员控制台 · 全局洞察”。
  - 右侧提供胶囊式的切换控制器 (视图切换开关)。
- **核心数据区 (Stats Area)**：
  - 由 4 个不同尺寸（`col-span-1` 与 `col-span-2`）的 Glassmorphism 卡片交错组装成 Bento Grid。
  - 门票预订与核销卡片拓展为两倍宽，卡片内添加进度比例圈。
- **大盘指标区 (Details Grid)**：
  - 双列大卡片，带有细微的透明毛玻璃模糊阴影效果 (`backdrop-blur-md bg-white/70 dark:bg-black/45 border border-white/20 dark:border-white/10`)。
  - 所有的卡片在 hover 时有微小的向外阴影扩展或向上浮动效果。

### B. 交互方案：大盘视图与活动管理工作区切换
- **大盘视图 (Admin Dashboard)**: 展示系统快捷入口（分类、账号）、核心指标网格、最新成员、各分类活动占比、热门校园活动 Top 5 以及最新发布活动列表。
- **管理视图 (Organizer Dashboard)**: 专门呈现数据分析看板、活动发布表单与活动管理列表。

---

## 3. 具体修改内容计划

### 1. `app/dashboard/page.tsx`
- 新增 `activeTab` 状态变量，用于控制视图切换：`"stats" | "events"`。
- 新增 Segmented Control 组件，提供“系统大盘”和“活动管理”选项。
- 调整页面内容渲染 structure，当 `activeTab === "stats"` 时渲染管理员大盘；当 `activeTab === "events"` 时渲染活动管理。
- 使用 Tailwind 类 `backdrop-blur-md bg-white/70 dark:bg-card/40 border border-border/50 shadow-xs transition-all duration-300 hover:shadow-md hover:border-brand/20` 等装饰卡片，营造 Glassmorphism 微磨砂玻璃质感。

---

## 4. 验证方式 (Verification)

1. **功能验证**：登录管理员账号，进入控制台，验证页面上方切换开关能否正常工作，视图能否顺畅切换。
2. **样式核对**：检查 Glassmorphism 的磨砂感、阴影、圆角是否在 Light / Dark 模式下均保持极高的质感。
3. **测试套件**：执行 `pnpm test` 确保数据统计和流程接口逻辑未发生破坏。
