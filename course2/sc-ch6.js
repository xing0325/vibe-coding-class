/* ============================================================
 * 第 6 章 · 三颗后悔药（去重合并）  (chapter:6, play:true)
 * 把 discard / reset / revert / checkout 统一成「按你想撤销什么来选药」。
 * 屏 6.1 triage     · 分诊台（四入口决策卡 → 跳对应屏）
 * 屏 6.2 discard    · 丢掉未提交改动
 * 屏 6.3 reset      · reset --hard（分支整段退回，C/D 成孤儿）
 * 屏 6.4 revert     · 新建 E 抵消，历史全留
 * 屏 6.5 checkout   · 只是去看看（分离头指针，呼应第 5 章）
 * 屏 6.6 undo-table · 四味药对照表（行可点 → 右侧迷你画布重放）
 * 样式前缀: c-ch6-
 * 仅调用框架契约：window.registerScreen / api.step / api.frag / api.graph
 *   / api.aiCard / api.astronaut / api.next / api.onReset / api.isReplay
 * ============================================================ */
(function () {
  'use strict';

  function injectStyle() {
    if (document.getElementById('c-ch6-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ch6-style';
    s.textContent = [
      '.c-ch6-wrap{display:flex;flex-direction:column;align-items:center;gap:18px;width:100%;}',
      '.c-ch6-lead{max-width:780px;text-align:center;}',
      '.c-ch6-graphbox{position:relative;width:100%;max-width:720px;margin:4px auto 0;}',
      '.c-ch6-row{display:grid;grid-template-columns:1.05fr .95fr;gap:26px;align-items:center;width:100%;max-width:1040px;}',
      '@media (max-width:820px){.c-ch6-row{grid-template-columns:1fr;gap:18px;}}',
      '.c-ch6-controls{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center;}',
      '.c-ch6-state{font-size:14px;color:var(--dim);min-height:1.5em;text-align:center;transition:color .3s;max-width:760px;}',
      '.c-ch6-state.warn{color:var(--info);font-weight:600;}',
      '.c-ch6-state.ok{color:var(--c-teal);font-weight:600;}',
      '.c-ch6-pin{display:flex;gap:10px;align-items:flex-start;max-width:780px;margin:2px auto 0;padding:13px 18px;border-radius:12px;',
      'background:color-mix(in srgb,var(--git) 8%,transparent);border:1px solid color-mix(in srgb,var(--git) 30%,transparent);font-size:14px;line-height:1.55;}',
      '.c-ch6-pin .ic{font-size:17px;flex:0 0 auto;}',
      '.c-ch6-pin b{color:var(--git);}',

      /* ---------- 6.1 分诊台决策卡 ---------- */
      '.c-ch6-triage{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;width:100%;max-width:920px;}',
      '@media (max-width:680px){.c-ch6-triage{grid-template-columns:1fr;}}',
      '.c-ch6-tcard{position:relative;text-align:left;cursor:pointer;border-radius:16px;padding:20px 22px;',
      'background:var(--pane);border:1px solid var(--border);transition:transform .15s var(--ease),border-color .15s,box-shadow .2s;}',
      '.c-ch6-tcard:hover{transform:translateY(-3px);border-color:var(--accent);box-shadow:0 8px 26px rgba(0,0,0,.35);}',
      '.c-ch6-tcard.flash{animation:c-ch6-flash 1.1s var(--ease);}',
      '@keyframes c-ch6-flash{0%,100%{box-shadow:0 0 0 0 var(--accent);}30%{box-shadow:0 0 0 3px var(--accent);}}',
      '.c-ch6-tcard .q{font-size:13px;color:var(--dim);font-weight:600;margin-bottom:8px;}',
      '.c-ch6-tcard .need{font-size:clamp(16px,2vw,21px);font-weight:800;line-height:1.35;letter-spacing:-.01em;}',
      '.c-ch6-tcard .rx{display:inline-flex;align-items:center;gap:7px;margin-top:14px;padding:5px 12px;border-radius:999px;',
      'font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--accent);',
      'background:color-mix(in srgb,var(--accent) 14%,transparent);border:1px solid color-mix(in srgb,var(--accent) 40%,transparent);}',
      '.c-ch6-tcard .rx .arrow{opacity:.7;}',

      /* ---------- 6.2 工作区脏改动标记 ---------- */
      '.c-ch6-worktree{display:flex;flex-direction:column;gap:8px;width:100%;max-width:460px;padding:18px;border-radius:14px;',
      'background:var(--pane);border:1px solid var(--border);}',
      '.c-ch6-wt-h{font-family:var(--font-mono);font-size:12px;letter-spacing:.08em;color:var(--dim);text-transform:uppercase;margin-bottom:4px;}',
      '.c-ch6-file{display:flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:13.5px;padding:6px 10px;border-radius:8px;',
      'background:#1a1f29;transition:opacity .4s var(--ease),transform .4s var(--ease),background .3s;}',
      '.c-ch6-file .badge{flex:0 0 auto;width:18px;text-align:center;font-weight:800;}',
      '.c-ch6-file.mod .badge{color:var(--c-amber);}',
      '.c-ch6-file.mod{border-left:3px solid var(--c-amber);}',
      '.c-ch6-file.del .badge{color:var(--git);}',
      '.c-ch6-file.del{border-left:3px solid var(--git);}',
      '.c-ch6-file.add .badge{color:var(--c-teal);}',
      '.c-ch6-file.add{border-left:3px solid var(--c-teal);}',
      '.c-ch6-file.clean{border-left:3px solid var(--c-teal);background:color-mix(in srgb,var(--c-teal) 8%,transparent);}',
      '.c-ch6-file.poof{opacity:0;transform:translateX(26px) scale(.9);}',
      '.c-ch6-wt-status{margin-top:8px;font-size:13px;color:var(--dim);transition:color .3s;}',
      '.c-ch6-wt-status.ok{color:var(--c-teal);font-weight:600;}',

      /* ---------- 6.6 对照表 ---------- */
      '.c-ch6-table-wrap{width:100%;max-width:1040px;}',
      '.c-ch6-table{width:100%;border-collapse:separate;border-spacing:0;font-size:14px;}',
      '.c-ch6-table th,.c-ch6-table td{padding:12px 14px;text-align:left;border-bottom:1px solid var(--border);vertical-align:top;}',
      '.c-ch6-table th{font-family:var(--font-mono);font-size:12px;letter-spacing:.05em;color:var(--dim);text-transform:uppercase;font-weight:700;}',
      '.c-ch6-table td:first-child{font-family:var(--font-mono);font-weight:800;white-space:nowrap;}',
      '.c-ch6-table tr.rx{cursor:pointer;transition:background .15s;}',
      '.c-ch6-table tr.rx:hover td{background:color-mix(in srgb,var(--text) 5%,transparent);}',
      '.c-ch6-table tr.rx.on td{background:color-mix(in srgb,var(--accent) 12%,transparent);}',
      '.c-ch6-table tr.rx.on td:first-child{color:var(--accent);box-shadow:inset 3px 0 0 var(--accent);}',
      '.c-ch6-safe-y{color:var(--c-teal);font-weight:700;}',
      '.c-ch6-safe-n{color:var(--git);font-weight:700;}',
      '.c-ch6-safe-m{color:var(--c-amber);font-weight:700;}',
      '.c-ch6-mini-panel{margin-top:6px;padding:14px;border-radius:14px;background:var(--pane);border:1px solid var(--border);min-height:160px;}',
      '.c-ch6-mini-panel h4{font-family:var(--font-mono);font-size:13px;margin:0 0 8px;color:var(--accent);}',
      '.c-ch6-mini-panel .cap{font-size:12.5px;color:var(--dim);line-height:1.5;margin-top:8px;}',
      '.c-ch6-closer{max-width:880px;margin:6px auto 0;text-align:center;font-size:clamp(15px,1.8vw,19px);line-height:1.55;}',
      '.c-ch6-closer b{color:var(--c-teal);}'
    ].join('');
    document.head.appendChild(s);
  }

  // 四味药的主题色（用于卡片 / 表格行高亮的 --accent）
  var RX_COLOR = {
    discard: '#2DD4BF',
    reset: '#F05133',
    revert: '#A78BFA',
    checkout: '#58A6FF'
  };
  // 屏 id 与 screen index 无关，跳转用 hash 锚点（引擎支持 #s<idx>，但我们按 id 找）
  // 引擎未暴露按 id 跳转的 API，故 6.1 的跳转用「定位到目标屏」的稳健兜底：
  //   优先 api.next 顺序翻页提示；这里采用 hash 路由 + 高亮兜底。

  /* ====================================================== */
  /* 屏 6.1 — 分诊台                                         */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '三颗后悔药',
    id: 'triage',
    title: '分诊台',
    subtitle: '按你想撤销什么来选药',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch6-wrap">' +
          '<h2 class="sc-h2 sc-center">后悔了？先分诊：<b style="color:var(--git)">你想撤销的，到底是什么？</b></h2>' +
          '<p class="sc-lead c-ch6-lead">网上把 discard / reset / revert / checkout 讲得一团乱。其实<b style="color:var(--c-teal)">四味药各管一种需求</b>——对症下药就行。点一张卡，直接去看那味药。</p>' +
          '<div class="c-ch6-triage" id="c-ch6-1-cards">' +
            card('discard', '① 还没提交的烂摊子', '改了一堆<b>还没 commit</b>的东西，越改越坏，想全扔了回到干净状态', 'discard') +
            card('reset', '② 想让分支整个退回去', '<b>已经提交</b>的最近几次是一条死路，整段不要了', 'reset --hard') +
            card('revert', '③ 烂代码已经 push 了', '坏改动<b>已经 push / 别人依赖</b>，不能改历史，只能抵消', 'revert') +
            card('checkout', '④ 只想去看看旧版本', '<b>什么都不改</b>，只是好奇某个旧版本长啥样', 'checkout') +
          '</div>' +
          '<p class="c-ch6-state" id="c-ch6-1-state">点任一张卡 → 跳到对应那一屏。（也可以直接按空格顺序往后翻）</p>' +
        '</div>';

      function card(rx, q, need, cmd) {
        return '<button class="c-ch6-tcard" data-interactive="1" data-rx="' + rx + '" style="--accent:' + RX_COLOR[rx] + ';">' +
          '<div class="q">' + q + '</div>' +
          '<div class="need">' + need + '</div>' +
          '<div class="rx">💊 ' + cmd + ' <span class="arrow">→</span></div>' +
        '</button>';
      }

      var stateEl = stage.querySelector('#c-ch6-1-state');

      // 跳转：本屏在引擎中的 idx 已知（当前 idx），目标屏按注册顺序紧随其后。
      // 6.1→6.2 是 +1，6.3 +2 … 用相对偏移最稳（不依赖全局屏数）。
      var rxOrder = { discard: 1, reset: 2, revert: 3, checkout: 4 };
      var Deck = window.__Deck;

      function jumpTo(rx) {
        var off = rxOrder[rx];
        if (Deck && typeof Deck.go === 'function' && typeof Deck.idx === 'number') {
          Deck.go(Deck.idx + off, 0, true); // 直接跳到对应屏
          return true;
        }
        return false;
      }

      stage.querySelectorAll('.c-ch6-tcard').forEach(function (c) {
        c.addEventListener('click', function () {
          var rx = c.getAttribute('data-rx');
          if (!jumpTo(rx)) {
            // 兜底：跳转不可用 → 高亮该卡 + 提示顺序翻页
            stage.querySelectorAll('.c-ch6-tcard').forEach(function (x) { x.classList.remove('flash'); });
            void c.offsetWidth;
            c.classList.add('flash');
            stateEl.className = 'c-ch6-state warn';
            stateEl.innerHTML = '👉 这味药是 <span class="sc-mono">' + rx + '</span> —— 按 <b>空格 / →</b> 往后翻几屏就能看到它。';
          }
        });
      });

      // 四张卡依次浮入
      stage.querySelectorAll('#c-ch6-1-cards .c-ch6-tcard').forEach(function (c) { api.frag(c); });
    }
  });

  /* ====================================================== */
  /* 屏 6.2 — discard                                        */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '三颗后悔药',
    id: 'discard',
    title: 'discard · 丢掉未提交改动',
    subtitle: '回到上次 commit 的干净态',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch6-wrap">' +
          '<h2 class="sc-h2 sc-center">💊① <b style="color:var(--c-teal)">discard</b> —— 还没提交，全扔了</h2>' +
          '<div class="c-ch6-row">' +
            '<div style="display:flex;justify-content:center;">' +
              '<div class="c-ch6-worktree" id="c-ch6-2-wt">' +
                '<div class="c-ch6-wt-h">工作区 · 未提交改动</div>' +
                '<div class="c-ch6-file mod"><span class="badge">M</span><span>app.js</span></div>' +
                '<div class="c-ch6-file mod"><span class="badge">M</span><span>styles.css</span></div>' +
                '<div class="c-ch6-file del"><span class="badge">D</span><span>utils.js</span></div>' +
                '<div class="c-ch6-file add"><span class="badge">+</span><span>weird-experiment.js</span></div>' +
                '<div class="c-ch6-wt-status" id="c-ch6-2-status">4 处改动还没 commit —— 越改越乱。</div>' +
              '</div>' +
            '</div>' +
            '<div id="c-ch6-2-aicard"></div>' +
          '</div>' +
          '<div class="c-ch6-controls">' +
            '<button class="sc-btn primary" id="c-ch6-2-btn" data-interactive="1">🗑 discard（丢掉全部改动）</button>' +
          '</div>' +
          '<div class="c-ch6-pin">' +
            '<span class="ic">📌</span>' +
            '<span><b>典型场景：</b>AI 一通乱改、还没 commit、越改越坏 → discard 一键回到上次干净 commit，比让它一条条撤回快得多。</span>' +
          '</div>' +
        '</div>';

      var aicard = api.aiCard({
        effect: '把还没提交的改动全部丢掉，回到上次 commit 的干净状态',
        say: '把我没提交的改动全撤了',
        cmd: 'git restore .   (或 git checkout -- .)'
      });
      stage.querySelector('#c-ch6-2-aicard').appendChild(aicard);

      var btn = stage.querySelector('#c-ch6-2-btn');
      var statusEl = stage.querySelector('#c-ch6-2-status');
      var wt = stage.querySelector('#c-ch6-2-wt');
      var dirtyFiles = wt.querySelectorAll('.c-ch6-file');

      var discarded = false;
      function doDiscard(animated) {
        if (discarded) return;
        discarded = true;
        // 红/黄/绿改动「啪」消失
        dirtyFiles.forEach(function (f, i) {
          if (animated === false) { f.style.display = 'none'; }
          else { setTimeout(function () { f.classList.add('poof'); }, i * 80); }
        });
        var done = function () {
          // 工作区回干净态：留一行 clean 提示
          if (animated !== false) {
            dirtyFiles.forEach(function (f) { f.style.display = 'none'; });
          }
          if (!wt.querySelector('.c-ch6-file.clean')) {
            var clean = document.createElement('div');
            clean.className = 'c-ch6-file clean';
            clean.innerHTML = '<span class="badge">✓</span><span>working tree clean</span>';
            wt.insertBefore(clean, statusEl);
          }
          statusEl.className = 'c-ch6-wt-status ok';
          statusEl.textContent = '✓ 干净了 —— 回到上次 commit 的状态，那些乱改像没发生过。';
        };
        if (animated === false) done();
        else setTimeout(done, dirtyFiles.length * 80 + 320);
        btn.disabled = true; btn.style.opacity = '.5'; btn.style.cursor = 'default';
      }

      btn.addEventListener('click', function () { doDiscard(true); });

      api.step(function (animated) { doDiscard(animated); });

      api.onReset(function () {
        discarded = false;
        var clean = wt.querySelector('.c-ch6-file.clean');
        if (clean) clean.parentNode.removeChild(clean);
        dirtyFiles.forEach(function (f) { f.classList.remove('poof'); f.style.display = ''; });
        statusEl.className = 'c-ch6-wt-status';
        statusEl.textContent = '4 处改动还没 commit —— 越改越乱。';
        btn.disabled = false; btn.style.opacity = ''; btn.style.cursor = '';
      });
    }
  });

  /* ====================================================== */
  /* 屏 6.3 — reset --hard                                   */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '三颗后悔药',
    id: 'reset',
    title: 'reset --hard · 分支整段退回',
    subtitle: '最暴力 · 会重写历史',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch6-wrap">' +
          '<h2 class="sc-h2 sc-center">💊② <b style="color:var(--git)">reset --hard</b> —— 让 main 硬退回去</h2>' +
          '<div class="c-ch6-row">' +
            '<div class="c-ch6-graphbox" id="c-ch6-3-box"></div>' +
            '<div id="c-ch6-3-aicard"></div>' +
          '</div>' +
          '<div class="c-ch6-state" id="c-ch6-3-state">main 现在在 D。目标：让它直接退回 B，丢掉 C、D。</div>' +
          '<div class="c-ch6-controls">' +
            '<button class="sc-btn primary" id="c-ch6-3-btn" data-interactive="1">⏮ reset --hard 到 B</button>' +
          '</div>' +
          '<div class="c-ch6-pin">' +
            '<span class="ic">📌</span>' +
            '<span><b>典型场景：</b>最近几次提交是一条走死的探索，整个不要了 → 让 main 直接跳回 B。' +
            '<b>最暴力、会重写历史 —— 没 push 才安全。</b></span>' +
          '</div>' +
        '</div>';

      var aicard = api.aiCard({
        effect: '分支整个退回到 B，丢掉后面的提交',
        say: '把 main 硬退回到 b2c3d4e',
        cmd: 'git reset --hard b2c3d4e'
      });
      stage.querySelector('#c-ch6-3-aicard').appendChild(aicard);

      var box = stage.querySelector('#c-ch6-3-box');
      var stateEl = stage.querySelector('#c-ch6-3-state');
      var btn = stage.querySelector('#c-ch6-3-btn');

      var g = api.graph(box, {});
      g.init('main', ['A', 'B', 'C', 'D']);

      var didReset = false;
      function doReset(animated) {
        if (didReset) return;
        didReset = true;
        // 框架无「移动分支头」原语 → 用既有原语表达「丢弃 C、D」的视觉：标记成孤儿 + 宇航员飘走。
        // main 直接跳回 B 的语义，通过把 C、D 变灰飘走 + 文案强调来呈现。
        g.setGhost('C', true);
        g.setGhost('D', true);
        g.highlight('B', true);
        // 宇航员把 C、D 带离
        var xyC = g.getNodeXY('C'), xyD = g.getNodeXY('D');
        if (xyC) api.astronaut({ svgRoot: g.svg, x: xyC.x, y: xyC.y });
        if (xyD) setTimeout(function () { var d = g.getNodeXY('D'); if (d) api.astronaut({ svgRoot: g.svg, x: d.x, y: d.y }); }, 260);
        stateEl.className = 'c-ch6-state warn';
        stateEl.innerHTML = '⚠️ main 退回到 <span class="sc-mono">B</span>，<b>C、D 被丢弃</b>（变孤儿飘走）。历史被重写了 —— 这就是为什么 push 过就别这么干。';
        btn.disabled = true; btn.style.opacity = '.5'; btn.style.cursor = 'default';
      }

      btn.addEventListener('click', function () { doReset(true); });
      api.step(function (animated) { doReset(animated); });

      api.onReset(function () {
        didReset = false;
        g.reset(); g.init('main', ['A', 'B', 'C', 'D']);
        stateEl.className = 'c-ch6-state';
        stateEl.innerHTML = 'main 现在在 D。目标：让它直接退回 B，丢掉 C、D。';
        btn.disabled = false; btn.style.opacity = ''; btn.style.cursor = '';
      });
    }
  });

  /* ====================================================== */
  /* 屏 6.4 — revert                                         */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '三颗后悔药',
    id: 'revert',
    title: 'revert · 新建提交抵消',
    subtitle: '历史全保留 · push 过也安全',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch6-wrap">' +
          '<h2 class="sc-h2 sc-center">💊③ <b style="color:var(--c-purple)">revert</b> —— 不删历史，新建一个 E 抵消</h2>' +
          '<div class="c-ch6-row">' +
            '<div class="c-ch6-graphbox" id="c-ch6-4-box"></div>' +
            '<div id="c-ch6-4-aicard"></div>' +
          '</div>' +
          '<div class="c-ch6-state" id="c-ch6-4-state">A─B─C─D 全在。目标：抵消掉 C、D 的改动，但一个提交都不删。</div>' +
          '<div class="c-ch6-controls">' +
            '<button class="sc-btn primary" id="c-ch6-4-btn" data-interactive="1">↪ revert 掉 C、D</button>' +
          '</div>' +
          '<div class="c-ch6-pin">' +
            '<span class="ic">📌</span>' +
            '<span><b>典型场景：</b>坏改动埋在中间某次提交、上面还压着好几个好提交，又已经 push / 别人依赖 → revert 新建 E 抵消，历史记录全保留。</span>' +
          '</div>' +
        '</div>';

      var aicard = api.aiCard({
        effect: '用一个新提交抵消掉 C、D 的改动，历史保留',
        say: '帮我 revert 掉 c3d4e5f 和 d4e5f6g',
        cmd: 'git revert c3d4e5f d4e5f6g'
      });
      stage.querySelector('#c-ch6-4-aicard').appendChild(aicard);

      var box = stage.querySelector('#c-ch6-4-box');
      var stateEl = stage.querySelector('#c-ch6-4-state');
      var btn = stage.querySelector('#c-ch6-4-btn');

      var g = api.graph(box, {});
      g.init('main', ['A', 'B', 'C', 'D']);

      var didRevert = false;
      function doRevert(animated) {
        if (didRevert) return;
        didRevert = true;
        // 新增 E（A─B─C─D─E），HEAD 跟着 main 到 E。E 内容 = B，但历史全留。
        g.addCommit('main', 'E', { anim: animated !== false });
        g.highlight('E', true);
        stateEl.className = 'c-ch6-state ok';
        stateEl.innerHTML = '✓ 新增了 <span class="sc-mono" style="color:var(--c-purple)">E</span>：E 的代码状态 <b>= B</b>（C、D 反着做了一遍），但历史 <span class="sc-mono">A-B-C-D</span> 一个没少。';
        btn.disabled = true; btn.style.opacity = '.5'; btn.style.cursor = 'default';
      }

      btn.addEventListener('click', function () { doRevert(true); });
      api.step(function (animated) { doRevert(animated); });

      api.onReset(function () {
        didRevert = false;
        g.reset(); g.init('main', ['A', 'B', 'C', 'D']);
        stateEl.className = 'c-ch6-state';
        stateEl.innerHTML = 'A─B─C─D 全在。目标：抵消掉 C、D 的改动，但一个提交都不删。';
        btn.disabled = false; btn.style.opacity = ''; btn.style.cursor = '';
      });
    }
  });

  /* ====================================================== */
  /* 屏 6.5 — checkout（只是去看看）                          */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '三颗后悔药',
    id: 'checkout',
    title: 'checkout · 只是去看看',
    subtitle: '分离头指针 · 分支不动',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch6-wrap">' +
          '<h2 class="sc-h2 sc-center">💊④ <b style="color:var(--info)">checkout</b> —— 我只是去看一眼</h2>' +
          '<div class="c-ch6-row">' +
            '<div class="c-ch6-graphbox" id="c-ch6-5-box"></div>' +
            '<div id="c-ch6-5-aicard"></div>' +
          '</div>' +
          '<div class="c-ch6-state" id="c-ch6-5-state">main 在 D。我想回去看看 B 那个版本长啥样 —— 但不想动任何东西。</div>' +
          '<div class="c-ch6-controls">' +
            '<button class="sc-btn" id="c-ch6-5-btn" data-interactive="1">👀 checkout 到 B（去看看）</button>' +
          '</div>' +
          '<div class="c-ch6-pin">' +
            '<span class="ic">📌</span>' +
            '<span>这就是<b>分离头指针</b>（呼应第 5 章）：HEAD 直接指向 B，<b>main 没动，还在 D</b>。看完切回来即可，什么都没改。</span>' +
          '</div>' +
        '</div>';

      var aicard = api.aiCard({
        effect: '只是切过去看看旧版本，分支不动',
        say: '我想看看 b2c3d4e 那个版本长啥样',
        cmd: 'git checkout b2c3d4e'
      });
      stage.querySelector('#c-ch6-5-aicard').appendChild(aicard);

      var box = stage.querySelector('#c-ch6-5-box');
      var stateEl = stage.querySelector('#c-ch6-5-state');
      var btn = stage.querySelector('#c-ch6-5-btn');

      var g = api.graph(box, {});
      g.init('main', ['A', 'B', 'C', 'D']);

      var didCheckout = false;
      function doCheckout(animated) {
        if (didCheckout) return;
        didCheckout = true;
        g.checkout('B'); // 分离态：HEAD 钉 B，main 标签仍指 D，画面转冷色
        stateEl.className = 'c-ch6-state warn';
        stateEl.innerHTML = '⚠️ HEAD 分离落在 <span class="sc-mono">B</span>（画面转冷色），但 <span class="sc-mono">main</span> 标签还稳稳在 D。我只是去看看，分支一点没动。';
        btn.disabled = true; btn.style.opacity = '.5'; btn.style.cursor = 'default';
      }

      btn.addEventListener('click', function () { doCheckout(true); });
      api.step(function (animated) { doCheckout(animated); });

      api.onReset(function () {
        didCheckout = false;
        g.reset(); g.init('main', ['A', 'B', 'C', 'D']);
        stateEl.className = 'c-ch6-state';
        stateEl.innerHTML = 'main 在 D。我想回去看看 B 那个版本长啥样 —— 但不想动任何东西。';
        btn.disabled = false; btn.style.opacity = ''; btn.style.cursor = '';
      });
    }
  });

  /* ====================================================== */
  /* 屏 6.6 — 四味药对照表                                    */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '三颗后悔药',
    id: 'undo-table',
    title: '四味药对照表',
    subtitle: '一张表收尾',
    play: true,
    render: function (stage, api) {
      injectStyle();

      // 每味药：[名, 撤销对象, 改历史吗, 安不安全, 典型场景, 重放函数]
      var ROWS = [
        { rx: 'discard', obj: '未提交改动', hist: '—', safe: ['安全', 'y'], scene: 'AI 没提交就改烂了' },
        { rx: 'reset',   obj: '已提交整段', hist: '✅ 重写', safe: ['仅限没 push', 'm'], scene: '放弃一段死探索' },
        { rx: 'revert',  obj: '已提交单次', hist: '❌ 保留', safe: ['push 了也安全', 'y'], scene: '撤掉被埋住的坏提交' },
        { rx: 'checkout',obj: '只读不改', hist: '—', safe: ['安全', 'y'], scene: '回去看一眼旧版本' }
      ];

      function safeCell(s) {
        var cls = s[1] === 'y' ? 'c-ch6-safe-y' : (s[1] === 'n' ? 'c-ch6-safe-n' : 'c-ch6-safe-m');
        return '<span class="' + cls + '">' + s[0] + '</span>';
      }

      var rowsHtml = ROWS.map(function (r) {
        return '<tr class="rx" data-interactive="1" data-rx="' + r.rx + '" style="--accent:' + RX_COLOR[r.rx] + ';">' +
          '<td style="color:' + RX_COLOR[r.rx] + ';">' + r.rx + '</td>' +
          '<td>' + r.obj + '</td>' +
          '<td>' + r.hist + '</td>' +
          '<td>' + safeCell(r.safe) + '</td>' +
          '<td>' + r.scene + '</td>' +
        '</tr>';
      }).join('');

      stage.innerHTML =
        '<div class="c-ch6-wrap">' +
          '<h2 class="sc-h2 sc-center">四味药 · 一张表收尾</h2>' +
          '<div class="c-ch6-row" style="grid-template-columns:1.35fr .9fr;align-items:start;">' +
            '<div class="c-ch6-table-wrap">' +
              '<table class="c-ch6-table">' +
                '<thead><tr><th>药</th><th>撤销对象</th><th>改历史吗</th><th>安不安全</th><th>典型场景</th></tr></thead>' +
                '<tbody id="c-ch6-6-tbody">' + rowsHtml + '</tbody>' +
              '</table>' +
              '<p class="sc-dim" style="font-size:12.5px;margin-top:10px;">点表格里任意一行 → 右侧迷你画布重放那味药的动画。</p>' +
            '</div>' +
            '<div class="c-ch6-mini-panel" id="c-ch6-6-panel" style="--accent:var(--c-teal);">' +
              '<h4 id="c-ch6-6-panel-h">点一行看重放 →</h4>' +
              '<div class="c-ch6-graphbox" id="c-ch6-6-mini" style="margin:0;min-height:120px;"></div>' +
              '<div class="cap" id="c-ch6-6-cap">每味药的效果在这里单独放一遍。</div>' +
            '</div>' +
          '</div>' +
          '<p class="c-ch6-closer" id="c-ch6-6-closer">' +
            '很多时候「让 AI 在最新版上改」确实够用 —— <b>上面四个场景，是它不够用的时候。</b>' +
          '</p>' +
        '</div>';

      var tbody = stage.querySelector('#c-ch6-6-tbody');
      var panel = stage.querySelector('#c-ch6-6-panel');
      var panelH = stage.querySelector('#c-ch6-6-panel-h');
      var capEl = stage.querySelector('#c-ch6-6-cap');
      var miniBox = stage.querySelector('#c-ch6-6-mini');

      // 右侧迷你画布：复用 6.2-6.5 的状态，每次点行重建并重放该药动画
      function replay(rx) {
        panel.style.setProperty('--accent', RX_COLOR[rx]);
        miniBox.innerHTML = '';
        var g = api.graph(miniBox, {});

        if (rx === 'discard') {
          // discard 不涉及 commit 图 → 用文字 + 一条干净时间线表示「工作区回到上次 commit」
          g.init('main', ['A', 'B', 'C', 'D']);
          g.highlight('D', true);
          panelH.textContent = '💊 discard · 工作区回到上次 commit';
          capEl.textContent = '未提交的改动全丢掉，提交图一点没动 —— 你还停在 D，只是工作区变干净了。';
        } else if (rx === 'reset') {
          g.init('main', ['A', 'B', 'C', 'D']);
          panelH.textContent = '💊 reset --hard · 退回 B，C/D 成孤儿';
          capEl.textContent = 'main 硬退回 B，C、D 被丢弃飘走。最暴力、重写历史 —— 没 push 才安全。';
          setTimeout(function () {
            g.setGhost('C', true); g.setGhost('D', true); g.highlight('B', true);
            var xy = g.getNodeXY('D'); if (xy) api.astronaut({ svgRoot: g.svg, x: xy.x, y: xy.y });
          }, 160);
        } else if (rx === 'revert') {
          g.init('main', ['A', 'B', 'C', 'D']);
          panelH.textContent = '💊 revert · 新增 E 抵消，历史全留';
          capEl.textContent = '新建 E，E 的内容 = B，但 A-B-C-D 一个不删。push 过也安全。';
          setTimeout(function () { g.addCommit('main', 'E', { anim: true }); g.highlight('E', true); }, 160);
        } else if (rx === 'checkout') {
          g.init('main', ['A', 'B', 'C', 'D']);
          panelH.textContent = '💊 checkout · 分离头指针，只看不改';
          capEl.textContent = 'HEAD 分离落在 B（冷色），main 标签仍在 D 没动。看完切回即可。';
          setTimeout(function () { g.checkout('B'); }, 160);
        }
      }

      var rows = tbody.querySelectorAll('tr.rx');
      rows.forEach(function (tr) {
        tr.addEventListener('click', function () {
          rows.forEach(function (x) { x.classList.remove('on'); });
          tr.classList.add('on');
          replay(tr.getAttribute('data-rx'));
        });
      });

      // 四行依次浮入，再浮出收尾句
      rows.forEach(function (tr) { api.frag(tr); });
      api.frag(stage.querySelector('#c-ch6-6-closer'));

      // 进屏默认先放 discard 一帧（让右侧不空），但放在 step 之后不影响分步
      // 用一个轻量初始重放（不抢 step 焦点）
      replay('discard');
      rows[0].classList.add('on');

      api.onReset(function () {
        rows.forEach(function (x) { x.classList.remove('on'); });
        replay('discard');
        rows[0].classList.add('on');
      });
    }
  });

})();
