(function () {
  'use strict';

  // ============================================================
  // 第2章 · Commit 提交
  // theme: #3fb950  emoji: 📦
  // 样式前缀: c-commit-
  // ============================================================

  // 推文版本名 <-> commit 一一对应
  var TWEET_VERSIONS = ['第一版', '第二版', '第三版', '定稿版', '最终版', '打死不改最终版'];
  var COMMIT_HASHES = ['a1f3c0', 'b7e9d2', 'c2a8f1', 'd0c4b9', 'e5f7a3', 'f9b1e8'];
  var COMMIT_MSGS = [
    '初稿：搭好推文骨架',
    '补上活动时间地点',
    '改了开头的钩子',
    '定稿：润色措辞',
    '换了一张封面图',
    '修个错别字（真的最后一次）'
  ];

  // 画一条横向 commit 链。
  // opts: { ids, msgs, topLabels, head(index|null), interactive(bool), accent } 由调用方决定坐标
  function buildChainSVG(opts) {
    var ids = opts.ids;
    var n = ids.length;
    var w = 760, h = opts.topLabels ? 230 : 170;
    var pad = 70;
    var gap = (w - pad * 2) / (n - 1);
    var cy = opts.topLabels ? 150 : 86;
    var r = 16;

    var parts = [];
    parts.push('<svg class="c-commit-chain" viewBox="0 0 ' + w + ' ' + h + '" width="100%" aria-hidden="true">');

    // 发光滤镜（节点柔和光晕）
    parts.push(
      '<defs>' +
        '<filter id="c-commit-glow" x="-80%" y="-80%" width="260%" height="260%">' +
          '<feGaussianBlur stdDeviation="3.4" result="b"/>' +
          '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
        '</filter>' +
      '</defs>'
    );

    // 连线（先画，垫底；主干一根，端点圆润）
    for (var i = 0; i < n - 1; i++) {
      var x1 = pad + gap * i, x2 = pad + gap * (i + 1);
      parts.push('<line x1="' + x1 + '" y1="' + cy + '" x2="' + x2 + '" y2="' + cy + '" stroke="var(--course-accent)" stroke-width="3" stroke-linecap="round" opacity="0.9"/>');
    }

    // 顶部推文版本名 + 连到对应 commit 的虚线
    if (opts.topLabels) {
      for (var t = 0; t < n; t++) {
        var lx = pad + gap * t;
        parts.push('<line x1="' + lx + '" y1="48" x2="' + lx + '" y2="' + (cy - r - 4) + '" stroke="var(--c-fg-muted)" stroke-width="1.5" stroke-dasharray="3 4" stroke-linecap="round"/>');
        parts.push('<text x="' + lx + '" y="40" text-anchor="middle" font-size="13" fill="#d6e0f0" font-weight="600">' + opts.topLabels[t] + '</text>');
      }
    }

    // commit 圆点 + 下方编号/hash
    for (var c = 0; c < n; c++) {
      var cx = pad + gap * c;
      var g = '<g class="c-commit-node" data-i="' + c + '"' + (opts.interactive ? ' style="cursor:pointer"' : '') + '>';
      // 交互模式下加一个透明大热区，方便点
      if (opts.interactive) {
        g += '<circle class="c-commit-hit" cx="' + cx + '" cy="' + cy + '" r="30" fill="transparent"/>';
      }
      g += '<circle class="c-commit-dot" cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="var(--course-accent)" stroke="#fff" stroke-width="2" filter="url(#c-commit-glow)"/>';
      g += '</g>';
      parts.push(g);
      // 下方两行：commit #N + hash
      var ly = cy + r + 22;
      parts.push('<text class="c-commit-num" x="' + cx + '" y="' + ly + '" text-anchor="middle" font-size="13" fill="#d6e0f0" font-weight="700">commit #' + (c + 1) + '</text>');
      parts.push('<text class="c-commit-hash" x="' + cx + '" y="' + (ly + 17) + '" text-anchor="middle" font-size="11" fill="var(--c-fg-muted)">' + ids[c] + '</text>');
    }

    parts.push('</svg>');
    return parts.join('');
  }

  window.registerChapter({
    id: 'commit',
    index: 2,
    emoji: '📦',
    title: 'Commit 提交',
    subtitle: '一次 commit = 一个版本',
    theme: '#3fb950',
    slides: [

      // ---------- Slide 1：点题，commit 是最基本单元 ----------
      {
        title: 'commit 是什么',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<div class="c-commit-bigbox">📦</div>' +
              '<h1 class="deck-h1"><span style="color:var(--course-accent)">commit（提交）</span></h1>' +
              '<p class="deck-lead">是 Git 进行版本控制的<b>最基本单元</b>。</p>' +
              '<div class="deck-callout">' +
                '<p class="deck-p" style="margin:0;font-size:18px">' +
                  '一句话记住它：<br>' +
                  '<b style="color:var(--course-accent)">每一次 commit，就是一个版本。</b>' +
                '</p>' +
              '</div>' +
              '<p class="deck-p" style="color:var(--c-fg-muted)">' +
                '还记得上一章存推文吗？每存一个"第 X 版"，在 Git 里就对应一次 commit。下一页我们把它俩对起来看。' +
              '</p>' +
            '</div>' +
            '<style>' +
            '.c-commit-bigbox{font-size:64px;line-height:1;margin:6px 0 8px;animation:c-commit-bob 2.6s ease-in-out infinite;}' +
            '@keyframes c-commit-bob{0%,100%{transform:translateY(0) rotate(-2deg)}50%{transform:translateY(-9px) rotate(2deg)}}' +
            '</style>';
        }
      },

      // ---------- Slide 2：核心对照图（推文版本 ←→ commit 链）----------
      {
        title: '推文版本 ←→ commit 链',
        render: function (stage, api) {
          stage.innerHTML =
            '<h2 class="deck-h2">把上一章的推文版本，对到 commit 上 🔗</h2>' +
            '<p class="deck-lead">上面是你熟悉的推文版本名，下面是 Git 里的 commit 链，一一对应：</p>' +
            '<div class="c-commit-chartwrap">' +
              buildChainSVG({ ids: COMMIT_HASHES, topLabels: TWEET_VERSIONS, interactive: false }) +
            '</div>' +
            '<div class="deck-callout">' +
              '推文里的"<b>第三版</b>" = Git 里的 "<b>commit #3</b>"。' +
              '你每次说"存一版"，Git 那边就是"做一次 commit"。一根链串起来，就是这篇推文从头到尾的全部历史。' +
            '</div>' +
            '<style>' +
            '.c-commit-chartwrap{background:rgba(255,255,255,0.04);border:1px solid var(--c-border);border-radius:16px;padding:18px 10px;margin:18px 0;box-shadow:inset 0 0 60px color-mix(in srgb,var(--course-accent) 5%,transparent);}' +
            '.c-commit-chain{display:block;max-width:760px;margin:0 auto;}' +
            '.c-commit-chain .c-commit-hash,.c-commit-chain .c-commit-num{font-family:var(--font-mono);}' +
            '.c-commit-node .c-commit-dot{transform-box:fill-box;transform-origin:center;animation:c-commit-pop .5s both cubic-bezier(.34,1.56,.64,1);}' +
            '@keyframes c-commit-pop{from{opacity:0;transform:scale(.2)}to{opacity:1;transform:scale(1)}}' +
            '</style>';
        }
      },

      // ---------- Slide 3：commit 历史 = 项目变迁链路（可点击回溯）----------
      {
        title: '点任意一个 commit 回溯',
        render: function (stage, api) {
          stage.innerHTML =
            '<h2 class="deck-h2">commit 历史链 = 项目变迁的链路 🕰️</h2>' +
            '<p class="deck-lead">每一个 commit 都是一个存档点，<b>都可以随时回溯</b>。点链上任意一个圆点试试 👇</p>' +
            '<div class="c-commit-chartwrap">' +
              buildChainSVG({ ids: COMMIT_HASHES, interactive: true }) +
            '</div>' +
            '<div class="c-commit-detail" id="c-commit-detail">' +
              '<span class="c-commit-detail-empty">👆 点上面任意一个 commit 圆点</span>' +
            '</div>' +
            '<style>' +
            '.c-commit-chartwrap{background:rgba(255,255,255,0.04);border:1px solid var(--c-border);border-radius:16px;padding:18px 10px;margin:18px 0 14px;box-shadow:inset 0 0 60px color-mix(in srgb,var(--course-accent) 5%,transparent);}' +
            '.c-commit-chain{display:block;max-width:760px;margin:0 auto;}' +
            '.c-commit-chain .c-commit-hash,.c-commit-chain .c-commit-num{font-family:var(--font-mono);}' +
            '.c-commit-node .c-commit-dot{transform-box:fill-box;transform-origin:center;transition:r .2s ease,filter .2s ease,transform .2s ease;}' +
            '.c-commit-node:hover .c-commit-dot{transform:scale(1.12);filter:drop-shadow(0 0 8px var(--course-accent));}' +
            '.c-commit-node.sel .c-commit-dot{r:20;filter:drop-shadow(0 0 14px var(--course-accent));}' +
            '.c-commit-node.sel .c-commit-num{fill:var(--course-accent);}' +
            '.c-commit-detail{min-height:78px;background:rgba(255,255,255,0.04);border:1px solid var(--c-border);border-left:4px solid var(--course-accent);border-radius:10px;padding:14px 18px;display:flex;align-items:center;box-shadow:inset 0 0 40px color-mix(in srgb,var(--course-accent) 6%,transparent);}' +
            '.c-commit-detail-empty{color:var(--c-fg-muted);}' +
            '.c-commit-detail .h{font-weight:700;color:var(--c-fg);}' +
            '.c-commit-detail code{font-family:var(--font-mono,ui-monospace,monospace);color:var(--course-accent);}' +
            '.c-commit-restore{margin-top:8px;display:inline-block;font-size:13px;background:var(--course-accent);color:#08240f;font-weight:700;padding:4px 12px;border-radius:999px;box-shadow:0 0 14px var(--course-accent-soft);}' +
            '</style>';

          var detail = stage.querySelector('#c-commit-detail');
          var nodes = stage.querySelectorAll('.c-commit-node');
          nodes.forEach(function (node) {
            node.addEventListener('click', function () {
              var i = parseInt(node.getAttribute('data-i'), 10);
              nodes.forEach(function (x) { x.classList.remove('sel'); });
              node.classList.add('sel');
              detail.innerHTML =
                '<div>' +
                  '<div class="h">commit #' + (i + 1) + ' · <code>' + COMMIT_HASHES[i] + '</code> · 对应「' + TWEET_VERSIONS[i] + '」</div>' +
                  '<div style="color:var(--c-fg-muted);margin-top:3px">改动说明：' + COMMIT_MSGS[i] + '</div>' +
                  '<span class="c-commit-restore">⏪ 回到这个版本</span>' +
                '</div>';
            });
          });
        }
      },

      // ---------- Slide 4：协作视角，每次改动都被记录（谁/何时/改了啥）----------
      {
        title: '协作：谁改了啥一清二楚',
        render: function (stage, api) {
          var rows = [
            { who: '小明 👦', hash: 'a1f3c0', when: '周一 09:12', what: '加上了活动报名链接' },
            { who: '小红 👧', hash: 'b7e9d2', when: '周一 14:30', what: '修好了首页一处错别字' },
            { who: '你 🙋', hash: 'c2a8f1', when: '周二 10:05', what: '新增"常见问题"板块' },
            { who: '小刚 🧑', hash: 'd0c4b9', when: '周二 16:48', what: '换了一张更清楚的封面图' }
          ];
          var tr = rows.map(function (r) {
            return (
              '<div class="c-commit-row">' +
                '<div class="c-commit-cell who">' + r.who + '</div>' +
                '<div class="c-commit-cell hash"><code>' + r.hash + '</code></div>' +
                '<div class="c-commit-cell when">' + r.when + '</div>' +
                '<div class="c-commit-cell what">' + r.what + '</div>' +
              '</div>'
            );
          }).join('');

          stage.innerHTML =
            '<h2 class="deck-h2">人一多，commit 的好处就炸出来了 👥</h2>' +
            '<p class="deck-lead">每个协作者的<b>每一次改动</b>都会被一个 commit 记下来——谁、什么时候、改了什么，全都有据可查：</p>' +
            '<div class="c-commit-table">' +
              '<div class="c-commit-row head">' +
                '<div class="c-commit-cell">谁改的</div>' +
                '<div class="c-commit-cell">commit</div>' +
                '<div class="c-commit-cell">什么时候</div>' +
                '<div class="c-commit-cell">改了什么</div>' +
              '</div>' +
              tr +
            '</div>' +
            '<div class="deck-callout">' +
              '上一章那个"十个人改到天昏地暗"的混乱场面？正是 commit 把它治好了：' +
              '出了问题，一眼就能看出是哪次改动、谁动的，再也不用对着一堆 <span class="deck-kbd">_最终版</span> 互相甩锅。' +
            '</div>' +
            '<style>' +
            '.c-commit-table{margin:18px 0;border:1px solid var(--c-border);border-radius:12px;overflow:hidden;background:rgba(255,255,255,0.03);}' +
            '.c-commit-row{display:grid;grid-template-columns:1fr 1fr 1.1fr 2.2fr;align-items:center;}' +
            '.c-commit-cell{padding:11px 14px;font-size:14px;color:var(--c-fg);border-top:1px solid var(--c-border);transition:background .15s;}' +
            '.c-commit-row.head .c-commit-cell{border-top:none;background:rgba(255,255,255,0.05);color:var(--c-fg-muted);font-weight:700;font-size:12.5px;font-family:var(--font-mono,ui-monospace,monospace);letter-spacing:0.02em;}' +
            '.c-commit-row:not(.head):hover{background:var(--course-accent-soft);box-shadow:inset 3px 0 0 var(--course-accent);}' +
            '.c-commit-cell.hash code{font-family:var(--font-mono,ui-monospace,monospace);color:var(--course-accent);}' +
            '.c-commit-cell.when{color:var(--c-fg-muted);}' +
            '</style>';
        }
      },

      // ---------- Slide 5：AI 时代收尾小贴士 ----------
      {
        title: 'vibe coder 的 commit 习惯',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h2 class="deck-h2">作为 vibe coder，一句大白话就行 🤖</h2>' +
              '<p class="deck-lead">commit 听起来像个命令，但你完全不用记——直接让 AI 帮你做：</p>' +
              '<div class="c-commit-chat">' +
                '<div class="c-commit-bubble you">' +
                  '<div class="c-commit-bubble-who">你 🙋</div>' +
                  '帮我 commit 一下，记录现在这个版本' +
                '</div>' +
                '<div class="c-commit-bubble ai">' +
                  '<div class="c-commit-bubble-who">AI 🤖</div>' +
                  '已帮你提交 ✅ <code>commit #7 · 9c4d2a</code>「完成报名表单」' +
                '</div>' +
              '</div>' +
              '<div class="deck-callout">' +
                '<b>养成一个好习惯：每完成一个小功能点，就 commit 一次。</b><br>' +
                '那一刻的代码，就被存成了一个<b>完美的存档点</b>——哪天改崩了，随时能 ⏪ 回到这里，' +
                '就像打游戏存档，永远不怕从头再来。' +
              '</div>' +
              '<p class="deck-p" style="color:var(--c-fg-muted)">小结：<b style="color:var(--course-accent)">一次 commit = 一个版本 = 一个存档点。</b>' +
                '可现在这些存档都只在你电脑里——<b>下一章</b>我们把它们送上云端，让全世界都能看到。</p>' +
            '</div>' +
            '<style>' +
            '.c-commit-chat{max-width:560px;margin:22px auto;display:flex;flex-direction:column;gap:12px;}' +
            '.c-commit-bubble{position:relative;padding:14px 16px 14px;border-radius:14px;font-size:15px;line-height:1.5;text-align:left;}' +
            '.c-commit-bubble-who{font-size:12px;font-weight:700;margin-bottom:5px;opacity:.8;}' +
            '.c-commit-bubble.you{align-self:flex-end;background:rgba(255,255,255,0.05);border:1px solid var(--c-border);border-bottom-right-radius:4px;max-width:82%;}' +
            '.c-commit-bubble.ai{align-self:flex-start;background:var(--course-accent-soft);border:1px solid var(--course-accent);border-bottom-left-radius:4px;max-width:88%;box-shadow:0 0 22px var(--course-accent-soft);}' +
            '.c-commit-bubble.ai code{font-family:var(--font-mono,ui-monospace,monospace);color:var(--course-accent);font-weight:700;}' +
            '</style>';
        }
      }

    ]
  });
})();
