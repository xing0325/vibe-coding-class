(function () {
  'use strict';

  // ============================================================
  // 第9章 · GitHub 多人协作
  // theme: #2ea043  emoji: 🤝
  // 样式前缀: c-collab-
  // 框架负责翻页（底部按钮 + 键盘 ←→），本文件只做每页内容 + 页内互动。
  // 纯内联 SVG + vanilla JS，零外部资源。
  // ============================================================

  // 一次性注入本章公共样式（id 去重，避免多次 render 重复插入）
  function injectStyle() {
    if (document.getElementById('c-collab-style')) return;
    var s = document.createElement('style');
    s.id = 'c-collab-style';
    s.textContent = [
      // 树状图外框
      '.c-collab-treewrap{background:var(--c-bg-card);border:1px solid var(--c-border);border-radius:16px;padding:14px 8px 8px;margin:14px 0;}',
      '.c-collab-tree{display:block;width:100%;max-width:760px;margin:0 auto;}',
      '.c-collab-tree.bad{border-radius:16px;box-shadow:inset 0 0 0 2px rgba(248,81,73,.0);}',
      // 图例
      '.c-collab-legend{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;margin:4px 0 2px;font-size:12.5px;color:var(--c-fg-muted);}',
      '.c-collab-legend span{display:inline-flex;align-items:center;gap:6px;}',
      '.c-collab-legend i{width:18px;height:4px;border-radius:2px;display:inline-block;}',
      // 卡片网格
      '.c-collab-cards{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0;}',
      '.c-collab-card{background:var(--c-bg-card);border:1px solid var(--c-border);border-radius:14px;padding:16px 18px;}',
      '.c-collab-card.good{border-color:var(--course-accent);box-shadow:0 0 0 1px var(--course-accent) inset;}',
      '.c-collab-card.bad{border-color:#f85149;box-shadow:0 0 0 1px #f85149 inset;}',
      '.c-collab-card h3{margin:0 0 8px;font-size:15px;}',
      '.c-collab-card .verdict{font-size:13px;font-weight:700;}',
      '.c-collab-card.good .verdict{color:var(--course-accent);}',
      '.c-collab-card.bad .verdict{color:#f85149;}',
      // 流程步骤条
      '.c-collab-flow{display:flex;align-items:stretch;gap:6px;flex-wrap:wrap;justify-content:center;margin:18px 0;}',
      '.c-collab-step{background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:12px;padding:12px 14px;min-width:96px;text-align:center;font-size:13px;}',
      '.c-collab-step b{color:var(--course-accent);display:block;font-size:14px;}',
      '.c-collab-sep{display:flex;align-items:center;color:var(--course-accent);font-size:20px;font-weight:700;}',
      // AI 对话气泡
      '.c-collab-chat{max-width:580px;margin:20px auto;display:flex;flex-direction:column;gap:12px;}',
      '.c-collab-bubble{position:relative;padding:13px 16px;border-radius:14px;font-size:15px;line-height:1.55;text-align:left;}',
      '.c-collab-bubble .who{font-size:12px;font-weight:700;margin-bottom:5px;opacity:.85;}',
      '.c-collab-bubble.you{align-self:flex-end;background:var(--c-bg-soft);border:1px solid var(--c-border);border-bottom-right-radius:4px;max-width:84%;}',
      '.c-collab-bubble.ai{align-self:flex-start;background:var(--course-accent-soft);border:1px solid var(--course-accent);border-bottom-left-radius:4px;max-width:90%;}',
      '.c-collab-bubble code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--course-accent);font-weight:700;}',
      // 一行小代码/标签
      '.c-collab-tag{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;color:var(--course-accent);background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:6px;padding:2px 7px;}',
      // 大入口卡片
      '.c-collab-cta{background:linear-gradient(140deg,var(--course-accent-soft),var(--c-bg-card));border:1.5px solid var(--course-accent);border-radius:22px;padding:34px 28px;text-align:center;margin:18px auto;max-width:620px;}',
      '.c-collab-cta .big{font-size:56px;line-height:1;margin-bottom:10px;}',
      '.c-collab-cta .deck-btn{font-size:18px;padding:14px 30px;margin-top:14px;}',
      '@keyframes c-collab-pulse{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}',
      '.c-collab-cta .big{animation:c-collab-pulse 2.4s ease-in-out infinite;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ----------------------------------------------------------------
  // 核心：画一张「Git 提交历史」树状图 SVG。
  // 多条 lane（分支线），每条有自己的颜色；commit = 圆点 + 字母标号；
  // 分支名用 pill 指向 lane 头部 commit；
  // 支持：冲突点 ⚡(红)、快进箭头、虚线分叉连接。
  //
  // spec:
  // {
  //   w, h,                         画布尺寸
  //   x0, dx,                       第一个 commit 的 x、相邻 commit 横向间距
  //   lanes: [{
  //     y,                          这条线的纵坐标
  //     color,                      线/点颜色
  //     pill,                       分支 pill 文案（指向最后一个 commit）
  //     commits: [{ id, x?(可覆盖), conflict?(bool) }],
  //     from: { x, y }              （可选）这条线从某点分叉出来：画虚线连到本线第一个 commit
  //   }],
  //   ff: { x1,y1,x2,y2,label }     （可选）快进箭头
  //   notes: [{x,y,text,color,anchor}]  （可选）自由文字注解
  // }
  // ----------------------------------------------------------------
  function buildTreeSVG(spec) {
    var r = spec.r || 16;
    var parts = [];
    parts.push('<svg class="c-collab-tree" viewBox="0 0 ' + spec.w + ' ' + spec.h + '" width="100%" aria-hidden="true">');

    // marker：箭头（快进 / 分叉）
    parts.push(
      '<defs>' +
        '<marker id="c-collab-arrow-ff" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
          '<path d="M0 0L10 5L0 10z" fill="var(--course-accent)"/>' +
        '</marker>' +
        '<marker id="c-collab-arrow-pick" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
          '<path d="M0 0L10 5L0 10z" fill="#d29922"/>' +
        '</marker>' +
      '</defs>'
    );

    // 计算每条 lane 每个 commit 的坐标
    var laid = spec.lanes.map(function (lane) {
      var cs = lane.commits.map(function (c, i) {
        var cx = (typeof c.x === 'number') ? c.x : (spec.x0 + spec.dx * i);
        return { id: c.id, conflict: c.conflict, cx: cx, cy: lane.y };
      });
      return { lane: lane, cs: cs };
    });

    // 1) 先画分叉虚线（垫底）
    laid.forEach(function (L) {
      if (L.lane.from && L.cs.length) {
        var first = L.cs[0];
        parts.push('<path d="M' + L.lane.from.x + ' ' + L.lane.from.y +
          ' C ' + ((L.lane.from.x + first.cx) / 2) + ' ' + L.lane.from.y + ', ' +
          ((L.lane.from.x + first.cx) / 2) + ' ' + first.cy + ', ' +
          first.cx + ' ' + first.cy + '" fill="none" stroke="' + L.lane.color +
          '" stroke-width="3" stroke-dasharray="2 5" opacity="0.65"/>');
      }
    });

    // 2) 画每条 lane 的连线
    laid.forEach(function (L) {
      var cs = L.cs;
      for (var i = 0; i < cs.length - 1; i++) {
        parts.push('<line x1="' + cs[i].cx + '" y1="' + cs[i].cy +
          '" x2="' + cs[i + 1].cx + '" y2="' + cs[i + 1].cy +
          '" stroke="' + L.lane.color + '" stroke-width="4"/>');
      }
    });

    // 3) 快进箭头（在画点之前画，避免压住圆点）
    if (spec.ff) {
      parts.push('<line x1="' + spec.ff.x1 + '" y1="' + spec.ff.y1 +
        '" x2="' + spec.ff.x2 + '" y2="' + spec.ff.y2 +
        '" stroke="var(--course-accent)" stroke-width="3" stroke-dasharray="6 5" marker-end="url(#c-collab-arrow-ff)"/>');
      if (spec.ff.label) {
        parts.push('<text x="' + ((spec.ff.x1 + spec.ff.x2) / 2) + '" y="' + (spec.ff.y1 - 10) +
          '" text-anchor="middle" font-size="12.5" font-weight="700" fill="var(--course-accent)">' + spec.ff.label + '</text>');
      }
    }

    // 3b) cherry-pick 摘取箭头（自定义）
    if (spec.pick) {
      parts.push('<path d="' + spec.pick.d + '" fill="none" stroke="#d29922" stroke-width="3" stroke-dasharray="5 5" marker-end="url(#c-collab-arrow-pick)"/>');
      if (spec.pick.label) {
        parts.push('<text x="' + spec.pick.lx + '" y="' + spec.pick.ly +
          '" text-anchor="middle" font-size="12.5" font-weight="700" fill="#d29922">' + spec.pick.label + '</text>');
      }
    }

    // 4) 画 commit 圆点 + 字母标号 + 冲突 ⚡
    laid.forEach(function (L) {
      L.cs.forEach(function (c) {
        var fill = c.conflict ? '#f85149' : L.lane.color;
        parts.push('<circle cx="' + c.cx + '" cy="' + c.cy + '" r="' + r + '" fill="' + fill + '" stroke="#fff" stroke-width="3"/>');
        parts.push('<text x="' + c.cx + '" y="' + (c.cy + 5) + '" text-anchor="middle" font-size="14" font-weight="800" fill="#fff" font-family="ui-monospace,monospace">' + c.id + '</text>');
        if (c.conflict) {
          parts.push('<text x="' + (c.cx + r + 2) + '" y="' + (c.cy - r + 2) + '" font-size="18">⚡</text>');
        }
      });
    });

    // 5) 分支 pill（指向 lane 头部 commit）
    laid.forEach(function (L) {
      if (!L.lane.pill || !L.cs.length) return;
      var head = L.cs[L.cs.length - 1];
      var px = head.cx + r + 14;
      var py = head.cy;
      var label = L.lane.pill;
      var pw = 16 + label.length * 8.4;
      // 连接小横线
      parts.push('<line x1="' + (head.cx + r) + '" y1="' + py + '" x2="' + px + '" y2="' + py + '" stroke="' + L.lane.color + '" stroke-width="2"/>');
      parts.push('<rect x="' + px + '" y="' + (py - 13) + '" width="' + pw + '" height="26" rx="13" fill="' + L.lane.color + '" opacity="0.18" stroke="' + L.lane.color + '" stroke-width="1.5"/>');
      parts.push('<text x="' + (px + pw / 2) + '" y="' + (py + 4) + '" text-anchor="middle" font-size="12" font-weight="700" fill="' + L.lane.color + '" font-family="ui-monospace,monospace">' + label + '</text>');
    });

    // 6) 自由注解
    (spec.notes || []).forEach(function (nt) {
      parts.push('<text x="' + nt.x + '" y="' + nt.y + '" text-anchor="' + (nt.anchor || 'start') +
        '" font-size="' + (nt.size || 12.5) + '" font-weight="600" fill="' + (nt.color || 'var(--c-fg-muted)') + '">' + nt.text + '</text>');
    });

    parts.push('</svg>');
    return parts.join('');
  }

  // 章节通用线条配色（语义化）
  var COL_UPSTREAM = '#a371f7'; // 上游 main（别人）紫色
  var COL_MINE = '#2ea043';     // 你自己的分支 绿色（=主题）
  var COL_MAIN = '#58a6ff';     // 你的 main 蓝色

  // 图例小块
  function legend(items) {
    return '<div class="c-collab-legend">' + items.map(function (it) {
      return '<span><i style="background:' + it.c + '"></i>' + it.t + '</span>';
    }).join('') + '</div>';
  }

  window.registerChapter({
    id: 'collab',
    index: 9,
    emoji: '🤝',
    title: 'GitHub 多人协作',
    subtitle: 'fork、PR、review 与冲突回避',
    theme: '#2ea043',
    slides: [

      // ---------- Slide 1：发现项目 → fork ----------
      {
        title: '协作第一步：fork 一份',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h1 class="deck-h1">在 GitHub 上发现一个好项目 👀</h1>' +
              '<p class="deck-lead">你逛 GitHub，看到一个想参与的项目。第一步不是直接动手，而是先——<b style="color:var(--course-accent)">fork（复刻）</b>一份到你自己名下。</p>' +
              '<div class="c-collab-flow">' +
                '<div class="c-collab-step">🌍<b>原项目</b>别人的仓库</div>' +
                '<div class="c-collab-sep">🍴→</div>' +
                '<div class="c-collab-step">🪞<b>你的 fork</b>你名下的副本</div>' +
              '</div>' +
              '<div class="deck-callout">' +
                '<b>fork</b> = 把整个仓库原样复制一份到<b>你自己的 GitHub 账号</b>下。' +
                '从此你在这份副本上怎么折腾都行，<b>动不到</b>原项目一根毫毛。（上一章讲过它～）' +
              '</div>' +
              '<p class="deck-p" style="color:var(--c-fg-muted)">把它想成：你不能在别人的作业本上乱画，但可以复印一份，在复印件上随便改。改好了再"申请"把你的改动交回去。</p>' +
            '</div>';
        }
      },

      // ---------- Slide 2：把"你 fork 的那份"地址给 AI clone ----------
      {
        title: '把你 fork 的地址给 AI',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<h2 class="deck-h2">复制地址时，认准"你名下那一份" ⚠️</h2>' +
            '<p class="deck-lead">fork 完，你要把仓库 clone（克隆）到本地。这一步最容易踩坑的是——<b>复制错地址</b>。</p>' +
            '<div class="c-collab-cards">' +
              '<div class="c-collab-card bad">' +
                '<h3>❌ 不要复制这个</h3>' +
                '<p class="deck-p" style="margin:6px 0">原项目的地址：</p>' +
                '<span class="c-collab-tag">github.com/<b>原作者</b>/cool-project</span>' +
                '<p class="verdict" style="margin-top:8px">这是别人的，你没权限往里推</p>' +
              '</div>' +
              '<div class="c-collab-card good">' +
                '<h3>✅ 复制这个</h3>' +
                '<p class="deck-p" style="margin:6px 0">你 fork 出来、<b>你名下</b>的那份：</p>' +
                '<span class="c-collab-tag">github.com/<b>你的用户名</b>/cool-project</span>' +
                '<p class="verdict" style="margin-top:8px">这是你的副本，随便改</p>' +
              '</div>' +
            '</div>' +
            '<div class="c-collab-chat">' +
              '<div class="c-collab-bubble you"><div class="who">你 🙋</div>这是我 fork 的仓库地址，帮我 clone 到本地：<br><code>github.com/你的用户名/cool-project</code></div>' +
              '<div class="c-collab-bubble ai"><div class="who">AI 🤖</div>已经帮你 clone 下来啦 ✅ 现在本地就有这个项目了，你可以开始改了。</div>' +
            '</div>';
        }
      },

      // ---------- Slide 3：黄金法则（点题页）----------
      {
        title: '黄金法则',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<div class="deck-center">' +
              '<div style="font-size:60px;line-height:1;margin-bottom:8px">🛑</div>' +
              '<h1 class="deck-h1">黄金法则：<span style="color:#f85149">别直接在 main 上改！</span></h1>' +
              '<p class="deck-lead"><b>main（主干分支）</b>要永远保持"干净的官方版"。你的改动，统统放到<b style="color:var(--course-accent)">新分支</b>上去。</p>' +
              '<div class="deck-callout warn">' +
                '为什么？因为你在改的同时，<b>上游（原项目）的 main 也在更新</b>——别人也在提交新代码。' +
                '接下来两页，我们用两张树状图，把"直接在 main 改" vs "在新分支改"摆在一起对比。看完你就再也不想在 main 上动手了。' +
              '</div>' +
              '<div class="c-collab-cards" style="max-width:560px;margin:16px auto 0">' +
                '<div class="c-collab-card bad"><h3>情况一 😣</h3><p class="deck-p" style="margin:0">直接在自己的 main 上改 → 下一页</p></div>' +
                '<div class="c-collab-card good"><h3>情况二 😎</h3><p class="deck-p" style="margin:0">在新分支上改 → 下下页</p></div>' +
              '</div>' +
            '</div>';
        }
      },

      // ---------- Slide 4：情况一 · 直接在 main 改（红色警告 + 树状图）----------
      {
        title: '情况一：直接在 main 改 😣',
        render: function (stage, api) {
          injectStyle();
          // 你的 main:  A B C X Y     上游 main: ... C D E（C 之后分叉）
          // 共同祖先 C 在 x = 280。两条线都从 C 往后长，各走各的。
          var svg = buildTreeSVG({
            w: 760, h: 280, r: 17, x0: 70, dx: 105,
            lanes: [
              {
                y: 90, color: COL_UPSTREAM, pill: 'upstream/main',
                commits: [
                  { id: 'A', x: 70 }, { id: 'B', x: 175 }, { id: 'C', x: 280 },
                  { id: 'D', x: 430 }, { id: 'E', x: 535 }
                ]
              },
              {
                y: 200, color: COL_MAIN, pill: '你的 main',
                from: { x: 280, y: 90 },
                commits: [
                  { id: 'X', x: 430 }, { id: 'Y', x: 535, conflict: true }
                ]
              }
            ],
            notes: [
              { x: 380, y: 30, anchor: 'middle', size: 13, color: 'var(--c-fg)', text: '两条线都从 C 之后各自长出新提交 → 分叉了' },
              { x: 595, y: 200, anchor: 'start', color: '#f85149', text: '⚡ X/Y 和 D/E 碰到同一行 → 冲突' }
            ]
          });
          stage.innerHTML =
            '<h2 class="deck-h2">情况一：你直接在自己的 main 上写 X、Y 😣</h2>' +
            '<div class="c-collab-treewrap">' +
              legend([{ c: COL_UPSTREAM, t: '上游 main（别人提交 D、E）' }, { c: COL_MAIN, t: '你的 main（你写了 X、Y）' }, { c: '#f85149', t: '⚡ 冲突' }]) +
              svg +
            '</div>' +
            '<div class="deck-callout warn">' +
              '从共同的 <b>C</b> 之后，两条线<b>各长各的</b>：你这边有 X、Y，上游那边有 D、E，谁也没有对方的提交。' +
              '这时你想 <span class="c-collab-tag">git pull</span> 上游最新代码，Git 没法"快进"，只能做一次<b>真正的三方合并</b>，多出一个莫名其妙的合并提交；' +
              '万一 X/Y 跟 D/E 改了<b>同一行</b>，就直接 <b style="color:#f85149">⚡ 冲突</b>，还得你手动一行行去解，历史也变得一团乱。' +
            '</div>';
        }
      },

      // ---------- Slide 5：情况二 · 在新分支改（绿色丝滑 + 树状图 + 快进）----------
      {
        title: '情况二：在新分支改 😎',
        render: function (stage, api) {
          injectStyle();
          // 你的 main: A B C（不动）  你的分支: C→X→Y  上游 main: C→D→E
          // pull 后你的 main 直接快进 C→D→E。
          var svg = buildTreeSVG({
            w: 760, h: 320, r: 17, x0: 70, dx: 105,
            lanes: [
              // 上游 main（顶部，紫）
              {
                y: 70, color: COL_UPSTREAM, pill: 'upstream/main',
                commits: [
                  { id: 'A', x: 70 }, { id: 'B', x: 175 }, { id: 'C', x: 280 },
                  { id: 'D', x: 430 }, { id: 'E', x: 535 }
                ]
              },
              // 你的分支（中间，绿）从 C 分叉
              {
                y: 175, color: COL_MINE, pill: 'feature 分支',
                from: { x: 280, y: 70 },
                commits: [
                  { id: 'X', x: 430 }, { id: 'Y', x: 535 }
                ]
              },
              // 你的 main（底部，蓝）pull 之后快进到 A-B-C-D-E
              {
                y: 280, color: COL_MAIN, pill: '你的 main（pull 后）',
                commits: [
                  { id: 'A', x: 70 }, { id: 'B', x: 175 }, { id: 'C', x: 280 },
                  { id: 'D', x: 430 }, { id: 'E', x: 535 }
                ]
              }
            ],
            ff: { x1: 280, y1: 280, x2: 525, y2: 280, label: '快进 fast-forward →' },
            notes: [
              { x: 280, y: 40, anchor: 'middle', size: 13, color: 'var(--c-fg)', text: '你的 main 一直没动，纯净 👍' }
            ]
          });
          stage.innerHTML =
            '<h2 class="deck-h2">情况二：你把 X、Y 写在一个新分支上 😎</h2>' +
            '<div class="c-collab-treewrap">' +
              legend([{ c: COL_UPSTREAM, t: '上游 main（D、E）' }, { c: COL_MINE, t: '你的 feature 分支（X、Y）' }, { c: COL_MAIN, t: '你的 main（纯净）' }]) +
              svg +
            '</div>' +
            '<div class="deck-callout">' +
              '你的 <b>main 一直停在 C，没动过</b>。改动全在绿色的 feature 分支上。' +
              '这时你 <span class="c-collab-tag">git checkout main</span> 再 <span class="c-collab-tag">git pull</span>，因为 main 从 C 之后没有任何自己的提交，' +
              'Git 只需把它<b style="color:var(--course-accent)">"快进"(fast-forward)</b>到 A-B-C-D-E 就行——<b style="color:var(--course-accent)">零合并、零冲突！</b>' +
              '你的 feature 分支还在旁边好好的，一点没受影响。' +
            '</div>';
        }
      },

      // ---------- Slide 6：一句话总结 ----------
      {
        title: '一句话总结心法',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h2 class="deck-h2">所以记住这条心法 🧠</h2>' +
              '<div class="deck-callout" style="font-size:18px">' +
                '让你的 <b style="color:var(--course-accent)">main 永远是"纯净的官方版"</b>，' +
                '自己的改动<b>都放分支上</b>。<br>' +
                '想要上游最新代码时，main 只需要<b style="color:var(--course-accent)">"快进"</b>——丝滑，无冲突。' +
              '</div>' +
              '<div class="c-collab-cards" style="max-width:560px;margin:18px auto 0">' +
                '<div class="c-collab-card bad"><h3>😣 在 main 上改</h3><p class="verdict">三方合并 · 可能冲突 · 历史乱</p></div>' +
                '<div class="c-collab-card good"><h3>😎 在分支上改</h3><p class="verdict">main 快进 · 零冲突 · 历史干净</p></div>' +
              '</div>' +
              '<p class="deck-p" style="color:var(--c-fg-muted)">这一条吃透，你已经超过一大半"只会在 main 上瞎改"的新手了。</p>' +
            '</div>';
        }
      },

      // ---------- Slide 7：PR = Pull Request ----------
      {
        title: 'PR = Pull Request',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<h2 class="deck-h2">改完了，怎么交回去？发一个 PR 📬</h2>' +
            '<p class="deck-lead"><b>PR = Pull Request（合并请求）</b>：把你<b>分支上</b>的改动，<b>提议合并</b>回某个分支（通常是上游 main）的请求。</p>' +
            '<div class="c-collab-flow">' +
              '<div class="c-collab-step">🌿<b>你的分支</b>X、Y 写好了</div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">📬<b>发起 PR</b>"我想把这些合进去"</div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">🎯<b>上游 main</b>等待审核合并</div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '划重点：PR <b>不是直接合并</b>，而是一个<b style="color:var(--course-accent)">"提案"</b>。' +
              '你只是举手说"我写好了，请看看能不能收"，然后<b>等人审核</b>。同意了才会真的合进去。' +
            '</div>' +
            '<p class="deck-p" style="color:var(--c-fg-muted)">名字有点反直觉：明明是你要"推"代码进去，却叫 Pull Request——因为是站在项目方角度，"请求项目方把你的改动 pull 过去"。记结论就行。</p>';
        }
      },

      // ---------- Slide 8：Code Review ----------
      {
        title: 'Code Review 代码审核',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<h2 class="deck-h2">Code Review：开源协作的质量关卡 🔍</h2>' +
            '<p class="deck-lead">你发了 PR 之后，项目管理员会<b>逐行看你的代码</b>，这一步叫 <b style="color:var(--course-accent)">Code Review（代码审核）</b>。</p>' +
            '<div class="c-collab-flow">' +
              '<div class="c-collab-step">📬<b>① 你发 PR</b></div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">🔍<b>② 管理员审</b>提修改意见</div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">🔧<b>③ 你改好</b>按意见修</div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">✅<b>④ 确认合并</b>Approve & Merge</div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '管理员可能会说："这里命名能更清楚点""这段缺个判空"。你按意见改好、再推上去，' +
              'PR 会<b>自动更新</b>。直到管理员觉得 OK，才点同意（Approve）并合并（Merge）。' +
              '<b>这道关卡，正是开源代码质量的保障。</b>' +
            '</div>' +
            '<p class="deck-p" style="color:var(--c-fg-muted)">被打回来很正常，别气馁——连资深工程师的 PR 也天天被 review 出问题。这是协作，不是考试。</p>';
        }
      },

      // ---------- Slide 9：提 PR 前先 pull 最新 ----------
      {
        title: '提 PR 前，先 pull 最新',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<h2 class="deck-h2">提 PR 之前，记得先 pull 一次最新 🔄</h2>' +
            '<p class="deck-lead">从你<b>上次 pull</b> 到你<b>准备提 PR</b> 的这段时间里，上游（母仓库）可能又更新了好几次。</p>' +
            '<div class="c-collab-flow">' +
              '<div class="c-collab-step">⏪<b>上次 pull</b>那时的最新</div>' +
              '<div class="c-collab-sep">…⏳…</div>' +
              '<div class="c-collab-step">🆕<b>母仓库又更新</b>新功能、新修复</div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">📥<b>先 pull 合进来</b>再提 PR</div>' +
            '</div>' +
            '<div class="deck-callout warn">' +
              '如果不先 pull 就提 PR，你的分支可能<b>落后于</b>最新代码，甚至和别人新合进去的改动<b>撞车冲突</b>。' +
              '正确做法：把上游最新的拉过来、合并进你的分支、确认没问题，<b>再</b>发 PR。' +
            '</div>' +
            '<div class="c-collab-chat">' +
              '<div class="c-collab-bubble you"><div class="who">你 🙋</div>提 PR 之前，帮我把上游 main 的最新代码拉下来、合并进我现在这个分支</div>' +
              '<div class="c-collab-bubble ai"><div class="who">AI 🤖</div>已拉取并合并 ✅ 没有冲突，你的分支现在是最新的，可以放心提 PR 了。</div>' +
            '</div>';
        }
      },

      // ---------- Slide 10：cherry-pick 拣选提交（树状图）----------
      {
        title: 'cherry-pick 精准摘取',
        render: function (stage, api) {
          injectStyle();
          // 另一条分支上有 P Q R，我只想要 Q，摘到当前分支末尾。
          var svg = buildTreeSVG({
            w: 760, h: 280, r: 17, x0: 70, dx: 120,
            lanes: [
              // 另一条分支（上）：M N P Q R，其中 Q 是我想要的（高亮金色由 notes 提示）
              {
                y: 80, color: COL_UPSTREAM, pill: '别人的分支',
                commits: [
                  { id: 'M', x: 70 }, { id: 'N', x: 190 }, { id: 'P', x: 310 },
                  { id: 'Q', x: 430 }, { id: 'R', x: 550 }
                ]
              },
              // 当前分支（下）：M N → 摘来一个 Q'
              {
                y: 210, color: COL_MINE, pill: '你当前分支',
                from: { x: 190, y: 80 },
                commits: [
                  { id: 'a', x: 310 }, { id: 'b', x: 430 }, { id: "Q'", x: 600 }
                ]
              }
            ],
            // 从上面的 Q 画一条金色虚线箭头到下面的 Q'
            pick: {
              d: 'M430 97 C 500 140, 540 170, 595 196',
              lx: 540, ly: 130, label: '🍒 cherry-pick Q'
            },
            notes: [
              { x: 430, y: 50, anchor: 'middle', size: 12.5, color: '#d29922', text: '只想要这一个 Q（不要整条分支）' }
            ]
          });
          stage.innerHTML =
            '<h2 class="deck-h2">cherry-pick：只摘你想要的那一颗"樱桃" 🍒</h2>' +
            '<p class="deck-lead">有时你<b>只想要别的分支上某一个特定的 commit</b>，而不是整条分支。这时用 <b style="color:#d29922">cherry-pick</b>——精准摘取那一个 commit，把它的改动复制到你当前分支末尾。</p>' +
            '<div class="c-collab-treewrap">' +
              legend([{ c: COL_UPSTREAM, t: '别人的分支（含你想要的 Q）' }, { c: COL_MINE, t: '你当前分支' }, { c: '#d29922', t: '🍒 摘取的那一个 commit' }]) +
              svg +
            '</div>' +
            '<div class="deck-callout">' +
              '看，别人那条分支上有 P、Q、R 一串，但你<b>只想要 Q</b> 这一个修复。cherry-pick 就把 Q 的改动<b>复制</b>一份，' +
              '贴到你当前分支末尾（成了 Q\'），其余的 P、R 一概不要。' +
            '</div>' +
            '<div class="c-collab-chat">' +
              '<div class="c-collab-bubble you"><div class="who">你 🙋</div>那条分支上有个提交 hash 是 <code>3f9a2c</code>，帮我 cherry-pick 这个提交过来</div>' +
              '<div class="c-collab-bubble ai"><div class="who">AI 🤖</div>搞定 ✅ 已把 <code>3f9a2c</code> 的改动摘到你当前分支了，其它提交没动。</div>' +
            '</div>';
        }
      },

      // ---------- Slide 11：协作者模式（本课用的方式）----------
      {
        title: '另一种模式：直接当协作者',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<h2 class="deck-h2">另一种更简单的协作：直接当 collaborator 👥</h2>' +
            '<p class="deck-lead">除了 fork，还有一种更省事的方式——项目所有者<b>直接邀请你的同学和老师成为仓库协作者（collaborator）</b>。</p>' +
            '<div class="c-collab-cards">' +
              '<div class="c-collab-card">' +
                '<h3>🍴 fork 模式</h3>' +
                '<p class="deck-p" style="margin:6px 0">先复刻一份到自己名下，在副本上改，再发 PR 交回去。</p>' +
                '<p class="verdict" style="color:var(--course-accent)">适合：参与陌生人的开源项目</p>' +
              '</div>' +
              '<div class="c-collab-card good">' +
                '<h3>👥 协作者模式（本课用这个）</h3>' +
                '<p class="deck-p" style="margin:6px 0">大家在<b>同一个仓库</b>里直接开分支干活，<b>省掉 fork 这一步</b>。</p>' +
                '<p class="verdict">适合：熟人小团队（同学 + 老师）</p>' +
              '</div>' +
            '</div>' +
            '<div class="c-collab-flow">' +
              '<div class="c-collab-step">🌿<b>开分支</b></div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">🔧<b>改</b></div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">📬<b>PR</b></div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">🔍<b>review</b></div>' +
              '<div class="c-collab-sep">→</div>' +
              '<div class="c-collab-step">✅<b>merge</b></div>' +
            '</div>' +
            '<div class="deck-callout">协作者模式流程更短：<b>开分支 → 改 → PR → review → merge</b>，没有 fork、没有"上游/我的副本"之分。咱们这门课接下来的实战演练，走的就是这种模式。</div>';
        }
      },

      // ---------- Slide 12：收尾 + 实战入口 ----------
      {
        title: '去实战演练！',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h1 class="deck-h1">心法学完，该上手了！🚀</h1>' +
              '<p class="deck-lead">fork、分支、PR、review、cherry-pick……理论你都懂了。光看不练假把式，现在去亲手走一遍。</p>' +
              '<div class="c-collab-cta">' +
                '<div class="big">🎮</div>' +
                '<h2 class="deck-h2" style="margin:0 0 6px">进入实战演练</h2>' +
                '<p class="deck-p" style="margin:0 0 4px">在一个<b>仿真的 GitHub</b> 里，跟着 spotlight 高亮一步步亲手做：</p>' +
                '<p class="deck-p" style="color:var(--course-accent);font-weight:700;margin:6px 0 0">完整走一遍 issue → 分支 → PR → merge</p>' +
                '<a class="deck-btn" href="github-tutorial.html">🎮 开始实战演练</a>' +
              '</div>' +
              '<p class="deck-p" style="color:var(--c-fg-muted)">演练里有高亮引导、有"AI 咒语"提示，全程点鼠标就能通关。做完这一遍，你就能在真 GitHub 上独立协作了。</p>' +
            '</div>';
        }
      }

    ]
  });
})();
