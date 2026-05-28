(function () {
  'use strict';

  // ============================================================
  // 第5章 · 分支 Branch（git 概念的核心）
  // theme: #39c5cf  emoji: 🌿
  // 样式前缀: c-branch-
  //
  // 这一章大量用内联 SVG 画 git 树状图。统一画法封装在下面的
  // gitTree() 里：
  //   commit  = 圆点（半径 14-18，白描边）
  //   main    = 一种颜色的连线；feature = 另一种颜色的连线
  //   分支标签 = 圆角 pill，用短线指向它当前所指的 commit
  //   HEAD    = 金黄 #e3b341 特殊 pill
  //   孤儿/被丢弃 commit = 虚线 + 半透明灰
  // ============================================================

  // ---- 调色（与 theme 协调）----
  var CLR = {
    main: '#39c5cf',        // 主干色（= theme）
    feature: '#d2a8ff',     // feature 分支色（紫）
    feature2: '#f0883e',    // 第二条 feature（橙）
    head: '#e3b341',        // HEAD 金黄
    ghost: '#6e7681',       // 孤儿/丢弃灰
    revert: '#3fb950'       // revert 新提交（绿）
  };

  // ------------------------------------------------------------
  // 通用：一个 commit 圆点
  // o = { x, y, color, label, hash, ghost }
  // ------------------------------------------------------------
  function commitDot(o) {
    var r = o.r || 16;
    var color = o.ghost ? CLR.ghost : (o.color || CLR.main);
    var fill = o.ghost ? 'var(--c-bg-soft)' : color;
    var dash = o.ghost ? ' stroke-dasharray="4 3"' : '';
    var op = o.ghost ? ' opacity="0.55"' : '';
    var s = '<g' + op + '>';
    s += '<circle cx="' + o.x + '" cy="' + o.y + '" r="' + r + '" fill="' + fill +
         '" stroke="' + (o.ghost ? CLR.ghost : '#fff') + '" stroke-width="3"' + dash + '/>';
    if (o.hash) {
      s += '<text x="' + o.x + '" y="' + (o.y + (o.hashBelow === false ? -r - 10 : r + 18)) +
           '" text-anchor="middle" font-size="12" font-family="ui-monospace,monospace" fill="var(--c-fg-muted)">' +
           o.hash + '</text>';
    }
    if (o.inner) {
      s += '<text x="' + o.x + '" y="' + (o.y + 5) + '" text-anchor="middle" font-size="13" fill="#fff" font-weight="700">' + o.inner + '</text>';
    }
    s += '</g>';
    return s;
  }

  // 连线（两点之间）
  function link(x1, y1, x2, y2, color, ghost) {
    var dash = ghost ? ' stroke-dasharray="5 4"' : '';
    var op = ghost ? ' opacity="0.5"' : '';
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (ghost ? CLR.ghost : color) + '" stroke-width="5" stroke-linecap="round"' + dash + op + '/>';
  }

  // 分支 pill 标签 + 指向短线
  // o = { x, y, text, color, toX, toY, head }
  function branchPill(o) {
    var color = o.head ? CLR.head : (o.color || CLR.main);
    var w = Math.max(46, o.text.length * 9 + 22);
    var h = 26;
    var px = o.x - w / 2;
    var py = o.y - h / 2;
    var s = '<g class="c-branch-pill"' + (o.id ? ' data-pill="' + o.id + '"' : '') + '>';
    // 指向短线
    if (o.toX != null) {
      s += '<line x1="' + o.x + '" y1="' + o.y + '" x2="' + o.toX + '" y2="' + o.toY +
        '" stroke="' + color + '" stroke-width="2.5" stroke-dasharray="3 3" opacity="0.85"/>';
    }
    s += '<rect x="' + px + '" y="' + py + '" width="' + w + '" height="' + h +
      '" rx="13" fill="' + color + '" opacity="' + (o.head ? '1' : '0.92') + '"/>';
    var tcolor = o.head ? '#1a1500' : '#06121a';
    s += '<text x="' + o.x + '" y="' + (o.y + 4.5) + '" text-anchor="middle" font-size="13" font-weight="800" ' +
      'font-family="ui-monospace,monospace" fill="' + tcolor + '">' + o.text + '</text>';
    s += '</g>';
    return s;
  }

  // 包一层 svg 外壳
  function svg(vb, inner, extra) {
    return '<svg class="c-branch-svg ' + (extra || '') + '" viewBox="0 0 ' + vb +
      '" width="100%" aria-hidden="true">' + inner + '</svg>';
  }

  // 每张 svg 都带的 arrow marker / 通用样式
  function defs() {
    return '<defs>' +
      '<marker id="c-branch-arrow" markerWidth="9" markerHeight="9" refX="6.5" refY="4.5" orient="auto">' +
        '<path d="M0,0 L9,4.5 L0,9 Z" fill="' + CLR.main + '"/></marker>' +
      '</defs>';
  }

  window.registerChapter({
    id: 'branch',
    index: 5,
    emoji: '🌿',
    title: '分支 Branch',
    subtitle: '存储库的不同开发线',
    theme: '#39c5cf',
    slides: [

      // ========================================================
      // Slide 1 · 什么是 branch
      // ========================================================
      {
        title: '什么是分支',
        render: function (stage, api) {
          var diagram = svg('560 240',
            defs() +
            // 主干 main：三个 commit 一条线
            link(60, 150, 200, 150, CLR.main) +
            link(200, 150, 340, 150, CLR.main) +
            // 从第二个 commit 岔出一条 feature 支线（往上）
            link(200, 150, 320, 70, CLR.feature) +
            link(320, 70, 440, 70, CLR.feature) +
            commitDot({ x: 60, y: 150, color: CLR.main }) +
            commitDot({ x: 200, y: 150, color: CLR.main }) +
            commitDot({ x: 340, y: 150, color: CLR.main }) +
            commitDot({ x: 320, y: 70, color: CLR.feature }) +
            commitDot({ x: 440, y: 70, color: CLR.feature }) +
            branchPill({ x: 420, y: 178, text: 'main', color: CLR.main }) +
            branchPill({ x: 500, y: 70, text: 'feature', color: CLR.feature, toX: 458, toY: 70 }) +
            // 岔点强调
            '<circle cx="200" cy="150" r="24" fill="none" stroke="var(--course-accent)" stroke-width="2" stroke-dasharray="4 4" opacity="0.7"><animate attributeName="r" values="20;26;20" dur="2.4s" repeatCount="indefinite"/></circle>'
          );

          stage.innerHTML =
            '<h1 class="deck-h1">分支 <span style="color:var(--course-accent)">Branch</span></h1>' +
            '<p class="deck-lead">前面几章里，你的项目都只有<b>一条</b>时间线。从这章起，时间线要分叉了——' +
            '分支，就是一条<b>独立的开发线</b>，一个仓库可以同时存在好几条。</p>' +
            '<div class="c-branch-stage">' + diagram + '</div>' +
            '<div class="deck-callout">' +
              '<p class="deck-p" style="margin:0">一句话记住它 👇</p>' +
              '<p class="deck-p c-branch-bigline">分支让你在<b style="color:var(--course-accent)">不影响别人</b>的前提下，<b>开一条自己的开发线</b>。</p>' +
              '<p class="deck-p" style="margin:0;color:var(--c-fg-muted)">上图：从 <b style="color:var(--course-accent)">main</b> 的某个 commit 岔出去一条 <b style="color:' + CLR.feature + '">feature</b>。' +
              '它们后面各走各的，互不干扰。' +
            '</div>' +
            commonStyle();
        }
      },

      // ========================================================
      // Slide 2 · main / master 主干分支
      // ========================================================
      {
        title: 'main 主干分支',
        render: function (stage, api) {
          var diagram = svg('560 180',
            defs() +
            link(80, 90, 220, 90, CLR.main) +
            link(220, 90, 360, 90, CLR.main) +
            link(360, 90, 500, 90, CLR.main) +
            commitDot({ x: 80, y: 90, color: CLR.main, hash: 'c1' }) +
            commitDot({ x: 220, y: 90, color: CLR.main, hash: 'c2' }) +
            commitDot({ x: 360, y: 90, color: CLR.main, hash: 'c3' }) +
            commitDot({ x: 500, y: 90, color: CLR.main, hash: 'c4' }) +
            branchPill({ x: 500, y: 38, text: 'main', color: CLR.main, toX: 500, toY: 70 }) +
            branchPill({ x: 430, y: 132, text: 'HEAD', head: true, toX: 488, toY: 102 })
          );

          stage.innerHTML =
            '<h2 class="deck-h2">每个仓库，天生就有一条 <span style="color:var(--course-accent)">main</span></h2>' +
            '<p class="deck-lead">你 <span class="deck-kbd">git init</span> 或在 GitHub 建仓库的那一刻，' +
            '默认就有一条主干分支叫 <b style="color:var(--course-accent)">main</b>（旧名 <b>master</b>，现在基本都改叫 main 了）。</p>' +
            '<div class="c-branch-stage">' + diagram + '</div>' +
            '<div class="deck-grid c-branch-2col">' +
              '<div class="deck-card">' +
                '<div class="c-branch-cardh"><span style="color:var(--course-accent)">●</span> main 是干啥的</div>' +
                '<p class="deck-p" style="margin:0">它是项目的"正式版主线"。一般来说，能上线、能给别人用的代码，最终都要回到 main。</p>' +
              '</div>' +
              '<div class="deck-card">' +
                '<div class="c-branch-cardh"><span style="color:' + CLR.head + '">●</span> 那 HEAD 呢</div>' +
                '<p class="deck-p" style="margin:0">金黄色这块叫 <b style="color:' + CLR.head + '">HEAD</b>，表示你<b>现在所在的位置</b>。先记个脸熟，第 8 页专门讲它。</p>' +
              '</div>' +
            '</div>' +
            commonStyle();
        }
      },

      // ========================================================
      // Slide 3 · 新建 feature 分支（互动：长出 pill）
      // ========================================================
      {
        title: '新建 feature 分支',
        render: function (stage, api) {
          function draw(showFeature) {
            return svg('560 200',
              defs() +
              link(80, 110, 240, 110, CLR.main) +
              link(240, 110, 400, 110, CLR.main) +
              commitDot({ x: 80, y: 110, color: CLR.main, hash: 'c1' }) +
              commitDot({ x: 240, y: 110, color: CLR.main, hash: 'c2' }) +
              commitDot({ x: 400, y: 110, color: CLR.main, hash: 'c3' }) +
              branchPill({ x: 400, y: 60, text: 'main', color: CLR.main, toX: 400, toY: 90 }) +
              branchPill({ x: 320, y: 165, text: 'HEAD', head: true, toX: 388, toY: 122 }) +
              (showFeature
                ? ('<g class="c-branch-grow">' +
                    branchPill({ x: 500, y: 110, text: 'feature', color: CLR.feature, toX: 422, toY: 110 }) +
                   '</g>')
                : '')
            );
          }

          stage.innerHTML =
            '<h2 class="deck-h2">新建一条 <span style="color:' + CLR.feature + '">feature</span> 分支</h2>' +
            '<p class="deck-lead">关键点：feature <b>刚被创建的那一刻</b>，它和 main <b>一模一样</b>——指向<b>同一个 commit</b>，' +
            '没有任何新东西。</p>' +
            '<div class="c-branch-stage" id="c-branch-s3">' + draw(false) + '</div>' +
            '<div class="deck-center">' +
              '<button class="deck-btn" id="c-branch-s3btn">🌿 创建 feature 分支</button>' +
            '</div>' +
            '<div class="deck-callout c-branch-s3note" id="c-branch-s3note" style="display:none">' +
              '看到没？feature 这个 pill 直接贴在 <b>c3</b> 上，和 main 重合。' +
              '<b>创建分支几乎不花成本</b>——它只是给当前这个 commit 多挂了一个名牌，<b>没有复制任何文件</b>。' +
            '</div>' +
            commonStyle();

          var host = stage.querySelector('#c-branch-s3');
          var note = stage.querySelector('#c-branch-s3note');
          var btn = stage.querySelector('#c-branch-s3btn');
          var made = false;
          btn.addEventListener('click', function () {
            made = !made;
            host.innerHTML = draw(made);
            note.style.display = made ? 'block' : 'none';
            btn.textContent = made ? '↩️ 删掉这条分支' : '🌿 创建 feature 分支';
          });
        }
      },

      // ========================================================
      // Slide 4 · 分支隔离（互动：feature 长出 commit，main 不动）
      // ========================================================
      {
        title: '分支隔离',
        render: function (stage, api) {
          function draw(extra) {
            extra = extra || 0; // feature 上多出几个 commit
            var inner = defs();
            // main 主干（纹丝不动）
            inner += link(80, 130, 240, 130, CLR.main) + link(240, 130, 400, 130, CLR.main);
            // feature 从 c3 岔出
            var fx = [490, 580]; // feature commit 的 x
            inner += link(400, 130, 470, 70, CLR.feature, extra < 1); // 第一段（>=1 才实线）
            if (extra >= 1) inner += commitDot({ x: 470, y: 70, color: CLR.feature, hash: 'f1' });
            if (extra >= 2) {
              inner += link(470, 70, 560, 70, CLR.feature);
              inner += commitDot({ x: 560, y: 70, color: CLR.feature, hash: 'f2' });
            }
            inner += commitDot({ x: 80, y: 130, color: CLR.main, hash: 'c1' });
            inner += commitDot({ x: 240, y: 130, color: CLR.main, hash: 'c2' });
            inner += commitDot({ x: 400, y: 130, color: CLR.main, hash: 'c3' });
            inner += branchPill({ x: 200, y: 175, text: 'main', color: CLR.main, toX: 400, toY: 152 });
            var headX = extra >= 2 ? 560 : (extra >= 1 ? 470 : 430);
            inner += branchPill({ x: headX + 60, y: 30, text: 'HEAD→feature', head: true, toX: headX + 8, toY: extra >= 1 ? 58 : 100 });
            return svg('640 200', inner);
          }

          stage.innerHTML =
            '<h2 class="deck-h2">在 feature 上改东西，<span style="color:var(--course-accent)">main 纹丝不动</span></h2>' +
            '<p class="deck-lead">现在你站在 feature 上写代码、提交。每点一次"提交"，feature 往前长一个 commit——' +
            '注意看下面的 main：<b>一动不动</b>。</p>' +
            '<div class="c-branch-stage" id="c-branch-s4">' + draw(0) + '</div>' +
            '<div class="deck-center c-branch-row">' +
              '<button class="deck-btn" id="c-branch-s4commit">✍️ 在 feature 上 commit</button>' +
              '<button class="deck-btn ghost" id="c-branch-s4reset">重来</button>' +
              '<span class="c-branch-counter" id="c-branch-s4cnt">feature 已有 0 个新提交</span>' +
            '</div>' +
            '<div class="deck-callout">' +
              '这就是<b>分支隔离</b>：你在 feature 上做的 commit，<b>只属于 feature，也只能在 feature 看到</b>，' +
              '完全<b>不会影响 main</b>。等于你在一个安全的"平行宇宙"里随便折腾，主线毫发无损。' +
            '</div>' +
            commonStyle();

          var host = stage.querySelector('#c-branch-s4');
          var cnt = stage.querySelector('#c-branch-s4cnt');
          var n = 0;
          function rerender() {
            host.innerHTML = draw(n);
            cnt.textContent = 'feature 已有 ' + n + ' 个新提交';
          }
          stage.querySelector('#c-branch-s4commit').addEventListener('click', function () {
            if (n < 2) { n++; rerender(); }
          });
          stage.querySelector('#c-branch-s4reset').addEventListener('click', function () {
            n = 0; rerender();
          });
        }
      },

      // ========================================================
      // Slide 5 · 多人 / 多 agent 并行
      // ========================================================
      {
        title: '多人 / 多 agent 协作',
        render: function (stage, api) {
          var diagram = svg('600 280',
            defs() +
            // main 主干
            link(70, 150, 230, 150, CLR.main) +
            commitDot({ x: 70, y: 150, color: CLR.main, hash: 'c1' }) +
            commitDot({ x: 230, y: 150, color: CLR.main, hash: 'c2' }) +
            // 小A 分支（往上）
            link(230, 150, 340, 70, CLR.feature) +
            link(340, 70, 460, 70, CLR.feature) +
            commitDot({ x: 340, y: 70, color: CLR.feature, inner: 'A' }) +
            commitDot({ x: 460, y: 70, color: CLR.feature, inner: 'A' }) +
            branchPill({ x: 540, y: 70, text: 'credit', color: CLR.feature, toX: 478, toY: 70 }) +
            // 小B 分支（往下）
            link(230, 150, 340, 230, CLR.feature2) +
            link(340, 230, 460, 230, CLR.feature2) +
            commitDot({ x: 340, y: 230, color: CLR.feature2, inner: 'B' }) +
            commitDot({ x: 460, y: 230, color: CLR.feature2, inner: 'B' }) +
            branchPill({ x: 540, y: 230, text: 'books', color: CLR.feature2, toX: 478, toY: 230 }) +
            branchPill({ x: 150, y: 195, text: 'main', color: CLR.main, toX: 230, toY: 168 })
          );

          stage.innerHTML =
            '<h2 class="deck-h2">分支真正的威力：<span style="color:var(--course-accent)">同时开工</span></h2>' +
            '<p class="deck-lead">每个人 / 每个 AI agent 都基于最新的 main 拉一条自己的分支，各开发各的，互不打扰。</p>' +
            '<div class="c-branch-stage">' + diagram + '</div>' +
            '<div class="deck-grid c-branch-2col">' +
              '<div class="deck-card c-branch-personA">' +
                '<div class="c-branch-cardh">🧑‍💻 小 A · 分支 <code>credit</code></div>' +
                '<p class="deck-p" style="margin:0">开发<b>"信用分模块"</b>，只动 <code>credit/</code> 文件夹。</p>' +
              '</div>' +
              '<div class="deck-card c-branch-personB">' +
                '<div class="c-branch-cardh">🧑‍🎨 小 B · 分支 <code>books</code></div>' +
                '<p class="deck-p" style="margin:0">开发<b>"必读书模块"</b>，只动 <code>books/</code> 文件夹。</p>' +
              '</div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '两个互不相干的文件夹 → 两条分支可以 <b>同时进行</b>，谁先做完谁先合回 main。' +
              '这就是<b>多人 / 多 agent 并行开发</b>：不用排队、不用互相等。' +
            '</div>' +
            commonStyle();
        }
      },

      // ========================================================
      // Slide 6 · merge 合并（互动：feature 汇入 main）
      // ========================================================
      {
        title: 'merge 合并',
        render: function (stage, api) {
          function draw(merged) {
            var inner = defs();
            // main
            inner += link(70, 130, 220, 130, CLR.main) + link(220, 130, 370, 130, CLR.main);
            inner += commitDot({ x: 70, y: 130, color: CLR.main, hash: 'c1' });
            inner += commitDot({ x: 220, y: 130, color: CLR.main, hash: 'c2' });
            inner += commitDot({ x: 370, y: 130, color: CLR.main, hash: 'c3' });
            // feature
            inner += link(220, 130, 320, 60, CLR.feature) + link(320, 60, 440, 60, CLR.feature);
            inner += commitDot({ x: 320, y: 60, color: CLR.feature, hash: 'f1' });
            inner += commitDot({ x: 440, y: 60, color: CLR.feature, hash: 'f2' });
            if (merged) {
              // 汇入：从 f2 与 c3 连到一个新的 merge commit
              inner += link(440, 60, 540, 130, CLR.feature, false);
              inner += link(370, 130, 540, 130, CLR.main, false);
              inner += commitDot({ x: 540, y: 130, color: CLR.main, hash: 'merge', r: 18 });
              inner += branchPill({ x: 540, y: 178, text: 'main', color: CLR.main, toX: 540, toY: 152 });
              inner += branchPill({ x: 540, y: 25, text: 'feature', color: CLR.feature, toX: 446, toY: 50 });
            } else {
              inner += branchPill({ x: 320, y: 178, text: 'main', color: CLR.main, toX: 370, toY: 152 });
              inner += branchPill({ x: 510, y: 60, text: 'feature', color: CLR.feature, toX: 468, toY: 60 });
            }
            return svg('600 210', inner);
          }

          stage.innerHTML =
            '<h2 class="deck-h2">做完了，就 <span style="color:var(--course-accent)">merge</span> 回主干</h2>' +
            '<p class="deck-lead">把一条分支的成果合并回 main，这个动作叫 <b style="color:var(--course-accent)">merge（合并）</b>。' +
            'feature 上的 commit 会汇入 main。</p>' +
            '<div class="c-branch-stage" id="c-branch-s6">' + draw(false) + '</div>' +
            '<div class="deck-center">' +
              '<button class="deck-btn" id="c-branch-s6btn">🔀 把 feature 合并进 main</button>' +
            '</div>' +
            '<div class="deck-callout c-branch-s6note" id="c-branch-s6note" style="display:none">' +
              '🤖 老规矩，一句话就行：跟 AI 说' +
              '<span class="deck-kbd">"把我这个分支合并进 main"</span>，' +
              '它自己去跑 <span class="deck-kbd">git merge</span>，你只管确认结果对不对。' +
            '</div>' +
            commonStyle();

          var host = stage.querySelector('#c-branch-s6');
          var note = stage.querySelector('#c-branch-s6note');
          var btn = stage.querySelector('#c-branch-s6btn');
          var done = false;
          btn.addEventListener('click', function () {
            done = !done;
            host.innerHTML = draw(done);
            note.style.display = done ? 'block' : 'none';
            btn.textContent = done ? '↩️ 倒回合并前' : '🔀 把 feature 合并进 main';
          });
        }
      },

      // ========================================================
      // Slide 7 · 互动小游戏「跟着步骤建分支」（重点）
      // ========================================================
      {
        title: '🎮 亲手建一条分支',
        render: function (stage, api) {
          // 游戏状态机：
          // step 0 起点：main 上只有 c1，HEAD→main
          // step 1: 在 main 上 commit → c2
          // step 2: 创建 feature（指向 c2）
          // step 3: 在 feature commit → f1 ，HEAD→feature
          // step 4: 在 feature 再 commit → f2
          // step 5: merge 回 main → merge commit，HEAD→main
          var GAME = [
            { label: '① 在 main 上 commit', tip: '当前 <b>HEAD → main</b>。在 main 上提交，主干长出 <b>c2</b>，main 指向 c2。' },
            { label: '② 创建 feature 分支', tip: '从 main 当前的 c2 长出 <b style="color:' + CLR.feature + '">feature</b>。它现在和 main 重合，还<b>没</b>切过去。' },
            { label: '③ 切到 feature 并 commit', tip: '现在 <b>HEAD → feature</b>。提交一次，feature 长出 <b>f1</b>，<b>main 没动</b>。' },
            { label: '④ 在 feature 再 commit 一次', tip: 'feature 继续长出 <b>f2</b>。HEAD 一直跟着 feature 跑，main 依旧停在 c2。' },
            { label: '⑤ merge 回 main', tip: '切回 main，把 feature 合并进来：生成 <b>merge</b> commit，<b>HEAD 又回到 main</b>。完成！🎉' }
          ];
          var state = 0; // 0..5，表示已完成的步数

          function draw(s) {
            var inner = defs();
            // main 主干 c1 -> c2
            inner += commitDot({ x: 90, y: 150, color: CLR.main, hash: 'c1' });
            if (s >= 1) {
              inner += link(90, 150, 230, 150, CLR.main);
              inner += commitDot({ x: 230, y: 150, color: CLR.main, hash: 'c2' });
            }
            // feature 创建 / commit
            if (s >= 3) {
              inner += link(230, 150, 340, 80, CLR.feature);
              inner += commitDot({ x: 340, y: 80, color: CLR.feature, hash: 'f1' });
            }
            if (s >= 4) {
              inner += link(340, 80, 460, 80, CLR.feature);
              inner += commitDot({ x: 460, y: 80, color: CLR.feature, hash: 'f2' });
            }
            // merge
            if (s >= 5) {
              inner += link(230, 150, 560, 150, CLR.main);
              inner += link(460, 80, 560, 150, CLR.feature);
              inner += commitDot({ x: 560, y: 150, color: CLR.main, hash: 'merge', r: 18 });
            }
            // 分支 pill
            // main pill
            var mainTo = s >= 5 ? 560 : (s >= 1 ? 230 : 90);
            inner += branchPill({ x: mainTo, y: 198, text: 'main', color: CLR.main, toX: mainTo, toY: 172 });
            // feature pill（s>=2 出现，指向其当前 commit）
            if (s >= 2) {
              var fTo = s >= 4 ? 460 : (s >= 3 ? 340 : 230);
              var fToY = s >= 3 ? 80 : 150;
              inner += branchPill({ x: fTo + 70, y: s >= 3 ? 35 : 110, text: 'feature', color: CLR.feature, toX: fTo + 8, toY: fToY });
            }
            // HEAD pill：步骤 3、4 在 feature 上，其它在 main 上
            var onFeature = (s === 3 || s === 4);
            if (onFeature) {
              var hx = s >= 4 ? 460 : 340;
              inner += branchPill({ x: hx, y: 130, text: 'HEAD', head: true, toX: hx, toY: 98 });
            } else {
              var hmx = s >= 5 ? 560 : (s >= 1 ? 230 : 90);
              inner += branchPill({ x: hmx - 70, y: 150, text: 'HEAD', head: true, toX: hmx - 18, toY: 150 });
            }
            return svg('640 230', inner);
          }

          stage.innerHTML =
            '<h2 class="deck-h2">🎮 跟着步骤，<span style="color:var(--course-accent)">亲手建一条分支</span></h2>' +
            '<p class="deck-lead">从上到下点 5 个按钮。每点一步，看树状图怎么变、<b style="color:' + CLR.head + '">HEAD</b> 跑到哪儿去了。</p>' +
            '<div class="c-branch-stage" id="c-branch-game">' + draw(0) + '</div>' +
            '<div class="c-branch-gamebar" id="c-branch-gamebar"></div>' +
            '<div class="deck-callout c-branch-narrate" id="c-branch-narrate">' +
              '👇 准备好了，点 <b>①</b> 开始。当前 <b style="color:' + CLR.head + '">HEAD → main</b>，主干上只有一个 c1。' +
            '</div>' +
            '<div class="deck-center" style="margin-top:14px">' +
              '<button class="deck-btn ghost" id="c-branch-gamereset">↻ 从头玩一遍</button>' +
            '</div>' +
            commonStyle() +
            '<style>' +
            '.c-branch-gamebar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:18px 0 4px;}' +
            '.c-branch-step{font-size:13px;font-weight:700;padding:9px 14px;border-radius:10px;cursor:pointer;border:1px solid var(--c-border);background:var(--c-bg-card);color:var(--c-fg);transition:all .2s;font-family:inherit;}' +
            '.c-branch-step:hover:not(:disabled){border-color:var(--course-accent);transform:translateY(-2px);}' +
            '.c-branch-step.done{background:var(--course-accent);border-color:var(--course-accent);color:#06121a;}' +
            '.c-branch-step.next{box-shadow:0 0 0 3px var(--course-accent-soft);border-color:var(--course-accent);}' +
            '.c-branch-step:disabled{opacity:.4;cursor:not-allowed;}' +
            '.c-branch-narrate{animation:c-branch-pop .35s cubic-bezier(.34,1.56,.64,1);}' +
            '</style>';

          var host = stage.querySelector('#c-branch-game');
          var bar = stage.querySelector('#c-branch-gamebar');
          var narrate = stage.querySelector('#c-branch-narrate');

          function renderBar() {
            bar.innerHTML = '';
            GAME.forEach(function (g, i) {
              var b = document.createElement('button');
              b.className = 'c-branch-step' + (i < state ? ' done' : '') + (i === state ? ' next' : '');
              b.textContent = (i < state ? '✓ ' : '') + g.label;
              b.disabled = i !== state; // 只能按顺序点下一步
              b.addEventListener('click', function () {
                state = i + 1;
                host.innerHTML = draw(state);
                narrate.innerHTML = g.tip;
                renderBar();
              });
              bar.appendChild(b);
            });
          }
          renderBar();

          stage.querySelector('#c-branch-gamereset').addEventListener('click', function () {
            state = 0;
            host.innerHTML = draw(0);
            narrate.innerHTML = '👇 准备好了，点 <b>①</b> 开始。当前 <b style="color:' + CLR.head + '">HEAD → main</b>，主干上只有一个 c1。';
            renderBar();
          });
        }
      },

      // ========================================================
      // Slide 8 · HEAD 概念
      // ========================================================
      {
        title: 'HEAD 是什么',
        render: function (stage, api) {
          var diagram = svg('560 200',
            defs() +
            link(80, 110, 240, 110, CLR.main) + link(240, 110, 400, 110, CLR.main) +
            commitDot({ x: 80, y: 110, color: CLR.main, hash: 'c1' }) +
            commitDot({ x: 240, y: 110, color: CLR.main, hash: 'c2' }) +
            commitDot({ x: 400, y: 110, color: CLR.main, hash: 'c3' }) +
            branchPill({ x: 400, y: 60, text: 'main', color: CLR.main, toX: 400, toY: 90 }) +
            // HEAD 贴在 main 上
            branchPill({ x: 300, y: 165, text: 'HEAD', head: true, toX: 388, toY: 122 }) +
            '<text x="300" y="120" text-anchor="middle" font-size="13" fill="var(--c-fg-muted)" font-family="ui-monospace,monospace">你在这儿 👀</text>'
          );

          stage.innerHTML =
            '<h2 class="deck-h2"><span style="color:' + CLR.head + '">HEAD</span> = "我现在站在哪"</h2>' +
            '<p class="deck-lead">你<b>处于哪个分支</b>，就会看到那个分支的最新 commit。' +
            '这时我们说："<b style="color:' + CLR.head + '">HEAD</b> 指向这次提交 / 指向这个分支"。</p>' +
            '<div class="c-branch-stage">' + diagram + '</div>' +
            '<div class="deck-grid c-branch-3col">' +
              '<div class="deck-card"><div class="c-branch-stat">📍</div><div class="c-branch-statlabel">HEAD 是个"你在这儿"的书签</div></div>' +
              '<div class="deck-card"><div class="c-branch-stat">🌿</div><div class="c-branch-statlabel">正常情况它贴在某条分支上</div></div>' +
              '<div class="deck-card"><div class="c-branch-stat">↪️</div><div class="c-branch-statlabel">切分支 = 把 HEAD 挪过去</div></div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '正常状态下 HEAD 总是"<b>透过一条分支</b>"指向某个 commit。上图里 HEAD 贴着 <b>main</b>，' +
              '而 main 指向 c3，所以你现在看到的就是 c3 的代码。下一页会出现一个例外——HEAD <b>不靠分支</b>，直接指向 commit。' +
            '</div>' +
            commonStyle();
        }
      },

      // ========================================================
      // Slide 9 · detached HEAD（分离头指针）
      // ========================================================
      {
        title: '分离头指针 detached HEAD',
        render: function (stage, api) {
          var diagram = svg('600 240',
            defs() +
            link(80, 150, 220, 150, CLR.main) + link(220, 150, 360, 150, CLR.main) + link(360, 150, 500, 150, CLR.main) +
            commitDot({ x: 80, y: 150, color: CLR.main, hash: 'c1' }) +
            commitDot({ x: 220, y: 150, color: CLR.main, hash: 'c2' }) +
            commitDot({ x: 360, y: 150, color: CLR.main, hash: 'c3' }) +
            commitDot({ x: 500, y: 150, color: CLR.main, hash: 'c4' }) +
            branchPill({ x: 500, y: 198, text: 'main', color: CLR.main, toX: 500, toY: 172 }) +
            // HEAD 直接贴在历史 commit c2 上（不经过分支）
            branchPill({ x: 220, y: 100, text: 'HEAD', head: true, toX: 220, toY: 130 }) +
            // 从 c2 长出的孤儿 commit（虚线灰）
            link(220, 150, 320, 230, CLR.ghost, true) +
            commitDot({ x: 320, y: 230, ghost: true, hash: 'x1' }) +
            // 宇航员
            '<text x="380" y="238" font-size="30">🧑‍🚀</text>' +
            '<text x="415" y="218" font-size="18">💫</text>'
          );

          stage.innerHTML =
            '<h2 class="deck-h2">分离头指针 · <span style="color:' + CLR.head + '">detached HEAD</span></h2>' +
            '<p class="deck-lead">还有一种状态：HEAD <b>不指向任何分支</b>，而是<b>直接钉在某一次历史提交上</b>。这就叫分离头指针。</p>' +
            '<div class="c-branch-stage">' + diagram + '</div>' +
            '<div class="deck-callout warn">' +
              '<b>危险在哪？</b>此时你改代码产生的新 commit（图里的 <b>x1</b>，灰色虚线那个）<b>不归属任何分支</b>，' +
              '成了树干之外的<b>孤儿 commit</b>。一旦你切走，没有分支记得它的位置，它就' +
              '<b>迷失在数据的海洋里</b>——<b>就像飘出空间站、被遗忘的宇航员</b> 🧑‍🚀。' +
            '</div>' +
            commonStyle();
        }
      },

      // ========================================================
      // Slide 10 · 对历史 commit 创建分支（含基于分支建分支）
      // ========================================================
      {
        title: '对历史 commit 建分支',
        render: function (stage, api) {
          var diagram = svg('640 270',
            defs() +
            // main 主干
            link(80, 150, 220, 150, CLR.main) + link(220, 150, 360, 150, CLR.main) +
            commitDot({ x: 80, y: 150, color: CLR.main, hash: 'c1' }) +
            commitDot({ x: 220, y: 150, color: CLR.main, hash: 'c2' }) +
            commitDot({ x: 360, y: 150, color: CLR.main, hash: 'c3' }) +
            branchPill({ x: 360, y: 198, text: 'main', color: CLR.main, toX: 360, toY: 172 }) +
            // 对历史 c2 建一条新分支 idea（往上），健康（实线、有分支接着）
            link(220, 150, 320, 70, CLR.feature) +
            commitDot({ x: 320, y: 70, color: CLR.feature, hash: 'i1' }) +
            branchPill({ x: 400, y: 70, text: 'idea', color: CLR.feature, toX: 338, toY: 70 }) +
            // 基于 feature 的 commit#4 再建 feature2
            link(320, 70, 430, 35, CLR.feature2) +
            commitDot({ x: 430, y: 35, color: CLR.feature2, r: 13 }) +
            branchPill({ x: 520, y: 35, text: 'feature2', color: CLR.feature2, toX: 446, toY: 35 })
          );

          stage.innerHTML =
            '<h2 class="deck-h2">给历史 commit 建分支 = 开一种<span style="color:var(--course-accent)">新的可能性</span></h2>' +
            '<p class="deck-lead">你可以对<b>任何一次历史提交</b>创建分支。仓库就"回退"到那次 commit 的状态，' +
            '你在这条新分支上开发一条<b>平行开发线</b>。</p>' +
            '<div class="c-branch-stage">' + diagram + '</div>' +
            '<div class="deck-grid c-branch-2col">' +
              '<div class="deck-card">' +
                '<div class="c-branch-cardh"><span style="color:' + CLR.feature + '">●</span> 对历史 c2 建 <code>idea</code></div>' +
                '<p class="deck-p" style="margin:0">回到 c2 的状态，从这儿探索另一种做法。和 detached 不同——它有名牌接着，<b>不会变孤儿</b>。</p>' +
              '</div>' +
              '<div class="deck-card">' +
                '<div class="c-branch-cardh"><span style="color:' + CLR.feature2 + '">●</span> 基于分支再建分支 <code>feature2</code></div>' +
                '<p class="deck-p" style="margin:0">分支不一定从 main 长出。这里 <code>feature2</code> 是基于 <code>idea</code> 的 commit 长出来的——<b>分支可以套娃</b>。</p>' +
              '</div>' +
            '</div>' +
            commonStyle();
        }
      },

      // ========================================================
      // Slide 11 · 小结：两种"不破坏现有分支"回到历史的方法
      // ========================================================
      {
        title: '回到历史的两种安全姿势',
        render: function (stage, api) {
          // 左：detached HEAD（孤儿风险）  右：建新分支（安全）
          var left = svg('300 180',
            defs() +
            link(40, 90, 150, 90, CLR.main) + link(150, 90, 260, 90, CLR.main) +
            commitDot({ x: 40, y: 90, color: CLR.main, hash: 'B', r: 14 }) +
            commitDot({ x: 150, y: 90, color: CLR.main, hash: 'C', r: 14 }) +
            commitDot({ x: 260, y: 90, color: CLR.main, hash: 'D', r: 14 }) +
            branchPill({ x: 40, y: 45, text: 'HEAD', head: true, toX: 40, toY: 74 }) +
            link(40, 90, 110, 150, CLR.ghost, true) +
            commitDot({ x: 110, y: 150, ghost: true, r: 12 }) +
            '<text x="150" y="160" font-size="20">🧑‍🚀</text>'
          );
          var right = svg('300 180',
            defs() +
            link(40, 90, 150, 90, CLR.main) + link(150, 90, 260, 90, CLR.main) +
            commitDot({ x: 40, y: 90, color: CLR.main, hash: 'B', r: 14 }) +
            commitDot({ x: 150, y: 90, color: CLR.main, hash: 'C', r: 14 }) +
            commitDot({ x: 260, y: 90, color: CLR.main, hash: 'D', r: 14 }) +
            branchPill({ x: 260, y: 138, text: 'main', color: CLR.main, toX: 260, toY: 108 }) +
            link(40, 90, 110, 40, CLR.feature) +
            commitDot({ x: 110, y: 40, color: CLR.feature, r: 12 }) +
            branchPill({ x: 190, y: 40, text: 'retry', color: CLR.feature, toX: 126, toY: 40 })
          );

          stage.innerHTML =
            '<h2 class="deck-h2">想回到历史，又<span style="color:var(--course-accent)">不破坏现有分支</span>？两条路</h2>' +
            '<p class="deck-lead">假设 main 是 A→B→C→D，你想回到 <b>B</b> 看看 / 改改：</p>' +
            '<div class="deck-grid c-branch-2col c-branch-compare">' +
              '<div class="deck-card">' +
                '<div class="c-branch-cardh">① 分离头指针 <span class="c-branch-tag warn">有孤儿风险</span></div>' +
                '<div class="c-branch-stage tight">' + left + '</div>' +
                '<p class="deck-p" style="margin:6px 0 0">HEAD 直接钉到 B。在这儿提交的新 commit <b>没有分支接着</b>，一切走就变孤儿。</p>' +
              '</div>' +
              '<div class="deck-card">' +
                '<div class="c-branch-cardh">② 对 B 建新分支 <span class="c-branch-tag ok">更安全 ✓</span></div>' +
                '<div class="c-branch-stage tight">' + right + '</div>' +
                '<p class="deck-p" style="margin:6px 0 0">从 B 长出新分支 <code>retry</code>。新 commit 有名牌接着，<b>永远不会变孤儿</b>。</p>' +
              '</div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '一句话：两种都能"回到历史状态"，但 <b>② 建新分支</b> 几乎总是更稳——' +
              '只要你想在那个历史版本上<b>继续写代码</b>，就给它一条分支接着。' +
            '</div>' +
            commonStyle() +
            '<style>' +
            '.c-branch-compare .deck-card{display:flex;flex-direction:column;}' +
            '.c-branch-stage.tight{margin:6px 0;}' +
            '.c-branch-tag{font-size:11px;font-weight:700;padding:2px 8px;border-radius:999px;margin-left:6px;}' +
            '.c-branch-tag.warn{background:rgba(210,153,34,.18);color:#e3b341;}' +
            '.c-branch-tag.ok{background:rgba(63,185,80,.18);color:#3fb950;}' +
            '</style>';
        }
      },

      // ========================================================
      // Slide 12 · 三种"回退"语义对比（reset / revert / checkout）
      // ========================================================
      {
        title: '三种"回退"完全不一样',
        render: function (stage, api) {
          // 共同前提：A B C D，HEAD 在 D（main），想回到 B
          // reset --hard B
          var sReset = svg('320 170',
            defs() +
            link(30, 80, 110, 80, CLR.main) + link(110, 80, 190, 80, CLR.ghost, true) + link(190, 80, 270, 80, CLR.ghost, true) +
            commitDot({ x: 30, y: 80, color: CLR.main, hash: 'A', r: 13 }) +
            commitDot({ x: 110, y: 80, color: CLR.main, hash: 'B', r: 13 }) +
            commitDot({ x: 190, y: 80, ghost: true, hash: 'C', r: 13 }) +
            commitDot({ x: 270, y: 80, ghost: true, hash: 'D', r: 13 }) +
            branchPill({ x: 110, y: 130, text: 'main', color: CLR.main, toX: 110, toY: 97 }) +
            branchPill({ x: 110, y: 32, text: 'HEAD', head: true, toX: 110, toY: 65 })
          );
          // revert C D → 新 commit E
          var sRevert = svg('360 170',
            defs() +
            link(30, 80, 100, 80, CLR.main) + link(100, 80, 170, 80, CLR.main) + link(170, 80, 240, 80, CLR.main) + link(240, 80, 320, 80, CLR.revert) +
            commitDot({ x: 30, y: 80, color: CLR.main, hash: 'A', r: 13 }) +
            commitDot({ x: 100, y: 80, color: CLR.main, hash: 'B', r: 13 }) +
            commitDot({ x: 170, y: 80, color: CLR.main, hash: 'C', r: 13 }) +
            commitDot({ x: 240, y: 80, color: CLR.main, hash: 'D', r: 13 }) +
            commitDot({ x: 320, y: 80, color: CLR.revert, hash: 'E', r: 14 }) +
            branchPill({ x: 320, y: 130, text: 'main', color: CLR.main, toX: 320, toY: 98 }) +
            branchPill({ x: 320, y: 30, text: 'HEAD', head: true, toX: 320, toY: 63 })
          );
          // checkout B → detached
          var sCheckout = svg('320 170',
            defs() +
            link(30, 80, 110, 80, CLR.main) + link(110, 80, 190, 80, CLR.main) + link(190, 80, 270, 80, CLR.main) +
            commitDot({ x: 30, y: 80, color: CLR.main, hash: 'A', r: 13 }) +
            commitDot({ x: 110, y: 80, color: CLR.main, hash: 'B', r: 13 }) +
            commitDot({ x: 190, y: 80, color: CLR.main, hash: 'C', r: 13 }) +
            commitDot({ x: 270, y: 80, color: CLR.main, hash: 'D', r: 13 }) +
            branchPill({ x: 270, y: 130, text: 'main', color: CLR.main, toX: 270, toY: 97 }) +
            branchPill({ x: 110, y: 30, text: 'HEAD', head: true, toX: 110, toY: 64 })
          );

          stage.innerHTML =
            '<h2 class="deck-h2">三种"回退"，语义<span style="color:var(--course-accent)">完全不同</span></h2>' +
            '<p class="deck-lead">第 4 章你已经认识了 <b>reset</b> 和 <b>revert</b>。学完分支后再看一遍，' +
            '会多懂一层——它们的差别，其实全是"<b style="color:var(--course-accent)">分支指针挪去哪、HEAD 指向谁</b>"。' +
            '加上分支专属的 <b>checkout</b>，三个放一起对比 👇</p>' +
            '<p class="deck-lead">设定：你在 main，历史是 <b>A→B→C→D</b>（HEAD 在 D），目标是回到 <b>B</b>。看清楚每种的代价：</p>' +
            '<div class="c-branch-three">' +
              '<div class="c-branch-rcard">' +
                '<div class="c-branch-rtitle"><span class="deck-kbd">git reset --hard B</span></div>' +
                sReset +
                '<p class="deck-p">让 main <b>这根指针直接挪到 B</b>，C、D 被丢弃（变孤儿）。HEAD 仍透过 main 指着 B，<b>不是分离状态</b>。（细节见第 4 章）</p>' +
              '</div>' +
              '<div class="c-branch-rcard">' +
                '<div class="c-branch-rtitle"><span class="deck-kbd">git revert C D</span></div>' +
                sRevert +
                '<p class="deck-p"><b>不删历史</b>，新建一个 commit <b style="color:' + CLR.revert + '">E</b> 抵消 C、D，main 指针顺势前移到 E。代码状态等于 B，<b>也不是分离状态</b>。（细节见第 4 章）</p>' +
              '</div>' +
              '<div class="c-branch-rcard">' +
                '<div class="c-branch-rtitle"><span class="deck-kbd">git checkout B</span></div>' +
                sCheckout +
                '<p class="deck-p">这才是<b style="color:' + CLR.head + '">分离头指针</b>。HEAD 直接指向 B，<b>绕过分支</b>。main 本身<b>没动</b>，仍指向 D。我只是去看看。</p>' +
              '</div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '<p class="deck-p" style="margin:0 0 6px"><b>一句话记牢三者：</b></p>' +
              '<p class="deck-p" style="margin:0">• <b>reset</b> = 让分支倒退、<b>丢弃</b>后面的提交<br>' +
              '• <b>revert</b> = 用<b>新提交</b>抵消旧提交（历史不丢）<br>' +
              '• <b>checkout</b> = 我只是<b>去看看</b>那个版本，分支不动（= 分离 HEAD）</p>' +
            '</div>' +
            commonStyle() +
            '<style>' +
            '.c-branch-three{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:18px 0;}' +
            '@media (max-width:760px){.c-branch-three{grid-template-columns:1fr;}}' +
            '.c-branch-rcard{background:var(--c-bg-card);border:1px solid var(--c-border);border-radius:14px;padding:14px 16px;}' +
            '.c-branch-rtitle{margin-bottom:6px;}' +
            '.c-branch-rcard .c-branch-svg{margin:4px 0 8px;}' +
            '.c-branch-rcard .deck-p{font-size:13px;margin:0;line-height:1.6;}' +
            '</style>';
        }
      },

      // ========================================================
      // Slide 13 · 理解升华页（恍然大悟）
      // ========================================================
      {
        title: '为什么非得靠"分支指向"',
        render: function (stage, api) {
          var diagram = svg('600 220',
            defs() +
            link(80, 120, 220, 120, CLR.main) + link(220, 120, 360, 120, CLR.main) + link(360, 120, 500, 120, CLR.main) +
            commitDot({ x: 80, y: 120, color: CLR.main, hash: 'v1' }) +
            commitDot({ x: 220, y: 120, color: CLR.main, hash: 'v2' }) +
            commitDot({ x: 360, y: 120, color: CLR.main, hash: 'v3' }) +
            commitDot({ x: 500, y: 120, color: CLR.main, hash: 'v4' }) +
            branchPill({ x: 500, y: 70, text: 'main', color: CLR.main, toX: 500, toY: 100 }) +
            branchPill({ x: 410, y: 170, text: 'HEAD', head: true, toX: 488, toY: 132 }) +
            // 下一次 commit 的"问号"——它要记到哪个分支？
            link(500, 120, 580, 120, CLR.main, true) +
            '<circle cx="580" cy="120" r="14" fill="none" stroke="var(--course-accent)" stroke-width="2.5" stroke-dasharray="4 3"/>' +
            '<text x="580" y="126" text-anchor="middle" font-size="16" fill="var(--course-accent)" font-weight="800">?</text>' +
            '<text x="580" y="160" text-anchor="middle" font-size="11" fill="var(--c-fg-muted)" font-family="ui-monospace,monospace">下一次 commit</text>'
          );

          stage.innerHTML =
            '<h2 class="deck-h2">💡 恍然大悟：分支是用来<span style="color:var(--course-accent)">"指向"</span>的</h2>' +
            '<p class="deck-lead">git 天生是为<b>版本控制</b>而生。它每做一件事前，都得先知道一件事：' +
            '<b>下一次提交，要记到哪个分支上？</b></p>' +
            '<div class="c-branch-stage">' + diagram + '</div>' +
            '<div class="deck-callout">' +
              '<p class="deck-p" style="margin:0 0 8px">所以我们用<b>分支</b>去<b style="color:var(--course-accent)">指向</b>历史版本——' +
              '这是在替"下一次 commit"<b>提前定好归属</b>。并不是想当然地"我想看哪个历史，就直接看哪个历史"。</p>' +
              '<p class="deck-p" style="margin:0">类比：写论文时你<b>看哪个历史版本就直接在那个 Word 上改</b>——' +
              '那其实是默默地默认了"<b>main 就指向这个历史 commit</b>"。git 只是把这件事<b>显式</b>写出来了。</p>' +
            '</div>' +
            '<div class="deck-callout warn">' +
              '而<b style="color:' + CLR.head + '">分离头指针</b>是唯一<b>不靠"分支指向"</b>就能查看历史的方法。' +
              '代价就是：新 commit <b>不知道该去哪个分支</b>，于是变成<b>孤儿</b> 🧑‍🚀。' +
            '</div>' +
            commonStyle();
        }
      },

      // ========================================================
      // Slide 14 · 收尾
      // ========================================================
      {
        title: '收尾',
        render: function (stage, api) {
          var diagram = svg('600 230',
            defs() +
            // 一棵漂亮的多分支树（main + 3 条 feature 并行）
            link(60, 130, 200, 130, CLR.main) + link(200, 130, 340, 130, CLR.main) + link(340, 130, 540, 130, CLR.main) +
            link(200, 130, 320, 60, CLR.feature) + commitDot({ x: 320, y: 60, color: CLR.feature, r: 13 }) +
            link(320, 60, 460, 60, CLR.feature) + commitDot({ x: 460, y: 60, color: CLR.feature, r: 13 }) +
            link(200, 130, 320, 200, CLR.feature2) + commitDot({ x: 320, y: 200, color: CLR.feature2, r: 13 }) +
            link(320, 200, 460, 200, CLR.feature2) + commitDot({ x: 460, y: 200, color: CLR.feature2, r: 13 }) +
            // 两条 feature 汇回 main
            link(460, 60, 540, 130, CLR.feature, false) +
            link(460, 200, 540, 130, CLR.feature2, false) +
            commitDot({ x: 60, y: 130, color: CLR.main, r: 14 }) +
            commitDot({ x: 200, y: 130, color: CLR.main, r: 14 }) +
            commitDot({ x: 340, y: 130, color: CLR.main, r: 14 }) +
            commitDot({ x: 540, y: 130, color: CLR.main, hash: 'merge', r: 17 }) +
            branchPill({ x: 540, y: 178, text: 'main', color: CLR.main, toX: 540, toY: 152 })
          );

          stage.innerHTML =
            '<div class="deck-center">' +
              '<div class="c-branch-hero">' + diagram + '</div>' +
              '<h1 class="deck-h1">分支是 git <span style="color:var(--course-accent)">最强的协作武器</span> 🌿</h1>' +
              '<p class="deck-lead">尤其在 <b>AI 多 agent 并行</b>的时代：一堆 agent 各拉一条分支同时开工，做完再汇回主干。</p>' +
              '<div class="deck-grid c-branch-3col">' +
                '<div class="deck-card"><div class="c-branch-stat">🌿</div><div class="c-branch-statlabel">分支 = 独立开发线，互不影响</div></div>' +
                '<div class="deck-card"><div class="c-branch-stat">📍</div><div class="c-branch-statlabel">HEAD = 你现在站在哪</div></div>' +
                '<div class="deck-card"><div class="c-branch-stat">🔀</div><div class="c-branch-statlabel">merge = 把成果汇回主干</div></div>' +
              '</div>' +
              '<div class="deck-callout" style="text-align:left">' +
                '你已经搞懂了 git 最核心、最难的一章。剩下的命令（reset / revert / checkout）都只是' +
                '"<b>把分支挪去哪、HEAD 指向谁</b>"的不同玩法而已。<br>' +
                '<span style="color:var(--c-fg-muted)">不过多条分支同时开工，迟早会撞上两个新问题：怎么<b>真正同时</b>开几个工作台？' +
                '两个人改了同一行又怎么办？<b>下一章</b>——worktree 与合并冲突。👋</span>' +
              '</div>' +
            '</div>' +
            commonStyle();
        }
      }

    ]
  });

  // ------------------------------------------------------------
  // 这一章共用的样式（每页 stage.innerHTML 末尾拼一次）
  // 重复注入同名 class 没关系：后注入的覆盖，内容一致。
  // ------------------------------------------------------------
  function commonStyle() {
    return '<style>' +
      '.c-branch-stage{margin:18px auto;max-width:640px;display:flex;justify-content:center;}' +
      '.c-branch-svg{display:block;filter:drop-shadow(0 4px 14px rgba(0,0,0,.35));overflow:visible;}' +
      '.c-branch-bigline{font-size:18px;margin:8px 0;}' +
      '.c-branch-2col{grid-template-columns:1fr 1fr;max-width:640px;margin:18px auto;}' +
      '@media (max-width:640px){.c-branch-2col{grid-template-columns:1fr;}}' +
      '.c-branch-3col{grid-template-columns:repeat(3,1fr);max-width:640px;margin:18px auto;}' +
      '@media (max-width:640px){.c-branch-3col{grid-template-columns:1fr;}}' +
      '.c-branch-3col .deck-card{text-align:center;}' +
      '.c-branch-cardh{font-weight:700;color:var(--c-fg);margin-bottom:6px;}' +
      '.c-branch-cardh code,.c-branch-cardh .deck-kbd,.deck-card code{font-family:ui-monospace,monospace;font-size:.9em;background:var(--c-bg-soft);padding:1px 6px;border-radius:5px;color:var(--course-accent);}' +
      '.c-branch-stat{font-size:30px;line-height:1;margin-bottom:6px;}' +
      '.c-branch-statlabel{font-size:13px;color:var(--c-fg-muted);}' +
      '.c-branch-row{display:flex;gap:12px;align-items:center;justify-content:center;flex-wrap:wrap;}' +
      '.c-branch-counter{font-size:13px;color:var(--c-fg-muted);font-family:ui-monospace,monospace;}' +
      '.c-branch-grow{animation:c-branch-pop .45s cubic-bezier(.34,1.56,.64,1);}' +
      '.c-branch-hero{margin:2px 0 6px;}' +
      '@keyframes c-branch-pop{from{opacity:0;transform:translateY(10px) scale(.96)}to{opacity:1;transform:none}}' +
      '</style>';
  }

})();
