/* ============================================================
   sc-ch2.js  —  第 2 章 · Commit：版本控制的原子
   屏 2.1 what-commit / 2.2 commit-message / 2.3 commit-hash
   只调用 window.registerScreen(...)，不实现框架。
   主题：你不背命令，你只理解效果，然后用人话告诉 AI。
   所有 class 前缀 c-ch2-，render 幂等。
   ============================================================ */
(function () {
  "use strict";

  var CH = 2;
  var CHNAME = "Commit：版本控制的原子";

  /* 一次性注入本章用到的样式（幂等：用 id 守卫） */
  function injectCSS() {
    if (document.getElementById("c-ch2-style")) return;
    var s = document.createElement("style");
    s.id = "c-ch2-style";
    s.textContent = [
      /* ---------- 时间线 (2.1) ---------- */
      ".c-ch2-tl-wrap{width:100%;max-width:1080px;margin:14px auto 0}",
      ".c-ch2-tl-svg{width:100%;display:block;overflow:visible}",
      ".c-ch2-tl-edge{stroke:var(--border);stroke-width:4;fill:none;",
        "transition:stroke .4s var(--ease),opacity .4s var(--ease);opacity:.25}",
      ".c-ch2-tl-edge.on{stroke:var(--git);opacity:.9}",
      ".c-ch2-tl-node{cursor:pointer}",
      ".c-ch2-tl-node circle{stroke:#010409;stroke-width:2;fill:var(--ghost);opacity:.25;",
        "transition:fill .45s var(--ease),opacity .45s var(--ease),r .3s var(--ease),filter .3s}",
      ".c-ch2-tl-node.on circle{fill:var(--git);opacity:1;filter:drop-shadow(0 0 8px rgba(240,81,51,.6))}",
      ".c-ch2-tl-node.on.pop circle{animation:cCh2Pop .45s var(--ease)}",
      "@keyframes cCh2Pop{0%{transform:scale(.2)}60%{transform:scale(1.25)}100%{transform:scale(1)}}",
      ".c-ch2-tl-node:hover circle{filter:drop-shadow(0 0 11px rgba(240,81,51,.9))}",
      ".c-ch2-tl-num{font-family:var(--font-mono);font-size:15px;font-weight:800;fill:#fff;",
        "text-anchor:middle;dominant-baseline:central;pointer-events:none;opacity:0;transition:opacity .4s}",
      ".c-ch2-tl-node.on .c-ch2-tl-num{opacity:1}",
      ".c-ch2-tl-cap{font-family:var(--font-sans);font-size:13px;fill:var(--dim);",
        "text-anchor:middle;pointer-events:none;opacity:0;transition:opacity .4s}",
      ".c-ch2-tl-node.on .c-ch2-tl-cap{opacity:1;fill:var(--text)}",
      ".c-ch2-tl-hint{text-align:center;color:var(--dim);font-size:13px;margin-top:10px;",
        "font-family:var(--font-mono)}",
      /* 弹出卡片 (2.1) */
      ".c-ch2-pop{position:fixed;z-index:70;min-width:230px;max-width:300px;",
        "background:var(--pane);border:1px solid var(--git);border-radius:14px;",
        "padding:16px 18px;box-shadow:0 14px 40px rgba(0,0,0,.55);",
        "transform:translate(-50%,calc(-100% - 14px));pointer-events:none;",
        "animation:cCh2PopIn .25s var(--ease)}",
      "@keyframes cCh2PopIn{from{opacity:0;transform:translate(-50%,calc(-100% - 4px))}",
        "to{opacity:1;transform:translate(-50%,calc(-100% - 14px))}}",
      ".c-ch2-pop .row{display:flex;gap:8px;font-size:13px;line-height:1.7}",
      ".c-ch2-pop .row .k{color:var(--dim);min-width:64px}",
      ".c-ch2-pop .row .v{color:var(--text);font-family:var(--font-mono)}",
      ".c-ch2-pop .blur{filter:blur(4px);user-select:none}",
      ".c-ch2-pop .msg{font-weight:700;margin-bottom:8px;font-size:14px}",
      ".c-ch2-pop .foot{margin-top:8px;color:var(--dim);font-size:11.5px}",
      /* ---------- commit message (2.2) ---------- */
      ".c-ch2-msg-stage{display:flex;flex-direction:column;align-items:center;gap:22px;width:100%}",
      ".c-ch2-msg-node{position:relative;display:flex;flex-direction:column;align-items:center}",
      ".c-ch2-msg-bubble{position:relative;max-width:520px;min-width:260px;",
        "background:var(--pane2);border:1px solid var(--border);border-radius:14px;",
        "padding:12px 18px;font-size:16px;line-height:1.5;text-align:center;",
        "transition:border-color .3s var(--ease),color .3s}",
      ".c-ch2-msg-bubble::after{content:'';position:absolute;left:50%;bottom:-9px;",
        "transform:translateX(-50%);border:9px solid transparent;border-top-color:var(--border)}",
      ".c-ch2-msg-bubble.good{border-color:var(--c-teal);color:#d7fbf4}",
      ".c-ch2-msg-bubble.good::after{border-top-color:var(--c-teal)}",
      ".c-ch2-msg-bubble.bad{border-color:var(--git);color:#ffd9d2}",
      ".c-ch2-msg-bubble.bad::after{border-top-color:var(--git)}",
      ".c-ch2-msg-bubble .ph{color:var(--dim)}",
      ".c-ch2-msg-dot{width:54px;height:54px;border-radius:50%;background:var(--git);",
        "margin-top:14px;display:flex;align-items:center;justify-content:center;",
        "font-family:var(--font-mono);font-weight:800;color:#fff;font-size:18px;",
        "box-shadow:0 0 14px rgba(240,81,51,.5);border:2px solid #010409}",
      ".c-ch2-msg-input{width:min(560px,92vw);font-family:var(--font-mono);font-size:15px;",
        "padding:12px 16px;border-radius:11px;background:#010409;color:var(--text);",
        "border:1px solid var(--border);outline:none;transition:border-color .2s}",
      ".c-ch2-msg-input:focus{border-color:var(--git)}",
      ".c-ch2-msg-cmp{display:grid;grid-template-columns:1fr 1fr;gap:14px;width:min(720px,94vw)}",
      "@media(max-width:560px){.c-ch2-msg-cmp{grid-template-columns:1fr}}",
      ".c-ch2-cmp-card{border-radius:13px;padding:14px 16px;cursor:pointer;",
        "background:var(--pane);border:1px solid var(--border);transition:transform .15s var(--ease),border-color .15s}",
      ".c-ch2-cmp-card:hover{transform:translateY(-2px)}",
      ".c-ch2-cmp-card.good{border-color:var(--c-teal)}",
      ".c-ch2-cmp-card.bad{border-color:var(--git)}",
      ".c-ch2-cmp-card .tag{font-size:13px;font-weight:700;margin-bottom:6px}",
      ".c-ch2-cmp-card.good .tag{color:var(--c-teal)}",
      ".c-ch2-cmp-card.bad .tag{color:var(--git)}",
      ".c-ch2-cmp-card .ex{font-family:var(--font-mono);font-size:14px;color:var(--text)}",
      ".c-ch2-cmp-card .why{font-size:12.5px;color:var(--dim);margin-top:6px;line-height:1.5}",
      /* ---------- hash (2.3) ---------- */
      ".c-ch2-hash-stage{display:flex;flex-direction:column;align-items:center;gap:18px;width:100%}",
      ".c-ch2-hashbox{display:flex;align-items:center;gap:16px;flex-wrap:wrap;justify-content:center}",
      ".c-ch2-hash-dot{width:60px;height:60px;border-radius:50%;background:var(--git);",
        "display:flex;align-items:center;justify-content:center;color:#fff;font-size:24px;",
        "box-shadow:0 0 16px rgba(240,81,51,.5);border:2px solid #010409;flex:none}",
      ".c-ch2-hash-str{font-family:var(--font-mono);font-size:clamp(20px,3.6vw,34px);",
        "letter-spacing:.04em;cursor:pointer;user-select:all;white-space:nowrap}",
      ".c-ch2-hash-short{color:var(--git);font-weight:800;transition:font-size .2s var(--ease),text-shadow .2s;",
        "border-radius:6px;padding:0 2px}",
      ".c-ch2-hash-str:hover .c-ch2-hash-short{font-size:1.18em;text-shadow:0 0 14px rgba(240,81,51,.8)}",
      ".c-ch2-hash-rest{color:var(--dim)}",
      ".c-ch2-hash-tip{font-size:13px;color:var(--c-teal);font-family:var(--font-mono);height:18px;",
        "opacity:0;transition:opacity .2s}",
      ".c-ch2-hash-str:hover + .c-ch2-hash-tip,.c-ch2-hash-tip.force{opacity:1}",
      ".c-ch2-hash-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center}",
      ".c-ch2-toast{position:fixed;left:50%;bottom:70px;transform:translateX(-50%) translateY(12px);",
        "z-index:75;background:var(--pane2);border:1px solid var(--c-teal);color:var(--c-teal);",
        "padding:9px 18px;border-radius:999px;font-size:13px;font-family:var(--font-mono);",
        "opacity:0;pointer-events:none;transition:opacity .25s,transform .25s var(--ease)}",
      ".c-ch2-toast.show{opacity:1;transform:translateX(-50%) translateY(0)}",
      ".c-ch2-chat{position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:74;",
        "max-width:420px;width:min(420px,90vw);background:var(--pane);border:1px solid var(--c-purple);",
        "border-radius:16px 16px 16px 6px;padding:14px 18px;box-shadow:0 14px 40px rgba(0,0,0,.55);",
        "opacity:0;pointer-events:none;transition:opacity .3s,transform .3s var(--ease)}",
      ".c-ch2-chat.show{opacity:1;transform:translateX(-50%) translateY(-6px)}",
      ".c-ch2-chat .who{color:var(--c-purple);font-weight:700;font-size:13px;margin-bottom:5px}",
      ".c-ch2-chat .txt{font-size:15px;line-height:1.5}",
      ".c-ch2-chat .typing{color:var(--dim);font-family:var(--font-mono)}"
    ].join("");
    document.head.appendChild(s);
  }

  /* 把任意元素安全清除（用于幂等清理弹层） */
  function killStray(sel) {
    var n = document.querySelectorAll(sel);
    for (var i = 0; i < n.length; i++) if (n[i].parentNode) n[i].parentNode.removeChild(n[i]);
  }

  var SVGNS = "http://www.w3.org/2000/svg";
  function s(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  /* ============================================================
     屏 2.1 — 什么是 commit
     ============================================================ */
  var TL = [
    { num: "#1", cap: "第一版" },
    { num: "#2", cap: "第二版" },
    { num: "#3", cap: "第三版" },
    { num: "#4", cap: "定稿版" },
    { num: "#5", cap: "最终版" },
    { num: "#6", cap: "打死不改最终版" }
  ];
  var TL_META = [
    { msg: "初始化项目骨架", date: "周一 09:12", author: "你", hash: "f0a1b2c" },
    { msg: "加上登录页面", date: "周一 15:40", author: "你", hash: "9c3d4e5" },
    { msg: "接入数据库", date: "周二 11:02", author: "你", hash: "1a2b3c4" },
    { msg: "准备上线，定稿", date: "周三 18:30", author: "你", hash: "d5e6f70" },
    { msg: "改了文案，真最终", date: "周四 10:15", author: "你", hash: "7b8c9d0" },
    { msg: "老板又要改…最后一次", date: "周五 20:48", author: "你", hash: "e1f2a3b" }
  ];

  window.registerScreen({
    chapter: CH,
    chapterName: CHNAME,
    id: "what-commit",
    title: "什么是 commit",
    subtitle: "上一章那一排小圆点——每个点，就是一次 commit",
    render: function (stage, api) {
      injectCSS();
      killStray(".c-ch2-pop");

      stage.appendChild(h("div", "sc-pill", "上一章的小圆点，揭晓了"));
      var hh = h("h1", "sc-h1");
      hh.style.marginTop = "12px";
      hh.innerHTML = "一次 <span style='color:var(--git)'>commit</span> ＝ 给项目按一次「保存」，存下当前这一版";
      stage.appendChild(hh);
      var lead = h("p", "sc-lead sc-dim");
      lead.style.marginTop = "10px";
      lead.innerHTML = "就像在 Word 里按 <b style='color:var(--text)'>Ctrl+S</b> 存一版——只不过 Git 会把每一版都好好排成一串，随时翻回去看。";
      stage.appendChild(lead);

      /* 时间线 SVG：横向 6 节点 */
      var W = 1080, H = 240;
      var pad = 90, gap = (W - pad * 2) / (TL.length - 1);
      var cy = 96;
      var wrap = h("div", "c-ch2-tl-wrap");
      var svg = s("svg", { "class": "c-ch2-tl-svg", viewBox: "0 0 " + W + " " + H });
      wrap.appendChild(svg);
      stage.appendChild(wrap);

      var hint = h("div", "c-ch2-tl-hint", "← / → 让版本依次生长 · 点任一节点看它的身份信息");
      stage.appendChild(hint);

      var edges = [], nodes = [];
      // edges first (under nodes)
      for (var i = 1; i < TL.length; i++) {
        var x1 = pad + (i - 1) * gap, x2 = pad + i * gap;
        var ed = s("path", { "class": "c-ch2-tl-edge", d: "M" + x1 + "," + cy + " L" + x2 + "," + cy });
        svg.appendChild(ed); edges.push(ed);
      }
      for (var j = 0; j < TL.length; j++) {
        var cx = pad + j * gap;
        var g = s("g", { "class": "c-ch2-tl-node", transform: "translate(" + cx + "," + cy + ")" });
        g.appendChild(s("circle", { r: 24, cx: 0, cy: 0 }));
        var num = s("text", { "class": "c-ch2-tl-num", x: 0, y: 0 }); num.textContent = TL[j].num;
        g.appendChild(num);
        var cap = s("text", { "class": "c-ch2-tl-cap", x: 0, y: 52 }); cap.textContent = TL[j].cap;
        g.appendChild(cap);
        svg.appendChild(g); nodes.push(g);
        bindNodeClick(g, j, cx, cy, svg);
      }

      function bindNodeClick(g, idx, ux, uy, svgRoot) {
        g.setAttribute("data-interactive", "1");
        g.addEventListener("click", function (e) {
          e.stopPropagation();
          if (!g.classList.contains("on")) return; // 还没点亮的节点不弹卡
          showCard(idx, ux, uy, svgRoot);
        });
      }

      function showCard(idx, ux, uy, svgRoot) {
        killStray(".c-ch2-pop");
        var pt = svgRoot.createSVGPoint(); pt.x = ux; pt.y = uy;
        var ctm = svgRoot.getScreenCTM();
        var px = window.innerWidth / 2, py = window.innerHeight / 2;
        if (ctm) { var sp = pt.matrixTransform(ctm); px = sp.x; py = sp.y - 26; }
        var m = TL_META[idx];
        var pop = h("div", "c-ch2-pop");
        pop.innerHTML =
          '<div class="msg">' + esc(TL[idx].num) + " " + esc(TL[idx].cap) + "</div>" +
          '<div class="row"><span class="k">message</span><span class="v">' + esc(m.msg) + "</span></div>" +
          '<div class="row"><span class="k">日期</span><span class="v">' + esc(m.date) + "</span></div>" +
          '<div class="row"><span class="k">作者</span><span class="v">' + esc(m.author) + "</span></div>" +
          '<div class="row"><span class="k">hash</span><span class="v blur">' + esc(m.hash) + "</span></div>" +
          '<div class="foot">message / 日期 / 作者 / hash 后面几屏细讲 →</div>';
        pop.style.left = px + "px"; pop.style.top = py + "px";
        document.body.appendChild(pop);
        clearTimeout(showCard._t);
        showCard._t = setTimeout(function () { killStray(".c-ch2-pop"); }, 3600);
      }

      function light(idx, animated) {
        edges.slice(0, idx).forEach(function (e) { e.classList.add("on"); });
        for (var k = 0; k <= idx; k++) {
          nodes[k].classList.add("on");
          if (animated && k === idx) {
            nodes[k].classList.add("pop");
            (function (nn) { setTimeout(function () { nn.classList.remove("pop"); }, 460); })(nodes[k]);
          }
        }
      }

      /* 6 节点从左到右依次点亮（分步） */
      for (var stp = 0; stp < TL.length; stp++) {
        (function (idx) {
          api.step(function (animated) { light(idx, animated); });
        })(stp);
      }

      api.onReset(function () { killStray(".c-ch2-pop"); });
    }
  });

  /* ============================================================
     屏 2.2 — commit message
     ============================================================ */
  window.registerScreen({
    chapter: CH,
    chapterName: CHNAME,
    id: "commit-message",
    title: "commit message",
    subtitle: "每次提交写一句话说明你干了啥",
    render: function (stage, api) {
      injectCSS();

      stage.appendChild(h("div", "sc-pill", "写给未来的你和队友"));
      var hh = h("h2", "sc-h2"); hh.style.marginTop = "12px";
      hh.textContent = "每次提交，写一句话说明你干了啥。";
      stage.appendChild(hh);

      var box = h("div", "c-ch2-msg-stage"); box.style.marginTop = "8px";
      stage.appendChild(box);

      /* 放大的节点 + 上方实时气泡 */
      var nodeWrap = h("div", "c-ch2-msg-node");
      var bubble = h("div", "c-ch2-msg-bubble");
      bubble.innerHTML = '<span class="ph">在下面输入框敲字，这里会实时显示…</span>';
      var dot = h("div", "c-ch2-msg-dot", "✓");
      nodeWrap.appendChild(bubble); nodeWrap.appendChild(dot);
      box.appendChild(nodeWrap);

      var input = h("input", "c-ch2-msg-input");
      input.type = "text";
      input.placeholder = "例如：修复登录按钮点击无反应";
      input.setAttribute("data-interactive", "1");
      input.value = "";
      box.appendChild(input);

      function refresh() {
        var v = input.value;
        bubble.classList.remove("good", "bad");
        if (!v) {
          bubble.innerHTML = '<span class="ph">在下面输入框敲字，这里会实时显示…</span>';
          return;
        }
        bubble.textContent = v;
      }
      input.addEventListener("input", refresh);

      /* 第 1 步：好 / 坏 对比卡 */
      var cmp = h("div", "c-ch2-msg-cmp"); cmp.style.marginTop = "6px";
      var good = h("div", "c-ch2-cmp-card good");
      good.innerHTML = '<div class="tag">✅ 好的 message</div>' +
        '<div class="ex">修复登录按钮点击无反应</div>' +
        '<div class="why">说清了「改了什么、解决了什么问题」，半年后也看得懂。</div>';
      var bad = h("div", "c-ch2-cmp-card bad");
      bad.innerHTML = '<div class="tag">❌ 偷懒的 message</div>' +
        '<div class="ex">update</div>' +
        '<div class="why">等于没写。回头翻历史，根本不知道这一版动了啥。</div>';
      cmp.appendChild(good); cmp.appendChild(bad);
      api.frag(cmp);
      box.appendChild(cmp);

      /* 点卡片 → 把示例灌进输入框 + 气泡，并给气泡上色 */
      good.setAttribute("data-interactive", "1");
      bad.setAttribute("data-interactive", "1");
      good.addEventListener("click", function (e) {
        e.stopPropagation();
        input.value = "修复登录按钮点击无反应";
        bubble.classList.remove("bad"); bubble.classList.add("good");
        bubble.textContent = input.value;
      });
      bad.addEventListener("click", function (e) {
        e.stopPropagation();
        input.value = "update";
        bubble.classList.remove("good"); bubble.classList.add("bad");
        bubble.textContent = input.value;
      });

      /* 第 2 步：把「效果→人话」收口（贴合主题词） */
      var card = h("div", "sc-card"); card.style.marginTop = "4px"; card.style.maxWidth = "720px";
      card.innerHTML =
        '<p class="sc-p"><b>你不用记 <span class="sc-mono">git commit -m</span> 怎么写</b>——' +
        "你只要用人话描述清楚『这一版我干了啥』，AI 就能替你提交得明明白白。</p>";
      api.frag(card);
      box.appendChild(card);

      /* 回退 / 重置时清空输入，保证幂等观感 */
      api.onReset(function () { input.value = ""; refresh(); });
    }
  });

  /* ============================================================
     屏 2.3 — commit id / hash（长短 id）
     ============================================================ */
  var FULL_HASH = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0";
  var SHORT_HASH = "a1b2c3d";

  window.registerScreen({
    chapter: CH,
    chapterName: CHNAME,
    id: "commit-hash",
    title: "commit id / hash",
    subtitle: "每一版的身份证：长 id 前 7 位 ＝ 短 id",
    render: function (stage, api) {
      injectCSS();
      killStray(".c-ch2-toast,.c-ch2-chat");

      stage.appendChild(h("div", "sc-pill", "commit id / hash"));
      var hh = h("h2", "sc-h2"); hh.style.marginTop = "12px";
      hh.textContent = "每次 commit，Git 自动算出一个唯一哈希值。";
      stage.appendChild(hh);

      var box = h("div", "c-ch2-hash-stage"); box.style.marginTop = "10px";
      stage.appendChild(box);

      /* 节点 + 哈希串 */
      var hashBox = h("div", "c-ch2-hashbox");
      var dot = h("div", "c-ch2-hash-dot", "●");
      var hashStr = h("div", "c-ch2-hash-str sc-mono");
      hashStr.setAttribute("data-interactive", "1");
      hashStr.innerHTML =
        '<span class="c-ch2-hash-short">' + SHORT_HASH + "</span>" +
        '<span class="c-ch2-hash-rest">' + FULL_HASH.slice(SHORT_HASH.length) + "</span>";
      hashBox.appendChild(dot); hashBox.appendChild(hashStr);
      box.appendChild(hashBox);

      var tip = h("div", "c-ch2-hash-tip", "↑ 悬停时高亮的前 7 位，就是「短 id」");
      box.appendChild(tip);

      /* 第 1 步：解释长短 id（卡片） */
      var grid = h("div", "sc-grid");
      grid.style.gridTemplateColumns = "repeat(auto-fit,minmax(220px,1fr))";
      grid.style.maxWidth = "820px"; grid.style.width = "100%";
      var c1 = h("div", "sc-card");
      c1.innerHTML = '<p class="sc-p"><b style="color:var(--git)">前 7 位 ＝ 短 id</b><br>' +
        '<span class="sc-dim">长 id 和短 id 功能完全一样，平时报短的就够。</span></p>';
      var c2 = h("div", "sc-card");
      c2.innerHTML = '<p class="sc-p"><b style="color:var(--c-teal)">仓库内唯一</b><br>' +
        '<span class="sc-dim">像版本的身份证 / 代号——可以拿它和 AI 精确指代「某一版」。</span></p>';
      grid.appendChild(c1); grid.appendChild(c2);
      api.frag(grid);
      box.appendChild(grid);

      /* 第 2 步：操作区（复制 / 告诉 AI） */
      var actions = h("div", "c-ch2-hash-actions");
      var copyBtn = h("button", "sc-btn"); copyBtn.innerHTML = "📋 复制短 id";
      copyBtn.setAttribute("data-interactive", "1");
      var aiBtn = h("button", "sc-btn primary"); aiBtn.innerHTML = "💬 告诉 AI";
      aiBtn.setAttribute("data-interactive", "1");
      actions.appendChild(copyBtn); actions.appendChild(aiBtn);
      api.frag(actions);
      box.appendChild(actions);

      function toast(text) {
        killStray(".c-ch2-toast");
        var t = h("div", "c-ch2-toast", text);
        document.body.appendChild(t);
        void t.offsetWidth; t.classList.add("show");
        clearTimeout(toast._t);
        toast._t = setTimeout(function () {
          t.classList.remove("show");
          setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 300);
        }, 1800);
      }

      copyBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        var done = function () { toast("已复制短 id：" + SHORT_HASH); };
        var fail = function () {
          // 兜底：选中文本
          try {
            var r = document.createRange(); r.selectNodeContents(hashStr.firstChild);
            var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
          } catch (_) {}
          toast("已选中短 id：" + SHORT_HASH + "（按 Ctrl+C 复制）");
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(SHORT_HASH).then(done, fail);
        } else { fail(); }
      });

      aiBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        killStray(".c-ch2-chat");
        var chat = h("div", "c-ch2-chat");
        chat.innerHTML = '<div class="who">🤖 发给 AI</div>' +
          '<div class="txt typing">正在输入…</div>';
        document.body.appendChild(chat);
        void chat.offsetWidth; chat.classList.add("show");
        var line = "我说的是 " + SHORT_HASH + " 那一版";
        var i = 0, txtEl = chat.querySelector(".txt");
        clearInterval(aiBtn._iv);
        aiBtn._iv = setInterval(function () {
          i++;
          if (i > line.length) {
            clearInterval(aiBtn._iv);
            txtEl.classList.remove("typing");
            return;
          }
          txtEl.textContent = "「" + line.slice(0, i) + "」";
        }, 45);
        clearTimeout(aiBtn._hide);
        aiBtn._hide = setTimeout(function () {
          chat.classList.remove("show");
          setTimeout(function () { if (chat.parentNode) chat.parentNode.removeChild(chat); }, 320);
        }, 4200);
      });

      /* 第 3 步：预告卡——hash 是「这次提交的代号」，下一章拿它指认版本
         ⚠ 知识锁：第 2 章不讲"回退/后悔药"，这里只点明它是个可以报给 AI 的代号，
            具体能拿它做什么留到下一章揭晓（不出现 reset / 回退 / 分支 等词）。 */
      var teaser = h("div", "sc-card");
      teaser.style.marginTop = "6px"; teaser.style.maxWidth = "620px";
      teaser.innerHTML =
        '<p class="sc-p"><b style="color:var(--git)">这串代号 ＝ 这次提交的名字。</b><br>' +
        '记不住没关系——复制下来，或者直接报给 AI，就能精确指认「我说的是<span class="sc-mono">' + esc(SHORT_HASH) + '</span>那一版」。' +
        '<br><span class="sc-dim">至于拿这个代号还能让 AI 替你做什么，<b style="color:var(--c-purple)">下一章揭晓 →</b></span></p>';
      var holder = h("div"); holder.style.display = "flex"; holder.style.justifyContent = "center";
      holder.style.width = "100%";
      holder.appendChild(teaser);
      api.frag(holder);
      box.appendChild(holder);

      api.onReset(function () { killStray(".c-ch2-toast,.c-ch2-chat"); });
    }
  });

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
})();
