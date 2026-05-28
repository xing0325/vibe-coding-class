// ============================================================
// GitHub 协作教学 · 文案数据 v3
// 受众：15-18 岁青少年 vibe coder（会用 AI、对 GitHub 一无所知）
// 文风：友好、清晰、不油腻、有点活泼
// ------------------------------------------------------------
// 本文件只负责数据，不写引擎逻辑、不写 DOM。
// 末尾通过 window.TUTORIAL_DATA 暴露给引擎。
// 引擎已把 role='teacher' 的标签渲染为"仓库主人"。
// ============================================================

// ------------------------------------------------------------
// Part 1: STEPS —— 38 步主线剧本（即时讲解版）
//   Chapter 0 (1-4):    欢迎 + GitHub 简介
//   Chapter 1 (5-12):   建仓库 + 邀请同学（中途认识 Code 标签）
//   Chapter 2 (13-38):  完整协作主线（中途认识 Issues / Pull requests 标签）
// ------------------------------------------------------------
const STEPS = [
  // ========== Chapter 0: 欢迎 + GitHub 简介 ==========
  {
    id: 1,
    role: 'system',
    page: 'ai',
    target: null,
    title: '👋 欢迎',
    body: '你好！接下来 30 分钟，咱们一起走一遍真实的 GitHub 协作流程——从建仓库、领任务、改代码，到提交评审、合并上线。全程模拟环境，放心点，点坏了也没事。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 2,
    role: 'system',
    page: 'ai',
    target: null,
    title: 'GitHub 是啥？',
    body: '说人话：<strong>GitHub 是全世界程序员存代码、一起干活的网站</strong>。你可以把它理解成「代码界的微博 + Notion + 网盘」——代码托管在上面，每个项目有自己的主页，谁改了啥都看得见，还能互相留言。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 3,
    role: 'system',
    page: 'ai',
    target: null,
    title: 'Git ≠ GitHub',
    body: '俩名字像，干的活不一样：<br>· <strong>Git</strong> 是一个工具，负责管代码的版本历史（谁啥时候改了啥）。<br>· <strong>GitHub</strong> 是一个网站，让大家把 Git 仓库放到一起共享。<br>作为 vibe coder，你<strong>不用敲 Git 命令</strong>——让 AI 敲。你只在 GitHub 网页上点按钮。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 4,
    role: 'system',
    page: 'ai',
    target: null,
    title: '这个教程怎么用',
    body: '三个小约定：<br>① 看到屏幕上的 <strong>spotlight 圆圈</strong>，就点高亮的那个按钮。<br>② 看到「对 AI 说」卡片，就照着那句话跟你的 AI 说。<br>③ <kbd>←</kbd> <kbd>→</kbd> 翻页，<kbd>Esc</kbd> 暂停。<br>准备好了？开始 🚀',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },

  // ========== Chapter 1: 建仓库 + 邀请同学 ==========
  {
    id: 5,
    role: 'teacher',
    page: 'repo',
    target: 'plus-menu',
    title: '建仓库第一步',
    body: '👉 点右上角的 <strong>➕ 按钮</strong>。下拉菜单里就有 New repository（新建仓库）。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 6,
    role: 'teacher',
    page: 'repo',
    target: 'plus-menu-new-repo',
    title: '选 New repository',
    body: '在下拉菜单里点 <strong>New repository</strong>，会跳到建仓库的页面。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 7,
    role: 'teacher',
    page: 'new-repo',
    target: 'repo-name-input',
    title: '给仓库起名',
    body: '输入仓库名字，比如 <code>vibe-coding-class</code>。仓库名是别人识别你项目的关键，起得清楚一点，未来的你会感谢现在的你。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 8,
    role: 'teacher',
    page: 'new-repo',
    target: 'create-repo-btn',
    title: '创建仓库',
    body: '点绿色的 <strong>Create repository</strong>。<br>· <strong>Public</strong>：所有人都能看（但只有你和你邀请的人能改）。<br>· <strong>Private</strong>：只你和你邀请的人能看。<br>教学项目选 Public 就行。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 9,
    role: 'system',
    page: 'repo',
    target: 'nav-code',
    title: '🎉 仓库建好了',
    body: '这就是你的仓库主页！默认进的是 <strong>Code 标签</strong>——代码本体住的地方。<br><br>注意看页面下半部分：GitHub 会<strong>自动读取并渲染仓库根目录的 <code>README.md</code></strong>，当成项目主页展示出来。所以 README 就是你项目的门面——别人点进来第一眼看的就是它。<br><br>💡 想让别人秒懂你的项目？把 README 写好就行。（待会儿有个选修关专门讲这个）',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 10,
    role: 'teacher',
    page: 'repo',
    target: 'nav-settings',
    title: '去 Settings 邀请同学',
    body: '👉 默认只有你能改这个仓库。要让同学也能写代码，得去顶栏的 <strong>Settings</strong>（设置）。点它。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 11,
    role: 'teacher',
    page: 'settings-collab',
    target: 'invite-input',
    title: '输同学的 GitHub 用户名',
    body: '👉 进到 Collaborators 页啦。在邀请框里输入对方的 <strong>GitHub 用户名</strong>（不是邮箱！是用户名，比如 <code>xing0325</code>）。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 12,
    role: 'teacher',
    page: 'settings-collab',
    target: 'invite-btn',
    title: '点 Add 发送邀请',
    body: '点 <strong>Add</strong>。对方会收到一封邀请邮件，接受之后就能往你这个仓库提交代码了。仓库就算搭好了。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },

  // ========== Chapter 2: 完整协作主线 ==========
  {
    id: 13,
    role: 'system',
    page: 'repo',
    target: 'nav-issues',
    title: 'Issues 是任务板',
    body: '邀请发出去了，接着干活。👆 顶部的 <strong>Issues 标签</strong>就是项目的任务板——想象成一面贴满便利贴的墙，或者一块 Trello。每件要做的事、每个 bug，都开一张 <span data-term="issue">issue</span> 卡。<strong>所有协作都从开 issue 开始。</strong>仓库主人现在就去立一张。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 14,
    role: 'teacher',
    page: 'issues',
    target: 'new-issue-btn',
    title: '仓库主人开个 issue',
    body: '仓库主人先点 New issue，把"今天要干啥"立个项。<span data-term="issue">issue</span> 就是任务卡，所有协作从它开始。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 15,
    role: 'teacher',
    page: 'issue-new',
    target: 'issue-title-input',
    title: '写个清楚的标题',
    body: '👉 切到新建 issue 页。仓库主人在标题框敲："加一行 hello world"。标题写得越具体，后面看历史越省事。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 16,
    role: 'teacher',
    page: 'issue-new',
    target: 'issue-submit-btn',
    title: '仓库主人 submit',
    body: '点 Submit new issue，任务卡就挂出来了，编号 #1。同学们在群里能看到这条任务。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 17,
    role: 'student',
    page: 'ai',
    target: null,
    title: '先 pull 一下 main',
    body: '👉 轮到你了。咱们干活前先同步一下最新代码，别基于半年前的版本改。让 AI 帮你 <span data-term="pull">pull</span> 最新的 <span data-term="main">main</span> 分支。',
    nextOn: 'aiPrompt',
    aiPrompt: '帮我 pull 一下最新的 main 分支，我要开始干活了',
    inputValidator: null
  },
  {
    id: 18,
    role: 'student',
    page: 'issue-detail',
    target: 'assignees-btn',
    title: '把自己挂上 Assignees',
    body: '👉 切到 issue 详情页。点右边的 Assignees，把自己加上。这一步是告诉大家"这活我接了"，别人就不会重复劳动。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 19,
    role: 'student',
    page: 'issue-detail',
    target: 'create-branch-btn',
    title: '在 issue 里直接建分支',
    body: '往下滑找到 Development 区域，点 Create a branch。GitHub 会替你建一个 <span data-term="branch">branch</span>，还自动跟这个 <span data-term="issue">issue</span> 绑定，省事。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 20,
    role: 'student',
    page: 'issue-detail',
    target: 'branch-name-input',
    title: '改个像样的分支名',
    body: '默认名又长又丑，改成 <code>feature/add-hello-#1</code>。按功能命名 + issue 编号，别带自己的用户名（团队里看着乱，谁干的看 commit 作者就行）。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 21,
    role: 'student',
    page: 'issue-detail',
    target: 'confirm-create-branch-btn',
    title: '确认创建',
    body: '点 Create branch。这条 <span data-term="branch">branch</span> 现在只在远端 <span data-term="repo">repo</span> 里，本地还没有，下一步要把它拉到本地。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 22,
    role: 'student',
    page: 'ai',
    target: null,
    title: '让 AI 切到新分支',
    body: '👉 回到 AI 那边。告诉它你刚建了新 <span data-term="branch">branch</span>，让它帮你切过去。切完之后你写的代码才会进对地方。',
    nextOn: 'aiPrompt',
    aiPrompt: '帮我切到 feature/add-hello-#1 这个分支',
    inputValidator: null
  },
  {
    id: 23,
    role: 'student',
    page: 'ai',
    target: null,
    title: '让 AI 改代码',
    body: '现在可以放心改了。告诉 AI 你要干啥，越具体越好——别只说"改一下"，要说"在哪个文件、加什么"。',
    nextOn: 'aiPrompt',
    aiPrompt: '帮我在 README.md 末尾加一行 hello world',
    inputValidator: null
  },
  {
    id: 24,
    role: 'student',
    page: 'ai',
    target: null,
    title: 'commit + push 一条龙',
    body: '改完了得保存历史 + 推到云端。<span data-term="commit">commit</span> 是本地存档，<span data-term="push">push</span> 是推到 GitHub。让 AI 一起做了。',
    nextOn: 'aiPrompt',
    aiPrompt: '帮我 commit 一下，message 写：添加 hello，然后 push 到 origin',
    inputValidator: null
  },
  {
    id: 25,
    role: 'system',
    page: 'repo',
    target: 'nav-pulls',
    title: 'Pull requests 是改动评审区',
    body: '你刚 <span data-term="push">push</span> 完，仓库主页会冒出一条黄色横幅催你开 PR。但先认识下这个标签——👆 顶部的 <strong>Pull requests 标签</strong>，是所有"想合并的改动"集合的地方。一个 <span data-term="PR">PR</span> = 一份改动 + 一场围观讨论。<strong>任何对代码的修改都得走 PR 才能合进 <span data-term="main">main</span>，main 才不会被人乱改。</strong>这是 GitHub 最核心的协作机制。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 26,
    role: 'student',
    page: 'repo',
    target: 'compare-pr-banner',
    title: '回 GitHub 看黄条',
    body: '👉 切回仓库主页 Code 标签。刷新一下，顶上会有一条黄色横幅写着 "Compare & pull request"。点它，开始发起 <span data-term="PR">PR</span>。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 27,
    role: 'student',
    page: 'pr-new',
    target: 'base-branch-dropdown',
    title: '看一眼 base / compare 方向',
    body: '⚠️ 别搞反！<strong>base</strong> 是"要被合进去的"（应该是 <span data-term="main">main</span>），<strong>compare</strong> 是"你写的新东西"（你那条 <span data-term="branch">branch</span>）。搞反了等于把 main 合进你分支，反向操作。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 28,
    role: 'student',
    page: 'pr-new',
    target: 'pr-description-input',
    title: '描述里写 Closes #1',
    body: '这是个魔法咒语：在描述里写 <code>Closes #1</code>，<span data-term="PR">PR</span> 一旦 <span data-term="merge">merge</span>，对应的 <span data-term="issue">issue</span> 会自动关闭。不写的话仓库主人还得手动关，麻烦。',
    nextOn: 'input',
    aiPrompt: null,
    inputValidator: 'contains:Closes #'
  },
  {
    id: 29,
    role: 'student',
    page: 'pr-new',
    target: 'pr-reviewers-btn',
    title: '加仓库主人当 Reviewer',
    body: '右边 Reviewers 里把仓库主人加上。不加的话对方不会收到通知，你的 <span data-term="PR">PR</span> 会在角落里吃灰。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 30,
    role: 'student',
    page: 'pr-new',
    target: 'create-pr-btn',
    title: '创建 PR',
    body: '点 Create pull request。到这一步同学的活就告一段落了，接下来看仓库主人。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 31,
    role: 'teacher',
    page: 'pr-detail',
    target: 'files-changed-tab',
    title: '仓库主人切到 Files changed',
    body: '👉 切到 PR 详情页。仓库主人 review 一下，先点 Files changed 标签页，绿色是新增、红色是删除。一眼扫过去看改了啥。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 32,
    role: 'teacher',
    page: 'pr-detail',
    target: 'review-changes-btn',
    title: '仓库主人点 Review changes',
    body: '看完代码点右上 Review changes，准备给个正式意见。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 33,
    role: 'teacher',
    page: 'pr-detail',
    target: 'approve-radio',
    title: '仓库主人选 Approve',
    body: '这次代码没问题，仓库主人选 Approve。另外两个选项：<br>· <strong>Comment</strong>：只评论，不表态。<br>· <strong>Request changes</strong>：打回重做。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 34,
    role: 'teacher',
    page: 'pr-detail',
    target: 'submit-review-btn',
    title: '仓库主人 Submit review',
    body: '点 Submit review 提交评审。这条 <span data-term="PR">PR</span> 现在亮起绿勾，允许合并。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 35,
    role: 'teacher',
    page: 'pr-detail',
    target: 'merge-pr-btn',
    title: '仓库主人点 Merge',
    body: '点 Merge pull request。下拉里有 Merge commit / Squash / Rebase 三种，新手默认 <strong>Merge commit</strong> 就行，别乱切。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 36,
    role: 'teacher',
    page: 'pr-detail',
    target: 'confirm-merge-btn',
    title: '确认合并',
    body: '点 Confirm merge。代码正式进 <span data-term="main">main</span>，所有人 <span data-term="pull">pull</span> 一下就能拿到。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 37,
    role: 'teacher',
    page: 'pr-detail',
    target: 'delete-branch-btn',
    title: '顺手删了那条分支',
    body: '合并完后按钮会变成 Delete branch，点掉。分支留着会堆成山，看着烦——反正 <span data-term="commit">commit</span> 历史都在 <span data-term="main">main</span> 里了，不会丢。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  },
  {
    id: 38,
    role: 'system',
    page: 'issue-detail',
    target: null,
    title: '🎉 issue 自动关闭啦',
    body: '👉 切回 issue 详情页瞧瞧。🎉 因为 <span data-term="PR">PR</span> 描述里写了 Closes #1，<span data-term="issue">issue</span> 已经自动关闭、撒花！这就是一个完整的 GitHub 协作回合。下次自己来一遍试试。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  }
];

// ------------------------------------------------------------
// Part 2: PITFALLS —— 10 个常见卡点
// 注：复杂的 check 暂用占位，重点是文案与触发时机。
// 引擎接入真实 DOM / state 后可改写 check 函数。
// beforeStep 已按新编号重新映射。
// ------------------------------------------------------------
const PITFALLS = [
  {
    // 3. 在 main 上直接改 —— 最经典的新手翻车
    beforeStep: 18,
    check: function(ctx) { return false; }, // TODO: 检测当前分支是否仍是 main
    message: '⚠️ 别直接在 main 上改代码！先建一条新 branch 再动手。main 是大家共享的"成品展柜",在上面瞎改会影响所有人。',
    block: false
  },
  {
    // 6. 分支名带用户名
    beforeStep: 21,
    check: function(ctx) {
      var name = (ctx && ctx.branchName) || '';
      // 简单检测：分支名以"用户名/"开头（如 xing0325/xxx）
      return /^[a-zA-Z0-9_-]+\//.test(name) && !/^(feature|fix|hotfix|chore|docs|refactor)\//.test(name);
    },
    message: '⚠️ 分支名看着像带了用户名（比如 xing0325/xxx）。团队里建议按"功能/任务"命名，比如 feature/add-hello-#1，谁干的看 commit 作者就行，分支名不用占这个坑。',
    block: false
  },
  {
    // 4. 没 pull 就开干
    beforeStep: 26,
    check: function(ctx) { return false; }, // TODO: 检测本地 main 是否落后于远端
    message: '⚠️ 不确定你刚才有没有 pull 最新的 main？如果你的分支基于老版本，等会儿 merge 时大概率撞 conflict。下次干活前先 pull 一下，养成习惯。',
    block: false
  },
  {
    // 1. base/compare 方向搞反
    beforeStep: 26,
    check: function(ctx) { return false; }, // TODO: 检测下拉框选择是否反了
    message: '👀 创建 PR 时先看一眼最上面的 base ← compare 方向：base 是"要被合进去的"（main），compare 是"你的新分支"。搞反了就是把 main 合进你的分支，相当于反向回滚。',
    block: false
  },
  {
    // 9. 描述只写一句"修复"
    beforeStep: 28,
    check: function(ctx) {
      var desc = (ctx && ctx.prDescription) || '';
      var trimmed = desc.trim();
      // 太短（< 5 字）或只有"修复/更新/改了下"这种敷衍话
      return trimmed.length > 0 && trimmed.length < 5;
    },
    message: '📝 描述也太敷衍了吧。哪怕一句"在 README 末尾加了 hello world"也行，未来的你/同事看 PR 历史时会感谢你。',
    block: false
  },
  {
    // 2. 没写 Closes #（block!）
    beforeStep: 29,
    check: function(ctx) {
      var desc = (ctx && ctx.prDescription) || '';
      return !/Closes\s+#\d+/i.test(desc) && !/Fixes\s+#\d+/i.test(desc) && !/Resolves\s+#\d+/i.test(desc);
    },
    message: '🛑 描述里没写 Closes #1，这条 PR 合并后 issue 不会自动关闭，仓库主人还得手动关一遍。在描述里加上 "Closes #1" 再继续。',
    block: true
  },
  {
    // 10. 没加 Reviewer
    beforeStep: 29,
    check: function(ctx) { return false; }, // TODO: 检测 reviewers 数组是否为空
    message: '⚠️ 还没加 Reviewer。不指定的话仓库主人不会收到通知，PR 会被遗忘在角落。把对方挂上去，他才知道该看了。',
    block: false
  },
  {
    // 5. PR 标题为空 / 默认
    beforeStep: 30,
    check: function(ctx) {
      var title = (ctx && ctx.prTitle) || '';
      return title.trim().length === 0 || /^Update\s+\S+$/i.test(title.trim());
    },
    message: '📌 PR 标题别留空、也别用默认的 "Update README.md"。一句话说清你干了啥，比如"在 README 末尾加 hello world"，仓库主人扫一眼就知道在 review 什么。',
    block: false
  },
  {
    // 7. 随手点了 Squash
    beforeStep: 36,
    check: function(ctx) {
      var method = (ctx && ctx.mergeMethod) || '';
      return method === 'squash' || method === 'rebase';
    },
    message: '✋ 你切到了 Squash/Rebase 合并？没事但新手别先碰这个——Squash 会把多个 commit 压成一个，Rebase 会改写历史，副作用多。默认 Merge commit 最稳，先用它。',
    block: false
  },
  {
    // 8. 忘删分支
    beforeStep: 38,
    check: function(ctx) { return false; }, // TODO: 检测是否跳过了 delete-branch-btn
    message: '🧹 合并完顺手把分支删了吧。代码都在 main 里了，旧分支留着只会让分支列表越来越长，半年后翻起来跟考古一样。',
    block: false
  }
];

// ------------------------------------------------------------
// Part 3: GLOSSARY —— 10 个术语
// human: 给完全没接触过的人看的人话（< 30 字）
// vibeCoder: 告诉 vibe coder 实际怎么用 / 怎么跟 AI 说（< 40 字）
// ------------------------------------------------------------
const GLOSSARY = {
  repo: {
    name: 'repo（仓库）',
    human: '这个项目的家，所有代码和历史都装在里面。',
    vibeCoder: '让 AI "clone 一下这个 repo" 就把项目拷到本地了，不用自己敲命令。'
  },
  commit: {
    name: 'commit（提交）',
    human: '给当前代码拍一张快照存起来，附带一句"我改了啥"。',
    vibeCoder: '跟 AI 说"帮我 commit 一下，message 写：XXX"，它会帮你存这一版历史。'
  },
  branch: {
    name: 'branch（分支）',
    human: '从主线岔出去的一条平行宇宙，怎么改都不影响 main。',
    vibeCoder: '让 AI "切到 feature/xxx 分支"，你之后的改动都进这条线，安全。'
  },
  main: {
    name: 'main（主分支）',
    human: '项目的"成品展柜"，所有人共享的那条主线。',
    vibeCoder: '别直接让 AI 在 main 上改！先建分支，写好再合回 main。'
  },
  pull: {
    name: 'pull（拉取）',
    human: '把云端最新的代码拉到本地，让本地跟上进度。',
    vibeCoder: '开工前跟 AI 说"帮我 pull 最新的 main"，省得基于老版本改导致冲突。'
  },
  push: {
    name: 'push（推送）',
    human: '把本地写的东西推到 GitHub 云端，别人才看得到。',
    vibeCoder: 'commit 完跟 AI 说"push 到 origin"，代码就上云了。'
  },
  PR: {
    name: 'PR（Pull Request）',
    human: '一份"请把我这条分支合进 main"的申请，附带 review 和讨论。',
    vibeCoder: 'PR 在网页上点 New pull request 创建，AI 一般不直接发 PR，得你手动来。'
  },
  merge: {
    name: 'merge（合并）',
    human: '把分支上的改动正式合进 main，所有人都能用上。',
    vibeCoder: '通常是仓库主人在网页上点 Merge 按钮，你不用让 AI 做这步。'
  },
  conflict: {
    name: 'conflict（冲突）',
    human: '两个人改了同一行代码，Git 不知道听谁的，就让你手动选。',
    vibeCoder: '碰到 conflict 把报错丢给 AI："帮我看下这个冲突怎么解"，它会给方案。'
  },
  issue: {
    name: 'issue（任务/问题）',
    human: '一张任务卡，写清要做啥 / 哪里有 bug，所有协作的起点。',
    vibeCoder: '在 GitHub 网页点 New issue 创建，PR 描述里写 Closes #编号 可自动关闭它。'
  }
};

// ------------------------------------------------------------
// 增量补丁：在原 step 8 (创建仓库) 前插入"选 Public 还是 Private"一步
// 这样侧边栏讲到的 public/private 在右侧主区也有 spotlight 引导
// 同时把所有 id >= 8 的 step 和 PITFALLS.beforeStep 全部 +1
// ------------------------------------------------------------
(function () {
  var insertIdx = -1;
  for (var i = 0; i < STEPS.length; i++) { if (STEPS[i].id === 8) { insertIdx = i; break; } }
  if (insertIdx === -1) return;
  // 提升 id
  for (var j = 0; j < STEPS.length; j++) { if (STEPS[j].id >= 8) STEPS[j].id += 1; }
  // 插入新 step
  STEPS.splice(insertIdx, 0, {
    id: 8,
    role: 'teacher',
    page: 'new-repo',
    target: 'visibility-row',
    title: '公开还是私密？',
    body: '看右侧高亮的这两个选项——<br>· <strong>Public</strong>：所有人都能看到这个仓库（但只有你和你邀请的人能改）。开源项目用这个，写在简历里也方便别人看。<br>· <strong>Private</strong>：只你和你邀请的人能看（适合公司内部项目）。<br>教学项目选 <strong>Public</strong> 就行，不用动。',
    nextOn: 'auto',
    aiPrompt: null,
    inputValidator: null
  });
  // PITFALLS beforeStep 同步偏移
  for (var k = 0; k < PITFALLS.length; k++) {
    if (PITFALLS[k].beforeStep >= 8) PITFALLS[k].beforeStep += 1;
  }
})();

// ------------------------------------------------------------
// 增量补丁 2：assignees 拆成两步（点齿轮开面板 → 勾选自己/别人）
// 按 target 匹配，不依赖具体 id；提升后续 id 与 PITFALLS.beforeStep
// ------------------------------------------------------------
(function () {
  var idx = -1;
  for (var i = 0; i < STEPS.length; i++) { if (STEPS[i].target === 'assignees-btn') { idx = i; break; } }
  if (idx === -1) return;
  var asgId = STEPS[idx].id;
  // 第一步改为"打开面板"
  STEPS[idx].title = '打开 Assignees 面板';
  STEPS[idx].body = '👉 切到 issue 详情页。点 Assignees 右边的齿轮按钮，会弹出一个选人面板。';
  // 提升后续 id
  for (var j = 0; j < STEPS.length; j++) { if (STEPS[j].id > asgId) STEPS[j].id += 1; }
  // 插入"勾选"步骤
  STEPS.splice(idx + 1, 0, {
    id: asgId + 1,
    role: 'student',
    page: 'issue-detail',
    target: 'assignee-checkbox',
    title: '勾上自己 = 认领',
    body: '在面板里勾上 <strong>xing0325（你自己）</strong>，就等于认领了这个任务，告诉大家"这活我接了"。<br>面板里还能勾别人——想拉某个同学一起看，勾上 ta 就相当于 @ 提醒 ta 来。',
    nextOn: 'click',
    aiPrompt: null,
    inputValidator: null
  });
  // PITFALLS 偏移
  for (var k = 0; k < PITFALLS.length; k++) { if (PITFALLS[k].beforeStep > asgId) PITFALLS[k].beforeStep += 1; }
})();

// ------------------------------------------------------------
// 增量补丁 3：侧边栏指令 ←→ 右侧 UI 联动
// 把"有真实可点击操作目标"的步骤从 auto 改成 click，
// 用户点真实按钮即自动前进，不用手动点"下一步"。
// （nav-* 指认介绍、输入框、看方向的下拉 保持 auto/input 不动）
// ------------------------------------------------------------
(function () {
  var clickTargets = [
    'new-issue-btn',     // 点 New issue
    'issue-submit-btn',  // 提交 issue
    'files-changed-tab', // 切到 Files changed
    'review-changes-btn',// 点 Review changes
    'approve-radio',     // 选 Approve
    'submit-review-btn', // 提交评审
  ];
  STEPS.forEach(function (s) {
    if (s.target && clickTargets.indexOf(s.target) !== -1) s.nextOn = 'click';
  });
})();

// ------------------------------------------------------------
// 增量补丁 A：仓库页导览（spotlight 框选讲解）
// 锚点：target === 'nav-code'（"仓库建好了"那步）。在它之后依次插入 7 步，
// 把第8章「GitHub 仓库页导览」的几站转写成右侧仿真页的 spotlight 引导。
// 全部 role:'system' / page:'repo' / aiPrompt:null / inputValidator:null。
// ------------------------------------------------------------
(function () {
  var idx = -1;
  for (var i = 0; i < STEPS.length; i++) { if (STEPS[i].target === 'nav-code') { idx = i; break; } }
  if (idx === -1) return;
  var anchorId = STEPS[idx].id;           // 锚点 step 的 id（先记下来）
  var newSteps = [
    {
      role: 'system', page: 'repo', target: 'repo-file-list', nextOn: 'auto',
      title: '区域①：文件列表',
      body: '页面中间这张表，列着项目里的<strong>所有文件和文件夹</strong>。点任意一个文件就看里面的内容，点文件夹就钻进去看下一层。每行后面还跟着这个文件<strong>最后一次的 commit message</strong>和<strong>更新时间</strong>，扫一眼就知道它最近经历了啥。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'repo', target: 'code-clone-btn', nextOn: 'click',
      title: '区域②：绿色 Code 按钮',
      body: '👉 点右上那个大绿按钮 <strong>Code</strong>，会弹出一个仓库地址。<strong>AI 时代怎么用</strong>：把这串地址丢给你的 coding agent，对它说一句「<code>帮我 clone 这个仓库</code>」，整个项目就下载到你电脑上了，立刻能开干。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'repo', target: 'repo-readme', nextOn: 'auto',
      title: '区域③：README',
      body: '文件列表下面这一大块，是 <code>README.md</code>。GitHub 会<strong>自动读取并渲染</strong>它，不用你做任何事。README 是项目的<strong>门面</strong>——讲清这个项目是<strong>做什么用的、怎么用</strong>。看一个陌生项目，先读它就对了。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'repo', target: 'repo-about', nextOn: 'auto',
      title: '区域④：About',
      body: '页面右上这张「一句话名片」就是 <strong>About</strong>：项目<strong>简介</strong>、几个 topics <strong>标签</strong>（像 education、ai，方便别人搜到），还有<strong>开源协议 License</strong>（比如 MIT，说明别人能怎么用你的代码）。想快速判断项目干啥的，扫一眼这里就够。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'repo', target: 'repo-releases', nextOn: 'click',
      title: '区域⑤：Releases',
      body: '👉 点右侧的 <strong>Releases</strong> 卡片进去看看。这里是项目的<strong>版本发布</strong>记录——每发一个新版本就记一笔。点进某个版本，能看到它的<strong>版本号</strong>，以及这个版本<strong>更新了哪些内容（changelog）</strong>。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'repo', target: 'repo-star', nextOn: 'auto',
      title: '区域⑥：Star',
      body: '右上的 <strong>★ Star</strong> 是程序员的「一键三连」——给项目<strong>点赞 + 收藏</strong>，表示喜欢。一个项目 Star 越多，说明它越受欢迎。逛 GitHub 看到好东西，顺手点个 Star 就对了。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'repo', target: 'repo-fork', nextOn: 'click',
      title: '区域⑦：Fork',
      body: '👉 点旁边的 <strong>⑂ Fork</strong> 看看。Fork = 把这个项目<strong>原样复制一份到你自己名下</strong>，变成属于你的仓库。之后你随便 DIY、随便改，都<strong>动不到原作者一根毫毛</strong>。想参与别人的项目，第一步常常就是 fork。',
      aiPrompt: null, inputValidator: null
    }
  ];
  var N = newSteps.length;
  // 1) 先把所有 id > 锚点id 的 step 整体 +N（腾出 anchorId+1 .. anchorId+N 的号段）
  for (var j = 0; j < STEPS.length; j++) { if (STEPS[j].id > anchorId) STEPS[j].id += N; }
  // 2) 给新步接续编号，splice 插到锚点后面
  for (var k = 0; k < N; k++) { newSteps[k].id = anchorId + 1 + k; }
  STEPS.splice.apply(STEPS, [idx + 1, 0].concat(newSteps));
  // 3) PITFALLS.beforeStep > 锚点id 的同步 +N
  for (var p = 0; p < PITFALLS.length; p++) { if (PITFALLS[p].beforeStep > anchorId) PITFALLS[p].beforeStep += N; }
})();

// ------------------------------------------------------------
// 增量补丁 B：多人协作心法（旁白讲解卡片）
// 锚点：target === 'compare-pr-banner'（"回 GitHub 看黄条"那步）。在它之前
// 插入 4 个旁白步，把第9章「多人协作」的核心心法转写进来。
// 全部 role:'system' / page:'ai' / target:null / nextOn:'auto' / aiPrompt:null。
// 注意：锚点 index 在本 IIFE 内实时查（补丁 A 可能已改变数组）。
// ------------------------------------------------------------
(function () {
  var idx = -1;
  for (var i = 0; i < STEPS.length; i++) { if (STEPS[i].target === 'compare-pr-banner') { idx = i; break; } }
  if (idx === -1) return;
  var anchorId = STEPS[idx].id;           // 锚点 step 的 id
  var narration = [
    {
      role: 'system', page: 'ai', target: null, nextOn: 'auto',
      title: 'fork 模式 vs 协作者模式',
      body: '参与协作有两种方式。想插手<strong>陌生人的开源项目</strong>，得先 <strong>fork</strong>（复刻一份到自己名下），在副本上改完再发 PR 交回去。但咱们这门课是<strong>熟人小团队</strong>——你早被仓库主人邀成<strong>协作者（collaborator）</strong>了，省掉 fork 这步，直接在同一个仓库里开分支干活。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'ai', target: null, nextOn: 'auto',
      title: '黄金法则：别在 main 上改',
      body: '🛑 记死这条：<strong>永远别直接在 <span data-term="main">main</span> 上改代码！</strong>你改的同时上游 main 也在更新。只要你的改动都在<strong>分支</strong>上、main 保持纯净，从上游 pull 最新时 main 只需「<strong>快进 fast-forward</strong>」——零合并、零冲突。直接在 main 上改，就会撞三方合并、解冲突、历史变乱。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'ai', target: null, nextOn: 'auto',
      title: 'PR 的本质是「提案」',
      body: '接下来你要发的 <span data-term="PR">PR</span>（Pull Request），<strong>不是直接把代码合进去</strong>，而是一个「<strong>请把我这条分支合进 main</strong>」的提案。你举手说「我写好了，请看看」，然后要经过<strong>code review（代码审核）</strong>——仓库主人逐行看过、点同意，才会真的合进 <span data-term="main">main</span>。被打回很正常，这是协作不是考试。',
      aiPrompt: null, inputValidator: null
    },
    {
      role: 'system', page: 'ai', target: null, nextOn: 'auto',
      title: '彩蛋：cherry-pick 摘樱桃 🍒',
      body: '再送你一招。当你<strong>只想要别的分支上某一个特定的 <span data-term="commit">commit</span></strong>、而不是整条分支时，用 <strong>cherry-pick</strong>：把那个 commit 的 <strong>hash</strong> 给 AI，说一句「<code>帮我 cherry-pick 这个提交</code>」，它就把那一颗「樱桃」摘到你当前分支末尾，其余提交一概不动。',
      aiPrompt: null, inputValidator: null
    }
  ];
  var N = narration.length;
  // 1) 旁白插在锚点之前，新步占 anchorId .. anchorId+N-1，锚点及其后所有 id >= anchorId 的 +N
  for (var j = 0; j < STEPS.length; j++) { if (STEPS[j].id >= anchorId) STEPS[j].id += N; }
  // 2) 新步接续旧锚点 id（旧 anchorId 开始），splice 到锚点位置之前
  for (var k = 0; k < N; k++) { narration[k].id = anchorId + k; }
  STEPS.splice.apply(STEPS, [idx, 0].concat(narration));
  // 3) PITFALLS.beforeStep >= 锚点id 的同步 +N（旁白插在它们之前，编号要一起后移）
  for (var p = 0; p < PITFALLS.length; p++) { if (PITFALLS[p].beforeStep >= anchorId) PITFALLS[p].beforeStep += N; }
})();

// 暴露给引擎
window.TUTORIAL_DATA = { STEPS, PITFALLS, GLOSSARY };
