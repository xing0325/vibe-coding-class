/* ============================================================
   sc-ch3.js  —  第 3 章 · 本地 vs 远端 + GitHub
   屏 3.1 local-remote / 3.2 git-hub / 3.3 init-bridge
   只调用 window.registerScreen(...)，不实现框架。
   主题：你不背命令，你只理解效果，然后用人话告诉 AI。
   所有 class 前缀 c-ch3-，render 幂等。
   ============================================================ */
(function () {
  "use strict";

  var CH = 3;
  var CHNAME = "本地 vs 远端 + GitHub";

  function injectCSS() {
    if (document.getElementById("c-ch3-style")) return;
    var st = document.createElement("style");
    st.id = "c-ch3-style";
    st.textContent = [
      /* ---------- local → remote (3.1) ---------- */
      ".c-ch3-lr-wrap{width:100%;max-width:1040px;margin:14px auto 0}",
      ".c-ch3-lr-svg{width:100%;display:block;overflow:visible}",
      ".c-ch3-side-label{font-family:var(--font-mono);font-size:13px;fill:var(--dim);text-anchor:middle}",
      ".c-ch3-side-title{font-family:var(--font-sans);font-weight:800;font-size:18px;fill:var(--text);text-anchor:middle}",
      ".c-ch3-box{fill:var(--pane);stroke:var(--border);stroke-width:2}",
      ".c-ch3-box.remote{stroke:var(--c-teal)}",
      ".c-ch3-pipe{fill:none;stroke:var(--border);stroke-width:3;stroke-dasharray:8 8;opacity:.5}",
      ".c-ch3-pipe.live{stroke:var(--git);opacity:.9;animation:cCh3Flow 1s linear infinite}",
      "@keyframes cCh3Flow{to{stroke-dashoffset:-32}}",
      ".c-ch3-arrow{fill:var(--dim);transition:fill .3s}",
      ".c-ch3-arrow.live{fill:var(--git)}",
      ".c-ch3-pushlabel{font-family:var(--font-mono);font-size:13px;fill:var(--git);text-anchor:middle;font-weight:700}",
      ".c-ch3-commit{transition:opacity .3s}",
      ".c-ch3-commit circle{stroke:#010409;stroke-width:2}",
      ".c-ch3-commit-hash{font-family:var(--font-mono);font-size:11px;fill:var(--dim);",
        "text-anchor:middle;dominant-baseline:hanging;letter-spacing:.02em}",
      ".c-ch3-fly{transition:transform 1s var(--ease)}",
      ".c-ch3-lr-actions{display:flex;gap:12px;justify-content:center;margin-top:18px;flex-wrap:wrap}",
      ".c-ch3-spark{position:fixed;width:7px;height:7px;border-radius:50%;background:var(--git);",
        "z-index:65;pointer-events:none;box-shadow:0 0 8px var(--git);will-change:transform,opacity}",
      /* ---------- github = git + hub (3.2) ---------- */
      ".c-ch3-eq{display:flex;align-items:center;justify-content:center;gap:16px;flex-wrap:wrap;",
        "font-family:var(--font-mono);font-weight:800;letter-spacing:-.02em;margin-top:6px}",
      ".c-ch3-eq .t{font-size:clamp(30px,6vw,64px)}",
      ".c-ch3-eq .git{color:var(--git)}",
      ".c-ch3-eq .hub{color:var(--c-teal)}",
      ".c-ch3-eq .op{color:var(--dim);font-weight:400}",
      ".c-ch3-note{text-align:center;color:var(--dim);font-size:14px;margin-top:6px}",
      ".c-ch3-hub-wrap{width:100%;max-width:880px;margin:10px auto 0}",
      ".c-ch3-hub-svg{width:100%;display:block;overflow:visible}",
      ".c-ch3-dev{transition:opacity .3s}",
      ".c-ch3-dev .face{fill:var(--pane2);stroke:var(--border);stroke-width:2}",
      ".c-ch3-repo-icon{fill:var(--git);opacity:.9}",
      ".c-ch3-hub-core{fill:var(--pane);stroke:var(--c-teal);stroke-width:3;",
        "transition:r .5s var(--ease),filter .5s}",
      ".c-ch3-hub-core.grow{filter:drop-shadow(0 0 14px rgba(45,212,191,.5))}",
      ".c-ch3-hub-label{font-family:var(--font-mono);font-weight:800;fill:var(--c-teal);text-anchor:middle;dominant-baseline:central}",
      ".c-ch3-thrown{opacity:0}",
      ".c-ch3-brands{display:flex;gap:14px;justify-content:center;margin-top:16px;flex-wrap:wrap}",
      ".c-ch3-brand{font-family:var(--font-mono);font-size:14px;font-weight:700;cursor:default;",
        "padding:7px 14px;border-radius:10px;background:var(--pane);border:1px solid var(--border);",
        "color:var(--dim);position:relative;transition:border-color .15s,color .15s}",
      ".c-ch3-brand:hover{border-color:var(--c-purple);color:var(--text)}",
      ".c-ch3-brand .bt{position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);",
        "white-space:nowrap;background:var(--pane2);border:1px solid var(--c-purple);color:var(--text);",
        "font-size:12px;font-weight:600;padding:6px 12px;border-radius:9px;opacity:0;pointer-events:none;",
        "transition:opacity .2s}",
      ".c-ch3-brand:hover .bt{opacity:1}",
      /* ---------- git init / .gitignore (3.3) ---------- */
      ".c-ch3-init-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;width:100%;max-width:920px;margin:10px auto 0}",
      "@media(max-width:640px){.c-ch3-init-grid{grid-template-columns:1fr}}",
      ".c-ch3-folder{position:relative;min-height:210px}",
      ".c-ch3-folder .title{font-weight:700;margin-bottom:10px;font-size:15px}",
      ".c-ch3-filelist{display:flex;flex-direction:column;gap:7px;font-family:var(--font-mono);font-size:14px}",
      ".c-ch3-file{display:flex;align-items:center;gap:8px;padding:5px 9px;border-radius:8px;",
        "background:var(--pane2);border:1px solid transparent;transition:opacity .35s var(--ease),",
        "color .35s,border-color .35s,filter .35s}",
      ".c-ch3-file.dimmed{opacity:.32;filter:grayscale(1);text-decoration:line-through;color:var(--dim)}",
      ".c-ch3-file .ic{opacity:.85}",
      ".c-ch3-git-dir{display:flex;align-items:center;gap:8px;padding:5px 9px;border-radius:8px;",
        "background:rgba(240,81,51,.1);border:1px dashed var(--git);color:var(--git);",
        "font-family:var(--font-mono);font-size:14px;max-height:0;overflow:hidden;opacity:0;",
        "transition:max-height .45s var(--ease),opacity .35s,margin .45s var(--ease)}",
      ".c-ch3-git-dir.show{max-height:48px;opacity:1;margin-top:7px}",
      ".c-ch3-repo-badge{position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:11px;",
        "font-weight:700;color:var(--git);background:rgba(240,81,51,.12);border:1px solid var(--git);",
        "border-radius:999px;padding:2px 10px;opacity:0;transition:opacity .4s}",
      ".c-ch3-repo-badge.show{opacity:1}",
      ".c-ch3-ignore-file{font-family:var(--font-mono);font-size:14px;background:#010409;",
        "border:1px solid var(--border);border-radius:10px;padding:12px 14px;margin-top:6px}",
      ".c-ch3-ignore-file .fn{color:var(--c-amber);font-weight:700;margin-bottom:8px;display:block}",
      ".c-ch3-ignore-line{color:var(--c-teal);min-height:21px;line-height:1.5}",
      ".c-ch3-ignore-line.pending{opacity:.35}",
      ".c-ch3-init-actions{display:flex;gap:10px;margin-top:12px;flex-wrap:wrap}",
      /* 过桥卡 */
      ".c-ch3-bridge{width:100%;max-width:920px;margin:22px auto 0;",
        "background:linear-gradient(135deg,rgba(45,212,191,.12),rgba(167,139,250,.1));",
        "border:1px solid var(--c-teal);border-radius:18px;padding:20px 24px;",
        "display:flex;align-items:center;gap:18px;flex-wrap:wrap}",
      ".c-ch3-bridge .txt{flex:1;min-width:240px;line-height:1.6}",
      ".c-ch3-bridge .txt .ok{color:var(--c-teal);font-weight:800}",
      ".c-ch3-bridge .txt .nx{color:var(--c-purple);font-weight:700}",
      ".c-ch3-bridge a.sc-btn{text-decoration:none}"
    ].join("");
    document.head.appendChild(st);
  }

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
     屏 3.1 — local → remote
     ============================================================ */
  window.registerScreen({
    chapter: CH,
    chapterName: CHNAME,
    id: "local-remote",
    title: "local → remote",
    subtitle: "本地仓库 push 到云端远端仓库",
    render: function (stage, api) {
      injectCSS();
      killStray(".c-ch3-spark");

      stage.appendChild(h("div", "sc-pill", "本地 vs 远端"));
      var hh = h("h2", "sc-h2"); hh.style.marginTop = "12px";
      hh.innerHTML = "你的电脑里有一份仓库，云端也有一份——" +
        '<span style="color:var(--git)">push</span> 把本地的提交送上去。';
      stage.appendChild(hh);

      var W = 1040, H = 340;
      var wrap = h("div", "c-ch3-lr-wrap");
      var svg = s("svg", { "class": "c-ch3-lr-svg", viewBox: "0 0 " + W + " " + H });
      wrap.appendChild(svg);
      stage.appendChild(wrap);

      /* 左：笔记本电脑 local repo */
      var lx = 70, lyTop = 70, lw = 340, lh = 200, lcy = lyTop + lh / 2;
      var laptop = s("g", {});
      laptop.appendChild(s("rect", { "class": "c-ch3-box", x: lx, y: lyTop, width: lw, height: lh, rx: 16 }));
      // laptop glyph
      laptop.appendChild(s("rect", { x: lx + 24, y: lyTop + 22, width: 74, height: 50, rx: 5, fill: "none", stroke: "var(--dim)", "stroke-width": 3 }));
      laptop.appendChild(s("rect", { x: lx + 14, y: lyTop + 74, width: 94, height: 8, rx: 3, fill: "var(--dim)" }));
      var lt1 = s("text", { "class": "c-ch3-side-title", x: lx + lw / 2, y: lyTop - 16 }); lt1.textContent = "💻 你的电脑";
      var lt2 = s("text", { "class": "c-ch3-side-label sc-mono", x: lx + lw / 2, y: lyTop + lh + 26 }); lt2.textContent = "local repository";
      svg.appendChild(laptop); svg.appendChild(lt1); svg.appendChild(lt2);

      /* 右：云端 remote repo */
      var rx = W - 70 - lw, ryTop = 70, rw = lw, rh = lh, rcy = ryTop + rh / 2;
      var cloud = s("g", {});
      cloud.appendChild(s("rect", { "class": "c-ch3-box remote", x: rx, y: ryTop, width: rw, height: rh, rx: 16 }));
      // cloud glyph
      cloud.appendChild(s("path", {
        d: "M" + (rx + 34) + " " + (ryTop + 70) +
           " a26 26 0 0 1 6 -51 a32 32 0 0 1 60 6 a22 22 0 0 1 -4 45 z",
        fill: "none", stroke: "var(--c-teal)", "stroke-width": 3, opacity: ".8"
      }));
      var rt1 = s("text", { "class": "c-ch3-side-title", x: rx + rw / 2, y: ryTop - 16 }); rt1.textContent = "☁ 云端";
      var rt2 = s("text", { "class": "c-ch3-side-label sc-mono", x: rx + rw / 2, y: ryTop + rh + 26 }); rt2.textContent = "remote repository";
      rt2.setAttribute("fill", "var(--c-teal)");
      svg.appendChild(cloud); svg.appendChild(rt1); svg.appendChild(rt2);

      /* 中间 push 通道 */
      var pipeY = lcy;
      var pStart = lx + lw, pEnd = rx;
      var pipe = s("path", { "class": "c-ch3-pipe", d: "M" + (pStart + 8) + " " + pipeY + " L" + (pEnd - 30) + " " + pipeY });
      var arrow = s("path", { "class": "c-ch3-arrow", d: "M" + (pEnd - 30) + " " + (pipeY - 11) + " L" + (pEnd - 6) + " " + pipeY + " L" + (pEnd - 30) + " " + (pipeY + 11) + " Z" });
      var pushLbl = s("text", { "class": "c-ch3-pushlabel", x: (pStart + pEnd) / 2, y: pipeY - 20 }); pushLbl.textContent = "push ▶";
      svg.appendChild(pipe); svg.appendChild(arrow); svg.appendChild(pushLbl);

      /* 本地仓库的提交链 —— bare 裸线模式：
         ⚠ 知识锁：第 3 章还没讲分支/HEAD，这里所有点统一用 git 橙单色、
            一条直线串起来，节点下方标短 id，不出现分支标签也不出现 HEAD 旗。 */
      var BARE = "var(--git)";
      var HASHES = ["a1b2c3d", "9c3d4e5", "d5e6f70"]; // 与第 2 章风格一致的短 id
      var commits = [];
      var startX = lx + 150, startGap = 56;
      // 先画连接相邻节点的裸线（在节点下层）
      var bareLine = s("path", {
        "class": "c-ch3-bareline",
        d: "M" + startX + " " + lcy + " L" + (startX + 2 * startGap) + " " + lcy,
        fill: "none", stroke: BARE, "stroke-width": 3, opacity: ".9"
      });
      svg.appendChild(bareLine);
      for (var i = 0; i < 3; i++) {
        var g = s("g", { "class": "c-ch3-commit", transform: "translate(" + (startX + i * startGap) + "," + lcy + ")" });
        g.appendChild(s("circle", { r: 15, cx: 0, cy: 0, fill: BARE, stroke: "#010409", "stroke-width": 2 }));
        var hsh = s("text", { "class": "c-ch3-commit-hash", x: 0, y: 30 }); hsh.textContent = HASHES[i];
        g.appendChild(hsh);
        svg.appendChild(g);
        commits.push({ g: g, lx: startX + i * startGap, rxTarget: rx + 70 + i * startGap });
      }

      /* push 状态：moved=true 时节点落在云端侧 */
      function place(moved) {
        commits.forEach(function (c) {
          var x = moved ? c.rxTarget : c.lx;
          c.g.setAttribute("transform", "translate(" + x + "," + lcy + ")");
        });
        // 裸线跟随：本地态连本地链，已推送态连云端链
        var s0 = moved ? commits[0].rxTarget : commits[0].lx;
        var s2 = moved ? commits[2].rxTarget : commits[2].lx;
        bareLine.setAttribute("d", "M" + s0 + " " + lcy + " L" + s2 + " " + lcy);
        pipe.classList.toggle("live", !!moved);
        arrow.classList.toggle("live", !!moved);
      }

      function spark(fromX, fromY, toX, toY) {
        var sp = h("div", "c-ch3-spark");
        sp.style.left = fromX + "px"; sp.style.top = fromY + "px";
        document.body.appendChild(sp);
        void sp.offsetWidth;
        sp.style.transition = "transform .9s var(--ease),opacity .9s";
        sp.style.transform = "translate(" + (toX - fromX) + "px," + (toY - fromY) + "px)";
        sp.style.opacity = "0";
        setTimeout(function () { if (sp.parentNode) sp.parentNode.removeChild(sp); }, 1000);
      }

      var btnWrap = h("div", "c-ch3-lr-actions");
      var pushBtn = h("button", "sc-btn primary"); pushBtn.innerHTML = "⬆ push";
      pushBtn.setAttribute("data-interactive", "1");
      var resetBtn = h("button", "sc-btn"); resetBtn.innerHTML = "↺ 拉回来看一次";
      resetBtn.setAttribute("data-interactive", "1");
      btnWrap.appendChild(pushBtn); btnWrap.appendChild(resetBtn);
      stage.appendChild(btnWrap);

      var aiHolder = h("div"); aiHolder.style.display = "flex"; aiHolder.style.justifyContent = "center";
      aiHolder.style.marginTop = "16px"; aiHolder.style.width = "100%";
      var aiCard = api.aiCard({
        effect: "把本地改动同步到云端",
        say: "帮我把代码推到 GitHub 上",
        cmd: "git push"
      });
      aiHolder.appendChild(aiCard);
      api.frag(aiHolder);
      stage.appendChild(aiHolder);

      function doPush() {
        // 飞行粒子（用页面坐标）
        var ctm = svg.getScreenCTM();
        if (ctm) {
          commits.forEach(function (c, k) {
            var p1 = svg.createSVGPoint(); p1.x = c.lx; p1.y = lcy;
            var p2 = svg.createSVGPoint(); p2.x = c.rxTarget; p2.y = lcy;
            var a = p1.matrixTransform(ctm), b = p2.matrixTransform(ctm);
            setTimeout(function () { spark(a.x, a.y, b.x, b.y); }, k * 130);
          });
        }
        place(true);
      }

      pushBtn.addEventListener("click", function (e) { e.stopPropagation(); doPush(); });
      resetBtn.addEventListener("click", function (e) { e.stopPropagation(); place(false); });

      /* step：点「下一步」也能演示 push（兼容键盘流） */
      place(false);
      api.step(function (animated) {
        if (animated) doPush(); else place(true);
      });

      api.onReset(function () { place(false); killStray(".c-ch3-spark"); });
    }
  });

  /* ============================================================
     屏 3.2 — github = git + hub
     ============================================================ */
  window.registerScreen({
    chapter: CH,
    chapterName: CHNAME,
    id: "git-hub",
    title: "github = git + hub",
    subtitle: "git 是工具，hub 是大家共用的枢纽",
    render: function (stage, api) {
      injectCSS();

      var eq = h("div", "c-ch3-eq");
      eq.innerHTML =
        '<span class="t"><span class="git">git</span><span class="hub">hub</span></span>' +
        '<span class="t op">=</span>' +
        '<span class="t git">git</span>' +
        '<span class="t op">+</span>' +
        '<span class="t hub">hub</span>';
      stage.appendChild(eq);
      var note = h("div", "c-ch3-note");
      note.innerHTML = "git ＝ 版本控制工具（你已经懂了） · <b style='color:var(--c-teal)'>hub ＝ 集合 / 枢纽</b>";
      stage.appendChild(note);

      /* hub 图：开发者把小仓库投进中央 hub */
      var W = 880, H = 380;
      var wrap = h("div", "c-ch3-hub-wrap");
      var svg = s("svg", { "class": "c-ch3-hub-svg", viewBox: "0 0 " + W + " " + H });
      wrap.appendChild(svg);
      stage.appendChild(wrap);

      var ccx = W / 2, ccy = H / 2 + 16;

      /* 中央 hub core */
      var coreR0 = 40, growStep = 11;
      var core = s("circle", { "class": "c-ch3-hub-core", cx: ccx, cy: ccy, r: coreR0 });
      var coreLabel = s("text", { "class": "c-ch3-hub-label", x: ccx, y: ccy, "font-size": 20 }); coreLabel.textContent = "hub";
      svg.appendChild(core); svg.appendChild(coreLabel);

      /* 4 个开发者，环绕在四角 */
      var devs = [
        { x: 120, y: 80 }, { x: W - 120, y: 80 },
        { x: 120, y: H - 70 }, { x: W - 120, y: H - 70 }
      ];
      var devNodes = [], repoNodes = [];
      devs.forEach(function (d, i) {
        var g = s("g", { "class": "c-ch3-dev" });
        // 头像
        g.appendChild(s("circle", { "class": "face", cx: d.x, cy: d.y, r: 22 }));
        g.appendChild(s("circle", { cx: d.x, cy: d.y - 5, r: 7, fill: "var(--dim)" }));
        g.appendChild(s("path", { d: "M" + (d.x - 11) + " " + (d.y + 14) + " a11 9 0 0 1 22 0", fill: "var(--dim)" }));
        svg.appendChild(g); devNodes.push(g);
        // 小仓库图标（待投出）
        var repo = s("g", { "class": "c-ch3-repo-thrown c-ch3-thrown", "data-i": i });
        var sx = d.x, sy = d.y + 40;
        repo.appendChild(s("rect", { "class": "c-ch3-repo-icon", x: sx - 11, y: sy - 11, width: 22, height: 22, rx: 5 }));
        repo.appendChild(s("path", { d: "M" + (sx - 5) + " " + (sy - 3) + " v8 M" + (sx - 5) + " " + (sy - 3) + " a5 5 0 0 1 10 0", fill: "none", stroke: "#fff", "stroke-width": 2 }));
        svg.appendChild(repo);
        repoNodes.push({ el: repo, sx: sx, sy: sy });
      });

      var thrownCount = 0;
      function throwOne(idx, animated) {
        var r = repoNodes[idx];
        // 计算位移到 hub 中心
        var dx = ccx - r.sx, dy = ccy - r.sy;
        if (animated) {
          r.el.style.transition = "transform .7s var(--ease),opacity .7s";
          r.el.style.opacity = "1";
          void r.el.getBoundingClientRect();
          r.el.style.transform = "translate(" + dx + "px," + dy + "px) scale(.4)";
          r.el.style.opacity = "0";
        } else {
          r.el.style.transition = "none";
          r.el.style.transform = "translate(" + dx + "px," + dy + "px) scale(.4)";
          r.el.style.opacity = "0";
        }
        thrownCount = Math.max(thrownCount, idx + 1);
        growHub(thrownCount, animated);
      }
      function growHub(n, animated) {
        var rr = coreR0 + n * growStep;
        if (!animated) core.style.transition = "none"; else core.style.transition = "";
        core.setAttribute("r", rr);
        coreLabel.setAttribute("font-size", 20 + n * 1.5);
        core.classList.toggle("grow", n > 0);
        if (!animated) { void core.getBoundingClientRect(); core.style.transition = ""; }
      }

      /* 每个开发者一个 step：依次投入并膨胀 */
      devs.forEach(function (d, i) {
        api.step(function (animated) { throwOne(i, animated); });
      });

      /* 收尾说明 */
      var card = h("div", "sc-card"); card.style.maxWidth = "760px"; card.style.margin = "16px auto 0";
      card.innerHTML = '<p class="sc-p sc-center">每个人都把自己的仓库往同一个 hub 上放，' +
        "大家就能在同一个地方<b>看见彼此的代码、一起协作</b>——这就是 GitHub。</p>";
      api.frag(card);
      stage.appendChild(card);

      /* 同类远端服务徽标（悬停提示） */
      var brands = h("div", "c-ch3-brands");
      ["GitLab", "Bitbucket"].forEach(function (name) {
        var b = h("div", "c-ch3-brand", name);
        var bt = h("span", "bt", "也是远端仓库服务");
        b.appendChild(bt);
        brands.appendChild(b);
      });
      var brandNote = h("div", "c-ch3-note"); brandNote.style.marginTop = "8px";
      brandNote.textContent = "同类的远端仓库服务 · 概念完全一样，换个网站而已";
      api.frag(brands);
      api.frag(brandNote);
      stage.appendChild(brands);
      stage.appendChild(brandNote);
    }
  });

  /* ============================================================
     屏 3.3 — git init / .gitignore + 过桥
     ============================================================ */
  window.registerScreen({
    chapter: CH,
    chapterName: CHNAME,
    id: "init-bridge",
    title: "git init / .gitignore",
    subtitle: "让文件夹变仓库 · 排除不该提交的文件",
    render: function (stage, api) {
      injectCSS();

      stage.appendChild(h("div", "sc-pill", "本地端的最后两块拼图"));
      var hh = h("h2", "sc-h2"); hh.style.marginTop = "12px";
      hh.innerHTML = '<span style="color:var(--git)">git init</span> 让文件夹变仓库 · ' +
        '<span style="color:var(--c-amber)">.gitignore</span> 排除不该提交的文件';
      stage.appendChild(hh);

      var grid = h("div", "c-ch3-init-grid");
      stage.appendChild(grid);

      /* ---- 左：普通文件夹 → git init → 长出 .git/ ---- */
      var left = h("div", "sc-card c-ch3-folder");
      var badge = h("div", "c-ch3-repo-badge", "✓ 这是一个仓库了");
      left.appendChild(badge);
      left.appendChild(h("div", "title", "📁 my-project/"));
      var fileList = h("div", "c-ch3-filelist");
      var FILES = [
        { name: "index.html", ic: "📄" },
        { name: "app.js", ic: "📄" },
        { name: "node_modules/", ic: "📦", ignore: true },
        { name: ".env", ic: "🔑", ignore: true }
      ];
      var fileEls = {};
      FILES.forEach(function (f) {
        var fe = h("div", "c-ch3-file");
        fe.innerHTML = '<span class="ic">' + f.ic + "</span><span>" + esc(f.name) + "</span>";
        fileList.appendChild(fe);
        fileEls[f.name] = fe;
      });
      left.appendChild(fileList);
      var gitDir = h("div", "c-ch3-git-dir");
      gitDir.innerHTML = "<span>📂</span><span>.git/　（隐藏目录 · Git 的大脑）</span>";
      left.appendChild(gitDir);
      var leftActions = h("div", "c-ch3-init-actions");
      var initBtn = h("button", "sc-btn primary"); initBtn.innerHTML = "▶ git init";
      initBtn.setAttribute("data-interactive", "1");
      leftActions.appendChild(initBtn);
      left.appendChild(leftActions);
      grid.appendChild(left);

      function doInit(animated) {
        if (!animated) { gitDir.style.transition = "none"; }
        gitDir.classList.add("show");
        badge.classList.add("show");
        initBtn.disabled = true; initBtn.style.opacity = ".5";
        if (!animated) { void gitDir.getBoundingClientRect(); gitDir.style.transition = ""; }
      }
      initBtn.addEventListener("click", function (e) { e.stopPropagation(); doInit(true); });

      /* ---- 右：.gitignore 写一行 → 对应文件变灰 ---- */
      var right = h("div", "sc-card c-ch3-folder");
      right.appendChild(h("div", "title", "🚫 .gitignore　决定哪些文件不进仓库"));
      var ignoreFile = h("div", "c-ch3-ignore-file");
      ignoreFile.innerHTML = '<span class="fn"># .gitignore</span>';
      var line1 = h("div", "c-ch3-ignore-line pending", "node_modules/");
      var line2 = h("div", "c-ch3-ignore-line pending", ".env");
      ignoreFile.appendChild(line1); ignoreFile.appendChild(line2);
      right.appendChild(ignoreFile);
      var rightActions = h("div", "c-ch3-init-actions");
      var addNode = h("button", "sc-btn"); addNode.innerHTML = "+ 加一行 node_modules/";
      addNode.setAttribute("data-interactive", "1");
      var addEnv = h("button", "sc-btn"); addEnv.innerHTML = "+ 加一行 .env";
      addEnv.setAttribute("data-interactive", "1");
      rightActions.appendChild(addNode); rightActions.appendChild(addEnv);
      right.appendChild(rightActions);
      var rightNote = h("p", "sc-p sc-dim"); rightNote.style.marginTop = "10px"; rightNote.style.fontSize = "13px";
      rightNote.textContent = "依赖、密钥、临时产物都不该进仓库——写进 .gitignore，左边对应文件就被排除（变灰）。";
      right.appendChild(rightNote);
      grid.appendChild(right);

      function ignore(name, lineEl, animated) {
        lineEl.classList.remove("pending");
        var fe = fileEls[name];
        if (fe) {
          if (!animated) fe.style.transition = "none";
          fe.classList.add("dimmed");
          if (!animated) { void fe.getBoundingClientRect(); fe.style.transition = ""; }
        }
      }
      addNode.addEventListener("click", function (e) { e.stopPropagation(); ignore("node_modules/", line1, true); });
      addEnv.addEventListener("click", function (e) { e.stopPropagation(); ignore(".env", line2, true); });

      /* steps：键盘流也能依次播放 init → ignore node_modules → ignore .env */
      api.step(function (animated) { doInit(animated); });
      api.step(function (animated) { ignore("node_modules/", line1, animated); });
      api.step(function (animated) { ignore(".env", line2, animated); });

      /* AI 命令卡：init 的人话版 */
      var aiHolder = h("div"); aiHolder.style.display = "flex"; aiHolder.style.justifyContent = "center";
      aiHolder.style.width = "100%"; aiHolder.style.marginTop = "18px";
      var aiCard = api.aiCard({
        effect: "把当前文件夹变成 Git 仓库",
        say: "帮我把这个项目初始化成 git 仓库，并忽略 node_modules 和 .env",
        cmd: "git init\nprintf 'node_modules/\\n.env\\n' > .gitignore"
      });
      aiHolder.appendChild(aiCard);
      api.frag(aiHolder);
      stage.appendChild(aiHolder);

      /* ---- 过桥卡 ---- */
      var bridge = h("div", "c-ch3-bridge");
      var txt = h("div", "txt");
      txt.innerHTML = '<span class="ok">✅ 到这里，Git 的本地端概念就齐了。</span><br>' +
        '<span class="nx">➡️ 接下来在 GitHub 网站上点哪些按钮</span>，去看『GitHub 网站』那一章。';
      var goBtn = h("a", "sc-btn primary", "去 GitHub 章 →");
      goBtn.setAttribute("data-interactive", "1");
      goBtn.setAttribute("data-bridge", "github");          // 框架接管的占位钩子
      goBtn.setAttribute("href", "../github-tutorial.html"); // 兜底跳转
      bridge.appendChild(txt); bridge.appendChild(goBtn);
      api.frag(bridge);
      stage.appendChild(bridge);

      api.onReset(function () {
        // render 已重建 DOM，这里无需额外清理；保留钩子以符合契约
      });
    }
  });

  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
})();
