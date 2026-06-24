# 设计文档：控制台（Dashboard）侧边栏导航重构

本设计文档旨在将原本庞大、堆叠的个人控制台（Dashboard）重构为传统且优雅的左侧侧边栏导航结构。通过将不同的功能模块拆分为独立的子路由页面，以提升用户体验，并使代码库结构更加清晰、可维护。

## 1. 现状与痛点分析

当前 `app/dashboard/page.tsx` 代码行数高达 1400+ 行，集成了以下所有功能：
- **学生角色 (USER)**: 查看我的活动门票列表。
- **主办方角色 (ORGANIZER)**:
  - 仪表盘分析 (DashboardAnalytics)
  - 电子门票现场核销 (handleCheckin 表单)
  - 活动发布、编辑与删除表单及状态管理
  - 群发通知广播弹窗
  - 活动列表清单
  - 门票核销明细过滤、搜索及导出 CSV 功能
- **管理员角色 (ADMIN)**: 仅仅渲染了指向账号管理和分类管理的两个卡片链接。

**痛点**:
1. 单个文件过大，状态极其繁杂（表单状态、筛选状态、模态框状态混杂），维护极其困难。
2. 页面中各种功能上下堆叠或通过局部 Tabs 切换，视觉密集度过高，不利于日常的高频操作（如现场核销与查看明细）。
3. 主办方、学生、管理员三大角色逻辑揉杂在同一个 Page 中，权限边界模糊。

## 2. 目标与设计原则

- **清晰的功能域拆分**: 将主办方的三大核心功能（数据大盘、活动发布与列表、门票核销、明细报表）拆分为独立的子路由页面，提高信息聚焦度。
- **一致的侧边栏布局**: 引入通用的 Layout 侧边栏，根据当前登录用户的角色，动态显示对应的导航菜单。
- **响应式优化**: 在桌面端显示为常驻的左侧边栏；在移动端（小屏幕）上收纳为顶部导航栏下的滑出式抽屉（Drawer）或折叠式菜单，保证移动端核销门票等操作的便利性。
- **优雅的过渡**: 维持原有的功能与状态逻辑，确保拆分后功能完全等价，数据读取和 API 交互完全一致。

## 3. 详细架构设计

### 3.1 路由结构规划

重构后的路由目录结构如下：

```
app/dashboard/
├── layout.tsx            # 公共布局，负责加载登录状态、展示响应式左侧导航栏、渲染子页面
├── page.tsx              # 控制台首页 (/dashboard)
│                         #  - ORGANIZER: 展示数据大盘 (原 DashboardAnalytics)
│                         #  - USER: 展示“我的活动门票”列表 (原学生控制台)
│                         #  - ADMIN: 重定向或展示系统管理看板
├── events/
│   └── page.tsx          # 主办方活动管理页 (/dashboard/events)
│                         #  - 活动列表、发布活动、编辑活动、发送广播
├── checkin/
│   └── page.tsx          # 主办方现场扫码核销页 (/dashboard/checkin)
│                         #  - 输入门票代码、一键核销及核销成功/失败提示
└── tickets/
    └── page.tsx          # 主办方门票明细表 (/dashboard/tickets)
                          #  - 门票搜索过滤、筛选条件、导出 CSV
```

对于系统管理员已有的两个子路由：
- `app/dashboard/categories/page.tsx`
- `app/dashboard/accounts/page.tsx`
它们无需修改具体业务代码，直接由 `app/dashboard/layout.tsx` 的侧边栏自动集成。

### 3.2 界面交互设计 (UI/UX)

- **侧边栏结构**:
  - 顶部: EventFlow 控制台标识与当前角色。
  - 中部: 导航菜单项（包括图标、文字），选中态具有明显的高亮效果。
  - 底部: 当前登录用户的姓名、角色标识，以及简洁的登出/返回探索按钮。
- **移动端适配**:
  - 在小屏幕上，侧边栏默认隐藏。顶部页面标题左侧增加一个汉堡包按钮，点击可滑出侧边栏抽屉。

### 3.3 状态管理与代码拆分

我们将原本在 `app/dashboard/page.tsx` 中定义的各种状态进行拆分，使其局部化到各自的子页面中：
- **/dashboard/events**: 管理发布活动表单（title, description, location, capacity, category, uploadFiles, startTime）以及广播弹窗状态。
- **/dashboard/checkin**: 管理单次核销输入框（ticketCodeInput）和核销成功/失败提示信息状态（checkinMsg）。
- **/dashboard/tickets**: 管理购票明细的搜索词（searchQuery）、活动过滤（eventFilter）、状态过滤（statusFilter）和日期范围过滤（dateRange）。

## 4. 实施步骤

1. **新建子路由目录**: 创建 `app/dashboard/events`、`app/dashboard/checkin`、`app/dashboard/tickets` 目录。
2. **提取与重构组件**:
   - 编写 `components/dashboard-sidebar.tsx` 侧边栏组件。
   - 编写 `app/dashboard/layout.tsx` 页面框架布局，引入 `dashboard-sidebar.tsx`。
3. **分配业务逻辑**:
   - 将原 `page.tsx` 的学生门票查看、主办方数据大盘分析保留或改造在 `app/dashboard/page.tsx` 中。
   - 将原 `page.tsx` 中主办方活动发布/编辑/广播等逻辑迁移至 `app/dashboard/events/page.tsx`。
   - 将原 `page.tsx` 中门票现场核销逻辑迁移至 `app/dashboard/checkin/page.tsx`。
   - 将原 `page.tsx` 中门票明细与 CSV 导出逻辑迁移至 `app/dashboard/tickets/page.tsx`。
4. **测试与适配**:
   - 验证不同角色（学生、主办方、系统管理员）登录后的侧边栏是否正确自适应展示。
   - 检查小屏幕下的响应式折叠菜单是否交互正常。
   - 验证原有的发布活动、门票核销、CSV导出等全部功能是否完好。

## 5. 成功验证标准

- [ ] 页面路由在 `/dashboard`、`/dashboard/events`、`/dashboard/checkin`、`/dashboard/tickets` 切换正常，且左侧侧边栏导航高亮随之变化。
- [ ] 主办方可在 `/dashboard/events` 正确创建、编辑、删除活动，群发广播通知正常工作。
- [ ] 主办方可在 `/dashboard/checkin` 成功现场核销门票，且提示卡片动画与交互正常。
- [ ] 主办方可在 `/dashboard/tickets` 成功过滤查询门票、导出 CSV 文件。
- [ ] 学生可在 `/dashboard` 查看到属于自己的门票，展示密钥等无误。
- [ ] 管理员可通过侧边栏菜单跳转至 `/dashboard/categories` 和 `/dashboard/accounts` 进行管理。
- [ ] 响应式布局：在移动端分辨率下，侧边栏能收缩或收纳在滑出式抽屉中，不遮挡主内容区域。
