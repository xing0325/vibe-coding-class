(function () {
  'use strict';

  // ============================================================
  // 第8章 · GitHub 仓库页导览
  // theme: #58a6ff  emoji: 🧭
  // 样式前缀: c-ghpage-
  // 做法：拼一个简化仿真的 GitHub 仓库页骨架，每页在要讲的区域
  //       盖一个「框选高亮」（描边 + 四周压暗 + 标注气泡），逐页移动。
  // ============================================================

  // ---- 仿真仓库的假数据 ----
  var OWNER = 'xing0325';
  var REPO = 'vibe-coding-class';

  // 文件列表（name / 类型 / 这一行的 commit message / 更新时间）
  var FILES = [
    { icon: 'dir', name: '.github', msg: '加上自动部署的 workflow', when: '3 天前' },
    { icon: 'dir', name: 'src', msg: '重构首页组件，拆成小文件', when: '2 小时前' },
    { icon: 'dir', name: 'public', msg: '换了新的封面图', when: '上周' },
    { icon: 'file', name: '.gitignore', msg: '把 .env 加进忽略清单', when: '上周' },
    { icon: 'file', name: 'README.md', msg: '补全使用说明 + 截图', when: '昨天' },
    { icon: 'file', name: 'package.json', msg: '升级依赖到最新版', when: '4 天前' },
    { icon: 'file', name: 'index.html', msg: '修好移动端排版错位', when: '2 小时前' }
  ];

  // ---- 一次性注入样式（id 去重，避免重复 render 叠加） ----
  function injectStyle() {
    if (document.getElementById('c-ghpage-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ghpage-style';
    s.textContent = [
      // 外层定位容器：高亮框是它的绝对定位子元素
      '.c-ghpage-wrap{position:relative;background:var(--c-bg);border:1px solid var(--c-border);border-radius:14px;padding:14px;margin:14px 0;overflow:hidden;}',
      // —— 仿真仓库骨架 ——
      '.c-ghpage-mock{font-size:13px;line-height:1.45;color:var(--c-fg);}',
      // 顶部一行：仓库名
      '.c-ghpage-repohead{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding-bottom:10px;border-bottom:1px solid var(--c-border);}',
      '.c-ghpage-repohead .book{color:var(--c-fg-muted);}',
      '.c-ghpage-repohead .owner{color:var(--course-accent);font-weight:600;}',
      '.c-ghpage-repohead .slash{color:var(--c-fg-muted);}',
      '.c-ghpage-repohead .name{color:var(--course-accent);font-weight:700;}',
      '.c-ghpage-repohead .pub{font-size:11px;color:var(--c-fg-muted);border:1px solid var(--c-border);border-radius:999px;padding:1px 8px;}',
      '.c-ghpage-repohead .spacer{flex:1;}',
      // 顶部右上 Star / Fork 小按钮组
      '.c-ghpage-acts{display:flex;gap:6px;}',
      '.c-ghpage-act{display:flex;align-items:center;gap:5px;background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:6px;padding:3px 9px;font-size:12px;color:var(--c-fg);}',
      '.c-ghpage-act .cnt{background:var(--c-bg);border:1px solid var(--c-border);border-radius:6px;padding:0 6px;font-size:11px;color:var(--c-fg-muted);}',
      // 标签栏 Code / Issues / PR
      '.c-ghpage-tabs{display:flex;gap:16px;margin-top:10px;padding-bottom:0;border-bottom:1px solid var(--c-border);}',
      '.c-ghpage-tab{display:flex;align-items:center;gap:6px;padding:7px 2px 9px;font-size:13px;color:var(--c-fg-muted);border-bottom:2px solid transparent;}',
      '.c-ghpage-tab.on{color:var(--c-fg);font-weight:600;border-bottom-color:#fd8c73;}',
      '.c-ghpage-tab .badge{background:var(--c-bg-soft);border-radius:999px;padding:0 7px;font-size:11px;}',
      // 主体两栏
      '.c-ghpage-body{display:grid;grid-template-columns:1fr 230px;gap:14px;margin-top:12px;}',
      '@media(max-width:640px){.c-ghpage-body{grid-template-columns:1fr;}}',
      // Code 工具条 + 绿色按钮
      '.c-ghpage-coderow{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;}',
      '.c-ghpage-branch{display:flex;align-items:center;gap:6px;background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:6px;padding:4px 10px;font-size:12px;color:var(--c-fg);}',
      '.c-ghpage-codebtn{display:inline-flex;align-items:center;gap:6px;background:#238636;border:1px solid rgba(240,246,252,.1);color:#fff;font-weight:600;font-size:13px;border-radius:6px;padding:5px 12px;cursor:pointer;}',
      '.c-ghpage-codebtn:hover{background:#2ea043;}',
      // 文件表
      '.c-ghpage-files{border:1px solid var(--c-border);border-radius:8px;overflow:hidden;}',
      '.c-ghpage-frow{display:grid;grid-template-columns:minmax(120px,1.4fr) 2fr auto;align-items:center;gap:10px;padding:8px 14px;border-top:1px solid var(--c-border);}',
      '.c-ghpage-frow:first-child{border-top:none;}',
      '.c-ghpage-frow.bar{background:var(--c-bg-soft);font-size:12px;color:var(--c-fg-muted);}',
      '.c-ghpage-fname{display:flex;align-items:center;gap:8px;color:var(--c-fg);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.c-ghpage-fname .ic{flex:none;}',
      '.c-ghpage-fmsg{color:var(--c-fg-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}',
      '.c-ghpage-fwhen{color:var(--c-fg-muted);font-size:12px;white-space:nowrap;text-align:right;}',
      // README 渲染区
      '.c-ghpage-readme{margin-top:14px;border:1px solid var(--c-border);border-radius:8px;overflow:hidden;}',
      '.c-ghpage-readme .rhead{display:flex;align-items:center;gap:8px;background:var(--c-bg-soft);border-bottom:1px solid var(--c-border);padding:8px 14px;font-size:12px;color:var(--c-fg-muted);font-weight:600;}',
      '.c-ghpage-readme .rbody{padding:14px 16px;}',
      '.c-ghpage-readme .rbody h3{margin:0 0 6px;font-size:18px;color:var(--c-fg);}',
      '.c-ghpage-readme .rbody p{margin:0 0 6px;font-size:13px;color:var(--c-fg-muted);}',
      '.c-ghpage-readme .rbody .pill{display:inline-block;background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:6px;padding:1px 7px;font-size:11px;color:var(--c-fg-muted);margin:2px 4px 2px 0;}',
      // 右栏卡片（About / Releases）
      '.c-ghpage-side{display:flex;flex-direction:column;gap:14px;}',
      '.c-ghpage-card{}',
      '.c-ghpage-card .ctitle{font-size:14px;font-weight:600;color:var(--c-fg);margin-bottom:8px;}',
      '.c-ghpage-about p{margin:0 0 8px;font-size:12.5px;color:var(--c-fg-muted);}',
      '.c-ghpage-topics{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0 8px;}',
      '.c-ghpage-topic{background:var(--course-accent-soft);color:var(--course-accent);border-radius:999px;padding:1px 9px;font-size:11px;font-weight:600;}',
      '.c-ghpage-about .meta{font-size:12px;color:var(--c-fg-muted);}',
      '.c-ghpage-rel{font-size:12.5px;}',
      '.c-ghpage-rel .tag{display:inline-flex;align-items:center;gap:5px;color:#3fb950;font-weight:600;}',
      '.c-ghpage-rel .sub{color:var(--c-fg-muted);margin-top:3px;}',
      // —— 框选高亮覆盖层 ——
      // 用四块半透明遮罩压暗「框外」区域 + 一个描边框 + 标注气泡
      '.c-ghpage-spot{position:absolute;border:2px solid var(--course-accent);border-radius:8px;box-shadow:0 0 0 9999px rgba(1,4,9,.55),0 0 18px var(--course-accent);transition:all .45s cubic-bezier(.4,0,.2,1);pointer-events:none;z-index:5;}',
      '.c-ghpage-spot.hide{opacity:0;}',
      '.c-ghpage-bubble{position:absolute;max-width:280px;background:var(--c-bg-card);border:1px solid var(--course-accent);border-radius:10px;padding:10px 13px;font-size:13px;line-height:1.5;color:var(--c-fg);box-shadow:0 8px 26px rgba(0,0,0,.5);z-index:6;transition:all .45s cubic-bezier(.4,0,.2,1);}',
      '.c-ghpage-bubble b{color:var(--course-accent);}',
      '.c-ghpage-bubble .lead{font-weight:700;margin-bottom:3px;display:block;}',
      // 进度小标签（第几站 / 共几站）
      '.c-ghpage-stepbadge{display:inline-flex;align-items:center;gap:6px;background:var(--course-accent-soft);color:var(--course-accent);border:1px solid var(--course-accent);border-radius:999px;padding:3px 12px;font-size:13px;font-weight:700;margin-bottom:4px;}',
      // —— 交互弹层（Code 展开 / Fork / Releases 详情） ——
      '.c-ghpage-pop{margin-top:14px;background:var(--c-bg-card);border:1px solid var(--c-border);border-radius:10px;padding:14px 16px;}',
      '.c-ghpage-urlrow{display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
      '.c-ghpage-url{flex:1;min-width:200px;background:var(--c-bg);border:1px solid var(--c-border);border-radius:6px;padding:7px 10px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12.5px;color:var(--c-fg);overflow:auto;}',
      '.c-ghpage-copy{flex:none;background:var(--c-bg-soft);border:1px solid var(--c-border);color:var(--c-fg);border-radius:6px;padding:7px 12px;font-size:12.5px;cursor:pointer;}',
      '.c-ghpage-copy:hover{border-color:var(--course-accent);}',
      '.c-ghpage-copy.done{background:var(--course-accent-soft);border-color:var(--course-accent);color:var(--course-accent);}',
      '.c-ghpage-changelog{margin:8px 0 0;padding:0;list-style:none;}',
      '.c-ghpage-changelog li{position:relative;padding:4px 0 4px 20px;font-size:13px;color:var(--c-fg);}',
      '.c-ghpage-changelog li::before{content:"›";position:absolute;left:4px;color:var(--course-accent);font-weight:700;}',
      '.c-ghpage-ver{display:inline-flex;align-items:center;gap:6px;background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:999px;padding:2px 11px;font-family:ui-monospace,monospace;font-size:13px;color:#3fb950;font-weight:700;}',
      '.c-ghpage-forkdone{display:flex;align-items:center;gap:8px;font-size:14px;color:var(--c-fg);}',
      '.c-ghpage-forkdone code{font-family:ui-monospace,monospace;color:var(--course-accent);font-weight:700;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ---- 小图标 ----
  function icDir() {
    return '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" fill="#54aeff" aria-hidden="true"><path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H14a1.75 1.75 0 0 1 1.75 1.75v8.5A1.75 1.75 0 0 1 14 15H2a1.75 1.75 0 0 1-1.75-1.75V2.75c0-.464.184-.91.513-1.237Z"/></svg>';
  }
  function icFile() {
    return '<svg class="ic" width="16" height="16" viewBox="0 0 16 16" fill="var(--c-fg-muted)" aria-hidden="true"><path d="M2 1.75C2 .784 2.784 0 3.75 0h6.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0 1 13.25 16h-9.5A1.75 1.75 0 0 1 2 14.25Zm8.75-.25v3.5c0 .138.112.25.25.25h3.5L10.75 1.5Z"/></svg>';
  }

  // ---- 构建仿真仓库骨架 HTML ----
  // 给每个「可框选区域」打上 data-region，方便高亮框定位。
  function buildMock(opts) {
    opts = opts || {};
    var fileRows = FILES.map(function (f, i) {
      return '<div class="c-ghpage-frow">' +
        '<div class="c-ghpage-fname">' + (f.icon === 'dir' ? icDir() : icFile()) + '<span>' + f.name + '</span></div>' +
        '<div class="c-ghpage-fmsg">' + f.msg + '</div>' +
        '<div class="c-ghpage-fwhen">' + f.when + '</div>' +
        '</div>';
    }).join('');

    return '<div class="c-ghpage-mock">' +
      // 顶部仓库名 + 右上 Star/Fork
      '<div class="c-ghpage-repohead" data-region="head">' +
        '<svg class="book" width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75H4.5A1 1 0 0 0 4 15h9.25a.75.75 0 0 1 0 1.5H4.5A2.5 2.5 0 0 1 2 14Z"/></svg>' +
        '<span class="owner">' + OWNER + '</span><span class="slash">/</span><span class="name">' + REPO + '</span>' +
        '<span class="pub">Public</span>' +
        '<span class="spacer"></span>' +
        '<div class="c-ghpage-acts" data-region="starfork">' +
          '<span class="c-ghpage-act" data-region="star">★ Star <span class="cnt">128</span></span>' +
          '<span class="c-ghpage-act" data-region="fork">⑂ Fork <span class="cnt">23</span></span>' +
        '</div>' +
      '</div>' +
      // 标签栏
      '<div class="c-ghpage-tabs" data-region="tabs">' +
        '<span class="c-ghpage-tab on">＜＞ Code</span>' +
        '<span class="c-ghpage-tab" data-region="issues">⊙ Issues <span class="badge">5</span></span>' +
        '<span class="c-ghpage-tab">⇄ Pull requests <span class="badge">2</span></span>' +
      '</div>' +
      // 主体两栏
      '<div class="c-ghpage-body">' +
        '<div class="c-ghpage-main">' +
          '<div class="c-ghpage-coderow">' +
            '<span class="c-ghpage-branch">⑂ main</span>' +
            '<span class="c-ghpage-codebtn" data-region="codebtn">＜＞ Code ▾</span>' +
          '</div>' +
          // 文件表（整张表 region=files；右两列 region=filemeta）
          '<div class="c-ghpage-files" data-region="files">' +
            '<div class="c-ghpage-frow bar">' +
              '<div class="c-ghpage-fname" style="color:var(--c-fg-muted)">阿木 上传于 2 小时前</div>' +
              '<div class="c-ghpage-fmsg" data-region="filemeta-msg">最新一次改动</div>' +
              '<div class="c-ghpage-fwhen" data-region="filemeta-when">更新时间</div>' +
            '</div>' +
            fileRows +
          '</div>' +
          // README
          '<div class="c-ghpage-readme" data-region="readme">' +
            '<div class="rhead">📖 README.md</div>' +
            '<div class="rbody">' +
              '<h3>🎮 vibe-coding-class</h3>' +
              '<p>一个写给青少年的「边玩边学」编程课，用聊天的方式带你从 0 做出能跑的小项目。</p>' +
              '<p><b style="color:var(--c-fg)">解决什么问题：</b>不用先啃枯燥语法，跟着 AI 把想法直接做成成品。</p>' +
              '<p><b style="color:var(--c-fg)">怎么用：</b></p>' +
              '<span class="pill">npm install</span><span class="pill">npm run dev</span><span class="pill">打开 localhost</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        // 右栏
        '<div class="c-ghpage-side">' +
          '<div class="c-ghpage-card c-ghpage-about" data-region="about">' +
            '<div class="ctitle">About</div>' +
            '<p>青少年友好的互动编程课，边聊边做项目。</p>' +
            '<div class="c-ghpage-topics"><span class="c-ghpage-topic">education</span><span class="c-ghpage-topic">vibe-coding</span><span class="c-ghpage-topic">ai</span></div>' +
            '<div class="meta">🔗 vibe-class.dev</div>' +
            '<div class="meta">⚖️ MIT License</div>' +
          '</div>' +
          '<div class="c-ghpage-card c-ghpage-rel" data-region="releases">' +
            '<div class="ctitle">Releases</div>' +
            '<div class="tag">🏷️ v1.2.0 （Latest）</div>' +
            '<div class="sub">3 个版本 · 发布于昨天</div>' +
          '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  // ---- 高亮覆盖层：根据 data-region 找到目标元素，把高亮框/气泡挪过去 ----
  // bubble: { lead, html, where } where ∈ 'below'|'above'|'left'|'right'
  function mountSpotlight(wrap, regionKey, bubble) {
    var mock = wrap.querySelector('.c-ghpage-mock');
    var target = regionKey ? wrap.querySelector('[data-region="' + regionKey + '"]') : null;

    var spot = document.createElement('div');
    spot.className = 'c-ghpage-spot' + (target ? '' : ' hide');
    wrap.appendChild(spot);

    var bub = null;
    if (bubble) {
      bub = document.createElement('div');
      bub.className = 'c-ghpage-bubble';
      bub.innerHTML = (bubble.lead ? '<span class="lead">' + bubble.lead + '</span>' : '') + bubble.html;
      wrap.appendChild(bub);
    }

    function place() {
      if (!target) return;
      var wr = wrap.getBoundingClientRect();
      var tr = target.getBoundingClientRect();
      var pad = 4;
      var x = tr.left - wr.left - pad;
      var y = tr.top - wr.top - pad;
      var w = tr.width + pad * 2;
      var h = tr.height + pad * 2;
      spot.style.left = x + 'px';
      spot.style.top = y + 'px';
      spot.style.width = w + 'px';
      spot.style.height = h + 'px';

      if (bub) {
        var where = (bubble && bubble.where) || 'below';
        var bw = bub.offsetWidth, bh = bub.offsetHeight, gap = 12;
        var bx, by;
        if (where === 'above') { bx = x; by = y - bh - gap; }
        else if (where === 'left') { bx = x - bw - gap; by = y; }
        else if (where === 'right') { bx = x + w + gap; by = y; }
        else { bx = x; by = y + h + gap; } // below
        // 夹在容器内
        var maxX = wrap.clientWidth - bw - 6;
        var maxY = wrap.clientHeight - bh - 6;
        bx = Math.max(6, Math.min(bx, maxX));
        by = Math.max(6, Math.min(by, maxY));
        bub.style.left = bx + 'px';
        bub.style.top = by + 'px';
      }
    }

    // 初次 + 下一帧（等布局稳定）+ 窗口变化都重新定位
    place();
    requestAnimationFrame(place);
    setTimeout(place, 60);
    var ro = (typeof ResizeObserver !== 'undefined') ? new ResizeObserver(place) : null;
    if (ro) ro.observe(wrap);
    window.addEventListener('resize', place);

    return { spot: spot, bubble: bub, place: place };
  }

  // 总站数（用于「第 N 站 / 共 M 站」）
  var TOTAL_STOPS = 8;
  function stepBadge(n) {
    return '<span class="c-ghpage-stepbadge">🧭 导览第 ' + n + ' 站 / 共 ' + TOTAL_STOPS + ' 站</span>';
  }

  window.registerChapter({
    id: 'ghpage',
    index: 8,
    emoji: '🧭',
    title: 'GitHub 仓库页导览',
    subtitle: 'Repository 长啥样',
    theme: '#58a6ff',
    slides: [

      // ---------- 1. 开场：整体看一眼（不高亮） ----------
      {
        title: 'GitHub 最核心的页面',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">GitHub 上最核心的一页：<span style="color:var(--course-accent)">仓库页</span> 🧭</h1>' +
            '<p class="deck-lead">你在 GitHub 上看到的几乎一切，都从这一页开始——它就叫 <b>repository（仓库）页</b>。</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-mock1"></div>' +
            '<div class="deck-callout">' +
              '别被密密麻麻吓到。接下来我们当导游，<b>一块区域一块区域地框出来给你讲</b>。' +
              '逛完这一圈，你就能看懂任何一个 GitHub 项目了。' +
            '</div>';
          var wrap = stage.querySelector('#c-ghpage-mock1');
          wrap.innerHTML = buildMock();
          // 开场不高亮
          mountSpotlight(wrap, null, null);
        }
      },

      // ---------- 2. 代码库表格（文件列表） ----------
      {
        title: '区域 ①：文件列表',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            stepBadge(1) +
            '<h2 class="deck-h2">最显眼的部分：项目的全部文件 📂</h2>' +
            '<p class="deck-lead">仓库页中间这张表，列出了这个项目的<b>所有文件和文件夹</b>。</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-w"></div>' +
            '<div class="deck-callout">' +
              '点击任意一个<b>文件</b>就能看里面的内容，点击<b>文件夹</b>就钻进去看下一层。' +
              '整个项目就像一个可以层层打开的文件柜。' +
            '</div>';
          var wrap = stage.querySelector('#c-ghpage-w');
          wrap.innerHTML = buildMock();
          mountSpotlight(wrap, 'files', {
            lead: '📂 文件列表',
            html: '项目里的<b>每一个文件 / 文件夹</b>都在这。点谁就看谁。',
            where: 'right'
          });
        }
      },

      // ---------- 3. 每行文件后面的两个信息（commit message + 时间） ----------
      {
        title: '区域 ①补：每行后面的两个信息',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            stepBadge(2) +
            '<h2 class="deck-h2">每一行文件后面，藏着两条信息 🔍</h2>' +
            '<p class="deck-lead">别只看文件名——每行右边还告诉你这个文件「最近发生了什么」。</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-w"></div>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">① 最后一次的 commit message</h2>' +
                '<p class="deck-p">这个文件<b>最近一次改动</b>时，作者写的说明。一眼看出「上次动它是为了啥」。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">② 最后更新日期</h2>' +
                '<p class="deck-p">这个文件<b>最近一次更新</b>是什么时候。看哪些文件最新、哪些很久没动了。</p></div>' +
            '</div>' +
            '<div class="deck-callout">两条合起来：扫一眼就知道<b>每个文件最近都经历了什么</b>，不用挨个点开。</div>';
          var wrap = stage.querySelector('#c-ghpage-w');
          wrap.innerHTML = buildMock();
          // 框选文件表右侧两列（用表头那两个 region 拼一个范围；这里直接框整张表并把气泡贴右侧讲两列）
          mountSpotlight(wrap, 'files', {
            lead: '🔍 看每行最右侧',
            html: '<b>左边一列</b>＝该文件最后一次 commit 的说明；<br><b>最右一列</b>＝最后更新时间。',
            where: 'right'
          });
        }
      },

      // ---------- 4. 绿色 Code 按钮（点击展开 https 地址 + 复制） ----------
      {
        title: '区域 ②：绿色 Code 按钮',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            stepBadge(3) +
            '<h2 class="deck-h2">右上那个大绿按钮：<span style="color:#3fb950">Code</span> 🟢</h2>' +
            '<p class="deck-lead">点开它会给你一个<b>仓库地址</b>，用这个地址就能把整个仓库<b>克隆（clone）到你电脑上</b>。</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-w"></div>' +
            '<p class="deck-p" style="text-align:center;color:var(--c-fg-muted)">👆 点一下上面那个绿色 <b>Code ▾</b> 按钮试试</p>' +
            '<div id="c-ghpage-codepop"></div>' +
            '<div class="deck-callout">' +
              '<b>AI 时代怎么用：</b>把这个地址丢给你的 coding agent，对它说一句——' +
              '<br>「<b>帮我 clone 这个仓库</b>」，它就会把整个项目下载到你电脑上，你立刻就能开干。' +
            '</div>';
          var wrap = stage.querySelector('#c-ghpage-w');
          wrap.innerHTML = buildMock();
          var sl = mountSpotlight(wrap, 'codebtn', {
            lead: '🟢 Code 按钮',
            html: '点开它 = 拿到仓库地址 = 能把项目<b>克隆到本地</b>。',
            where: 'below'
          });

          var pop = stage.querySelector('#c-ghpage-codepop');
          var url = 'https://github.com/' + OWNER + '/' + REPO + '.git';
          var btn = wrap.querySelector('[data-region="codebtn"]');
          btn.style.cursor = 'pointer';
          var opened = false;
          btn.addEventListener('click', function () {
            if (opened) return;
            opened = true;
            pop.innerHTML =
              '<div class="c-ghpage-pop">' +
                '<div style="font-size:12px;color:var(--c-fg-muted);margin-bottom:8px;">📋 Clone — HTTPS 地址</div>' +
                '<div class="c-ghpage-urlrow">' +
                  '<div class="c-ghpage-url">' + url + '</div>' +
                  '<button class="c-ghpage-copy" id="c-ghpage-copybtn">复制</button>' +
                '</div>' +
                '<div style="font-size:12.5px;color:var(--c-fg-muted);margin-top:10px;">这串地址就是仓库的「门牌号」，clone 时给 git 或 AI 用。</div>' +
              '</div>';
            var cb = stage.querySelector('#c-ghpage-copybtn');
            cb.addEventListener('click', function () {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(url).catch(function () {});
              }
              cb.textContent = '✓ 已复制';
              cb.classList.add('done');
              setTimeout(function () { cb.textContent = '复制'; cb.classList.remove('done'); }, 1800);
            });
            // 弹层出现后，骨架高度变了，重新定位高亮框
            if (sl && sl.place) requestAnimationFrame(sl.place);
          });
        }
      },

      // ---------- 5. README 渲染区 ----------
      {
        title: '区域 ③：README',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            stepBadge(4) +
            '<h2 class="deck-h2">文件列表下面这一大块：<span style="color:var(--course-accent)">README</span> 📖</h2>' +
            '<p class="deck-lead">GitHub 会<b>自动读取仓库里的 README 文件，把它渲染成网页</b>显示在这里——不用你做任何事。</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-w"></div>' +
            '<div class="deck-callout">' +
              'README 是项目的<b>门面</b>。一份好的 README 会讲清三件事：' +
              '<b>这个项目是做什么用的、解决了什么问题、以及怎么用</b>。' +
              '看一个陌生项目，先读它就对了。' +
            '</div>';
          var wrap = stage.querySelector('#c-ghpage-w');
          wrap.innerHTML = buildMock();
          mountSpotlight(wrap, 'readme', {
            lead: '📖 README 渲染区',
            html: 'GitHub 自动把 README 文件<b>渲染</b>在这。它是项目的门面。',
            where: 'above'
          });
        }
      },

      // ---------- 6. About 模块 ----------
      {
        title: '区域 ④：About',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            stepBadge(5) +
            '<h2 class="deck-h2">右上角的名片：<span style="color:var(--course-accent)">About</span> 🪪</h2>' +
            '<p class="deck-lead">页面右侧最上方这一小块，是项目的「一句话名片」。</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-w"></div>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">简介 + 标签</h2>' +
                '<p class="deck-p">一句话说明项目是干啥的，加上几个 <b>topics 标签</b>（像 education、ai），方便别人搜到。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">协议 + 链接</h2>' +
                '<p class="deck-p"><b>开源协议（License，如 MIT）</b>说明别人能怎么用你的代码；还能放一个项目网站链接。</p></div>' +
            '</div>' +
            '<div class="deck-callout">想快速判断「这项目是干啥的、能不能拿来用」，先扫一眼 About 就够了。</div>';
          var wrap = stage.querySelector('#c-ghpage-w');
          wrap.innerHTML = buildMock();
          mountSpotlight(wrap, 'about', {
            lead: '🪪 About',
            html: '项目<b>简介</b> + <b>topics 标签</b> + <b>开源协议</b> + 网站链接。',
            where: 'left'
          });
        }
      },

      // ---------- 7. Star 与 Fork（含 Fork 互动） ----------
      {
        title: '区域 ⑤：Star 与 Fork',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            stepBadge(6) +
            '<h2 class="deck-h2">右上两个按钮：<span style="color:#e3b341">★ Star</span> 与 <span style="color:var(--course-accent)">⑂ Fork</span></h2>' +
            '<p class="deck-lead">逛 GitHub 最常按的两个键，作用完全不同：</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-w"></div>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">★ Star（星标）</h2>' +
                '<p class="deck-p">程序员的「一键三连」——给项目<b>点赞 + 收藏</b>，表示喜欢。Star 越多，说明这个项目越受欢迎。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">⑂ Fork（复刻）</h2>' +
                '<p class="deck-p">把这个项目<b>原样复制一份到你自己名下</b>，变成你的仓库，你可以随便 DIY 改造。</p></div>' +
            '</div>' +
            '<p class="deck-p" style="text-align:center;color:var(--c-fg-muted)">👆 点上面那个 <b>⑂ Fork</b> 按钮，看看会发生什么</p>' +
            '<div id="c-ghpage-forkpop"></div>';
          var wrap = stage.querySelector('#c-ghpage-w');
          wrap.innerHTML = buildMock();
          var sl = mountSpotlight(wrap, 'starfork', {
            lead: '★ Star ＆ ⑂ Fork',
            html: '<b>Star</b>＝点赞收藏；<b>Fork</b>＝复制一份到你名下。',
            where: 'below'
          });

          var pop = stage.querySelector('#c-ghpage-forkpop');
          var forkBtn = wrap.querySelector('[data-region="fork"]');
          forkBtn.style.cursor = 'pointer';
          var done = false;
          forkBtn.addEventListener('click', function () {
            if (done) return;
            done = true;
            pop.innerHTML =
              '<div class="c-ghpage-pop">' +
                '<div style="font-size:13px;color:var(--c-fg-muted);margin-bottom:8px;">点击 <b style="color:var(--c-fg)">Create fork</b> 之后……</div>' +
                '<div class="c-ghpage-forkdone">✅ 已复刻！现在你名下也有了一个一模一样的仓库：' +
                  '<code>your-name/' + REPO + '</code></div>' +
                '<div style="font-size:12.5px;color:var(--c-fg-muted);margin-top:8px;">它完全属于你，随便改、随便玩，都不会影响原作者的项目。</div>' +
              '</div>';
            if (sl && sl.place) requestAnimationFrame(sl.place);
          });
        }
      },

      // ---------- 8. Releases 模块（含点进去看版本 + changelog） ----------
      {
        title: '区域 ⑥：Releases',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            stepBadge(7) +
            '<h2 class="deck-h2">右侧的 <span style="color:#3fb950">Releases</span>：版本发布 🏷️</h2>' +
            '<p class="deck-lead">这里展示项目的<b>正式版本发布信息</b>——每发布一个新版本，就在这里记一笔。</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-w"></div>' +
            '<p class="deck-p" style="text-align:center;color:var(--c-fg-muted)">👆 点上面的 <b>Releases</b> 卡片，进去看看一个版本里有什么</p>' +
            '<div id="c-ghpage-relpop"></div>' +
            '<div class="deck-callout">点进某个版本，能看到它的<b>版本号</b>，以及这个版本<b>包含的所有更新内容（changelog）</b>。</div>';
          var wrap = stage.querySelector('#c-ghpage-w');
          wrap.innerHTML = buildMock();
          var sl = mountSpotlight(wrap, 'releases', {
            lead: '🏷️ Releases',
            html: '项目的<b>版本发布</b>记录。点进去看版本号 + 更新内容。',
            where: 'left'
          });

          var pop = stage.querySelector('#c-ghpage-relpop');
          var relCard = wrap.querySelector('[data-region="releases"]');
          relCard.style.cursor = 'pointer';
          var opened = false;
          relCard.addEventListener('click', function () {
            if (opened) return;
            opened = true;
            pop.innerHTML =
              '<div class="c-ghpage-pop">' +
                '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:6px;">' +
                  '<span class="c-ghpage-ver">🏷️ v1.2.0</span>' +
                  '<span style="font-size:12px;color:var(--c-fg-muted);">发布于昨天 · Latest</span>' +
                '</div>' +
                '<div style="font-size:13px;color:var(--c-fg);font-weight:600;margin:6px 0 2px;">这个版本更新了什么：</div>' +
                '<ul class="c-ghpage-changelog">' +
                  '<li>新增「续读进度条」，刷新页面也不丢进度</li>' +
                  '<li>修好了移动端首页排版错位</li>' +
                  '<li>README 补上了使用截图</li>' +
                  '<li>升级依赖，启动速度更快</li>' +
                '</ul>' +
              '</div>';
            if (sl && sl.place) requestAnimationFrame(sl.place);
          });
        }
      },

      // ---------- 9. Issues 标签 ----------
      {
        title: '区域 ⑦：Issues 标签',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            stepBadge(8) +
            '<h2 class="deck-h2">顶部标签栏里的 <span style="color:var(--course-accent)">Issues</span> ⊙</h2>' +
            '<p class="deck-lead">回到页面最上方那排标签，点 <b>Issues</b> 会进入项目的「任务 / 问题」清单。</p>' +
            '<div class="c-ghpage-wrap" id="c-ghpage-w"></div>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">Issue 是什么</h2>' +
                '<p class="deck-p">一张张<b>任务卡 / 问题卡</b>：可以是「发现一个 bug」「想加个新功能」「有个疑问」。大家在卡片里讨论。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">两种状态</h2>' +
                '<p class="deck-p"><b style="color:#3fb950">Open（未解决）</b>＝还在处理；<br><b style="color:#a371f7">Closed（已解决）</b>＝已经搞定关掉了。</p></div>' +
            '</div>' +
            '<div class="deck-callout">想知道一个项目「现在大家在忙啥、还有哪些坑」，翻 Issues 就一目了然。</div>';
          var wrap = stage.querySelector('#c-ghpage-w');
          wrap.innerHTML = buildMock();
          mountSpotlight(wrap, 'issues', {
            lead: '⊙ Issues',
            html: '任务 / 问题卡片清单，分 <b>Open（未解决）</b> 和 <b>Closed（已解决）</b>。',
            where: 'below'
          });
        }
      },

      // ---------- 10. 小结 ----------
      {
        title: '本章小结',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h1 class="deck-h1">逛完一圈，你已经会看仓库页了 🎉</h1>' +
              '<p class="deck-lead">把刚才框过的几站连起来回顾一下：</p>' +
            '</div>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">📂 文件列表</h2><p class="deck-p">项目全部文件，点开看内容；每行后面是最近的 commit 说明和更新时间。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">🟢 Code 按钮</h2><p class="deck-p">拿仓库地址，把项目 clone 到本地。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">📖 README</h2><p class="deck-p">项目门面：做什么、解决啥、怎么用。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">🪪 About</h2><p class="deck-p">简介、标签、开源协议、链接。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">★ Star ＆ ⑂ Fork</h2><p class="deck-p">点赞收藏 / 复制一份到自己名下。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">🏷️ Releases</h2><p class="deck-p">版本发布与更新内容（changelog）。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">⊙ Issues</h2><p class="deck-p">任务 / 问题卡片，Open 与 Closed。</p></div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '记住这张地图，<b>任何一个 GitHub 项目你都能快速看懂了</b>。' +
              '下一章，我们学怎么真正<b>参与进去、和别人协作</b>。👋' +
            '</div>';
        }
      }

    ]
  });
})();
