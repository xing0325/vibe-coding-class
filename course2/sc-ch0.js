/* ============================================================
 * 第 0 章 · 开场  (chapter:0, chapterName:'开场')
 *   屏 0.1 cover        · 封面（深空终端：漂浮圆点 + 连线粒子 + 鼠标视差 + 极淡裸节点漂移）
 *   屏 0.2 chapter-map  · 章节地图（横向圆点链，v2 新顺序；兼 Esc 总览页）
 *
 * 样式前缀: c-ch0-
 * 仅调用框架契约：window.registerScreen / api.step / api.frag / api.graph / api.isReplay
 *
 * v2 分镜要点：
 *   - 封面定调；除文楷副标题外不出现任何 git 术语。
 *   - 章节地图用「新顺序」：后悔药(4) 排在 分支(5) 之前。
 *     1 为什么需要 Git → 2 Commit → 3 本地/远端 → 4 三颗后悔药 → 5 分支
 *     → 6 指针与 HEAD → 7 回到后悔药·原理 → 8 git diff → 9 多人协作 → 10 worktree → 结尾
 *   - 这里的「显示顺序/章号」是 v2 叙事顺序，与底层已注册脚本的真实 chapter 号不同。
 *     每个节点带 targetChapter = 真实已注册的 chapter 号，点击时遍历
 *     window.__Deck.screens 找到第一个 s.chapter===targetChapter 跳过去。
 *     找不到 __Deck 就兜底：高亮该节点 + 轻提示。
 *   - 节点只显示「章号 + 章名」，不剧透概念（不写"分支""HEAD"之类解释）。
 *
 * 幂等：每次进入(含后退/resize) fresh 调 render；漂移/视差为纯 CSS 动画 + 一次性监听，
 *       重建 DOM 时旧监听随节点销毁，不泄漏。
 * ============================================================ */
(function () {
  'use strict';

  function register(def) {
    if (typeof window.registerScreen === 'function') { window.registerScreen(def); }
    else { (window.__pendingScreens = window.__pendingScreens || []).push(def); }
  }

  /* ---------- 章节地图数据（v2 叙事顺序）----------
     n      : 地图上显示的章号（叙事顺序，1..10）
     name   : 显示的章名（不剧透概念）
     blurb  : 悬停弹出的一句话简介（简短、不剧透概念）
     target : 真实已注册的 chapter 号（用于跳转；可能与 n 不同）
     accent : 节点配色（teal/git/purple/amber/main），点缀用
     最后追加一个「结尾」终点节点。 */
  var MAP = [
    { n: 1,  name: '为什么需要 Git',  blurb: '没有它的那些深夜，到底有多痛。',       target: 1,  accent: 'main'   },
    { n: 2,  name: 'Commit',          blurb: '把"现在这一刻"稳稳地存下来。',         target: 2,  accent: 'teal'   },
    { n: 3,  name: '本地 / 远端',      blurb: '你电脑里的，和云上那份，是怎么对上的。', target: 3,  accent: 'teal'   },
    { n: 4,  name: '三颗后悔药',       blurb: '手滑了？先学怎么把日子倒回去。',       target: 4,  accent: 'git'    },
    { n: 5,  name: '分支',            blurb: '同一个项目，开几条平行的路一起走。',     target: 5,  accent: 'git'    },
    { n: 6,  name: '指针与 HEAD',      blurb: '搞清楚"你现在到底站在哪一格"。',       target: 6,  accent: 'purple' },
    { n: 7,  name: '后悔药·原理',      blurb: '回头看：那三颗药为什么真的灵。',       target: 7,  accent: 'amber'  },
    { n: 8,  name: 'git diff',        blurb: '一眼看出这次到底改了哪几行。',         target: 8,  accent: 'teal'   },
    { n: 9,  name: '多人协作',         blurb: '一群人改同一个项目，怎么不打架。',     target: 9,  accent: 'git'    },
    { n: 10, name: 'worktree',        blurb: '同时摊开好几个工作台，互不干扰。',     target: 10, accent: 'purple' },
    { n: '✓', name: '结尾',           blurb: '收个尾，看看你都拿下了什么。',         target: 11, accent: 'main', end: true }
  ];

  var ACCENT_VAR = {
    main:   'var(--c-main)',
    teal:   'var(--c-teal)',
    git:    'var(--git)',
    purple: 'var(--c-purple)',
    amber:  'var(--c-amber)'
  };

  /* ====================================================== */
  /* 样式（两屏共用，仅注入一次）                            */
  /* ====================================================== */
  function injectStyle() {
    if (document.getElementById('c-ch0-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ch0-style';
    s.textContent = [
      /* ============ 屏 0.1 封面 ============ */
      '.c-ch0-cover{position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:70vh;width:100%;overflow:hidden;}',

      /* 漂浮圆点 + 连线粒子层（SVG，CSS 缓慢漂移；鼠标视差作用于此容器） */
      '.c-ch0-particles{position:absolute;inset:-8%;z-index:0;pointer-events:none;will-change:transform;transition:transform .6s cubic-bezier(.2,.8,.2,1);}',
      '.c-ch0-particles svg{width:100%;height:100%;display:block;}',
      '.c-ch0-pdrift{animation:c-ch0-pdrift 64s linear infinite;transform-origin:center;}',
      '@keyframes c-ch0-pdrift{from{transform:translateX(0);}to{transform:translateX(-260px);}}',
      '.c-ch0-pdot{fill:var(--c-teal);}',
      '.c-ch0-pdot.git{fill:var(--git);}',
      '.c-ch0-pline{stroke:var(--text);fill:none;stroke-width:1;}',
      '.c-ch0-pfloat{animation:c-ch0-float 7s ease-in-out infinite;transform-origin:center;}',
      '@keyframes c-ch0-float{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}',

      /* 极淡裸节点漂移（api.graph bare 模式，呼应主视觉 commit 图） */
      '.c-ch0-barebg{position:absolute;left:0;right:0;top:50%;z-index:0;pointer-events:none;opacity:0.12;',
      'transform:translateY(-50%);-webkit-mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent);mask-image:linear-gradient(90deg,transparent,#000 18%,#000 82%,transparent);}',
      '.c-ch0-baretrack{animation:c-ch0-bdrift 50s linear infinite;will-change:transform;}',
      '@keyframes c-ch0-bdrift{from{transform:translateX(0);}to{transform:translateX(-46px);}}',
      '.c-ch0-barebg .cg-wrap{width:200%;}',

      '.c-ch0-cover-inner{position:relative;z-index:2;display:flex;flex-direction:column;align-items:center;}',
      '.c-ch0-title{font-family:var(--font-sans);font-size:clamp(30px,6.4vw,72px);font-weight:800;letter-spacing:-0.03em;line-height:1.1;margin:0 0 22px;max-width:18ch;',
      'background:linear-gradient(118deg,var(--text) 0%,var(--c-teal) 52%,var(--git) 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;',
      'opacity:0;animation:c-ch0-rise .9s .06s cubic-bezier(.2,.8,.2,1) forwards;}',
      '.c-ch0-title .c-ch0-amp{font-family:var(--font-mono);font-weight:600;color:var(--git);-webkit-text-fill-color:var(--git);padding:0 .06em;}',
      '.c-ch0-sub{margin:0 0 44px;max-width:24ch;opacity:0;animation:c-ch0-rise .9s .30s cubic-bezier(.2,.8,.2,1) forwards;}',
      '.c-ch0-sub.sc-quote{color:var(--text);}',
      '.c-ch0-sub .accent{color:var(--git);}',
      '.c-ch0-start{display:inline-flex;align-items:center;gap:10px;font-family:var(--font-mono);font-size:15px;color:var(--text);padding:11px 22px;border-radius:999px;',
      'background:color-mix(in srgb,var(--git) 13%,transparent);border:1px solid color-mix(in srgb,var(--git) 45%,transparent);',
      'opacity:0;animation:c-ch0-rise .9s .54s cubic-bezier(.2,.8,.2,1) forwards,c-ch0-pulse 2.6s 1.5s ease-in-out infinite;}',
      '.c-ch0-start .key{display:inline-block;min-width:54px;text-align:center;padding:2px 9px;border-radius:6px;background:color-mix(in srgb,var(--text) 8%,transparent);border:1px solid color-mix(in srgb,var(--text) 18%,transparent);}',
      '@keyframes c-ch0-rise{from{opacity:0;transform:translateY(22px);}to{opacity:1;transform:translateY(0);}}',
      '@keyframes c-ch0-pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--git) 30%,transparent);}50%{box-shadow:0 0 0 9px color-mix(in srgb,var(--git) 0%,transparent);}}',

      /* ============ 屏 0.2 章节地图 ============ */
      '.c-ch0-map{width:100%;max-width:1080px;margin:0 auto;display:flex;flex-direction:column;align-items:center;}',
      '.c-ch0-map-head{text-align:center;margin-bottom:6px;}',
      '.c-ch0-map-sub{color:var(--dim);font-size:14px;margin-top:6px;}',
      '.c-ch0-map-sub .k{font-family:var(--font-mono);color:var(--text);background:color-mix(in srgb,var(--text) 8%,transparent);border:1px solid var(--border);border-radius:5px;padding:1px 7px;}',

      /* 横向圆点链：可横向滚动；中央一条连线，节点骑在线上 */
      '.c-ch0-chain-scroll{width:100%;overflow-x:auto;overflow-y:visible;padding:78px 8px 70px;-webkit-overflow-scrolling:touch;}',
      '.c-ch0-chain{position:relative;display:flex;align-items:center;gap:0;min-width:max-content;margin:0 auto;padding:0 24px;}',
      /* 连线段（节点之间的横线） */
      '.c-ch0-link{flex:0 0 38px;height:3px;border-radius:3px;background:color-mix(in srgb,var(--text) 18%,transparent);position:relative;}',
      '.c-ch0-link::after{content:"";position:absolute;inset:0;border-radius:3px;background:var(--git);transform:scaleX(0);transform-origin:left;transition:transform .4s var(--ease);}',
      '.c-ch0-link.done::after{transform:scaleX(1);}',

      /* 单个节点（按钮，可点击/可聚焦） */
      '.c-ch0-node{position:relative;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;',
      'background:none;border:none;cursor:pointer;padding:0;font-family:inherit;color:inherit;outline:none;}',
      '.c-ch0-dot{width:42px;height:42px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
      'font-family:var(--font-mono);font-size:15px;font-weight:800;color:var(--bg);',
      'background:var(--c-main);border:2px solid #010409;box-shadow:0 0 0 0 transparent;',
      'transition:transform .25s var(--ease),box-shadow .25s var(--ease),background .25s,opacity .25s;}',
      '.c-ch0-node .c-ch0-name{margin-top:12px;font-size:13px;font-weight:600;color:var(--dim);white-space:nowrap;letter-spacing:.01em;transition:color .25s,transform .25s var(--ease);max-width:9ch;text-align:center;line-height:1.2;}',
      /* end 节点（结尾）做成对勾收束样式 */
      '.c-ch0-node.is-end .c-ch0-dot{font-size:18px;}',

      /* 悬停 / 聚焦：放大 + 发光 + 名字变亮 */
      '.c-ch0-node:hover .c-ch0-dot,.c-ch0-node:focus-visible .c-ch0-dot{transform:scale(1.34);box-shadow:0 0 0 5px color-mix(in srgb,var(--git) 22%,transparent),0 0 18px color-mix(in srgb,var(--git) 55%,transparent);}',
      '.c-ch0-node:hover .c-ch0-name,.c-ch0-node:focus-visible .c-ch0-name{color:var(--text);transform:translateY(2px);}',

      /* 当前进度高亮（从某章按 Esc 进来时） */
      '.c-ch0-node.is-current .c-ch0-dot{box-shadow:0 0 0 4px var(--git),0 0 20px color-mix(in srgb,var(--git) 70%,transparent);}',
      '.c-ch0-node.is-current .c-ch0-name{color:var(--git);font-weight:800;}',

      /* 悬停气泡：一句话简介（不剧透概念） */
      '.c-ch0-tip{position:absolute;bottom:calc(100% + 16px);left:50%;transform:translate(-50%,8px);',
      'min-width:9.5em;max-width:15em;white-space:normal;text-align:center;',
      'background:var(--pane2);border:1px solid var(--border);border-radius:11px;padding:9px 13px;',
      'font-family:var(--font-quote);font-size:14px;line-height:1.5;color:var(--text);',
      'opacity:0;pointer-events:none;transition:opacity .2s var(--ease),transform .2s var(--ease);',
      'box-shadow:0 8px 24px rgba(0,0,0,.45);z-index:5;}',
      '.c-ch0-tip::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);',
      'border:7px solid transparent;border-top-color:var(--pane2);}',
      '.c-ch0-node:hover .c-ch0-tip,.c-ch0-node:focus-visible .c-ch0-tip{opacity:1;transform:translate(-50%,0);}',

      /* 兜底提示（找不到 __Deck 时） */
      '.c-ch0-map-note{margin-top:30px;min-height:1.4em;font-size:13px;color:var(--dim);text-align:center;transition:color .25s;}',
      '.c-ch0-map-note.show{color:var(--c-teal);}',

      /* 滚动条收一点 */
      '.c-ch0-chain-scroll::-webkit-scrollbar{height:8px;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ============================================================
     封面：漂浮圆点 + 连线粒子 SVG（确定性布局，不随机抖动）
     两份并排，整组 c-ch0-pdrift 漂移 -260px = 一份宽度 → 无缝循环
     ============================================================ */
  function particlesSVG() {
    // 确定性伪随机（LCG），保证每次渲染布局一致、可循环
    var seed = 0x2f50f1;
    function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }

    var VW = 260, VH = 360;            // 一份的宽/高（用户坐标）
    var pts = [];
    var cols = 5, rows = 6;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var jx = (rnd() - 0.5) * 34;
        var jy = (rnd() - 0.5) * 34;
        pts.push({
          x: 18 + c * (VW / cols) + jx,
          y: 20 + r * (VH / rows) + jy,
          rad: rnd() * 1.6 + 1.1,
          git: rnd() < 0.18,             // 少量 git 橙点缀
          delay: (rnd() * 6).toFixed(2),
          dur: (6 + rnd() * 4).toFixed(2)
        });
      }
    }

    function seg(offsetX) {
      var out = '';
      // 连线：每个点连向「右侧最近的一个点」，形成稀疏粒子网
      for (var i = 0; i < pts.length; i++) {
        var a = pts[i], best = null, bd = 1e9;
        for (var j = 0; j < pts.length; j++) {
          if (j === i) continue;
          var b = pts[j];
          if (b.x <= a.x) continue;        // 只往右连，避免重复
          var d = (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
          if (d < bd && d < 95 * 95) { bd = d; best = b; }
        }
        if (best) {
          out += '<line class="c-ch0-pline" x1="' + (a.x + offsetX).toFixed(1) + '" y1="' + a.y.toFixed(1) +
                 '" x2="' + (best.x + offsetX).toFixed(1) + '" y2="' + best.y.toFixed(1) +
                 '" opacity="' + (0.05 + (1 - bd / (95 * 95)) * 0.12).toFixed(3) + '"/>';
        }
      }
      // 点（每个套一层缓慢上下浮动的 g）
      for (var k = 0; k < pts.length; k++) {
        var p = pts[k];
        out += '<g class="c-ch0-pfloat" style="animation-delay:' + p.delay + 's;animation-duration:' + p.dur + 's;">' +
                 '<circle class="c-ch0-pdot' + (p.git ? ' git' : '') + '" cx="' + (p.x + offsetX).toFixed(1) +
                 '" cy="' + p.y.toFixed(1) + '" r="' + p.rad.toFixed(2) +
                 '" opacity="' + (0.35 + rnd() * 0.4).toFixed(2) + '"/></g>';
      }
      return out;
    }

    var inner = seg(0) + seg(VW);        // 两份并排
    return '<svg viewBox="0 0 ' + (VW * 2) + ' ' + VH + '" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
             '<g class="c-ch0-pdrift">' + inner + '</g>' +
           '</svg>';
  }

  /* ====================================================== */
  /* 屏 0.1 — 封面                                          */
  /* ====================================================== */
  register({
    chapter: 0,
    chapterName: '开场',
    id: 'cover',
    title: 'Git ＆ GitHub：写给 Vibe Coder 的版本控制',
    subtitle: '你不背命令，你只理解效果，然后用人话告诉 AI',
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<div class="c-ch0-cover">' +
          // 极淡裸节点漂移（commit 图主视觉的暗示）
          '<div class="c-ch0-barebg" id="c-ch0-barebg"><div class="c-ch0-baretrack" id="c-ch0-baretrack"></div></div>' +
          // 漂浮圆点 + 连线粒子（带鼠标视差）
          '<div class="c-ch0-particles" id="c-ch0-particles">' + particlesSVG() + '</div>' +
          '<div class="c-ch0-cover-inner">' +
            '<h1 class="c-ch0-title">Git <span class="c-ch0-amp">＆</span> GitHub<br>写给 Vibe Coder 的版本控制</h1>' +
            '<p class="c-ch0-sub sc-quote">「你不背命令，你只理解<span class="accent">效果</span>，然后用人话告诉 AI。」</p>' +
            '<span class="c-ch0-start">〔 按 <span class="key">空格</span> 开始 ▶ 〕</span>' +
          '</div>' +
        '</div>';

      // —— 极淡裸节点漂移：用 api.graph 的 bare 模式画一排淡淡的裸节点 ——
      var bareHost = stage.querySelector('#c-ch0-baretrack');
      try {
        var g = api.graph(bareHost, {});
        g.init('main', ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], { bare: true });
      } catch (e) { /* 图失败不影响封面 */ }

      // —— 鼠标视差：粒子层随光标轻微反向位移（一次性监听；重建 DOM 时随节点销毁）——
      var pl = stage.querySelector('#c-ch0-particles');
      if (pl && !api.isReplay) {
        var onMove = function (ev) {
          var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
          var dx = (ev.clientX - cx) / cx, dy = (ev.clientY - cy) / cy;
          pl.style.transform = 'translate(' + (-dx * 18).toFixed(1) + 'px,' + (-dy * 14).toFixed(1) + 'px)';
        };
        // 绑到 stage 上，stage 重建即自动失效（旧 stage 内容被清空）
        stage.addEventListener('mousemove', onMove);
        // stage 之外也想响应：window 监听 + stage 在文档中才生效；离开本屏 stage 被清空，无副作用
        window.addEventListener('mousemove', onMove);
        api.onReset(function () { window.removeEventListener('mousemove', onMove); });
      }
      // 封面无分步。所有出现由 CSS 入场动画驱动（幂等：重建 DOM → 动画自动重跑）。
    }
  });

  /* ====================================================== */
  /* 屏 0.2 — 章节地图（v2 新顺序；兼 Esc 总览）             */
  /* ====================================================== */
  register({
    chapter: 0,
    chapterName: '开场',
    id: 'chapter-map',
    title: '章节地图',
    subtitle: '这趟旅程会经过哪些站',
    render: function (stage, api) {
      injectStyle();

      // ---- 计算「当前进度」：若从某章按 Esc 进来，高亮对应节点 ----
      var curChapter = null;
      try {
        var D = window.__Deck;
        if (D && D.screens && typeof D.idx === 'number' && D.screens[D.idx]) {
          var ch = D.screens[D.idx].chapter;
          if (ch && ch !== 0) curChapter = ch;   // 0=开场本身，不算进度
        }
      } catch (e) {}

      // ---- 组装 chain DOM ----
      var chainHTML = '';
      MAP.forEach(function (m, i) {
        if (i > 0) {
          // i 之前（含 target<=curChapter 的叙事段）算「已走过」→ 连线点亮
          chainHTML += '<span class="c-ch0-link" data-link="' + i + '"></span>';
        }
        var accent = ACCENT_VAR[m.accent] || ACCENT_VAR.main;
        chainHTML +=
          '<button class="c-ch0-node' + (m.end ? ' is-end' : '') + '" type="button" data-interactive="1"' +
            ' data-i="' + i + '" data-target="' + m.target + '" aria-label="第 ' + m.n + ' 章 ' + m.name + '：' + m.blurb + '">' +
            '<span class="c-ch0-tip">' + m.blurb + '</span>' +
            '<span class="c-ch0-dot" style="background:' + accent + ';">' + m.n + '</span>' +
            '<span class="c-ch0-name">' + m.name + '</span>' +
          '</button>';
      });

      stage.innerHTML =
        '<div class="c-ch0-map">' +
          '<div class="c-ch0-map-head">' +
            '<h2 class="sc-h2">章节地图</h2>' +
            '<p class="c-ch0-map-sub">点任意节点跳到那一章 · 随时按 <span class="k">Esc</span> 回到这里</p>' +
          '</div>' +
          '<div class="c-ch0-chain-scroll">' +
            '<div class="c-ch0-chain" id="c-ch0-chain">' + chainHTML + '</div>' +
          '</div>' +
          '<div class="c-ch0-map-note" id="c-ch0-map-note"></div>' +
        '</div>';

      var note = stage.querySelector('#c-ch0-map-note');

      // ---- 当前进度高亮 + 已走过连线点亮 ----
      // 高亮规则：节点的 target===curChapter → 标 current；
      //           叙事上排在「最后一个 current 节点」及之前的连线点亮。
      var lastCurrentIdx = -1;
      var nodes = stage.querySelectorAll('.c-ch0-node');
      if (curChapter != null) {
        MAP.forEach(function (m, i) {
          if (m.target === curChapter) {
            nodes[i].classList.add('is-current');
            if (i > lastCurrentIdx) lastCurrentIdx = i;
          }
        });
        if (lastCurrentIdx >= 0) {
          stage.querySelectorAll('.c-ch0-link').forEach(function (lk) {
            if (+lk.getAttribute('data-link') <= lastCurrentIdx) lk.classList.add('done');
          });
        }
      }

      // ---- 跳转：遍历 __Deck.screens 找第一个 chapter===target 的屏 ----
      function jumpTo(target, nodeEl) {
        var D = window.__Deck;
        if (D && D.screens && typeof D.go === 'function') {
          var hit = -1;
          for (var k = 0; k < D.screens.length; k++) {
            if (D.screens[k].chapter === target) { hit = k; break; }
          }
          if (hit >= 0) {
            try { if (typeof D.closeOverview === 'function') D.closeOverview(); } catch (e) {}
            D.go(hit, 0, true);
            return true;
          }
        }
        return false;
      }

      var noteTimer = null;
      function flashNote(msg) {
        if (!note) return;
        note.textContent = msg;
        note.classList.add('show');
        if (noteTimer) clearTimeout(noteTimer);
        noteTimer = setTimeout(function () {
          note.classList.remove('show');
        }, 2200);
      }

      Array.prototype.forEach.call(nodes, function (btn) {
        btn.addEventListener('click', function (e) {
          e.stopPropagation();           // 防止落入 deck 的左右翻页点击
          var target = +btn.getAttribute('data-target');
          var name = btn.querySelector('.c-ch0-name').textContent;
          var ok = jumpTo(target, btn);
          if (!ok) {
            // 兜底：找不到 __Deck / 对应章 → 高亮该节点 + 轻提示
            Array.prototype.forEach.call(nodes, function (n) { n.classList.remove('is-current'); });
            btn.classList.add('is-current');
            flashNote('「' + name + '」这一章稍后就到 —— 先记住它在地图上的位置 👆');
          }
        });
      });

      // 章节地图无分步（它同时承担 Esc 总览，需一进入即全貌可见）。
    }
  });

})();
