/* ============================================================
 * 第 1 章 · 为什么需要 Git
 * 屏 1.1 word-hell    · Word 文档地狱（一个人手动管版本的痛）
 * 屏 1.2 ten-people   · 一个人还能背，十个人就崩了（协作滑块）
 * 屏 1.3 git-arrives  · Git 登场（乱麻收束成时间线 + 文件夹→repository）
 * 样式前缀: c-ch1-
 * 仅调用框架契约：window.registerScreen / api.step / api.frag / api.graph / api.onReset ...
 * ============================================================ */
(function () {
  'use strict';

  function injectStyle() {
    if (document.getElementById('c-ch1-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ch1-style';
    s.textContent = [
      /* ---------- 屏 1.1 Word 文档地狱 ---------- */
      '.c-ch1-desk{position:relative;min-height:46vh;border-radius:18px;padding:30px 24px;margin-top:14px;',
      'background:radial-gradient(120% 120% at 50% 0%,color-mix(in srgb,var(--text) 5%,transparent),transparent 70%);',
      'border:1px solid color-mix(in srgb,var(--text) 10%,transparent);overflow:visible;}',
      '.c-ch1-files{display:flex;flex-wrap:wrap;gap:26px 34px;justify-content:center;align-items:flex-start;transition:none;}',
      '.c-ch1-file{position:relative;width:96px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:8px;',
      'transition:transform .5s cubic-bezier(.34,1.56,.64,1),margin .5s ease;}',
      '.c-ch1-file:hover{transform:translateY(-6px);}',
      '.c-ch1-file-name{font-family:var(--font-mono);font-size:11px;color:var(--dim);text-align:center;line-height:1.35;word-break:break-all;max-width:96px;}',
      '.c-ch1-file:hover .c-ch1-file-name{color:var(--text);}',
      /* 气泡 */
      '.c-ch1-bubble{position:absolute;left:50%;top:-14px;transform:translateX(-50%) translateY(-100%) scale(.9);',
      'background:var(--warn,#E3A008);color:#1a1300;font-size:12px;font-weight:600;font-family:var(--font-sans);padding:7px 11px;border-radius:10px;white-space:nowrap;',
      'opacity:0;pointer-events:none;transition:opacity .18s ease,transform .18s ease;box-shadow:0 6px 18px rgba(0,0,0,.4);z-index:5;}',
      '.c-ch1-bubble::after{content:"";position:absolute;left:50%;top:100%;transform:translateX(-50%);border:6px solid transparent;border-top-color:var(--warn,#E3A008);}',
      '.c-ch1-file:hover .c-ch1-bubble{opacity:1;transform:translateX(-50%) translateY(-100%) scale(1);}',
      /* 混乱叠放态：文件互相错位、抖动 */
      '.c-ch1-files.c-ch1-chaos{position:relative;height:240px;display:block;}',
      /* 稳定基准位移用 margin-left/top（--cx/--cy）把文件甩到错位处，jitter 只叠加一点点抖动 */
      '.c-ch1-files.c-ch1-chaos .c-ch1-file{position:absolute;left:50%;top:50%;margin-left:var(--cx,0);margin-top:var(--cy,0);transform:translate(-50%,-50%) rotate(var(--cr,0deg));animation:c-ch1-jitter .42s ease-in-out infinite alternate;}',
      '@keyframes c-ch1-jitter{from{transform:translate(-50%,-50%) rotate(var(--cr,0deg));}to{transform:translate(calc(-50% + 3px),calc(-50% - 3px)) rotate(var(--cr,0deg));}}',
      '.c-ch1-desk-hint{text-align:center;margin-top:16px;font-size:13px;color:var(--dim);}',
      '.c-ch1-desk-hint b{color:var(--warn,#E3A008);}',

      /* ---------- 屏 1.2 十个人 ---------- */
      '.c-ch1-collab-q{font-size:clamp(19px,2.8vw,28px);font-weight:700;text-align:center;line-height:1.5;margin:6px auto 8px;max-width:720px;}',
      '.c-ch1-collab-q b{color:var(--c-pink,#F472B6);}',
      '.c-ch1-collab-stage{position:relative;width:100%;max-width:760px;margin:6px auto 0;}',
      '.c-ch1-collab-svg{width:100%;height:auto;display:block;}',
      '.c-ch1-slider-wrap{display:flex;align-items:center;gap:16px;max-width:520px;margin:18px auto 0;font-family:var(--font-mono);font-size:14px;color:var(--dim);}',
      '.c-ch1-slider-wrap input[type=range]{flex:1;accent-color:var(--c-pink,#F472B6);height:4px;cursor:pointer;}',
      '.c-ch1-count{min-width:118px;text-align:center;color:var(--text);}',
      '.c-ch1-count b{color:var(--c-pink,#F472B6);font-size:18px;}',
      '.c-ch1-collab-foot{text-align:center;margin-top:10px;font-size:13px;color:var(--dim);}',

      /* ---------- 屏 1.3 Git 登场 ---------- */
      '.c-ch1-arrive-graph{width:100%;min-height:150px;display:flex;align-items:center;justify-content:center;margin:8px 0 6px;}',
      '.c-ch1-foreshadow{text-align:center;font-size:14px;color:var(--dim);margin:2px auto 0;max-width:560px;}',
      '.c-ch1-foreshadow b{color:var(--git);font-weight:700;}',
      '.c-ch1-folder-row{display:flex;align-items:center;justify-content:center;gap:40px;flex-wrap:wrap;margin:18px 0 6px;}',
      '.c-ch1-folder{position:relative;display:flex;flex-direction:column;align-items:center;gap:12px;}',
      '.c-ch1-folder-halo{position:absolute;inset:-22px -26px -30px -26px;border-radius:50%;opacity:0;',
      'background:radial-gradient(circle,color-mix(in srgb,var(--git) 34%,transparent),transparent 68%);',
      'box-shadow:0 0 40px color-mix(in srgb,var(--git) 30%,transparent);transition:opacity .7s ease;pointer-events:none;}',
      '.c-ch1-folder.c-ch1-blessed .c-ch1-folder-halo{opacity:1;}',
      '.c-ch1-folder-label{font-family:var(--font-mono);font-size:15px;color:var(--dim);position:relative;height:1.4em;min-width:130px;text-align:center;}',
      '.c-ch1-folder-label .c-ch1-lbl{position:absolute;left:0;right:0;transition:opacity .5s ease,transform .5s ease;}',
      '.c-ch1-folder-label .c-ch1-lbl-old{opacity:1;transform:translateY(0);}',
      '.c-ch1-folder-label .c-ch1-lbl-new{opacity:0;transform:translateY(8px);color:var(--git);font-weight:700;}',
      '.c-ch1-folder.c-ch1-blessed .c-ch1-lbl-old{opacity:0;transform:translateY(-8px);}',
      '.c-ch1-folder.c-ch1-blessed .c-ch1-lbl-new{opacity:1;transform:translateY(0);}',
      '.c-ch1-def{max-width:680px;margin:18px auto 0;text-align:center;font-size:17px;line-height:1.8;color:var(--text);}',
      '.c-ch1-def b{color:var(--git);}',
      '.c-ch1-def .c-ch1-m{font-family:var(--font-mono);color:var(--c-teal);}'
    ].join('');
    document.head.appendChild(s);
  }

  /* Word 风格文档图标（蓝色，右上折角） */
  function docSVG() {
    return '<svg width="58" height="72" viewBox="0 0 58 72" aria-hidden="true">' +
      '<defs><linearGradient id="c-ch1-doc" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#3B82F6"/><stop offset="1" stop-color="#1D4ED8"/></linearGradient></defs>' +
      // 纸身（右上缺角）
      '<path d="M6 2 H38 L52 16 V66 a4 4 0 0 1-4 4 H10 a4 4 0 0 1-4-4 V6 a4 4 0 0 1 4-4 Z" fill="url(#c-ch1-doc)"/>' +
      // 折角
      '<path d="M38 2 L52 16 H42 a4 4 0 0 1-4-4 Z" fill="#93C5FD"/>' +
      // 大写 W（Word 暗示）
      '<text x="29" y="50" text-anchor="middle" font-family="var(--font-sans)" font-size="22" font-weight="800" fill="#fff">W</text>' +
      '</svg>';
  }

  function folderSVG(size) {
    var s = size || 92;
    return '<svg width="' + s + '" height="' + (s * 0.8) + '" viewBox="0 0 100 80" aria-hidden="true">' +
      '<defs><linearGradient id="c-ch1-fold" x1="0" y1="0" x2="0" y2="1">' +
        '<stop offset="0" stop-color="#F0B429"/><stop offset="1" stop-color="#DE911D"/></linearGradient></defs>' +
      '<path d="M6 18 a6 6 0 0 1 6-6 H38 l8 8 H88 a6 6 0 0 1 6 6 V68 a6 6 0 0 1-6 6 H12 a6 6 0 0 1-6-6 Z" fill="url(#c-ch1-fold)"/>' +
      '<path d="M6 26 H94 V32 H6 Z" fill="#fff" opacity="0.18"/>' +
      '</svg>';
  }

  /* ====================================================== */
  /* 屏 1.1 — Word 文档地狱                                 */
  /* ====================================================== */
  window.registerScreen({
    chapter: 1,
    chapterName: '为什么需要 Git',
    id: 'word-hell',
    title: 'Word 文档地狱',
    subtitle: '"最终版" 后面永远还有一个 "最终版(2)"',
    render: function (stage, api) {
      injectStyle();

      var files = [
        '推文v1.docx',
        '推文v2.docx',
        '推文v3.docx',
        '推文最终版.docx',
        '推文最终版(2).docx',
        '推文打死不改最终版.docx'
      ];
      // 每个文件在"混乱态"下的随机错位参数（固定，保证幂等：每次 render 用同样的偏移）
      var chaos = [
        { cx: -150, cy: -70, cr: -9 },
        { cx: -40, cy: -88, cr: 7 },
        { cx: 90, cy: -60, cr: -5 },
        { cx: -110, cy: 20, cr: 11 },
        { cx: 30, cy: 44, cr: -8 },
        { cx: 140, cy: 12, cr: 6 }
      ];

      var fileHTML = files.map(function (name, i) {
        return '<div class="c-ch1-file" data-i="' + i + '" style="--cx:' + chaos[i].cx + 'px;--cy:' + chaos[i].cy + 'px;--cr:' + chaos[i].cr + 'deg;margin:-36px;">' +
          '<span class="c-ch1-bubble">和上一版差在哪？🤷 不知道</span>' +
          docSVG() +
          '<span class="c-ch1-file-name">' + name + '</span>' +
        '</div>';
      }).join('');

      stage.innerHTML =
        '<h2 class="sc-h2">在没有 Git 的世界里…</h2>' +
        '<p class="sc-p sc-dim">你想给一篇推文存几个版本，于是桌面变成了这样 👇</p>' +
        '<div class="c-ch1-desk" id="c-ch1-desk">' +
          '<div class="c-ch1-files" id="c-ch1-files">' + fileHTML + '</div>' +
        '</div>' +
        '<p class="c-ch1-desk-hint" id="c-ch1-deskhint">' +
          '把鼠标放到任一文件上 → 看气泡；<b>点桌面空白处</b> → 看它们乱成一团。' +
        '</p>';

      var desk = stage.querySelector('#c-ch1-desk');
      var filesBox = stage.querySelector('#c-ch1-files');
      var hint = stage.querySelector('#c-ch1-deskhint');

      // 修正初始 margin（上面用 -36px 是为了把文件挤近一点显得凌乱）
      Array.prototype.forEach.call(filesBox.querySelectorAll('.c-ch1-file'), function (f) {
        f.style.margin = '';
      });

      var chaosOn = false;
      function toggleChaos(force) {
        chaosOn = (typeof force === 'boolean') ? force : !chaosOn;
        filesBox.classList.toggle('c-ch1-chaos', chaosOn);
        hint.innerHTML = chaosOn
          ? '一团乱麻 —— 这就是 <b>纯靠脑子背版本</b> 的下场。再点一下桌面收回去。'
          : '把鼠标放到任一文件上 → 看气泡；<b>点桌面空白处</b> → 看它们乱成一团。';
      }

      // 点桌面空白（不是点文件本身）→ 触发混乱叠放
      desk.addEventListener('click', function (e) {
        if (e.target.closest('.c-ch1-file')) return; // 点到文件不触发
        toggleChaos();
      });

      // 后退重放时保持初始整齐态
      api.onReset(function () { toggleChaos(false); });
    }
  });

  /* ====================================================== */
  /* 屏 1.2 — 一个人还能背，十个人就崩了                     */
  /* ====================================================== */
  window.registerScreen({
    chapter: 1,
    chapterName: '为什么需要 Git',
    id: 'ten-people',
    title: '一个人还能背，十个人就崩了',
    subtitle: '协作人数一上去，版本就糊成乱麻',
    render: function (stage, api) {
      injectStyle();

      var W = 760, H = 360;
      var CX = W / 2, CY = H * 0.62;       // 中央"文件堆"位置
      var PEOPLE_MAX = 10;

      stage.innerHTML =
        '<p class="c-ch1-collab-q">如果是 <b>十个人</b> 同时改一个有几十篇文章的文件夹呢？</p>' +
        '<div class="c-ch1-collab-stage">' +
          '<svg class="c-ch1-collab-svg" id="c-ch1-collab-svg" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
            '<g id="c-ch1-lines"></g>' +
            '<g id="c-ch1-people"></g>' +
            '<g id="c-ch1-hub"></g>' +
          '</svg>' +
        '</div>' +
        '<div class="c-ch1-slider-wrap">' +
          '<span>协作人数</span>' +
          '<span style="font-family:var(--font-mono)">1</span>' +
          '<input type="range" id="c-ch1-slider" min="1" max="' + PEOPLE_MAX + '" step="1" value="1" />' +
          '<span style="font-family:var(--font-mono)">10</span>' +
          '<span class="c-ch1-count" id="c-ch1-count"><b>1</b> 人</span>' +
        '</div>' +
        '<p class="c-ch1-collab-foot" id="c-ch1-foot">🎮 拖动滑块，看版本与连线怎么爆炸。</p>';

      var svg = stage.querySelector('#c-ch1-collab-svg');
      var linesG = stage.querySelector('#c-ch1-lines');
      var peopleG = stage.querySelector('#c-ch1-people');
      var hubG = stage.querySelector('#c-ch1-hub');
      var slider = stage.querySelector('#c-ch1-slider');
      var countEl = stage.querySelector('#c-ch1-count');
      var footEl = stage.querySelector('#c-ch1-foot');

      var SVGNS = 'http://www.w3.org/2000/svg';
      function mk(tag, attrs) {
        var e = document.createElementNS(SVGNS, tag);
        for (var k in attrs) e.setAttribute(k, attrs[k]);
        return e;
      }

      // 中央"文件堆" hub —— 几张叠放的文档色块
      (function drawHub() {
        for (var i = 0; i < 4; i++) {
          hubG.appendChild(mk('rect', {
            x: CX - 24 + i * 4, y: CY - 30 + i * 4, width: 48, height: 60, rx: 5,
            fill: i === 3 ? '#3B82F6' : '#1D4ED8', opacity: 0.92 - i * 0.12,
            stroke: 'rgba(255,255,255,0.25)', 'stroke-width': 1
          }));
        }
        var t = mk('text', { x: CX, y: CY + 56, 'text-anchor': 'middle', fill: 'var(--dim)', 'font-size': 12, 'font-family': 'var(--font-mono)' });
        t.textContent = '共享文件夹';
        hubG.appendChild(t);
      })();

      // 人物在中心上方半圆排开
      function personXY(idx, total) {
        if (total === 1) return { x: CX, y: 64 };
        var spread = Math.min(W - 120, 90 * total);
        var x = CX - spread / 2 + (spread) * (idx / (total - 1));
        var y = 54 + (idx % 2) * 30; // 交错两排，密集时更"挤"
        return { x: x, y: y };
      }

      // 一个人贡献的"版本数" = 随人数指数式增长（n 人 → 每人 n 个版本分支线）
      function render(n) {
        // 清空
        while (linesG.firstChild) linesG.removeChild(linesG.firstChild);
        while (peopleG.firstChild) peopleG.removeChild(peopleG.firstChild);

        var palette = ['#F472B6', '#2DD4BF', '#A78BFA', '#F0B429', '#4493F8', '#34D399', '#FB7185', '#C084FC', '#22D3EE', '#FBBF24'];

        // 连线：第 i 个人拉出 (i 越多每人线越多) 条线到中心 → 总线数 ~ n*n
        for (var i = 0; i < n; i++) {
          var p = personXY(i, n);
          var col = palette[i % palette.length];
          var linesPer = n; // 每人 n 条 → n 人时 n*n 条，指数式爆炸
          for (var j = 0; j < linesPer; j++) {
            // 让多条线轻微发散，糊成乱麻
            var jitterX = (j - linesPer / 2) * 7;
            var jitterY = (j % 3) * 5;
            var midX = (p.x + CX) / 2 + jitterX * 1.4;
            var midY = (p.y + CY) / 2 - 30 + jitterY;
            linesG.appendChild(mk('path', {
              d: 'M' + p.x + ' ' + (p.y + 16) + ' Q' + midX + ' ' + midY + ' ' + (CX + jitterX) + ' ' + (CY - 20),
              fill: 'none', stroke: col, 'stroke-width': 1.5,
              opacity: Math.max(0.12, 0.5 - n * 0.03)
            }));
          }
        }

        // 头像
        for (var k = 0; k < n; k++) {
          var pp = personXY(k, n);
          var c = palette[k % palette.length];
          var g = mk('g', {});
          g.appendChild(mk('circle', { cx: pp.x, cy: pp.y, r: 13, fill: c, opacity: 0.95 }));
          g.appendChild(mk('circle', { cx: pp.x, cy: pp.y - 4, r: 4.5, fill: '#fff' }));
          g.appendChild(mk('path', { d: 'M' + (pp.x - 7) + ' ' + (pp.y + 9) + ' a7 7 0 0 1 14 0 Z', fill: '#fff' }));
          peopleG.appendChild(g);
        }
      }

      function update(n, animatedFoot) {
        n = Math.max(1, Math.min(PEOPLE_MAX, n | 0));
        slider.value = n;
        countEl.innerHTML = '<b>' + n + '</b> 人';
        render(n);
        if (n >= 9) footEl.innerHTML = '😵 已经糊成一团 —— <b style="color:var(--c-pink,#F472B6)">人脑根本追不上了</b>。';
        else if (n >= 5) footEl.innerHTML = '🔀 连线开始交叉爆炸…再往上拖。';
        else footEl.innerHTML = '🎮 拖动滑块，看版本与连线怎么爆炸。';
      }

      slider.addEventListener('input', function () { update(parseInt(slider.value, 10)); });

      // 初始：1 人
      update(1);

      // R 重置 → 回到 1 人
      api.onReset(function () { update(1); });
    }
  });

  /* ====================================================== */
  /* 屏 1.3 — Git 登场                                      */
  /* ====================================================== */
  window.registerScreen({
    chapter: 1,
    chapterName: '为什么需要 Git',
    id: 'git-arrives',
    title: 'Git 登场',
    subtitle: '乱麻收束成一条干净的时间线',
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<div style="text-align:center;margin-bottom:6px;">' + gitLogo() + '</div>' +
        '<h2 class="sc-h2" style="text-align:center;">于是，<span style="color:var(--git)">Git</span> 登场</h2>' +
        '<div class="c-ch1-arrive-graph" id="c-ch1-graph"></div>' +
        '<p class="c-ch1-foreshadow" id="c-ch1-foreshadow">那一团乱麻，被收束成一排整齐的小圆点。<b>每个点是什么？下一章揭晓 →</b></p>' +
        '<div class="c-ch1-folder-row">' +
          '<div class="c-ch1-folder" id="c-ch1-folder">' +
            '<span class="c-ch1-folder-halo"></span>' +
            folderSVG(96) +
            '<span class="c-ch1-folder-label">' +
              '<span class="c-ch1-lbl c-ch1-lbl-old">文件夹</span>' +
              '<span class="c-ch1-lbl c-ch1-lbl-new">repository</span>' +
            '</span>' +
          '</div>' +
        '</div>' +
        '<p class="c-ch1-def" id="c-ch1-def">' +
          '<b>Git</b> ＝ 世界上最多人用的<b>版本控制系统</b>；<br>' +
          '被 Git 管起来的文件夹 ＝ 一个<b>仓库</b> <span class="c-ch1-m">(repository)</span>。' +
        '</p>';

      // 用框架 CommitGraph 画"收束后的干净线性时间线"
      var graphHost = stage.querySelector('#c-ch1-graph');
      var folder = stage.querySelector('#c-ch1-folder');
      var def = stage.querySelector('#c-ch1-def');

      var g = api.graph(graphHost, {});
      // 初始（第 0 步）：先呈现一条"还在收束中"的稀疏状态。
      // ⚠ 知识锁：第 1 章还没讲 commit / 分支 / HEAD，这里只用 bare 裸线模式
      //   画一排朴素圆点作"视觉伏笔"——不出现分支标签，也不出现 HEAD 旗。
      // 真正的"乱麻→直线"由 step 推进时补全节点，达到视觉上的归位对齐。
      g.init('main', ['A', 'B'], { bare: true });

      // 定义句与文件夹标签初始为"未点亮"
      var defFrag = api.frag(def);

      // ---------- 分步 ----------
      // step 1：乱麻 → 直线收束（补齐节点，整齐对齐成一排 ●）
      api.step(function (animated) {
        // 幂等：无论 animated 与否，最终都是同一条整齐裸线 A B C D E
        // 仍用 bare 模式：只是一排朴素圆点，没有分支标签 / HEAD 旗（那些下一章才讲）。
        g.reset();
        g.init('main', ['A', 'B', 'C', 'D', 'E'], { bare: true });
        // animated=true 时引擎自带的 init 动画即视为"归位对齐"；
        // 这里不依赖额外计时器，保证后退重放也得到同样的最终态。
      });

      // step 2：文件夹被光环包住、标签 文件夹 → repository
      api.step(function (animated) {
        folder.classList.add('c-ch1-blessed');
      });

      // step 3：定义句淀入（defFrag 已由 api.frag 注册）—— 由框架推进显示

      // R 重置：收回光环、标签复位、时间线回到雏形
      api.onReset(function () {
        folder.classList.remove('c-ch1-blessed');
        g.reset();
        g.init('main', ['A', 'B'], { bare: true });
      });
    }
  });

  /* git 官方风格三点橙色 logo（纯 SVG，#F05133） */
  function gitLogo() {
    return '<svg width="96" height="96" viewBox="0 0 120 120" aria-hidden="true">' +
      '<g stroke="var(--git)" stroke-width="6" stroke-linecap="round">' +
        '<line x1="60" y1="98" x2="60" y2="40"/>' +
        '<line x1="60" y1="58" x2="92" y2="30"/>' +
      '</g>' +
      '<g fill="var(--git)">' +
        '<circle cx="60" cy="98" r="11"/>' +
        '<circle cx="60" cy="40" r="11"/>' +
        '<circle cx="92" cy="30" r="11"/>' +
      '</g></svg>';
  }

})();
