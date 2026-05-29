/* ============================================================
 * 第 0 章 · 封面 + 总纲
 * 屏 0.1 cover    · 封面
 * 屏 0.2 legend   · 这门课怎么上（主题词 + 视觉图例 + 三层卡示意）
 * 样式前缀: c-ch0-
 * 仅调用框架契约：window.registerScreen / api.step / api.frag / api.aiCard ...
 * ============================================================ */
(function () {
  'use strict';

  /* 一次性注入本章作用域样式（多屏共用；重复进入屏不会重复注入） */
  function injectStyle() {
    if (document.getElementById('c-ch0-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ch0-style';
    s.textContent = [
      /* ---------- 屏 0.1 封面 ---------- */
      '.c-ch0-cover{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:62vh;overflow:hidden;}',
      /* 背景极淡的 commit 图，自左向右缓慢漂移 */
      '.c-ch0-bg{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0.16;overflow:hidden;}',
      '.c-ch0-bg-track{position:absolute;top:50%;left:0;transform:translateY(-50%);will-change:transform;animation:c-ch0-drift 38s linear infinite;}',
      '@keyframes c-ch0-drift{from{transform:translate(0,-50%);}to{transform:translate(-50%,-50%);}}',
      '.c-ch0-cover-inner{position:relative;z-index:1;}',
      '.c-ch0-title{font-family:var(--font-sans);font-size:clamp(34px,7vw,76px);font-weight:800;letter-spacing:-0.03em;line-height:1.08;margin:0 0 18px;',
      'background:linear-gradient(120deg,var(--text) 0%,var(--c-teal) 55%,var(--git) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;',
      'opacity:0;animation:c-ch0-rise .9s .05s cubic-bezier(.2,.8,.2,1) forwards;}',
      '.c-ch0-title .c-ch0-mono{font-family:var(--font-mono);}',
      '.c-ch0-sub{font-size:clamp(15px,2.4vw,21px);color:var(--dim);letter-spacing:0.04em;margin:0 0 40px;opacity:0;animation:c-ch0-rise .9s .28s cubic-bezier(.2,.8,.2,1) forwards;}',
      '.c-ch0-start{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:15px;color:var(--text);padding:11px 22px;border-radius:999px;',
      'background:color-mix(in srgb,var(--git) 14%,transparent);border:1px solid color-mix(in srgb,var(--git) 45%,transparent);opacity:0;animation:c-ch0-rise .9s .52s cubic-bezier(.2,.8,.2,1) forwards,c-ch0-pulse 2.4s 1.4s ease-in-out infinite;}',
      '.c-ch0-start .c-ch0-key{display:inline-block;min-width:60px;text-align:center;padding:2px 8px;border-radius:6px;background:color-mix(in srgb,var(--text) 8%,transparent);border:1px solid color-mix(in srgb,var(--text) 18%,transparent);}',
      '@keyframes c-ch0-rise{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}',
      '@keyframes c-ch0-pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--git) 30%,transparent);}50%{box-shadow:0 0 0 9px color-mix(in srgb,var(--git) 0%,transparent);}}',

      /* ---------- 屏 0.2 总纲 ---------- */
      '.c-ch0-legend-wrap{display:grid;grid-template-columns:1.15fr 1fr;gap:34px;align-items:start;}',
      '@media (max-width:760px){.c-ch0-legend-wrap{grid-template-columns:1fr;gap:26px;}}',
      '.c-ch0-motto{font-family:var(--font-sans);font-size:clamp(24px,3.6vw,40px);font-weight:800;line-height:1.32;letter-spacing:-0.01em;margin:6px 0 22px;min-height:4.6em;}',
      '.c-ch0-motto .c-ch0-hl{color:var(--c-teal);}',
      '.c-ch0-motto .c-ch0-hl2{color:var(--git);}',
      '.c-ch0-caret{display:inline-block;width:0.55ch;background:var(--c-teal);color:transparent;animation:c-ch0-blink 1s steps(1) infinite;margin-left:1px;border-radius:1px;}',
      '@keyframes c-ch0-blink{0%,49%{opacity:1;}50%,100%{opacity:0;}}',
      '.c-ch0-legend-card{background:color-mix(in srgb,var(--text) 4%,transparent);border:1px solid color-mix(in srgb,var(--text) 12%,transparent);border-radius:16px;padding:22px 22px 18px;}',
      '.c-ch0-legend-card h3{margin:0 0 16px;font-size:13px;font-family:var(--font-mono);letter-spacing:0.14em;text-transform:uppercase;color:var(--dim);}',
      '.c-ch0-legend-row{display:flex;align-items:center;gap:14px;padding:11px 0;border-top:1px dashed color-mix(in srgb,var(--text) 12%,transparent);}',
      '.c-ch0-legend-row:first-of-type{border-top:none;}',
      '.c-ch0-legend-sym{flex:0 0 64px;display:flex;align-items:center;justify-content:center;height:34px;font-size:22px;}',
      '.c-ch0-legend-txt{font-size:15px;line-height:1.5;color:var(--text);}',
      '.c-ch0-legend-txt b{color:var(--c-teal);}',
      '.c-ch0-legend-txt .c-ch0-m{font-family:var(--font-mono);color:var(--dim);font-size:13px;}',
      '.c-ch0-demo-hint{margin:18px 0 8px;font-size:13px;color:var(--dim);text-align:center;}',
      '.c-ch0-demo-hint b{color:var(--git);}',
      /* 图例符号的小 SVG */
      '.c-ch0-sym-commit{width:18px;height:18px;border-radius:50%;background:var(--c-main);box-shadow:0 0 10px color-mix(in srgb,var(--c-main) 70%,transparent);}',
      '.c-ch0-sym-branch{width:46px;height:4px;border-radius:3px;background:var(--c-teal);box-shadow:0 0 10px color-mix(in srgb,var(--c-teal) 60%,transparent);}',
      '.c-ch0-sym-head{font-size:20px;}',
      '.c-ch0-sym-astro{font-size:22px;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* 背景漂移用的极淡 commit 图（自绘 SVG，两段拼接以便无缝循环漂移） */
  function bgCommitSVG() {
    var seg = '';
    var n = 14, gap = 84, r = 9, y = 60;
    for (var i = 0; i < n; i++) {
      var x = 30 + i * gap;
      if (i < n - 1) {
        seg += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + gap) + '" y2="' + y + '" stroke="var(--c-main)" stroke-width="3"/>';
      }
      // 偶尔分叉一条淡淡的支线，增加"版本图"质感
      if (i % 4 === 2) {
        seg += '<line x1="' + x + '" y1="' + y + '" x2="' + (x + gap) + '" y2="' + (y - 34) + '" stroke="var(--c-teal)" stroke-width="3"/>' +
               '<circle cx="' + (x + gap) + '" cy="' + (y - 34) + '" r="' + r + '" fill="var(--c-teal)"/>';
      }
    }
    for (var j = 0; j < n; j++) {
      seg += '<circle cx="' + (30 + j * gap) + '" cy="' + y + '" r="' + r + '" fill="var(--c-main)"/>';
    }
    var W = 30 + (n - 1) * gap + 60;
    // 两份并排 → track 宽度 2W，动画位移 -50% 正好滚过一份，无缝
    return '<svg class="c-ch0-bg-track" width="' + (W * 2) + '" height="120" viewBox="0 0 ' + (W * 2) + ' 120" aria-hidden="true">' +
      '<g>' + seg + '</g>' +
      '<g transform="translate(' + W + ',0)">' + seg + '</g>' +
      '</svg>';
  }

  /* git 官方风格三点橙色 logo（纯 SVG，#F05133） */
  function gitLogoSVG(size) {
    var s = size || 110;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 120 120" aria-hidden="true">' +
      '<g stroke="var(--git)" stroke-width="6" stroke-linecap="round" fill="var(--git)">' +
        '<line x1="60" y1="96" x2="60" y2="40"/>' +
        '<line x1="60" y1="58" x2="92" y2="30"/>' +
        '<circle cx="60" cy="96" r="11" stroke="none"/>' +
        '<circle cx="60" cy="40" r="11" stroke="none"/>' +
        '<circle cx="92" cy="30" r="11" stroke="none"/>' +
      '</g></svg>';
  }

  /* ====================================================== */
  /* 屏 0.1 — 封面                                          */
  /* ====================================================== */
  window.registerScreen({
    chapter: 0,
    chapterName: '封面 + 总纲',
    id: 'cover',
    title: 'Git，但是给 Vibe Coder',
    subtitle: '你不背命令，你理解效果',
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch0-cover">' +
          '<div class="c-ch0-bg">' + bgCommitSVG() + '</div>' +
          '<div class="c-ch0-cover-inner">' +
            '<h1 class="c-ch0-title">Git，<br>但是给 <span class="c-ch0-mono">Vibe&nbsp;Coder</span></h1>' +
            '<p class="c-ch0-sub">—— 你不背命令，你理解效果 ——</p>' +
            '<span class="c-ch0-start">〔 按 <span class="c-ch0-key">空格</span> 开始 ▶ 〕</span>' +
          '</div>' +
        '</div>';
      // 封面无分步。背景漂移由纯 CSS 动画驱动（幂等：每次进入重建 DOM，动画自动重跑）。
    }
  });

  /* ====================================================== */
  /* 屏 0.2 — 这门课怎么上（主题词 + 视觉图例 + 三层卡）       */
  /* ====================================================== */
  window.registerScreen({
    chapter: 0,
    chapterName: '封面 + 总纲',
    id: 'legend',
    title: '这门课怎么上',
    subtitle: '记住效果，把命令交给 AI',
    render: function (stage, api) {
      injectStyle();

      // 主题词文本（分段染色：teal 段 / git 段 / 普通段）
      var mottoParts = [
        { t: '你不背命令，你只理解', cls: '' },
        { t: '效果', cls: 'c-ch0-hl' },
        { t: '，然后用人话告诉 ', cls: '' },
        { t: 'AI', cls: 'c-ch0-hl2' },
        { t: '。', cls: '' }
      ];
      var fullLen = mottoParts.reduce(function (a, p) { return a + p.t.length; }, 0);

      stage.innerHTML =
        '<h2 class="sc-h2">这门课怎么上？</h2>' +
        '<div class="c-ch0-legend-wrap">' +
          '<div>' +
            '<div class="c-ch0-motto" id="c-ch0-motto"></div>' +
          '</div>' +
          '<div class="c-ch0-legend-card">' +
            '<h3>视觉图例 · 全站符号</h3>' +
            '<div class="c-ch0-legend-row" id="c-ch0-lg-0">' +
              '<div class="c-ch0-legend-sym"><span class="c-ch0-sym-commit"></span></div>' +
              '<div class="c-ch0-legend-txt"><b>● = 一次提交</b> <span class="c-ch0-m">commit</span><br>你按一次"存档键"，就多一个圆点。</div>' +
            '</div>' +
            '<div class="c-ch0-legend-row" id="c-ch0-lg-1">' +
              '<div class="c-ch0-legend-sym"><span class="c-ch0-sym-branch"></span></div>' +
              '<div class="c-ch0-legend-txt"><b>─── = 一条分支</b> <span class="c-ch0-m">branch</span><br>一条独立的时间线，可以平行往前走。</div>' +
            '</div>' +
            '<div class="c-ch0-legend-row" id="c-ch0-lg-2">' +
              '<div class="c-ch0-legend-sym"><span class="c-ch0-sym-head">🚩</span></div>' +
              '<div class="c-ch0-legend-txt"><b>🚩 HEAD = 你现在站在哪</b><br>这面小旗指着你当前所处的那个点。</div>' +
            '</div>' +
            '<div class="c-ch0-legend-row" id="c-ch0-lg-3">' +
              '<div class="c-ch0-legend-sym"><span class="c-ch0-sym-astro">👨‍🚀</span></div>' +
              '<div class="c-ch0-legend-txt"><b>👨‍🚀 = 孤儿 commit</b><br>没人牵着、飘走了的提交，最后会被回收。</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<p class="c-ch0-demo-hint" id="c-ch0-demohint">' +
          '后面每个操作都长这样 👇 <b>效果 → 对 AI 说的话 →（折叠的）真命令</b>。点一下卡片底部，展开看真命令。' +
        '</p>' +
        '<div id="c-ch0-aicard-host" style="max-width:560px;margin:0 auto;"></div>';

      var mottoEl = stage.querySelector('#c-ch0-motto');

      // —— 把主题词渲染到指定字符数（打字机 / 一次性）——
      function renderMotto(count, withCaret) {
        var html = '', left = count;
        for (var i = 0; i < mottoParts.length; i++) {
          var p = mottoParts[i];
          if (left <= 0) break;
          var take = Math.min(left, p.t.length);
          var chunk = p.t.slice(0, take);
          html += p.cls ? '<span class="' + p.cls + '">' + chunk + '</span>' : chunk;
          left -= take;
        }
        if (withCaret) html += '<span class="c-ch0-caret">|</span>';
        mottoEl.innerHTML = html;
      }

      // 初始（第 0 步）：主题词留空，等第一步推进
      renderMotto(0, false);

      // 三层 AI 卡：示意"效果 / 🤖对AI说 / 折叠真命令"
      var demoCard = api.aiCard({
        effect: '把项目回退到某个版本',
        say: '帮我回退到 a1b2c3d',
        cmd: 'git reset --hard a1b2c3d'
      });
      var aiHost = stage.querySelector('#c-ch0-aicard-host');
      aiHost.appendChild(demoCard);

      // ---------- 分步 ----------
      // step 1：主题词打字机出现
      var typingTimer = null;
      api.step(function (animated) {
        if (typingTimer) { clearInterval(typingTimer); typingTimer = null; }
        if (!animated) { renderMotto(fullLen, false); return; } // 后退重放：直接全显，不播动画
        var n = 0;
        typingTimer = setInterval(function () {
          n++;
          renderMotto(n, n < fullLen);
          if (n >= fullLen) {
            clearInterval(typingTimer); typingTimer = null;
            renderMotto(fullLen, false);
          }
        }, 55);
      });

      // step 2~5：四个图例符号依次淡入（api.frag 隐藏并注册淡入）
      api.frag(stage.querySelector('#c-ch0-lg-0'));
      api.frag(stage.querySelector('#c-ch0-lg-1'));
      api.frag(stage.querySelector('#c-ch0-lg-2'));
      api.frag(stage.querySelector('#c-ch0-lg-3'));

      // step 6：示意卡 + 提示出现，并轻轻提示"点开真命令"
      api.frag(stage.querySelector('#c-ch0-demohint'));
      api.frag(aiHost);
    }
  });

})();
