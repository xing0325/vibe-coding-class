/* ============================================================
   sc-branch.js  —  第 5 章 · 分支 Branch   (v3 新章)
   屏 5.1 branch-intro   · 分支 = 仓库的不同开发线
   屏 5.2 branch-create  · 建立一条 feature 分支 ⭐（把图画对）
   屏 5.3 branch-pointer · 分支 = 一个指针
   ------------------------------------------------------------
   只调用框架契约：window.registerScreen / api.step / api.frag
     / api.graph(完整模式) / api.aiCard / api.onReset / api.isReplay
   不实现框架 / 不引外部资源 / 纯 SVG（图由 api.graph 负责画）。

   ⚠ 本章知识锁（到「分支=指针」为止）：
     可见文案 / 按钮 / tooltip 内一律不出现：
       HEAD、分离、孤儿、merge / 合并、checkout、多人 / 协作、快照。
     这些留给后面的章节。

   幂等约定（框架每次进入屏含后退 / resize 都 fresh render，并把
   api.step 以 animated=false 重放）：
     · 每个 step(fn) 都从「干净 graph」出发，做一次确定性的完整重建到某 level；
     · 图状态完全由 level 决定，不依赖上一次 render 残留，所以后退 / 重放都对。
   所有 class 前缀 c-branch-。
   ============================================================ */
(function () {
  "use strict";

  var CH = 5;
  var CHNAME = "分支 Branch";

  /* 配色（与 _shell tokens 对齐）：feature = git 橙；main = 银白 */
  var FEATURE = "#F1502F"; // var(--git)
  var MAIN = "#E6EDF3";    // var(--c-main) 银白

  /* registerScreen 早注册 shim 友好封装 */
  function register(def) {
    if (typeof window.registerScreen === "function") { window.registerScreen(def); }
    else { (window.__pendingScreens = window.__pendingScreens || []).push(def); }
  }

  function h(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  function injectCSS() {
    if (document.getElementById("c-branch-style")) return;
    var st = document.createElement("style");
    st.id = "c-branch-style";
    st.textContent = [
      /* 通用：上文案 + 下画布的纵向布局 */
      ".c-branch-wrap{width:100%;display:flex;flex-direction:column;align-items:center;gap:clamp(14px,2.4vh,26px)}",
      ".c-branch-head{display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;max-width:880px}",
      ".c-branch-head .sc-h2{margin-top:4px}",
      ".c-branch-lead{max-width:760px;text-align:center}",
      ".c-branch-lead b.feat{color:var(--git)}",
      ".c-branch-lead b.main{color:var(--c-main)}",

      /* 画布：CommitGraph 的容器 */
      ".c-branch-graphbox{position:relative;width:100%;max-width:880px;margin:2px auto 0;min-height:200px}",
      ".c-branch-graphbox .cg-wrap{width:100%}",

      /* 一句旁白 / 讲解锚点 */
      ".c-branch-note{min-height:1.6em;max-width:760px;text-align:center;color:var(--text);",
        "font-size:clamp(14px,1.5vw,18px);line-height:1.6;transition:color .3s var(--ease)}",
      ".c-branch-note b.feat{color:var(--git)}",
      ".c-branch-note b.main{color:var(--c-main)}",
      ".c-branch-note.dim{color:var(--dim)}",

      /* 操作按钮行 */
      ".c-branch-actions{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:2px}",
      ".c-branch-actions .sc-btn.is-next{border-color:var(--git);color:var(--git);",
        "animation:cBranchGlow 1.8s ease-in-out infinite}",
      ".c-branch-actions .sc-btn.is-done{background:rgba(240,81,51,.12);border-color:rgba(240,81,51,.5);color:var(--git)}",
      ".c-branch-actions .sc-btn:disabled{opacity:.42;cursor:not-allowed;animation:none}",
      "@keyframes cBranchGlow{0%,100%{box-shadow:0 0 0 1px rgba(240,81,51,.35)}",
        "50%{box-shadow:0 0 0 2px rgba(240,81,51,.35),0 0 16px rgba(240,81,51,.4)}}",

      /* 折叠命令条（替代 / 补充 aiCard：纯展示「幕后命令」） */
      ".c-branch-cmd{width:100%;max-width:560px;margin:0 auto}",
      ".c-branch-cmd .aicard{max-width:none;margin:0 auto}",

      /* 金句 */
      ".c-branch-quote{text-align:center;max-width:820px;margin:6px auto 0}",
      ".c-branch-quote .accent{color:var(--git)}"
    ].join("");
    document.head.appendChild(st);
  }

  /* ============================================================
     屏 5.1 — branch-intro · 分支 = 仓库的不同开发线
     画面：横向主线 a—b—c—d，末端 d 挂 main 标签牌。
     静态进入；「下一步」只是把观众带去下一屏建分支。
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: "branch-intro",
    title: "分支 = 仓库的不同开发线",
    subtitle: "默认自带一条 main 主干",
    render: function (stage, api) {
      injectCSS();

      var wrap = h("div", "c-branch-wrap");

      var head = h("div", "c-branch-head");
      head.appendChild(h("div", "sc-pill", "🌿 branch · 分支"));
      var hh = h("h2", "sc-h2");
      hh.innerHTML = "一个仓库，可以有<span style='color:var(--git)'>好几条开发线</span>";
      head.appendChild(hh);
      wrap.appendChild(head);

      // 主线 a-b-c-d，末端 d 挂 main 标签牌
      var box = h("div", "c-branch-graphbox");
      wrap.appendChild(box);

      // 文案（旁白）
      var lead = h("p", "sc-lead c-branch-lead");
      lead.innerHTML =
        "<b class='feat'>branch 分支</b> = 仓库里一条<b>独立的开发线</b>。" +
        "默认每个仓库都自带一条 <b class='main'>main</b>（主干）—— " +
        "它是 git 最重要的结构。";
      wrap.appendChild(lead);

      stage.appendChild(wrap);

      // 建图：完整模式（出现分支标签）。main：a b c d，标签自动挂在末端 d。
      var g = api.graph(box, {});
      g.init("main", ["a", "b", "c", "d"]);

      // 下一行旁白 frag：点「下一步」时浮出，引导去建分支（不在本屏建 feature）
      var note = h("p", "c-branch-note dim");
      note.innerHTML = "现在只有这一条 <b class='main'>main</b>。下一步，我们从它身上岔出第二条线。";
      api.frag(note);
      wrap.appendChild(note);

      api.onReset(function () { /* 纯展示屏，render 已重建，无额外状态 */ });
    }
  });

  /* ============================================================
     屏 5.2 — branch-create · 建立一条 feature 分支 ⭐
     ① 从 d 建 feature 分支（出生时 feature 与 main 都指向 d）
     ② 在 feature 上提交一次 → e 长在 d 的右下方（feature lane）
     讲解锚点：feature 从 d 岔出，所以自然长在 d 的右边、另起一行。
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: "branch-create",
    title: "建立一条 feature 分支",
    subtitle: "从 d 岔出 → 在新线上提交一次",
    render: function (stage, api) {
      injectCSS();

      var wrap = h("div", "c-branch-wrap");

      var head = h("div", "c-branch-head");
      head.appendChild(h("div", "sc-pill", "🌿 新建分支"));
      var hh = h("h2", "sc-h2");
      hh.innerHTML = "从 <span class='sc-mono'>d</span> 岔出一条 <span style='color:var(--git)'>feature</span> 分支";
      head.appendChild(hh);
      wrap.appendChild(head);

      var box = h("div", "c-branch-graphbox");
      wrap.appendChild(box);

      var note = h("p", "c-branch-note");
      wrap.appendChild(note);

      var actions = h("div", "c-branch-actions");
      var btnCreate = h("button", "sc-btn", "🌿 从 d 建一条 feature 分支");
      var btnCommit = h("button", "sc-btn", "✍️ 在 feature 上提交一次");
      btnCreate.setAttribute("data-interactive", "1");
      btnCommit.setAttribute("data-interactive", "1");
      actions.appendChild(btnCreate);
      actions.appendChild(btnCommit);
      wrap.appendChild(actions);

      // 折叠命令条（幕后真命令）—— 用 aiCard 承载
      var cmdHolder = h("div", "c-branch-cmd");
      cmdHolder.appendChild(api.aiCard({
        effect: "岔出一条新开发线，并在上面提交",
        say: "给我开一条 feature 分支，然后在上面提交一次",
        cmd: "git checkout -b feature\ngit commit -m \"feature 的第一笔改动\""
      }));
      wrap.appendChild(cmdHolder);

      stage.appendChild(wrap);

      /* ----- graph 状态：level 0..2，完整重建（幂等 / 重放安全） -----
         level 0: main a b c d（feature 还没建）
         level 1: + 从 d 建 feature（feature、main 同指向 d）
         level 2: + 在 feature 上长出 e（e 落 d 右下方 feature lane）
         e 在 d 右边由框架保证：commit.index = 父.index + 1，
         feature 的父是 d，所以 e.index = d.index+1，画在 d 右边一列、
         feature 的 lane 上，不会回到 a 那一列。 */
      var g = api.graph(box, {});
      var level = 0;

      function rebuild(lv, anim) {
        g.reset();
        g.init("main", ["a", "b", "c", "d"]);
        if (lv >= 1) {
          g.createBranch("feature", "d", FEATURE);
        }
        if (lv >= 2) {
          g.addCommit("feature", "e", { anim: anim });
        }
        level = lv;
      }

      var NOTE0 = "main 现在停在 <b class='main'>d</b>。点下面第一个按钮，从 d 岔出 feature。";
      var NOTE1 = "feature 刚出生，和 main <b>一模一样</b> —— " +
        "<b class='feat'>feature</b> 和 <b class='main'>main</b> 此刻都贴在 <span class='sc-mono'>d</span> 上。";
      var NOTE2 = "feature 是从 <span class='sc-mono'>d</span> 这个时间点岔出来的，" +
        "所以新提交 <span class='sc-mono'>e</span> 自然长在 d 的<b class='feat'>右边</b>、另起一行。";

      function setNote(html, dim) {
        note.innerHTML = html;
        note.classList.toggle("dim", !!dim);
      }

      function syncButtons() {
        // create 只在 level 0 可点；commit 只在 level 1 可点
        btnCreate.disabled = level !== 0;
        btnCommit.disabled = level !== 1;
        btnCreate.classList.toggle("is-done", level >= 1);
        btnCommit.classList.toggle("is-done", level >= 2);
        btnCreate.classList.toggle("is-next", level === 0);
        btnCommit.classList.toggle("is-next", level === 1);
      }

      function applyLevel(lv, anim) {
        rebuild(lv, anim);
        setNote(lv === 0 ? NOTE0 : lv === 1 ? NOTE1 : NOTE2, lv === 0);
        syncButtons();
      }

      // 初始态
      applyLevel(0, false);

      // 两个 step：键盘流也能依次播放（① 建分支 ② 提交）
      api.step(function (animated) { applyLevel(1, animated); });
      api.step(function (animated) { applyLevel(2, animated); });

      // 按钮：点了就走对应 step（交给框架推进，保持 step 指针同步）
      btnCreate.addEventListener("click", function (e) {
        e.stopPropagation();
        if (level === 0) api.next();
      });
      btnCommit.addEventListener("click", function (e) {
        e.stopPropagation();
        if (level === 1) api.next();
      });

      api.onReset(function () { applyLevel(0, true); });
    }
  });

  /* ============================================================
     屏 5.3 — branch-pointer · 分支 = 一个指针
     接上图（main a-b-c-d + feature e from d）。
     文案：分支就是一个指针，指向这条线最新的那次提交。
       main 指着 d，feature 指着 e。
     互动：在 feature 上再提交一次 → f；feature 指针挪到 f，
       main 指针仍停在 d 不动（highlight d 强调对比）。
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: "branch-pointer",
    title: "分支 = 一个指针",
    subtitle: "指针各走各的 → 分支互不影响",
    render: function (stage, api) {
      injectCSS();

      var wrap = h("div", "c-branch-wrap");

      var head = h("div", "c-branch-head");
      head.appendChild(h("div", "sc-pill", "👉 分支 = 指针"));
      var hh = h("h2", "sc-h2");
      hh.innerHTML = "每个分支，其实就是<span style='color:var(--git)'>一个指针</span>";
      head.appendChild(hh);
      wrap.appendChild(head);

      var box = h("div", "c-branch-graphbox");
      wrap.appendChild(box);

      var lead = h("p", "sc-lead c-branch-lead");
      lead.innerHTML =
        "分支就是一个<b class='feat'>指针</b>，指向这条分支<b>最新的那一次提交</b>。" +
        "<b class='main'>main</b> 指着 <span class='sc-mono'>d</span>，" +
        "<b class='feat'>feature</b> 指着 <span class='sc-mono'>e</span>。";
      wrap.appendChild(lead);

      var note = h("p", "c-branch-note dim");
      wrap.appendChild(note);

      var actions = h("div", "c-branch-actions");
      var btnCommit = h("button", "sc-btn", "✍️ 在 feature 上再提交一次");
      btnCommit.setAttribute("data-interactive", "1");
      actions.appendChild(btnCommit);
      wrap.appendChild(actions);

      // 文楷金句
      var quote = h("p", "sc-quote c-branch-quote");
      quote.innerHTML = "所谓「分支互不影响」，本质就是<span class='accent'>各自的指针，各走各的</span>。";
      wrap.appendChild(quote);

      stage.appendChild(wrap);

      /* ----- graph：level 0..1（接上屏终态为起点） -----
         level 0: main a b c d + feature e（feature 指 e，main 指 d）
         level 1: + 在 feature 上长出 f（feature 指针挪到 f；main 仍指 d）
         强调对比：highlight d —— main 一点没动。 */
      var g = api.graph(box, {});
      var level = 0;

      function rebuild(lv, anim) {
        g.reset();
        g.init("main", ["a", "b", "c", "d"]);
        g.createBranch("feature", "d", FEATURE);
        g.addCommit("feature", "e", { anim: false });
        if (lv >= 1) {
          g.addCommit("feature", "f", { anim: anim });
        }
        // 高亮 d：强调「main 的指针停在 d 不动」
        g.highlight("d", true);
        level = lv;
      }

      var NOTE0 = "点下面的按钮，在 feature 上再提交一次，看看两个指针会怎么动。";
      var NOTE1 = "看 —— <b class='feat'>feature</b> 的指针往前走到了 <span class='sc-mono'>f</span>，" +
        "而 <b class='main'>main</b> 的指针还稳稳停在高亮的 <span class='sc-mono'>d</span> 上，一点没动。";

      function setNote(html, dim) {
        note.innerHTML = html;
        note.classList.toggle("dim", !!dim);
      }

      function syncButtons() {
        btnCommit.disabled = level !== 0;
        btnCommit.classList.toggle("is-done", level >= 1);
        btnCommit.classList.toggle("is-next", level === 0);
      }

      function applyLevel(lv, anim) {
        rebuild(lv, anim);
        setNote(lv === 0 ? NOTE0 : NOTE1, lv === 0);
        syncButtons();
      }

      applyLevel(0, false);

      api.step(function (animated) { applyLevel(1, animated); });

      btnCommit.addEventListener("click", function (e) {
        e.stopPropagation();
        if (level === 0) api.next();
      });

      api.onReset(function () { applyLevel(0, true); });
    }
  });

})();
