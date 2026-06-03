/* ============================================================
 * 第 6 章 · 路线图（未完待续）  chapter:6
 *   v3 阶段：第一部分(1-5章)已定稿，后续核心概念与协作先以路线图呈现。
 *   一屏：列出即将上线的内容 + 文楷金句 + 去 GitHub 实操的桥。
 *   只读展示，无知识锁风险（这里是"预告路标"，不展开概念）。
 * ========================================================== */
(function () {
  "use strict";
  function reg(def) {
    if (typeof window.registerScreen === "function") window.registerScreen(def);
    else { (window.__pendingScreens = window.__pendingScreens || []).push(def); }
  }

  var ROADMAP = [
    { icon: "🌿", name: "分支续集", desc: "把 feature 合回 main（merge）、多人各开一条线一起干。" },
    { icon: "📍", name: "指针与 HEAD", desc: "你当前站在哪条线、绕开分支去看历史、飘走的宇航员。" },
    { icon: "💊", name: "回到后悔药", desc: "reset 为什么能退回去（原理）+ 第四颗药 checkout。" },
    { icon: "🔍", name: "git diff", desc: "给 AI 两个 hash，一眼看出改了哪几行。" },
    { icon: "🤝", name: "多人协作", desc: "别在 main 上改、PR、冲突怎么拍板、cherry-pick。" },
    { icon: "🪟", name: "worktree", desc: "同一仓库多开工作台，多个 AI agent 并行干活。" }
  ];

  reg({
    chapter: 6,
    chapterName: "路线图",
    id: "roadmap",
    title: "路线图 · 未完待续",
    render: function (stage, api) {
      var root = document.createElement("div");
      root.className = "c-road-wrap";
      root.innerHTML =
        '<style>' +
        '.c-road-wrap{max-width:980px;margin:0 auto;padding:8px 4px;}' +
        '.c-road-head{text-align:center;margin-bottom:26px;}' +
        '.c-road-head .sc-h1{margin-bottom:10px;}' +
        '.c-road-head p{color:var(--dim);font-size:16px;line-height:1.7;margin:0;}' +
        '.c-road-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;}' +
        '.c-road-card{position:relative;background:linear-gradient(160deg,var(--pane,#121826),#0d1320);' +
          'border:1px solid var(--border,#26303f);border-radius:14px;padding:18px 18px 16px;opacity:.92;' +
          'transition:transform .2s,border-color .2s,opacity .2s;}' +
        '.c-road-card:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--git) 40%,var(--border));opacity:1;}' +
        '.c-road-card::after{content:"即将上线";position:absolute;top:12px;right:14px;font-family:var(--font-mono);' +
          'font-size:10px;letter-spacing:.08em;color:var(--dim);border:1px solid var(--border);border-radius:999px;padding:2px 8px;}' +
        '.c-road-card .ic{font-size:26px;line-height:1;margin-bottom:10px;display:block;}' +
        '.c-road-card h4{margin:0 0 6px;font-size:17px;color:var(--text);}' +
        '.c-road-card p{margin:0;color:var(--dim);font-size:13.5px;line-height:1.6;}' +
        '.c-road-foot{text-align:center;margin-top:30px;}' +
        '.c-road-quote{font-family:var(--font-quote,serif);font-size:21px;color:var(--text);line-height:1.7;margin:0 auto 20px;max-width:640px;}' +
        '.c-road-quote .o{color:var(--git);}' +
        '.c-road-cta{display:inline-flex;align-items:center;gap:8px;padding:12px 24px;border-radius:12px;cursor:pointer;' +
          'font-weight:700;font-size:15px;text-decoration:none;color:#fff;border:1px solid var(--git);' +
          'background:linear-gradient(135deg,var(--git),#b83a22);box-shadow:0 6px 20px color-mix(in srgb,var(--git) 35%,transparent);transition:transform .16s;}' +
        '.c-road-cta:hover{transform:translateY(-2px);}' +
        '</style>' +
        '<div class="c-road-head">' +
          '<div class="sc-h1">路线图 · <span style="color:var(--git)">未完待续</span></div>' +
          '<p>第一部分（为什么 → Commit → 本地/远端 → 后悔药 → 分支）已经够你上手了。<br>下面这些核心概念与协作，正在路上。</p>' +
        '</div>' +
        '<div class="c-road-grid" id="c-road-grid"></div>' +
        '<div class="c-road-foot">' +
          '<p class="c-road-quote">但其实，到这里你已经<span class="o">够用了</span>——<br>开分支、提交、回退，<span class="o">剩下的交给 AI</span>。</p>' +
          '<a class="c-road-cta" data-bridge="github" data-interactive="1" href="github-tutorial.html">去 GitHub 网站实操 →</a>' +
        '</div>';
      stage.appendChild(root);

      var grid = root.querySelector("#c-road-grid");
      // 逐张卡片分步淡入（后退重放直接全显）
      ROADMAP.forEach(function (item, i) {
        var card = document.createElement("div");
        card.className = "c-road-card";
        card.innerHTML = '<span class="ic">' + item.icon + '</span><h4>' + item.name + '</h4><p>' + item.desc + '</p>';
        grid.appendChild(card);
        if (api && api.frag) api.frag(card);
      });
    }
  });
})();
