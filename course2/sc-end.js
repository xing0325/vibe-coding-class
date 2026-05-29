/* ============================================================
 * 结尾屏 · 结语
 *   屏 ending · 居中文案分行淡入 + 极淡 commit 图缓慢漂移（呼应封面）
 * 样式前缀: c-end-
 * 仅调用框架契约：registerScreen / api.step / api.frag
 * 两个入口按钮：
 *   [返回目录]    → data-action="overview"（触发框架章节总览；兜底自绘）
 *   [去 GitHub 章 →] → data-bridge="github"，href="../github-tutorial.html" 兜底
 *
 * 幂等：每次进入(含后退/resize) fresh 调 render；背景漂移为纯 CSS 动画，自动重跑。
 * ============================================================ */
(function () {
  'use strict';

  function register(def) {
    if (typeof window.registerScreen === 'function') { window.registerScreen(def); }
    else { (window.__pendingScreens = window.__pendingScreens || []).push(def); }
  }

  function injectStyle() {
    if (document.getElementById('c-end-style')) return;
    var s = document.createElement('style');
    s.id = 'c-end-style';
    s.textContent = [
      '.c-end-wrap{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:64vh;overflow:hidden;width:100%;}',

      /* 极淡 commit 图背景，缓慢漂移（呼应封面 c-ch0-bg） */
      '.c-end-bg{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0.13;overflow:hidden;}',
      '.c-end-bg-track{position:absolute;top:50%;left:0;transform:translateY(-50%);will-change:transform;animation:c-end-drift 46s linear infinite;}',
      '@keyframes c-end-drift{from{transform:translate(0,-50%);}to{transform:translate(-50%,-50%);}}',

      '.c-end-inner{position:relative;z-index:1;display:flex;flex-direction:column;align-items:center;gap:0;}',

      /* 文案行：每行一块，分行淡入 */
      '.c-end-line{font-family:var(--font-sans);line-height:1.5;}',
      '.c-end-line.lead{font-size:clamp(28px,5vw,56px);font-weight:800;letter-spacing:-0.02em;margin-bottom:clamp(22px,4vh,40px);',
      'background:linear-gradient(120deg,var(--text) 0%,var(--c-teal) 60%,var(--git) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}',
      '.c-end-line.body{font-size:clamp(16px,2.4vw,24px);color:var(--text);font-weight:500;margin:4px 0;max-width:30ch;}',
      '.c-end-line.body .hl{color:var(--c-teal);font-weight:700;}',
      '.c-end-line.body .hl2{color:var(--git);font-weight:700;}',

      /* 入口按钮组 */
      '.c-end-actions{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin-top:clamp(30px,6vh,52px);}',
      '.c-end-actions .sc-btn{font-size:16px;padding:13px 26px;}',
      '.c-end-actions a.sc-btn{text-decoration:none;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* 极淡 commit 图（自绘 SVG，两段拼接 → 无缝循环漂移，呼应封面） */
  function bgCommitSVG() {
    var seg = '';
    var n = 14, gap = 84, r = 9, y = 60;
    for (var i = 0; i < n; i++) {
      var x = 30 + i * gap;
      if (i < n - 1) {
        seg += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + gap) + '" y2="' + y + '" stroke="var(--c-main)" stroke-width="3"/>';
      }
      // 偶尔分叉一条淡支线 + 合回，增加"版本图"质感
      if (i % 4 === 1) {
        seg += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + gap) + '" y2="' + (y - 34) + '" stroke="var(--c-teal)" stroke-width="3"/>' +
               '<circle cx="' + (x + gap) + '" cy="' + (y - 34) + '" r="' + r + '" fill="var(--c-teal)"/>';
      }
      if (i % 5 === 3) {
        seg += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + gap) + '" y2="' + (y + 32) + '" stroke="var(--git)" stroke-width="3"/>' +
               '<circle cx="' + (x + gap) + '" cy="' + (y + 32) + '" r="' + r + '" fill="var(--git)"/>';
      }
    }
    for (var j = 0; j < n; j++) {
      seg += '<circle cx="' + (30 + j * gap) + '" cy="' + y + '" r="' + r + '" fill="var(--c-main)"/>';
    }
    var W = 30 + (n - 1) * gap + 60;
    return '<svg class="c-end-bg-track" width="' + (W * 2) + '" height="140" viewBox="0 0 ' + (W * 2) + ' 140" aria-hidden="true">' +
      '<g>' + seg + '</g>' +
      '<g transform="translate(' + W + ',0)">' + seg + '</g>' +
      '</svg>';
  }

  register({
    chapter: 10,
    chapterName: '结语',
    id: 'ending',
    title: '你已经会用 Git 了',
    subtitle: '记效果 · 说人话 · 交给 AI',
    play: true,
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<div class="c-end-wrap">' +
          '<div class="c-end-bg">' + bgCommitSVG() + '</div>' +
          '<div class="c-end-inner">' +
            '<div class="c-end-line lead" id="c-end-l0">你已经会用 Git 了。</div>' +
            '<div class="c-end-line body" id="c-end-l1">不是因为你背下了命令，</div>' +
            '<div class="c-end-line body" id="c-end-l2">而是因为你知道每个动作的『<span class="hl">效果</span>』，</div>' +
            '<div class="c-end-line body" id="c-end-l3">并且能用<span class="hl2">人话</span>把它说给 AI 听。</div>' +
            '<div class="c-end-actions" id="c-end-actions">' +
              '<button class="sc-btn" id="c-end-overview" data-action="overview" data-interactive="1">↩ 返回目录</button>' +
              '<a class="sc-btn primary" id="c-end-bridge" data-bridge="github" data-interactive="1" href="../github-tutorial.html">去 GitHub 章 →</a>' +
            '</div>' +
          '</div>' +
        '</div>';

      // 分行淡入（api.frag 注册为分步；后退/重放瞬时到位）
      // lead 第一行 render 即显示（不藏），其余三行 + 按钮组逐行淡入。
      api.frag(stage.querySelector('#c-end-l1'));
      api.frag(stage.querySelector('#c-end-l2'));
      api.frag(stage.querySelector('#c-end-l3'));
      api.frag(stage.querySelector('#c-end-actions'));

      // [返回目录]：优先调框架总览（__Deck.openOverview），兜底点 menu 按钮
      var ovBtn = stage.querySelector('#c-end-overview');
      ovBtn.addEventListener('click', function (e) {
        e.preventDefault();
        try {
          if (window.__Deck && typeof window.__Deck.openOverview === 'function') {
            window.__Deck.openOverview();
            return;
          }
        } catch (err) {}
        var mb = document.getElementById('menu-btn');
        if (mb) mb.click();
      });

      // [去 GitHub 章]：保留 href 兜底跳转；若框架日后挂了 bridge handler 则交给它。
      // 这里不 preventDefault —— <a href> 兜底直接跳到 ../github-tutorial.html。
    }
  });

})();
