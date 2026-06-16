# 统一暗黑模式与亮色模式的 Shadcn/OKLCH 重构设计文档

本文档定义了将项目中现有硬编码暗黑模式样式（如 `dark:bg-zinc-900`）和硬编码品牌强调色（如 `text-indigo-600`）重构为基于 CSS 变量和 shadcn/ui 语义化类（如 `bg-card`、`text-brand`）的方案规范。

## 1. 目标与成功标准

### 目标
- 清理项目中所有 JSX 编写的硬编码暗黑模式颜色类名（如 `dark:bg-zinc-950`、`dark:text-white` 等）。
- 提取专门的品牌色（原本的 `indigo` 系列）到全局 CSS 变量中，通过 `--brand` 以及 Tailwind 别名 `brand` 语义化调用。
- 让亮色与暗色模式的配色配置完全收拢于 `app/globals.css`，达成全局统一。

### 成功标准
- 页面所有色彩与边框表现不受重构影响（亮色与暗色模式视觉效果与重构前一致）。
- 更改 `app/globals.css` 中品牌色（`--brand`）的 OKLCH 属性值后，所有页面的品牌强调色均能自动无缝改变。
- 代码中不含有 `dark:bg-zinc-`、`dark:text-neutral-` 等硬编码颜色名称类名。
- 所有编译与类型检查（如 `pnpm lint` 和 `pnpm typecheck`）正常通过。

## 2. 详细配置设计

### 2.1. 全局样式文件修改 `app/globals.css`

更新 `app/globals.css` 的内容，在 Tailwind CSS v4 `@theme inline` 块内注册自定义 CSS 变量别名，并在 `:root` 与 `.dark` 中定义对应的 OKLCH 变量：

```css
@theme inline {
    /* ...已有的其他变量... */
    
    --color-brand: var(--brand);
    --color-brand-foreground: var(--brand-foreground);
}

:root {
    /* ...已有的其他变量... */
    
    /* 品牌主色 (原本为 indigo-600) */
    --brand: oklch(0.511 0.262 276.966);
    --brand-foreground: oklch(0.985 0 0);
}

.dark {
    /* ...已有的其他变量... */
    
    /* 品牌主色 (原本为 indigo-400) */
    --brand: oklch(0.685 0.186 268.036);
    --brand-foreground: oklch(0.145 0 0);
}
```

### 2.2. 类名替换映射表

重构中将要进行的 JSX 样式类名映射明细：

| 受影响范围 | 原始样式类名 | 替换为语义化样式类名 |
| :--- | :--- | :--- |
| **页面/卡片背景** | `bg-white dark:bg-zinc-900` | `bg-card` |
| | `bg-white dark:bg-zinc-950` | `bg-popover` 或 `bg-background` (下拉框等使用 `bg-popover`) |
| | `bg-neutral-50 dark:bg-zinc-800` | `bg-muted` |
| | `bg-neutral-50 dark:bg-zinc-900/50` | `bg-muted/50` |
| | `bg-[#fcfcfd]/80 dark:bg-zinc-950/80` | `bg-background/80` |
| **品牌高亮背景** | `bg-indigo-50 dark:bg-indigo-950/50` | `bg-brand/10` |
| | `bg-indigo-50/40 dark:bg-indigo-950/20` | `bg-brand/10` 或 `bg-brand/5` |
| **边框与线** | `border-neutral-200 dark:border-neutral-800` | `border-border` |
| | `border-neutral-100 dark:border-neutral-800` | `border-border/60` |
| | `divide-neutral-100 dark:divide-neutral-800` | `divide-border` |
| **正文与标题** | `text-neutral-900 dark:text-white` | `text-foreground` |
| | `text-black dark:text-white` | `text-foreground` |
| | `text-neutral-800 dark:text-neutral-200` | `text-foreground/90` |
| **辅助说明文字** | `text-neutral-600 dark:text-neutral-400` | `text-muted-foreground` |
| | `text-neutral-500 dark:text-neutral-400` | `text-muted-foreground` |
| | `text-neutral-400 dark:text-neutral-500` | `text-muted-foreground/70` |
| **品牌强调文本** | `text-indigo-600 dark:text-indigo-400` | `text-brand` |

---

## 3. 受影响文件清单

- [app/globals.css](file:///D:/Desktop/javaweb/event-flow/app/globals.css) (CSS 变量声明)
- [app/events/[id]/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/events/[id]/page.tsx) (活动详情页)
- [app/layout.tsx](file:///D:/Desktop/javaweb/event-flow/app/layout.tsx) (主布局)
- [app/login/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/login/page.tsx) (登录页)
- [app/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/page.tsx) (门户主页)
- [components/event-card.tsx](file:///D:/Desktop/javaweb/event-flow/components/event-card.tsx) (活动卡片组件)
- [components/navbar.tsx](file:///D:/Desktop/javaweb/event-flow/components/navbar.tsx) (顶栏导航组件)
- [components/notification-center.tsx](file:///D:/Desktop/javaweb/event-flow/components/notification-center.tsx) (消息中心组件)
- [app/dashboard/page.tsx](file:///D:/Desktop/javaweb/event-flow/app/dashboard/page.tsx) (控制台控制页)

---

## 4. 自我审查结论

1. **无占位符**：方案里不存在 TBD 等占位信息，所有的类名映射均已有据可查。
2. **前后一致性**：新加入的 `brand` 变量被 Tailwind V4 的 `@theme inline` 包装，并完全兼容现有的 `bg-brand/10` 这种不透明度写法。
3. **隔离性**：重构不影响 Prisma 数据结构或 API 接口，不改动现有的日期筛选等业务逻辑。
