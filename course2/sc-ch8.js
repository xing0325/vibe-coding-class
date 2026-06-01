/* ============================================================
 * 第 8 章 · 多人协作
 * 屏 8.1 no-main      · 别直接在 main 上改（快进 vs 三方合并）
 * 屏 8.2 pr-flow      · fork → 改 → PR → review → merge（+ 过桥到 GitHub 章）
 * 屏 8.3 conflict     · merge conflict（人来拍板）  [play:true]
 * 屏 8.4 cherry-pick  · 只把一个 commit 拣到 main
 * 样式前缀: c-ch8-
 * 仅调用框架契约：window.registerScreen / api.step / api.frag / api.graph / api.aiCard ...
 * 8.1 / 8.4 的图为自绘 SVG（契约允许"CommitGraph 或自绘"），以获得精确的分叉/菱形/复制布局。
 * ============================================================ */
(function () {
  'use strict';

  /* ---- 防御性 registerScreen：若引擎尚未定义，先排队到 __pendingScreens ---- */
  if (typeof window.registerScreen !== 'function') {
    window.__pendingScreens = window.__pendingScreens || [];
    window.registerScreen = function (def) { window.__pendingScreens.push(def); };
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  function sx(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* 一次性注入本章作用域样式 */
  function injectStyle() {
    if (document.getElementById('c-ch8-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ch8-style';
    s.textContent = [
      '.c-ch8-wrap{display:flex;flex-direction:column;gap:20px;max-width:960px;margin:0 auto;width:100%;}',
      '.c-ch8-lead{font-size:15px;color:var(--dim);text-align:center;line-height:1.6;}',
      '.c-ch8-lead b{color:var(--c-teal);}',
      '.c-ch8-quote{font-size:clamp(16px,2.2vw,22px);font-weight:700;text-align:center;line-height:1.5;letter-spacing:-.01em;}',
      '.c-ch8-quote .hl{color:var(--git);}',

      /* ---------- 通用：自绘 commit 图 ---------- */
      '.c-ch8-gsvg{width:100%;display:block;overflow:visible;}',
      '.c-ch8-edge{stroke:var(--border);stroke-width:3;fill:none;transition:stroke .4s var(--ease),opacity .4s var(--ease);}',
      '.c-ch8-edge.merge{stroke:var(--c-purple);}',
      '.c-ch8-edge.ff{stroke:var(--c-teal);}',
      '.c-ch8-dot{stroke:#010409;stroke-width:2;transition:fill .4s var(--ease),stroke .4s var(--ease),r .35s var(--ease);}',
      '.c-ch8-dotlabel{font-family:var(--font-mono);font-size:12px;font-weight:700;text-anchor:middle;dominant-baseline:central;pointer-events:none;}',
      '.c-ch8-lane-label{font-family:var(--font-mono);font-size:12px;font-weight:700;dominant-baseline:central;}',
      '.c-ch8-merge-dot{filter:drop-shadow(0 0 8px rgba(167,139,250,.7));}',
      '.c-ch8-conflict-badge{font-family:var(--font-mono);font-size:11px;font-weight:800;fill:#fff;text-anchor:middle;dominant-baseline:central;}',
      '.c-ch8-pop{animation:c-ch8-pop .45s var(--ease);}',
      '@keyframes c-ch8-pop{0%{transform:scale(0);opacity:0}60%{transform:scale(1.22)}100%{transform:scale(1);opacity:1}}',

      /* ---------- 8.1 开关 ---------- */
      '.c-ch8-switch{display:inline-flex;align-self:center;border:1px solid var(--border);border-radius:999px;background:var(--pane);padding:4px;gap:4px;}',
      '.c-ch8-switch button{border:none;background:transparent;color:var(--dim);font-family:var(--font-sans);font-size:14px;font-weight:700;padding:9px 18px;border-radius:999px;cursor:pointer;transition:all .2s var(--ease);}',
      '.c-ch8-switch button.on{background:var(--git);color:#fff;box-shadow:0 0 0 1px var(--git);}',
      '.c-ch8-switch button:not(.on):hover{color:var(--text);background:var(--pane2);}',
      '.c-ch8-stage{background:var(--pane);border:1px solid var(--border);border-radius:16px;padding:18px 20px 14px;}',
      '.c-ch8-stage-title{font-size:14px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}',
      '.c-ch8-stage-title .tag{font-family:var(--font-mono);font-size:11px;padding:2px 8px;border-radius:6px;}',
      '.c-ch8-stage-title .tag.bad{color:var(--git);background:rgba(240,81,51,.12);border:1px solid rgba(240,81,51,.4);}',
      '.c-ch8-stage-title .tag.good{color:var(--c-teal);background:rgba(45,212,191,.12);border:1px solid rgba(45,212,191,.4);}',
      '.c-ch8-pullbar{display:flex;align-items:center;gap:12px;justify-content:center;margin-top:6px;flex-wrap:wrap;}',
      '.c-ch8-verdict{font-size:13.5px;font-family:var(--font-mono);padding:6px 12px;border-radius:8px;opacity:0;transition:opacity .3s var(--ease);}',
      '.c-ch8-verdict.show{opacity:1;}',
      '.c-ch8-verdict.ok{color:var(--c-teal);background:rgba(45,212,191,.1);border:1px solid rgba(45,212,191,.35);}',
      '.c-ch8-verdict.bad{color:var(--git);background:rgba(240,81,51,.1);border:1px solid rgba(240,81,51,.35);}',

      /* ---------- 8.2 PR 流程 ---------- */
      '.c-ch8-flow{display:flex;align-items:stretch;gap:0;flex-wrap:wrap;justify-content:center;}',
      '.c-ch8-step{flex:1 1 130px;max-width:180px;min-width:120px;text-align:center;background:var(--pane);border:1px solid var(--border);border-radius:14px;padding:16px 12px;cursor:pointer;transition:all .2s var(--ease);position:relative;}',
      '.c-ch8-step:hover{transform:translateY(-3px);border-color:#454d5e;}',
      '.c-ch8-step.on{border-color:var(--git);box-shadow:0 0 0 1px var(--git) inset,0 6px 22px rgba(240,81,51,.18);}',
      '.c-ch8-step .ic{font-size:26px;line-height:1;margin-bottom:8px;}',
      '.c-ch8-step .nm{font-size:14px;font-weight:800;}',
      '.c-ch8-step .en{font-family:var(--font-mono);font-size:10.5px;color:var(--dim);margin-top:2px;}',
      '.c-ch8-arrow{align-self:center;color:var(--dim);font-size:20px;padding:0 4px;flex:0 0 auto;}',
      '@media (max-width:680px){.c-ch8-arrow{transform:rotate(90deg);}.c-ch8-flow{flex-direction:column;align-items:center;}.c-ch8-step{max-width:260px;width:100%;}}',
      '.c-ch8-explain{background:#010409;border:1px solid var(--border);border-radius:12px;padding:14px 18px;min-height:62px;font-size:15px;line-height:1.6;}',
      '.c-ch8-explain .lab{font-family:var(--font-mono);color:var(--git);font-weight:700;margin-right:8px;}',
      '.c-ch8-sidecard{display:flex;gap:12px;align-items:flex-start;background:rgba(88,166,255,.07);border:1px solid rgba(88,166,255,.35);border-radius:12px;padding:14px 16px;font-size:14px;line-height:1.6;}',
      '.c-ch8-sidecard .k{font-size:22px;flex:0 0 auto;}',
      '.c-ch8-sidecard b{color:var(--info);}',
      '.c-ch8-sidecard .mono{font-family:var(--font-mono);color:var(--c-teal);}',
      '.c-ch8-bridge{display:flex;justify-content:center;margin-top:4px;}',

      /* ---------- 8.3 冲突 ---------- */
      '.c-ch8-conflict-intro{display:grid;grid-template-columns:1fr 1fr;gap:14px;}',
      '@media (max-width:620px){.c-ch8-conflict-intro{grid-template-columns:1fr;}}',
      '.c-ch8-branchcard{border-radius:12px;padding:12px 16px;border:1px solid var(--border);background:var(--pane);}',
      '.c-ch8-branchcard .who{font-size:13px;font-weight:700;margin-bottom:6px;display:flex;align-items:center;gap:8px;}',
      '.c-ch8-branchcard.mine{border-color:rgba(45,212,191,.5);}',
      '.c-ch8-branchcard.mine .who{color:var(--c-teal);}',
      '.c-ch8-branchcard.theirs{border-color:rgba(244,114,182,.5);}',
      '.c-ch8-branchcard.theirs .who{color:var(--c-pink);}',
      '.c-ch8-branchcard code{font-family:var(--font-mono);font-size:13px;color:var(--text);}',
      '.c-ch8-code{background:#010409;border:1px solid var(--border);border-radius:12px;font-family:var(--font-mono);font-size:13.5px;overflow:hidden;}',
      '.c-ch8-code-head{padding:8px 16px;border-bottom:1px solid var(--border);background:var(--pane);color:var(--c-amber);font-size:12.5px;}',
      '.c-ch8-code-body{padding:10px 0;}',
      '.c-ch8-cl{display:block;padding:2px 16px;white-space:pre-wrap;word-break:break-word;line-height:1.65;}',
      '.c-ch8-cl.ctx{color:var(--dim);}',
      '.c-ch8-cl.marker{color:var(--git);font-weight:700;background:rgba(240,81,51,.1);}',
      '.c-ch8-cl.marker.mid{color:var(--c-purple);background:rgba(167,139,250,.1);}',
      '.c-ch8-cl.mine{color:#9BE9A8;background:rgba(63,185,80,.12);}',
      '.c-ch8-cl.theirs{color:#F8B4B4;background:rgba(244,114,182,.12);}',
      '.c-ch8-cl.kept{color:#9BE9A8;background:rgba(63,185,80,.14);}',
      '.c-ch8-resolved-tag{display:flex;align-items:center;gap:8px;padding:8px 16px;color:var(--c-teal);font-size:13px;border-top:1px solid var(--border);background:rgba(45,212,191,.07);}',
      '.c-ch8-resolved-tag .ck{font-weight:900;}',
      '.c-ch8-choices{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}',
      '.c-ch8-choices .sc-btn.pickwin{border-color:var(--git);}',

      /* ---------- 8.4 cherry-pick ---------- */
      '.c-ch8-cp-hint{font-size:13.5px;color:var(--dim);text-align:center;}',
      '.c-ch8-cp-hint b{color:var(--git);font-family:var(--font-mono);}',
      '.c-ch8-good{cursor:grab;}',
      '.c-ch8-good:active{cursor:grabbing;}',
      '.c-ch8-aihost{max-width:560px;margin:0 auto;width:100%;}',
      '.c-ch8-cpbtns{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ============================================================
   * 自绘小工具：在 svg 里画一个 commit 节点
   * ============================================================ */
  function drawDot(parent, cx, cy, fill, label, opts) {
    opts = opts || {};
    var g = sx('g', { 'transform': 'translate(' + cx + ',' + cy + ')' });
    if (opts.cls) g.setAttribute('class', opts.cls);
    var r = opts.r || 18;
    var c = sx('circle', { 'class': 'c-ch8-dot' + (opts.merge ? ' c-ch8-merge-dot' : ''), 'r': r, 'cx': 0, 'cy': 0, 'fill': fill });
    if (opts.stroke) { c.setAttribute('stroke', opts.stroke); c.setAttribute('stroke-width', opts.strokeW || 3.5); }
    g.appendChild(c);
    var t = sx('text', { 'class': 'c-ch8-dotlabel', 'fill': opts.labelFill || '#010409' });
    t.textContent = label;
    g.appendChild(t);
    parent.appendChild(g);
    return g;
  }
  function drawEdge(parent, x1, y1, x2, y2, cls) {
    var d;
    if (y1 === y2) d = 'M' + x1 + ',' + y1 + ' L' + x2 + ',' + y2;
    else { var mx = (x1 + x2) / 2; d = 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2; }
    var e = sx('path', { 'class': 'c-ch8-edge' + (cls ? ' ' + cls : ''), 'd': d });
    parent.insertBefore(e, parent.firstChild); // 边在节点下层
    return e;
  }
  function laneLabel(parent, x, y, txt, color) {
    var t = sx('text', { 'class': 'c-ch8-lane-label', 'x': x, 'y': y, 'fill': color });
    t.textContent = txt;
    parent.appendChild(t);
    return t;
  }

  var COL = {
    main: '#E6EDF3', teal: '#2DD4BF', purple: '#A78BFA', amber: '#FBBF24', pink: '#F472B6', git: '#F05133'
  };

  /* ====================================================== */
  /* 屏 8.1 — 别直接在 main 上改                            */
  /* ====================================================== */
  window.registerScreen({
    chapter: 9,
    chapterName: '多人协作',
    id: 'no-main',
    title: '别直接在 main 上改',
    subtitle: '快进 vs 三方合并',
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<h2 class="sc-h2 sc-center">别直接在 main 上改</h2>' +
        '<div class="c-ch8-wrap">' +
          '<p class="c-ch8-lead">同一个仓库，别人也在往 <b>main</b> 上推。看你把自己的改动放哪——结局天差地别。</p>' +
          '<div class="c-ch8-switch" id="c-ch8-sw" data-interactive="1">' +
            '<button data-mode="main" data-interactive="1">😱 在 main 上改</button>' +
            '<button data-mode="branch" class="on" data-interactive="1">😎 在分支上改</button>' +
          '</div>' +
          '<div class="c-ch8-stage" id="c-ch8-stage">' +
            '<div class="c-ch8-stage-title" id="c-ch8-stitle"></div>' +
            '<div id="c-ch8-graph"></div>' +
            '<div class="c-ch8-pullbar">' +
              '<button class="sc-btn primary" id="c-ch8-pullbtn" data-interactive="1">▶ 演示 git pull 之后</button>' +
              '<span class="c-ch8-verdict" id="c-ch8-verdict"></span>' +
            '</div>' +
          '</div>' +
          '<p class="c-ch8-quote" id="c-ch8-quote"></p>' +
        '</div>';

      var graphHost = stage.querySelector('#c-ch8-graph');
      var titleEl = stage.querySelector('#c-ch8-stitle');
      var verdictEl = stage.querySelector('#c-ch8-verdict');
      var pullBtn = stage.querySelector('#c-ch8-pullbtn');
      var quoteEl = stage.querySelector('#c-ch8-quote');
      var swBtns = stage.querySelectorAll('#c-ch8-sw button');

      var mode = 'branch';   // 'main' | 'branch'   局部状态 → 重渲染归零（幂等）
      var pulled = false;    // 是否已演示 pull 结果

      // 几何
      var X0 = 70, GAP = 92;
      function X(i) { return X0 + i * GAP; }

      function drawGraph() {
        graphHost.innerHTML = '';
        var svg = sx('svg', { 'class': 'c-ch8-gsvg', 'preserveAspectRatio': 'xMidYMid meet' });
        graphHost.appendChild(svg);

        if (mode === 'main') {
          titleEl.innerHTML = '<span class="tag bad">在 main 上改</span> 你和上游都从 C 分叉，各走各的';
          var laneYourY = 70, laneUpY = 200;
          // 公共 A B C 放在你这条线（lane your），上游从 C 拉一条到下面
          // 你的 main: A B C X Y
          var yourIds = ['A', 'B', 'C', 'X', 'Y'];
          var upIds = ['D', 'E']; // 接在 C 之后（index 3,4）
          if (!pulled) {
            // 两条线都从 C 分叉
            // 你：A(0)B(1)C(2)X(3)Y(4)
            for (var i = 0; i < yourIds.length - 1; i++) drawEdge(svg, X(i), laneYourY, X(i + 1), laneYourY);
            // 上游：C(2) -> D(3) -> E(4) 在下面一条 lane，从 C 弯下去
            drawEdge(svg, X(2), laneYourY, X(3), laneUpY); // C -> D 分叉
            drawEdge(svg, X(3), laneUpY, X(4), laneUpY);   // D -> E
            yourIds.forEach(function (id, i) {
              var isMine = (id === 'X' || id === 'Y');
              drawDot(svg, X(i), laneYourY, isMine ? COL.git : COL.main, id, { labelFill: '#010409' });
            });
            upIds.forEach(function (id, i) {
              drawDot(svg, X(3 + i), laneUpY, COL.amber, id, { labelFill: '#010409' });
            });
            laneLabel(svg, X(4) + 28, laneYourY, '你的 main', COL.git);
            laneLabel(svg, X(4) + 28, laneUpY, '上游 main', COL.amber);
            svg.setAttribute('viewBox', '0 0 ' + (X(4) + 130) + ' 270');
          } else {
            // pull 之后：真·三方合并，多一个菱形合并点 M，X/Y 撞 D/E → 冲突
            for (var j = 0; j < yourIds.length - 1; j++) drawEdge(svg, X(j), laneYourY, X(j + 1), laneYourY);
            drawEdge(svg, X(2), laneYourY, X(3), laneUpY);
            drawEdge(svg, X(3), laneUpY, X(4), laneUpY);
            // 合并点 M 在 index 5（你的 lane），两个父：Y(4,your) 和 E(4,up)
            drawEdge(svg, X(4), laneYourY, X(5), laneYourY, 'merge');
            drawEdge(svg, X(4), laneUpY, X(5), laneYourY, 'merge');
            yourIds.forEach(function (id, i) {
              var isMine = (id === 'X' || id === 'Y');
              var conflict = (id === 'X' || id === 'Y');
              var node = drawDot(svg, X(i), laneYourY, isMine ? COL.git : COL.main, id, { labelFill: '#010409' });
              if (conflict) {
                // 红色冲突小标
                var b = sx('text', { 'class': 'c-ch8-conflict-badge', 'x': 0, 'y': -26, 'fill': COL.git });
                b.textContent = '✗冲突';
                node.appendChild(b);
              }
            });
            upIds.forEach(function (id, i) {
              drawDot(svg, X(3 + i), laneUpY, COL.amber, id, { labelFill: '#010409' });
            });
            drawDot(svg, X(5), laneYourY, COL.purple, '⛙', { merge: true, cls: 'c-ch8-pop', labelFill: '#010409' });
            laneLabel(svg, X(5) + 28, laneYourY, '乱掉的 main', COL.git);
            laneLabel(svg, X(4) + 28, laneUpY, '上游 main', COL.amber);
            svg.setAttribute('viewBox', '0 0 ' + (X(5) + 150) + ' 270');
          }
        } else {
          // branch 模式
          titleEl.innerHTML = '<span class="tag good">在分支上改</span> main 没动，你的活在 feature 分支上';
          var yourMainY = 70, featY = 200, upTheirY = 70;
          var baseIds = ['A', 'B', 'C'];
          var featIds = ['X', 'Y'];   // 在 feature lane，接 C
          var upIds2 = ['D', 'E'];    // 上游 main 接 C
          if (!pulled) {
            // 你的 main：A B C（没动）
            for (var k = 0; k < baseIds.length - 1; k++) drawEdge(svg, X(k), yourMainY, X(k + 1), yourMainY);
            // feature：C -> X -> Y（下面 lane）
            drawEdge(svg, X(2), yourMainY, X(3), featY);
            drawEdge(svg, X(3), featY, X(4), featY);
            baseIds.forEach(function (id, i) {
              drawDot(svg, X(i), yourMainY, COL.main, id, { labelFill: '#010409' });
            });
            featIds.forEach(function (id, i) {
              drawDot(svg, X(3 + i), featY, COL.teal, id, { labelFill: '#010409' });
            });
            laneLabel(svg, X(2) + 28, yourMainY, '你的 main（干净）', COL.main);
            laneLabel(svg, X(4) + 28, featY, 'feature 分支', COL.teal);
            svg.setAttribute('viewBox', '0 0 ' + (X(4) + 200) + ' 270');
          } else {
            // pull 之后：checkout main && pull → 完美快进 A B C D E（一条直线）
            var ffIds = ['A', 'B', 'C', 'D', 'E'];
            for (var m = 0; m < ffIds.length - 1; m++) {
              var isFF = (m >= 2); // C->D, D->E 是快进新拿到的
              drawEdge(svg, X(m), yourMainY, X(m + 1), yourMainY, isFF ? 'ff' : '');
            }
            // feature 还挂在 C 上（你的活还在，等会儿再开 PR）
            drawEdge(svg, X(2), yourMainY, X(3), featY);
            drawEdge(svg, X(3), featY, X(4), featY);
            ffIds.forEach(function (id, i) {
              var got = (id === 'D' || id === 'E');
              drawDot(svg, X(i), yourMainY, got ? COL.amber : COL.main, id, { labelFill: '#010409', cls: got ? 'c-ch8-pop' : '' });
            });
            featIds.forEach(function (id, i) {
              drawDot(svg, X(3 + i), featY, COL.teal, id, { labelFill: '#010409' });
            });
            laneLabel(svg, X(4) + 28, yourMainY, 'main = 上游（快进）', COL.teal);
            laneLabel(svg, X(4) + 28, featY, 'feature（你的活还在）', COL.teal);
            svg.setAttribute('viewBox', '0 0 ' + (X(4) + 220) + ' 270');
          }
        }
      }

      function renderVerdict() {
        if (!pulled) { verdictEl.classList.remove('show'); verdictEl.textContent = ''; return; }
        if (mode === 'main') {
          verdictEl.className = 'c-ch8-verdict show bad';
          verdictEl.textContent = '✗ 三方合并 + 冲突，历史变乱';
        } else {
          verdictEl.className = 'c-ch8-verdict show ok';
          verdictEl.textContent = '✓ fast-forward 快进，零冲突';
        }
      }

      function setQuote() {
        quoteEl.innerHTML = '为什么改东西要<span class="hl">开分支</span>、别碰 main——这是协作的<span class="hl">第一纪律</span>。';
      }

      function setMode(m) {
        mode = m;
        pulled = false;
        swBtns.forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-mode') === m); });
        pullBtn.disabled = false;
        pullBtn.textContent = '▶ 演示 git pull 之后';
        drawGraph();
        renderVerdict();
      }

      swBtns.forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          setMode(b.getAttribute('data-mode'));
        });
      });
      pullBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        pulled = true;
        pullBtn.disabled = true;
        pullBtn.textContent = mode === 'main' ? '⛙ 已 pull（三方合并）' : '⚡ 已 pull（快进）';
        drawGraph();
        renderVerdict();
      });

      api.onReset(function () { mode = 'branch'; pulled = false; });

      // 初始绘制（默认推荐做法：在分支上改）
      setMode('branch');
      setQuote();

      // 分步：开关 + 图一进来就能玩；金句作为一个揭示步（淡入），给讲解节奏。
      api.frag(quoteEl);
    }
  });

  /* ====================================================== */
  /* 屏 8.2 — fork → PR → review → merge                    */
  /* ====================================================== */
  window.registerScreen({
    chapter: 9,
    chapterName: '多人协作',
    id: 'pr-flow',
    title: 'fork → PR → review',
    subtitle: '协作的标准动作',
    render: function (stage, api) {
      injectStyle();

      var STEPS = [
        { key: 'fork', ic: '🍴', nm: 'fork', en: 'fork', exp: '把别人的仓库<b>复制一份到你自己名下</b>。从此你在自己的副本里随便改，碰不到原仓库。' },
        { key: 'edit', ic: '✏️', nm: '改', en: 'branch + commit', exp: '在你副本里<b>开一条分支</b>改东西、提交。别在 main 上改——还记得上一屏的第一纪律吗？' },
        { key: 'pr', ic: '📬', nm: '提 PR', en: 'pull request', exp: 'PR = <b>合并请求</b>：你举手说"我这条分支想并回原仓库，请看看"。本质是一次礼貌的对话。' },
        { key: 'review', ic: '🔍', nm: 'review', en: 'code review', exp: '维护者<b>审核</b>你的改动：逐行评论、提意见、要求你再改改。把关质量。' },
        { key: 'merge', ic: '✅', nm: 'merge', en: 'merge', exp: '审核通过 → <b>合并</b>进原仓库的 main。你的代码正式进入项目，皆大欢喜。' }
      ];

      var flowHTML = '';
      STEPS.forEach(function (s, i) {
        flowHTML +=
          '<div class="c-ch8-step" data-interactive="1" data-key="' + s.key + '" data-i="' + i + '">' +
            '<div class="ic">' + s.ic + '</div>' +
            '<div class="nm">' + s.nm + '</div>' +
            '<div class="en">' + s.en + '</div>' +
          '</div>';
        if (i < STEPS.length - 1) flowHTML += '<span class="c-ch8-arrow">→</span>';
      });

      stage.innerHTML =
        '<h2 class="sc-h2 sc-center">fork → 改 → PR → review → merge</h2>' +
        '<div class="c-ch8-wrap">' +
          '<p class="c-ch8-lead">点流程里的每一站，看它<b>是什么、为什么</b>。具体点哪个绿按钮，交给后面的 GitHub 章。</p>' +
          '<div class="c-ch8-flow" id="c-ch8-flow">' + flowHTML + '</div>' +
          '<div class="c-ch8-explain" id="c-ch8-explain"><span class="lab">点上面任意一站</span>这里出现它的一句话解释。</div>' +
          '<div class="c-ch8-sidecard" id="c-ch8-side">' +
            '<span class="k">🔑</span>' +
            '<div>有<b>写权限</b>时：直接 <span class="mono">git clone</span>、把分支 <span class="mono">push</span> 回<b>同一个仓库</b>、照样走 PR，<b>不用 fork</b>。<br>fork 是给你<b>没有写权限</b>时用的（比如给别人的开源项目贡献）。</div>' +
          '</div>' +
          '<div class="c-ch8-bridge" id="c-ch8-bridge">' +
            '<a class="sc-btn primary" id="c-ch8-bridgebtn" data-interactive="1" data-bridge="github" href="../github-tutorial.html">看看在 GitHub 上长啥样 →</a>' +
          '</div>' +
        '</div>';

      var stepEls = stage.querySelectorAll('.c-ch8-step');
      var explainEl = stage.querySelector('#c-ch8-explain');

      function selectStep(i) {
        stepEls.forEach(function (el, k) { el.classList.toggle('on', k === i); });
        var s = STEPS[i];
        explainEl.innerHTML = '<span class="lab">' + s.nm + '</span>' + s.exp;
      }

      stepEls.forEach(function (el) {
        el.addEventListener('click', function (e) {
          e.stopPropagation();
          selectStep(+el.getAttribute('data-i'));
        });
      });

      // 桥接占位：若集成层挂了 data-bridge 处理就用它，否则 href 兜底跳 GitHub 章
      var bridgeBtn = stage.querySelector('#c-ch8-bridgebtn');
      bridgeBtn.addEventListener('click', function (e) {
        // 不 stopPropagation 之外：交给集成层；这里仅防止误触幻灯片导航
        e.stopPropagation();
      });

      api.onReset(function () {
        stepEls.forEach(function (el) { el.classList.remove('on'); });
        explainEl.innerHTML = '<span class="lab">点上面任意一站</span>这里出现它的一句话解释。';
      });

      // 默认高亮第一站，给观众一个起点
      selectStep(0);

      // 分步：副卡 + 过桥按钮作为后续揭示步（流程图一进来就能点）
      api.frag(stage.querySelector('#c-ch8-side'));
      api.frag(stage.querySelector('#c-ch8-bridge'));
    }
  });

  /* ====================================================== */
  /* 屏 8.3 — merge conflict（人来拍板）                     */
  /* ====================================================== */
  window.registerScreen({
    chapter: 9,
    chapterName: '多人协作',
    id: 'conflict',
    title: 'merge conflict',
    subtitle: '这时必须人来拍板',
    play: true,
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<h2 class="sc-h2 sc-center">merge conflict：同一行，两种主张</h2>' +
        '<div class="c-ch8-wrap">' +
          '<div class="c-ch8-conflict-intro">' +
            '<div class="c-ch8-branchcard mine">' +
              '<div class="who">🟢 你（小 C）· 实时结算</div>' +
              '<code>settleCredit(user, mode = "realtime")</code>' +
            '</div>' +
            '<div class="c-ch8-branchcard theirs">' +
              '<div class="who">🩷 别人（小 D）· 每周结算</div>' +
              '<code>settleCredit(user, mode = "weekly")</code>' +
            '</div>' +
          '</div>' +
          '<p class="c-ch8-lead">两个<b>共享同一个父节点</b>的 commit，改了<b>同一文件的同一行</b> → 冲突。' +
          'git 不敢替你瞎选，于是把两边都塞进文件，画上冲突标记。</p>' +
          '<div class="c-ch8-code" id="c-ch8-code" data-interactive="1"></div>' +
          '<p class="c-ch8-quote" id="c-ch8-cq">这时必须 <span class="hl">人来拍板</span>——连 AI 也得你定。</p>' +
          '<div class="c-ch8-choices" id="c-ch8-choices">' +
            '<button class="sc-btn pickwin" data-interactive="1" data-pick="mine">保留实时结算</button>' +
            '<button class="sc-btn pickwin" data-interactive="1" data-pick="theirs">保留每周结算</button>' +
            '<button class="sc-btn pickwin" data-interactive="1" data-pick="both">都要，我手动合</button>' +
          '</div>' +
        '</div>';

      var codeEl = stage.querySelector('#c-ch8-code');
      var choiceBtns = stage.querySelectorAll('#c-ch8-choices button');
      var resolved = null; // null | 'mine' | 'theirs' | 'both'

      function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

      function conflictView() {
        return '' +
          '<div class="c-ch8-code-head">src/credit/settle.js — ⚠ 冲突（CONFLICT）</div>' +
          '<div class="c-ch8-code-body">' +
            '<span class="c-ch8-cl ctx">function settleAll(users){</span>' +
            '<span class="c-ch8-cl marker">' + esc('<<<<<<< HEAD（你的：实时结算）') + '</span>' +
            '<span class="c-ch8-cl mine">  settleCredit(user, mode = "realtime")</span>' +
            '<span class="c-ch8-cl marker mid">' + esc('=======') + '</span>' +
            '<span class="c-ch8-cl theirs">  settleCredit(user, mode = "weekly")</span>' +
            '<span class="c-ch8-cl marker">' + esc('>>>>>>> feature-D（别人的：每周结算）') + '</span>' +
            '<span class="c-ch8-cl ctx">}</span>' +
          '</div>';
      }

      function resolvedView(pick) {
        var head, lines, tag;
        if (pick === 'mine') {
          head = 'src/credit/settle.js — ✓ 已解决';
          lines = '<span class="c-ch8-cl kept">  settleCredit(user, mode = "realtime")</span>';
          tag = '保留了：实时结算（你的版本）';
        } else if (pick === 'theirs') {
          head = 'src/credit/settle.js — ✓ 已解决';
          lines = '<span class="c-ch8-cl kept">  settleCredit(user, mode = "weekly")</span>';
          tag = '保留了：每周结算（别人的版本）';
        } else {
          head = 'src/credit/settle.js — ✓ 已解决（手动合并）';
          lines = '<span class="c-ch8-cl kept">  settleCredit(user, mode = opts.weekly ? "weekly" : "realtime")</span>';
          tag = '两套都要：你手动写了一行同时支持';
        }
        return '' +
          '<div class="c-ch8-code-head">' + head + '</div>' +
          '<div class="c-ch8-code-body">' +
            '<span class="c-ch8-cl ctx">function settleAll(users){</span>' +
            lines +
            '<span class="c-ch8-cl ctx">}</span>' +
          '</div>' +
          '<div class="c-ch8-resolved-tag"><span class="ck">✓</span>' + tag + '（冲突标记已清除）</div>';
      }

      function paint() {
        if (resolved) {
          codeEl.innerHTML = resolvedView(resolved);
        } else {
          codeEl.innerHTML = conflictView();
        }
        choiceBtns.forEach(function (b) {
          b.classList.toggle('primary', resolved && b.getAttribute('data-pick') === resolved);
        });
      }

      choiceBtns.forEach(function (b) {
        b.addEventListener('click', function (e) {
          e.stopPropagation();
          resolved = (resolved === b.getAttribute('data-pick')) ? null : b.getAttribute('data-pick');
          paint();
        });
      });

      api.onReset(function () { resolved = null; });

      // 初始：显示带冲突标记的代码块
      paint();

      // 分步：先代码块（已在），再金句，再三个按钮——给讲解节奏
      api.frag(stage.querySelector('#c-ch8-cq'));
      api.frag(stage.querySelector('#c-ch8-choices'));
    }
  });

  /* ====================================================== */
  /* 屏 8.4 — cherry-pick（只拣一个 commit）                 */
  /* ====================================================== */
  window.registerScreen({
    chapter: 9,
    chapterName: '多人协作',
    id: 'cherry-pick',
    title: 'cherry-pick',
    subtitle: '只搬那一个 commit',
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<h2 class="sc-h2 sc-center">cherry-pick：只拣那一个好 commit</h2>' +
        '<div class="c-ch8-wrap">' +
          '<p class="c-ch8-cp-hint" id="c-ch8-cphint">feature 上有个 <b>★ 好 commit</b>。你只想要它、不想要整条分支。' +
          '把 ★ <b>拖到 main</b>（或点按钮）→ 复制一份落到 main 末端。</p>' +
          '<div id="c-ch8-cpgraph" style="position:relative;"></div>' +
          '<div class="c-ch8-cpbtns">' +
            '<button class="sc-btn primary" id="c-ch8-cpbtn" data-interactive="1">🍒 拣选这个 commit</button>' +
            '<button class="sc-btn" id="c-ch8-cpreset" data-interactive="1">↺ 重来</button>' +
          '</div>' +
          '<div class="c-ch8-aihost" id="c-ch8-cpai"></div>' +
        '</div>';

      var host = stage.querySelector('#c-ch8-cpgraph');
      var hintEl = stage.querySelector('#c-ch8-cphint');
      var picked = false; // 是否已 cherry-pick（局部状态 → 幂等）

      // 几何
      var X0 = 70, GAP = 100;
      function X(i) { return X0 + i * GAP; }
      var mainY = 70, featY = 200;

      // ★ 好 commit 在 feature 上：A B ★ Z（index 0..3 在 feature lane，但 A B 与 main 共享）
      // 为简洁：main: A B C（共享 A B），feature 从 B 分叉 → ★ Z
      // 布局：A(0) B(1) 在 main lane；C(2) 在 main lane；feature: ★(2) Z(3) 在 feat lane（从 B 分叉）
      var goodG = null;

      function draw() {
        host.innerHTML = '';
        var svg = sx('svg', { 'class': 'c-ch8-gsvg', 'preserveAspectRatio': 'xMidYMid meet' });
        host.appendChild(svg);

        // ---- main lane: A B C (+ 末端可能多一个 ★副本) ----
        drawEdge(svg, X(0), mainY, X(1), mainY); // A-B
        drawEdge(svg, X(1), mainY, X(2), mainY); // B-C
        drawDot(svg, X(0), mainY, COL.main, 'A', { labelFill: '#010409' });
        drawDot(svg, X(1), mainY, COL.main, 'B', { labelFill: '#010409' });
        drawDot(svg, X(2), mainY, COL.main, 'C', { labelFill: '#010409' });

        // ---- feature lane: 从 B 分叉 → ★ → Z ----
        drawEdge(svg, X(1), mainY, X(2), featY);  // B -> ★
        drawEdge(svg, X(2), featY, X(3), featY);  // ★ -> Z
        goodG = drawDot(svg, X(2), featY, COL.git, '★', { stroke: COL.git, labelFill: '#fff', cls: 'c-ch8-good' });
        goodG.setAttribute('data-interactive', '1'); // 防止拖拽/点击误触幻灯片导航
        // ★ 标注
        var lbl = sx('text', { 'class': 'c-ch8-conflict-badge', 'x': 0, 'y': -28, 'fill': COL.git });
        lbl.textContent = '好commit';
        goodG.appendChild(lbl);
        drawDot(svg, X(3), featY, COL.teal, 'Z', { labelFill: '#010409' });

        laneLabel(svg, X(2) + (picked ? 1 : 0) * GAP + 32, mainY, picked ? 'main（含 ★ 副本）' : 'main', picked ? COL.git : COL.main);
        laneLabel(svg, X(3) + 30, featY, 'feature', COL.teal);

        var rightMost = X(2);
        if (picked) {
          // ★ 的副本落到 main 末端（C 之后，index 3 在 main lane）
          drawEdge(svg, X(2), mainY, X(3), mainY); // C -> ★'
          drawDot(svg, X(3), mainY, COL.git, '★', { stroke: COL.git, labelFill: '#fff', cls: 'c-ch8-pop' });
          var lbl2 = sx('text', { 'class': 'c-ch8-conflict-badge', 'x': X(3), 'y': mainY - 28, 'fill': COL.git });
          lbl2.textContent = '副本';
          svg.appendChild(lbl2);
          rightMost = X(3);
          // 重画 main 标签到末端
        }
        svg.setAttribute('viewBox', '0 0 ' + (rightMost + 220) + ' 270');

        bindDrag(svg);
      }

      // 拖拽：把 ★ 拖到 main lane → 触发 cherry-pick
      function bindDrag(svg) {
        if (!goodG || picked) return;
        var dragging = false, ghost = null;
        function startXY(ev) {
          var t = (ev.touches && ev.touches[0]) || ev;
          return { x: t.clientX, y: t.clientY };
        }
        function onDown(ev) {
          if (picked) return;
          ev.preventDefault(); ev.stopPropagation();
          dragging = true;
          // 用一个浮动的 ★ 跟手
          ghost = document.createElement('div');
          ghost.textContent = '★';
          ghost.style.cssText = 'position:fixed;z-index:90;font-family:var(--font-mono);font-weight:800;font-size:22px;color:#fff;background:' + COL.git + ';width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;pointer-events:none;box-shadow:0 0 14px rgba(240,81,51,.8);transform:translate(-50%,-50%);';
          var p = startXY(ev);
          ghost.style.left = p.x + 'px'; ghost.style.top = p.y + 'px';
          document.body.appendChild(ghost);
          document.addEventListener('mousemove', onMove);
          document.addEventListener('mouseup', onUp);
          document.addEventListener('touchmove', onMove, { passive: false });
          document.addEventListener('touchend', onUp);
        }
        function onMove(ev) {
          if (!dragging) return;
          ev.preventDefault();
          var p = startXY(ev);
          ghost.style.left = p.x + 'px'; ghost.style.top = p.y + 'px';
        }
        function onUp(ev) {
          if (!dragging) return;
          dragging = false;
          var p = startXY(ev);
          if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
          ghost = null;
          document.removeEventListener('mousemove', onMove);
          document.removeEventListener('mouseup', onUp);
          document.removeEventListener('touchmove', onMove);
          document.removeEventListener('touchend', onUp);
          // 命中判定：落点是否落在 main lane（svg 上半区）
          var rect = svg.getBoundingClientRect();
          var midY = rect.top + rect.height * 0.5;
          if (p.y < midY && p.x > rect.left && p.x < rect.right) {
            doPick();
          }
        }
        goodG.addEventListener('mousedown', onDown);
        goodG.addEventListener('touchstart', onDown, { passive: false });
      }

      function doPick() {
        if (picked) return;
        picked = true;
        hintEl.innerHTML = '✓ <b>git cherry-pick</b> 把 ★ <b>复制</b>了一份到 main 末端——原来那个 ★ 还留在 feature 上，整条分支没被拖过来。';
        draw();
      }

      stage.querySelector('#c-ch8-cpbtn').addEventListener('click', function (e) {
        e.stopPropagation();
        doPick();
      });
      stage.querySelector('#c-ch8-cpreset').addEventListener('click', function (e) {
        e.stopPropagation();
        picked = false;
        hintEl.innerHTML = 'feature 上有个 <b>★ 好 commit</b>。你只想要它、不想要整条分支。把 ★ <b>拖到 main</b>（或点按钮）→ 复制一份落到 main 末端。';
        draw();
      });

      api.onReset(function () { picked = false; });

      // AI 卡
      var card = api.aiCard({
        effect: '只把那一个 commit 搬到 main，不连带整条分支',
        say: '把 a1b2c3d 这个 commit 单独 cherry-pick 到 main',
        cmd: 'git cherry-pick a1b2c3d'
      });
      stage.querySelector('#c-ch8-cpai').appendChild(card);

      // 初始绘制
      draw();

      // 分步：AI 卡作为揭示步（图与互动一进来就在）
      api.frag(stage.querySelector('#c-ch8-cpai'));
    }
  });

})();
