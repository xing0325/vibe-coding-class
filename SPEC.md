# GitHub 协作教学互动网页 · 设计文档

> 日期：2026-05-25
> 目标受众：Vibe coder 新手同学（用 AI 编程，不直接敲 git 命令）
> 形态：单 HTML 文件，可双击 file:// 打开，也可丢 GitHub Pages

---

## 1. 产品目标

让从未用过 GitHub 协作的同学，在 30 分钟内，靠点鼠标 + spotlight 引导，**走完一遍完整的 issue → PR → merge 闭环**，并知道每一步在真 GitHub 上对应哪个按钮。

**衡量标准**：通关后能独立在真 GitHub 上完成同样的协作流程，且懂得让 AI 帮自己做 git 操作。

---

## 2. 用户故事

- **小白小张**："我连 commit 是啥都不知道，但我会用 Claude Code。"
- **学完后小张**："我知道 commit / pull / PR 是干啥的，知道在 GitHub 哪里点按钮，知道让 AI 怎么帮我做 git。"

---

## 3. 技术栈

- 单个 `github-tutorial.html` 文件
- 内嵌 CSS（含 GitHub 深/浅色双主题，深色为默认）
- 内嵌 JS（vanilla，零依赖）
- 内嵌 Octicons SVG
- `localStorage` 存进度（刷新不丢）

不引外部字体（避免国内卡顿），用 `-apple-system, "Segoe UI", system-ui` 兜底。

---

## 4. 信息架构（仿真的 GitHub 页面）

按 SPA 路由切换 7 个"虚拟页面"：

| 路由 | 仿的 GitHub 页面 | 主要 UI |
|---|---|---|
| `#repo` | 仓库 Code 标签 | 顶栏、分支下拉、文件列表、README、Compare & PR 横幅 |
| `#issues` | Issues 列表 | 筛选栏、issue 行、New issue 按钮 |
| `#issue-new` | 新建 issue | 标题框、Markdown 编辑器、Submit |
| `#issue-detail` | 单个 issue | 评论流、右栏 Assignees / Development（含 Create a branch）|
| `#pulls` | Pull requests 列表 | 同 issues 风格 |
| `#pr-new` | 新建 PR | base/compare 下拉、diff 预览、Reviewers、描述框 |
| `#pr-detail` | 单个 PR | Conversation / Files changed / Review changes / Merge 按钮 |

切换由教程引擎驱动（同学不能乱跳，必须按步走）。

---

## 5. 教学主线（17 步剧本）

教程引擎接收 `steps[]` 数组，每条结构：

```js
{
  id: 'step-3',
  page: '#issue-detail',
  role: 'student',          // 老师 | 学生 | 系统
  targetSelector: '#assignees-btn',
  title: '把任务认领到自己头上',
  body: '在右栏点 Assignees，选自己。这样所有人都知道这事归你管了。',
  termHighlight: ['issue'],
  nextOn: 'click',          // click | auto | aiPrompt
  aiPromptHint: null        // 该步要让 AI 做啥（如有）
}
```

步骤列表（17 步）：

| # | 角色 | 路由 | 高亮按钮 | 学生要说的"AI 咒语" |
|---|---|---|---|---|
| 1 | 老师 | `#issues` → `#issue-new` | `New issue` → 标题框 → `Submit` | — |
| 2 | 学生 | （AI 提示框） | — | "帮我 pull 最新的 main 分支" |
| 3 | 学生 | `#issue-detail` | 右栏 `Assignees` | — |
| 4 | 学生 | `#issue-detail` | 右栏 `Development` → `Create a branch` | — |
| 5 | 学生 | 弹窗 | 分支名输入框 → `Create branch` | — |
| 6 | 学生 | （AI 提示框） | — | "切到 feature/xxx-#编号 这个分支" |
| 7 | 学生 | （AI 提示框） | — | "帮我改 README.md，加一句 hello" |
| 8 | 学生 | （AI 提示框） | — | "commit 并 push，message: 加 hello" |
| 9 | 学生 | `#repo` | 顶部黄色横幅 `Compare & pull request` | — |
| 10 | 学生 | `#pr-new` | base/compare 下拉（提示检查方向） | — |
| 11 | 学生 | `#pr-new` | 描述框输入区（必须打 `Closes #1`） | — |
| 12 | 学生 | `#pr-new` | 右栏 `Reviewers` → 选老师 | — |
| 13 | 学生 | `#pr-new` | `Create pull request` | — |
| 14 | 老师 | `#pr-detail` → Files changed | `Review changes` → `Approve` | — |
| 15 | 老师 | `#pr-detail` Conversation | `Merge pull request` → `Confirm` | — |
| 16 | 老师 | merge 后 | `Delete branch` | — |
| 17 | 系统 | `#issue-detail` | issue 自动变 Closed ✅ | — |

---

## 6. 卡点提示系统

10 个常见卡点不做成单独关卡，而是触发式提示：

- 第 2 步前不"pull"直接点下一步 → 弹"⚠️ 忘 pull 警告"
- 第 10 步如果点反方向下拉 → 弹"compare/base 方向搞反"
- 第 11 步如果不输入 `Closes #1` → 不让进入下一步，提示"issue 不会自动关"
- 等等

卡点数据结构：

```js
{
  triggerStep: 11,
  triggerCondition: () => !descInput.value.includes('Closes #'),
  message: '提示：描述里没写 Closes #1，issue 不会自动关哦'
}
```

---

## 7. 术语词典

- **开局速查表**：教程第一屏出现一个"GitHub 黑话速记"卡片墙，10 个术语翻牌
- **流程内悬停 tooltip**：剧本里凡是出现的术语（`commit` / `pull` / `branch` 等）自动用虚线下划线 + 悬停弹解释卡
- 术语词典数据放 `GLOSSARY` 对象

10 个术语见上一轮 brainstorm（repo / commit / branch / main / pull / push / PR / merge / conflict / issue）。

---

## 8. Worktree 加餐关（边场互动关）

**触发**：主线 17 步通关后，弹"🎉 主线通关，要解锁隐藏关卡吗？"

**关卡内容**：
- 一屏，左边一个文件夹图标 `feature/A`（里面有未提交的 AI 代码），右边一个文件夹图标 `feature/B`
- 让同学点击在两个 worktree 之间切换，每次切换有动画
- 切换时显示"看，你的 A 进度没丢，B 的代码独立"
- 结尾给"AI 咒语"：让 AI 帮你开 worktree 的话术

不教 `git worktree add` 命令本身，只教概念 + AI 咒语。

---

## 9. Spotlight 引擎设计

**视觉**：
- 全屏 `<div class="overlay">`，黑色 70% 不透明
- 用 `box-shadow: 0 0 0 9999px rgba(0,0,0,0.7)` 在目标元素周围"挖洞"
- 目标元素 `z-index` 抬高到 overlay 之上
- 旁边浮一个"教程气泡"，有标题、说明、上一步/下一步按钮、进度（3/17）

**交互**：
- `nextOn: 'click'` → 等同学点目标按钮才前进
- `nextOn: 'auto'` → 自动播放（用来演示老师那几步）
- `nextOn: 'aiPrompt'` → 显示一个"AI 咒语"卡片 + "我说完了"按钮

**键盘**：← → 翻页，Esc 退出

**进度**：顶部细进度条，`localStorage.tutorialStep` 存当前步骤

---

## 10. 文件结构

单文件，但内部按 section 注释拆分：

```
github-tutorial.html
├── <head>
│   ├── meta / title
│   └── <style>  (GitHub design tokens, dark mode, all components)
├── <body>
│   ├── #app                  ← SPA 容器
│   │   ├── header bar
│   │   ├── #page-repo        (hidden by default)
│   │   ├── #page-issues
│   │   ├── #page-issue-new
│   │   ├── #page-issue-detail
│   │   ├── #page-pulls
│   │   ├── #page-pr-new
│   │   └── #page-pr-detail
│   ├── #tutorial-overlay     ← spotlight 蒙层
│   ├── #tutorial-bubble      ← 提示气泡
│   ├── #glossary-modal       ← 开局术语墙
│   └── #worktree-bonus       ← 边场关
└── <script>
    ├── GLOSSARY = { ... }
    ├── STEPS = [ ... 17 步 ... ]
    ├── PITFALLS = [ ... 10 卡点 ... ]
    ├── Router (hashchange)
    ├── TutorialEngine
    │   ├── start / next / prev / goto
    │   ├── spotlight(el)
    │   └── handleAiPrompt()
    └── init()
```

---

## 11. 实现里程碑（subagent 并行分工）

可以拆给 **4 个并行 subagent**：

| Agent | 任务 | 产出 |
|---|---|---|
| **A · UI 还原** | 写 7 个 page 的 HTML + GitHub design tokens CSS（含深色模式、Octicons SVG） | `<style>` + 7 个 `#page-xxx` div |
| **B · 教程引擎** | 写 spotlight overlay、提示气泡、键盘控制、进度条、路由、AI 咒语卡片 | `TutorialEngine` class |
| **C · 内容数据** | 写 STEPS / PITFALLS / GLOSSARY 三个 JS 对象（中文文案） | 三个 const |
| **D · 加餐关** | 写 worktree 边场关 UI + 切换动画 + 收尾恭喜屏 | `#worktree-bonus` 模块 |

最后我（主线）做集成：把 A 的 UI 套上 B 的引擎，喂 C 的数据，最后插 D 的加餐关。

---

## 12. 验收

- 双击 `github-tutorial.html` 能在 Chrome 打开，全程无报错
- 17 步主线能跑通，每步 spotlight 正确高亮目标
- 卡点提示触发正常
- 术语 tooltip 工作
- worktree 加餐关动画流畅
- 深色模式默认，能切浅色
- 刷新页面进度保留
- 在 1280×800 和 1920×1080 都不错位

---

## 13. 不做（YAGNI）

- 真 GitHub OAuth / 真 API 调用
- 多用户、后端
- 自定义剧本/编辑器（v1 用不上）
- 移动端响应式（v1 桌面优先；用户是用电脑学 GitHub）
- fork 工作流（团队分支模型用不上）
- 国际化（中文教学）

---

## 14. 待用户确认

- [ ] 路径 `C:\Users\david\github-tutorial\github-tutorial.html` OK
- [ ] 17 步剧本无遗漏
- [ ] 卡点提示触发式（不做独立关卡）OK
- [ ] 4 个 subagent 分工 OK
- [ ] 通关后是否需要"导出证书"或"分享到群"的彩蛋（默认不做）
