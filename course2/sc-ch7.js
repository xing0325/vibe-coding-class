/* ============================================================
 * 第 7 章 · git diff（看两个版本差在哪）
 * 屏 7.1 diff · 在时间线上点选两个提交 → 弹出伪 diff（红行/绿行）
 * 样式前缀: c-ch7-
 * 仅调用框架契约：window.registerScreen / api.step / api.frag / api.aiCard ...
 * ============================================================ */
(function () {
  'use strict';

  /* ---- 防御性 registerScreen：若引擎尚未定义，先排队到 __pendingScreens ---- */
  if (typeof window.registerScreen !== 'function') {
    window.__pendingScreens = window.__pendingScreens || [];
    window.registerScreen = function (def) { window.__pendingScreens.push(def); };
  }

  /* 一次性注入本章作用域样式（重复进入屏不会重复注入） */
  function injectStyle() {
    if (document.getElementById('c-ch7-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ch7-style';
    s.textContent = [
      '.c-ch7-wrap{display:flex;flex-direction:column;gap:22px;max-width:920px;margin:0 auto;width:100%;}',
      '.c-ch7-hint{font-size:14px;color:var(--dim);text-align:center;}',
      '.c-ch7-hint b{color:var(--git);font-family:var(--font-mono);}',

      /* ---------- 时间线（自绘 SVG 一排节点，可点选） ---------- */
      '.c-ch7-timeline{position:relative;width:100%;}',
      '.c-ch7-tl-svg{width:100%;display:block;overflow:visible;}',
      '.c-ch7-node{cursor:pointer;}',
      '.c-ch7-node circle{stroke:#010409;stroke-width:2;fill:var(--c-main);transition:fill .3s var(--ease),stroke .3s var(--ease),filter .3s;}',
      '.c-ch7-node .ndot{filter:drop-shadow(0 0 5px rgba(255,255,255,.18));}',
      '.c-ch7-node:hover circle{stroke:var(--c-teal);stroke-width:3;}',
      '.c-ch7-node.sel circle{fill:var(--git);stroke:var(--git);stroke-width:3.5;filter:drop-shadow(0 0 10px rgba(240,81,51,.85));}',
      '.c-ch7-node .hash{font-family:var(--font-mono);font-size:12px;fill:var(--dim);text-anchor:middle;}',
      '.c-ch7-node.sel .hash{fill:var(--git);font-weight:700;}',
      '.c-ch7-node .msg{font-family:var(--font-sans);font-size:11.5px;fill:var(--text);text-anchor:middle;opacity:.8;}',
      '.c-ch7-node .badge{font-family:var(--font-mono);font-size:11px;font-weight:800;fill:#fff;text-anchor:middle;dominant-baseline:central;}',
      '.c-ch7-tl-edge{stroke:var(--border);stroke-width:3;fill:none;}',

      /* 选中顺序角标（旧/新） */
      '.c-ch7-pickpill{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:13px;color:var(--dim);justify-content:center;flex-wrap:wrap;}',
      '.c-ch7-pickpill .slot{padding:5px 12px;border-radius:8px;border:1px dashed var(--border);min-width:104px;text-align:center;}',
      '.c-ch7-pickpill .slot.filled{border-style:solid;border-color:var(--git);color:var(--git);background:rgba(240,81,51,.1);font-weight:700;}',
      '.c-ch7-pickpill .arrow{color:var(--dim);}',

      /* ---------- diff 面板 ---------- */
      '.c-ch7-diff{background:#010409;border:1px solid var(--border);border-radius:14px;overflow:hidden;font-family:var(--font-mono);font-size:13.5px;opacity:0;transform:translateY(10px);transition:opacity .35s var(--ease),transform .35s var(--ease);}',
      '.c-ch7-diff.show{opacity:1;transform:none;}',
      '.c-ch7-diff-head{display:flex;align-items:center;gap:10px;padding:10px 16px;border-bottom:1px solid var(--border);background:var(--pane);font-size:12.5px;color:var(--dim);flex-wrap:wrap;}',
      '.c-ch7-diff-head .cmd{color:var(--c-teal);}',
      '.c-ch7-diff-head .vs{color:var(--git);font-weight:700;}',
      '.c-ch7-diff-file{padding:8px 16px;color:var(--c-amber);border-bottom:1px solid var(--border);background:rgba(251,191,36,.05);}',
      '.c-ch7-diff-body{padding:6px 0;}',
      '.c-ch7-line{display:block;padding:2px 16px 2px 36px;white-space:pre-wrap;word-break:break-word;position:relative;line-height:1.6;}',
      '.c-ch7-line::before{position:absolute;left:14px;width:14px;text-align:center;color:var(--dim);}',
      '.c-ch7-line.ctx{color:var(--dim);}',
      '.c-ch7-line.ctx::before{content:" ";}',
      '.c-ch7-line.del{color:#F8B4B4;background:rgba(248,81,73,.13);}',
      '.c-ch7-line.del::before{content:"-";color:#F87171;}',
      '.c-ch7-line.add{color:#9BE9A8;background:rgba(63,185,80,.14);}',
      '.c-ch7-line.add::before{content:"+";color:#4ADE80;}',
      '.c-ch7-line.hunk{color:var(--c-purple);background:rgba(167,139,250,.08);}',
      '.c-ch7-line.hunk::before{content:"@";}',
      '.c-ch7-diff-empty{padding:18px 16px;color:var(--dim);text-align:center;font-family:var(--font-sans);}',
      '.c-ch7-aihost{max-width:560px;margin:0 auto;width:100%;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ====================================================== */
  /* 屏 7.1 — 比较两次提交                                   */
  /* ====================================================== */
  window.registerScreen({
    chapter: 7,
    chapterName: 'git diff',
    id: 'diff',
    title: '比较两次提交',
    subtitle: '点两个版本，看改了啥',
    render: function (stage, api) {
      injectStyle();

      /* 时间线节点：从旧到新（hash + 一句改动说明） */
      var NODES = [
        { id: 'a1b2c3d', msg: '初版登录' },
        { id: 'e4f5g6h', msg: '修空指针' },
        { id: 'b8c9d0e', msg: '加记住我' },
        { id: 'f1a2b3c', msg: '改文案' }
      ];

      /* 2-3 组不同 diff 文本，按"选了哪两个节点"轮换。
         key = 旧id + '>' + 新id；默认兜底用 DIFF_DEFAULT。 */
      var DIFFS = {
        'a1b2c3d>e4f5g6h': {
          file: 'src/login.js',
          lines: [
            { t: 'hunk', s: '@@ login() 防一下空指针 @@' },
            { t: 'del',  s: 'function login(u){ return u.name }' },
            { t: 'add',  s: 'function login(u){ return u?.name }' }
          ]
        },
        'e4f5g6h>b8c9d0e': {
          file: 'src/login.js',
          lines: [
            { t: 'hunk', s: '@@ 新增"记住我" @@' },
            { t: 'ctx',  s: 'function login(u, opts){' },
            { t: 'del',  s: '  return u?.name' },
            { t: 'add',  s: '  if (opts?.remember) setCookie(u.id)' },
            { t: 'add',  s: '  return u?.name' },
            { t: 'ctx',  s: '}' }
          ]
        },
        'b8c9d0e>f1a2b3c': {
          file: 'src/ui/strings.js',
          lines: [
            { t: 'hunk', s: '@@ 改登录按钮文案 @@' },
            { t: 'del',  s: 'export const LOGIN_BTN = "登 录"' },
            { t: 'add',  s: 'export const LOGIN_BTN = "立即登录"' }
          ]
        }
      };

      /* 跨段（跳着选）时给一个"合并视角"的兜底 diff */
      function fallbackDiff(oldId, newId) {
        return {
          file: 'src/login.js',
          lines: [
            { t: 'hunk', s: '@@ ' + oldId + ' → ' + newId + ' 累计改动 @@' },
            { t: 'del',  s: 'function login(u){ return u.name }' },
            { t: 'add',  s: 'function login(u, opts){' },
            { t: 'add',  s: '  if (opts?.remember) setCookie(u.id)' },
            { t: 'add',  s: '  return u?.name' },
            { t: 'add',  s: '}' }
          ]
        };
      }

      stage.innerHTML =
        '<h2 class="sc-h2 sc-center">git diff：看两个版本差在哪</h2>' +
        '<div class="c-ch7-wrap">' +
          '<p class="c-ch7-hint" id="c-ch7-hint">在下面的时间线上，依次点 <b>两个</b> 提交（先点旧的、再点新的），下面会弹出它俩的差异。</p>' +
          '<div class="c-ch7-pickpill" id="c-ch7-pick">' +
            '<span class="slot" data-slot="0">旧版本 ·······</span>' +
            '<span class="arrow">⇄</span>' +
            '<span class="slot" data-slot="1">新版本 ·······</span>' +
          '</div>' +
          '<div class="c-ch7-timeline" id="c-ch7-tl"></div>' +
          '<div class="c-ch7-diff" id="c-ch7-diff" data-interactive="1">' +
            '<div class="c-ch7-diff-empty" id="c-ch7-diffempty">选满两个提交后，这里出现 diff（红行=删掉，绿行=加上）。</div>' +
          '</div>' +
          '<div class="c-ch7-aihost" id="c-ch7-aihost"></div>' +
        '</div>';

      /* ---- 画时间线（自绘 SVG） ---- */
      var SVGNS = 'http://www.w3.org/2000/svg';
      var tlHost = stage.querySelector('#c-ch7-tl');
      var n = NODES.length;
      var GAP = 200, X0 = 90, Y = 56, W = X0 + (n - 1) * GAP + 90, H = 110;
      var svg = document.createElementNS(SVGNS, 'svg');
      svg.setAttribute('class', 'c-ch7-tl-svg');
      svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      // 连线
      var edge = document.createElementNS(SVGNS, 'path');
      edge.setAttribute('class', 'c-ch7-tl-edge');
      edge.setAttribute('d', 'M' + X0 + ',' + Y + ' L' + (X0 + (n - 1) * GAP) + ',' + Y);
      svg.appendChild(edge);

      var nodeEls = [];
      NODES.forEach(function (node, i) {
        var cx = X0 + i * GAP;
        var g = document.createElementNS(SVGNS, 'g');
        g.setAttribute('class', 'c-ch7-node');
        g.setAttribute('transform', 'translate(' + cx + ',' + Y + ')');
        g.setAttribute('data-interactive', '1');
        g.setAttribute('data-id', node.id);
        var circ = document.createElementNS(SVGNS, 'circle');
        circ.setAttribute('class', 'ndot');
        circ.setAttribute('r', 18);
        circ.setAttribute('cx', 0);
        circ.setAttribute('cy', 0);
        g.appendChild(circ);
        var badge = document.createElementNS(SVGNS, 'text');
        badge.setAttribute('class', 'badge');
        badge.textContent = ''; // 选中顺序角标（旧/新）
        g.appendChild(badge);
        var hash = document.createElementNS(SVGNS, 'text');
        hash.setAttribute('class', 'hash');
        hash.setAttribute('y', 38);
        hash.textContent = node.id;
        g.appendChild(hash);
        var msg = document.createElementNS(SVGNS, 'text');
        msg.setAttribute('class', 'msg');
        msg.setAttribute('y', 54);
        msg.textContent = node.msg;
        g.appendChild(msg);
        svg.appendChild(g);
        nodeEls.push({ g: g, badge: badge, id: node.id });
      });
      tlHost.appendChild(svg);

      var diffPanel = stage.querySelector('#c-ch7-diff');
      var pickEl = stage.querySelector('#c-ch7-pick');
      var slots = pickEl.querySelectorAll('.slot');
      var hintEl = stage.querySelector('#c-ch7-hint');

      /* ---- 选择状态（render 内部局部状态 → 重渲染即归零，幂等） ---- */
      var picks = []; // 存 id，最多 2 个

      function idShort(id) { return id; }

      function renderPicks() {
        nodeEls.forEach(function (ne) {
          var k = picks.indexOf(ne.id);
          if (k === 0) { ne.g.classList.add('sel'); ne.badge.textContent = '旧'; }
          else if (k === 1) { ne.g.classList.add('sel'); ne.badge.textContent = '新'; }
          else { ne.g.classList.remove('sel'); ne.badge.textContent = ''; }
        });
        slots[0].textContent = picks[0] ? idShort(picks[0]) : '旧版本 ·······';
        slots[0].classList.toggle('filled', !!picks[0]);
        slots[1].textContent = picks[1] ? idShort(picks[1]) : '新版本 ·······';
        slots[1].classList.toggle('filled', !!picks[1]);
      }

      function lineHTML(ln) {
        // textContent-safe：手动转义
        var esc = ln.s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        return '<span class="c-ch7-line ' + ln.t + '">' + esc + '</span>';
      }

      function showDiff() {
        if (picks.length < 2) {
          diffPanel.classList.remove('show');
          diffPanel.innerHTML = '<div class="c-ch7-diff-empty" id="c-ch7-diffempty">选满两个提交后，这里出现 diff（红行=删掉，绿行=加上）。</div>';
          return;
        }
        var oldId = picks[0], newId = picks[1];
        var key = oldId + '>' + newId;
        var d = DIFFS[key] || fallbackDiff(oldId, newId);
        var body = d.lines.map(lineHTML).join('');
        diffPanel.innerHTML =
          '<div class="c-ch7-diff-head">' +
            '<span class="cmd">$ git diff ' + oldId + ' ' + newId + '</span>' +
            '<span class="vs">（' + oldId + ' ⇄ ' + newId + '）</span>' +
          '</div>' +
          '<div class="c-ch7-diff-file">' + d.file + '</div>' +
          '<div class="c-ch7-diff-body">' + body + '</div>';
        // 触发淡入
        void diffPanel.offsetWidth;
        diffPanel.classList.add('show');
      }

      function pick(id) {
        var existing = picks.indexOf(id);
        if (existing !== -1) {
          // 再次点同一个 → 取消选它
          picks.splice(existing, 1);
        } else if (picks.length < 2) {
          picks.push(id);
        } else {
          // 已满两个：开始新一轮，从这个开始
          picks = [id];
        }
        renderPicks();
        if (picks.length === 2) {
          hintEl.innerHTML = '换两个节点试试 → diff 内容会跟着变。再点已选中的可取消。';
        } else {
          hintEl.innerHTML = '在下面的时间线上，依次点 <b>两个</b> 提交（先点旧的、再点新的），下面会弹出它俩的差异。';
        }
        showDiff();
      }

      nodeEls.forEach(function (ne) {
        ne.g.addEventListener('click', function (e) {
          e.stopPropagation();
          pick(ne.id);
        });
      });

      // 重置本屏：清空选择
      api.onReset(function () { picks = []; });

      /* ---- AI 卡片 ---- */
      var aiHost = stage.querySelector('#c-ch7-aihost');
      var card = api.aiCard({
        effect: '让 AI 说清两个版本差在哪',
        say: '比较 a1b2c3d 和 e4f5g6h，改了哪些东西',
        cmd: 'git diff a1b2c3d e4f5g6h'
      });
      aiHost.appendChild(card);

      /* ---- 初始：预选第一组，给观众一个"看得见的成果"，可随意改 ----
         时间线 + 取数槽一进来就在、随时可点（互动不依赖分步）。 */
      picks = ['a1b2c3d', 'e4f5g6h'];
      renderPicks();
      showDiff();

      /* ---- 分步：仅把 AI 卡作为一个揭示步（让讲解有节奏） ---- */
      api.frag(aiHost);
    }
  });

})();
