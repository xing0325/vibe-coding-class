/* ============================================================
 * 第 5 章 · HEAD 与指针  (chapter:6, play:true)
 * 屏 5.1 head-what     · HEAD 是什么（HEAD🚩 稳插 D，可拖拽提示）
 * 屏 5.2 detached      · 分离头指针（拖 / 按钮把 HEAD 移到 B → 冷色 + 警告带）
 * 屏 5.3 orphan        · 孤儿 commit / 宇航员（分离态提交 → 飘走 → 救回来）
 * 屏 5.4 head-insight  · 洞察小结（三行文字分步 + 两种回看姿势迷你演示）
 * 样式前缀: c-ch5-
 * 仅调用框架契约：window.registerScreen / api.step / api.frag / api.graph / api.aiCard
 *   / api.astronaut / api.onReset / api.isReplay
 *
 * 关于 HEAD🚩 拖拽：当前框架未暴露 g.onHeadDrop / pointer 拖拽。
 * 本章按契约的回退条款用「按钮模拟」——同时做特性探测：若未来框架
 * 暴露 g.onHeadDrop，则自动改走真实拖拽落点回调，无需改本文件。
 * ============================================================ */
(function () {
  'use strict';

  function injectStyle() {
    if (document.getElementById('c-ch5-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ch5-style';
    s.textContent = [
      /* 通用布局 */
      '.c-ch5-wrap{display:flex;flex-direction:column;align-items:center;gap:18px;width:100%;}',
      '.c-ch5-lead{max-width:760px;text-align:center;}',
      '.c-ch5-graphbox{position:relative;width:100%;max-width:760px;margin:6px auto 0;}',
      '.c-ch5-controls{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;align-items:center;margin-top:6px;}',
      '.c-ch5-hint{font-size:13px;color:var(--dim);font-family:var(--font-mono);}',
      '.c-ch5-hint b{color:var(--git);}',

      /* 「试试拖我」浮动提示气泡 —— 呼吸 + 指向右侧 */
      '.c-ch5-drag-tip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border-radius:999px;',
      'font-family:var(--font-mono);font-size:13px;color:var(--git);',
      'background:color-mix(in srgb,var(--git) 12%,transparent);border:1px dashed color-mix(in srgb,var(--git) 55%,transparent);',
      'animation:c-ch5-breathe 2.2s ease-in-out infinite;cursor:grab;user-select:none;}',
      '.c-ch5-drag-tip:active{cursor:grabbing;}',
      '@keyframes c-ch5-breathe{0%,100%{transform:translateY(0);box-shadow:0 0 0 0 color-mix(in srgb,var(--git) 30%,transparent);}50%{transform:translateY(-2px);box-shadow:0 0 0 7px color-mix(in srgb,var(--git) 0%,transparent);}}',

      /* HEAD 呼吸高亮覆盖在 svg 上方的发光环（屏 5.1） */
      '.c-ch5-headpulse{position:absolute;pointer-events:none;width:62px;height:30px;border-radius:6px;',
      'border:2px solid var(--git);opacity:0;transform:translate(-50%,-50%);',
      'animation:c-ch5-headring 2s ease-in-out infinite;}',
      '@keyframes c-ch5-headring{0%,100%{opacity:.15;transform:translate(-50%,-50%) scale(.92);}50%{opacity:.8;transform:translate(-50%,-50%) scale(1.12);}}',

      /* 落点按钮组（拖拽不可用时的模拟）—— 做成「把 HEAD 拖/送到这里」的目标格 */
      '.c-ch5-drops{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;}',
      '.c-ch5-drop{font-family:var(--font-mono);font-size:13px;font-weight:700;padding:9px 16px;border-radius:10px;cursor:pointer;',
      'background:var(--pane2);border:1px dashed var(--border);color:var(--text);transition:all .15s var(--ease);user-select:none;}',
      '.c-ch5-drop:hover{border-color:var(--git);background:#272e3d;transform:translateY(-1px);}',
      '.c-ch5-drop.is-on{border-style:solid;border-color:var(--git);box-shadow:0 0 0 1px var(--git) inset;color:var(--git);}',
      '.c-ch5-drop .tag{opacity:.6;font-weight:400;}',

      /* 状态说明条 */
      '.c-ch5-state{font-size:14px;color:var(--dim);min-height:1.5em;text-align:center;transition:color .3s;}',
      '.c-ch5-state.warn{color:var(--info);font-weight:600;}',
      '.c-ch5-state.ok{color:var(--c-teal);font-weight:600;}',

      /* 屏 5.4 洞察三行 */
      '.c-ch5-insights{display:flex;flex-direction:column;gap:18px;max-width:820px;margin:0 auto;}',
      '.c-ch5-ins{display:flex;gap:16px;align-items:flex-start;padding:18px 20px;border-radius:14px;',
      'background:color-mix(in srgb,var(--text) 4%,transparent);border:1px solid color-mix(in srgb,var(--text) 12%,transparent);}',
      '.c-ch5-ins .n{flex:0 0 auto;width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;',
      'font-family:var(--font-mono);font-weight:800;font-size:15px;background:color-mix(in srgb,var(--c-teal) 18%,transparent);color:var(--c-teal);}',
      '.c-ch5-ins .b{font-size:clamp(15px,1.7vw,19px);line-height:1.55;}',
      '.c-ch5-ins .b b{color:var(--c-teal);}',
      '.c-ch5-ins .b .warnhl{color:var(--info);}',
      '.c-ch5-ins .b .githl{color:var(--git);font-family:var(--font-mono);}',
      '.c-ch5-ins.path .n{background:color-mix(in srgb,var(--git) 18%,transparent);color:var(--git);}',

      /* 5.4 两种姿势的迷你示意 */
      '.c-ch5-mini-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:10px;}',
      '@media (max-width:680px){.c-ch5-mini-row{grid-template-columns:1fr;}}',
      '.c-ch5-mini{padding:14px;border-radius:14px;background:var(--pane);border:1px solid var(--border);}',
      '.c-ch5-mini h4{font-size:13px;font-family:var(--font-mono);letter-spacing:.06em;margin:0 0 10px;color:var(--dim);}',
      '.c-ch5-mini h4 .way1{color:var(--info);}',
      '.c-ch5-mini h4 .way2{color:var(--c-teal);}',
      '.c-ch5-mini .cap{font-size:12.5px;color:var(--dim);margin-top:8px;line-height:1.5;}'
    ].join('');
    document.head.appendChild(s);
  }

  /* 把发光呼吸环对齐到某个 commit 的 HEAD 旗位置（page 坐标 → graphbox 内相对坐标）。
     旗在节点上方约 48px（stem 顶 + 旗中心）。失败时静默忽略（幂等友好）。 */
  function placeHeadPulse(box, g, commitId) {
    var ring = box.querySelector('.c-ch5-headpulse');
    if (!ring) return;
    var xy = g.getNodeXY(commitId);
    var boxRect = box.getBoundingClientRect();
    if (!xy || !boxRect.width) { ring.style.opacity = '0'; return; }
    ring.style.left = (xy.x - boxRect.left) + 'px';
    ring.style.top = (xy.y - boxRect.top - 48) + 'px';
  }

  /* ====================================================== */
  /* 屏 5.1 — HEAD 是什么                                    */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '指针与 HEAD',
    id: 'head-what',
    title: 'HEAD 是什么',
    subtitle: '你现在站在哪',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch5-wrap">' +
          '<h2 class="sc-h2 sc-center">🚩 HEAD = 你现在站在哪</h2>' +
          '<p class="sc-lead c-ch5-lead">你在<b style="color:var(--c-teal)">哪个分支</b>，就看到这个分支的<b style="color:var(--c-teal)">最新 commit</b>。' +
            '那面 <span class="sc-mono" style="color:var(--git)">HEAD</span> 小旗，现在就稳稳插在 <span class="sc-mono">main</span> 的最新提交 D 上。</p>' +
          '<div class="c-ch5-graphbox" id="c-ch5-1-box">' +
            '<div class="c-ch5-headpulse"></div>' +
          '</div>' +
          '<div class="c-ch5-controls" id="c-ch5-1-ctrl"></div>' +
        '</div>';

      var box = stage.querySelector('#c-ch5-1-box');
      var g = api.graph(box, {});
      g.init('main', ['A', 'B', 'C', 'D']);

      // 呼吸环对齐到 D（HEAD 当前所在）。需在布局稳定后取坐标。
      function align() { placeHeadPulse(box, g, 'D'); }
      requestAnimationFrame(function () { requestAnimationFrame(align); });

      // step 1：浮出「试试把我拖到别处 →」提示
      var ctrl = stage.querySelector('#c-ch5-1-ctrl');
      ctrl.innerHTML =
        '<span class="c-ch5-drag-tip" data-interactive="1" title="下一屏可以拖动它">' +
          '🚩 试试把我拖到别处 →</span>' +
        '<span class="c-ch5-hint">（下一屏你就能动手拖 HEAD）</span>';
      api.frag(ctrl);

      // resize/replay 后重新对齐呼吸环
      api.onReset(function () { /* 纯展示屏，无额外状态需清 */ });
      window.requestAnimationFrame(align);
    }
  });

  /* ====================================================== */
  /* 屏 5.2 — 分离头指针                                     */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '指针与 HEAD',
    id: 'detached',
    title: '分离头指针',
    subtitle: 'detached HEAD',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch5-wrap">' +
          '<h2 class="sc-h2 sc-center">把 HEAD 拖离分支会怎样？</h2>' +
          '<p class="sc-lead c-ch5-lead">把 <span class="sc-mono" style="color:var(--git)">HEAD</span> 旗拖到中间的 <span class="sc-mono">B</span>——' +
            '它会绕开分支，<b style="color:var(--c-teal)">直接钉在某个历史 commit 上</b>。这就是分离头指针。</p>' +
          '<div class="c-ch5-graphbox" id="c-ch5-2-box"></div>' +
          '<div class="c-ch5-state" id="c-ch5-2-state">现在 HEAD 挂在 <span class="sc-mono">main</span> 上，指着最新的 D —— 一切正常（暖色）。</div>' +
          '<div class="c-ch5-controls">' +
            '<div class="c-ch5-drops" id="c-ch5-2-drops">' +
              '<button class="c-ch5-drop" data-target="B">⤵ 把 HEAD 拖到 <b>B</b> <span class="tag">历史 commit</span></button>' +
              '<button class="c-ch5-drop is-on" data-target="main">↩ 拖回 <b>main 头部 D</b> <span class="tag">分支头</span></button>' +
            '</div>' +
          '</div>' +
          '<p class="c-ch5-hint sc-center">落在<b>非分支头</b>→进入分离态（冷色+警告带）；落回<b>分支头</b>→恢复暖色。</p>' +
        '</div>';

      var box = stage.querySelector('#c-ch5-2-box');
      var stateEl = stage.querySelector('#c-ch5-2-state');
      var drops = stage.querySelector('#c-ch5-2-drops');
      var g = api.graph(box, {});
      g.init('main', ['A', 'B', 'C', 'D']);

      // 落点处理：target 'B' = 历史 commit → 分离态；'main' = 分支头 → 恢复
      function landOn(target) {
        if (target === 'B') {
          g.checkout('B'); // ref 为历史 commitId → 框架进入分离态：整图冷色 + 警告带 + HEAD 特殊样式
          stateEl.className = 'c-ch5-state warn';
          stateEl.innerHTML = '⚠️ 现在 HEAD 直接钉在历史 commit <span class="sc-mono">B</span> 上，<b>不挂在任何分支</b>。注意 main 标签仍留在 D 没动。';
        } else {
          g.checkout('main'); // 回到分支头 → 恢复暖色
          stateEl.className = 'c-ch5-state ok';
          stateEl.innerHTML = '✓ HEAD 拖回 <span class="sc-mono">main</span> 头部 D，恢复正常（暖色）。';
        }
        drops.querySelectorAll('.c-ch5-drop').forEach(function (b) {
          b.classList.toggle('is-on', b.getAttribute('data-target') === target);
        });
      }

      // —— 特性探测：框架若已实现拖拽回调就用真拖拽，否则按钮模拟 ——
      if (typeof g.onHeadDrop === 'function') {
        g.onHeadDrop(function (targetId, isBranchHead) {
          landOn(isBranchHead ? 'main' : (targetId === 'B' ? 'B' : 'main'));
        });
      }
      // 按钮始终绑定（也是无障碍 / 触屏后备）
      drops.querySelectorAll('.c-ch5-drop').forEach(function (btn) {
        btn.addEventListener('click', function () { landOn(btn.getAttribute('data-target')); });
      });

      // step 1：观众动手 —— 自动演示一次「拖到 B → 分离态」，让分步播放也能讲清
      api.step(function (animated) {
        landOn('B');
      });
      // step 2：拖回 main 恢复暖色
      api.step(function (animated) {
        landOn('main');
      });

      // 重置回初始暖色态
      api.onReset(function () { landOn('main'); });
    }
  });

  /* ====================================================== */
  /* 屏 5.3 — 孤儿 commit / 宇航员                            */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '指针与 HEAD',
    id: 'orphan',
    title: '孤儿 commit',
    subtitle: '飘走的宇航员',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch5-wrap">' +
          '<h2 class="sc-h2 sc-center">在分离态里提交，会发生什么？</h2>' +
          '<p class="sc-lead c-ch5-lead">现在 HEAD 钉在历史 commit <span class="sc-mono">B</span>（分离态）。' +
            '你在这里提交一次，新 commit <b style="color:var(--c-teal)">长出来了，却没有任何分支牵着它</b>。</p>' +
          '<div class="c-ch5-graphbox" id="c-ch5-3-box"></div>' +
          '<div class="c-ch5-state warn" id="c-ch5-3-state">⚠️ 分离态 —— 此处的新 commit 无分支收留。</div>' +
          '<div class="c-ch5-controls" id="c-ch5-3-ctrl">' +
            '<button class="sc-btn" id="c-ch5-3-commit" data-interactive="1">＋ 在这个状态提交一次</button>' +
            '<button class="sc-btn primary" id="c-ch5-3-rescue" data-interactive="1" style="display:none;">🪢 救回来</button>' +
          '</div>' +
          '<p class="sc-p c-ch5-lead sc-dim" id="c-ch5-3-note" style="max-width:760px;"></p>' +
        '</div>';

      var box = stage.querySelector('#c-ch5-3-box');
      var stateEl = stage.querySelector('#c-ch5-3-state');
      var noteEl = stage.querySelector('#c-ch5-3-note');
      var commitBtn = stage.querySelector('#c-ch5-3-commit');
      var rescueBtn = stage.querySelector('#c-ch5-3-rescue');

      var g = api.graph(box, {});
      g.init('main', ['A', 'B', 'C', 'D']);
      g.checkout('B'); // 进屏即处于分离态（承接上一屏）

      var committed = false;
      var rescued = false;

      function doCommit() {
        if (committed) return;
        committed = true;
        // 分离态提交 → 框架自动：建孤儿节点 X(ghost) + 宇航员飘走 (commitDetached 内部已调 api.astronaut)
        g.commitDetached('X');
        stateEl.className = 'c-ch5-state warn';
        stateEl.innerHTML = '👨‍🚀 commit <span class="sc-mono">X</span> 成了孤儿，飘出了主干 —— 没有分支牵着它。';
        noteEl.textContent = '分离态下的新 commit 成了孤儿 commit，飘在数据海里，像飘出空间站、被遗忘的宇航员。' +
          '它不会立刻消失，但你一旦切走，几乎再也找不回它 —— 除非现在就给它一条分支。';
        commitBtn.disabled = true;
        commitBtn.style.opacity = '.5';
        commitBtn.style.cursor = 'default';
        rescueBtn.style.display = '';
      }

      function doRescue() {
        if (!committed || rescued) return;
        rescued = true;
        // 给孤儿建分支收留 → 连回、恢复正常色、HEAD 重新挂分支（rescue 内部已处理）
        g.rescue('X', 'rescue', '#A78BFA');
        g.highlight('X', true);
        stateEl.className = 'c-ch5-state ok';
        stateEl.innerHTML = '✓ 建了一条 <span class="sc-mono" style="color:var(--c-purple)">rescue</span> 分支收留 X —— 它连回了正常时间线，宇航员被接回空间站。';
        noteEl.textContent = '只要在切走之前给孤儿建一条分支，它就从「飘走的宇航员」变回「有人牵着的正常提交」。' +
          '这正是第 5.4 屏要讲的：想保住历史，给它一条分支。';
        rescueBtn.disabled = true;
        rescueBtn.style.opacity = '.5';
        rescueBtn.style.cursor = 'default';
      }

      commitBtn.addEventListener('click', doCommit);
      rescueBtn.addEventListener('click', doRescue);

      // 分步：① 提交成孤儿  ② 救回来
      api.step(function (animated) {
        // 后退重放：保持终态，但 commitDetached 会重复创建 X —— 故重放时只在尚未提交时执行
        if (!committed) doCommit();
      });
      api.step(function (animated) {
        if (!rescued) doRescue();
      });

      api.onReset(function () {
        committed = false; rescued = false;
        g.reset();
        g.init('main', ['A', 'B', 'C', 'D']);
        g.checkout('B');
        stateEl.className = 'c-ch5-state warn';
        stateEl.innerHTML = '⚠️ 分离态 —— 此处的新 commit 无分支收留。';
        noteEl.textContent = '';
        commitBtn.disabled = false; commitBtn.style.opacity = ''; commitBtn.style.cursor = '';
        rescueBtn.style.display = 'none'; rescueBtn.disabled = false; rescueBtn.style.opacity = ''; rescueBtn.style.cursor = '';
      });
    }
  });

  /* ====================================================== */
  /* 屏 5.4 — 洞察小结                                        */
  /* ====================================================== */
  window.registerScreen({
    chapter: 6,
    chapterName: '指针与 HEAD',
    id: 'head-insight',
    title: '洞察小结',
    subtitle: '只看 vs 留住',
    play: true,
    render: function (stage, api) {
      injectStyle();
      stage.innerHTML =
        '<div class="c-ch5-wrap">' +
          '<h2 class="sc-h2 sc-center">三句话，把 HEAD 讲透</h2>' +
          '<div class="c-ch5-insights">' +
            '<div class="c-ch5-ins" id="c-ch5-4-i1">' +
              '<div class="n">1</div>' +
              '<div class="b">分支的意义，是告诉 git <b>「下一个 commit 该挂到哪」</b>。HEAD 跟着分支走，提交就自动接到分支头。</div>' +
            '</div>' +
            '<div class="c-ch5-ins" id="c-ch5-4-i2">' +
              '<div class="n">2</div>' +
              '<div class="b">想<b>回看历史而不改 main 指向</b>，有两条路：' +
                '<span class="warnhl">① 分离头指针</span>（只看不挂，代价是新提交会成孤儿）；' +
                '<span class="githl">② 给历史 commit 建一条分支</span>（把那个点正式收编进时间线）。</div>' +
            '</div>' +
            '<div class="c-ch5-ins path" id="c-ch5-4-i3">' +
              '<div class="n">3</div>' +
              '<div class="b">Vibe coder 基本不存在「只看不改」—— 你看了多半就想动手。' +
                '<b>所以你多半用 ②</b>：给它一条分支，想怎么折腾都不怕弄丢。</div>' +
            '</div>' +
          '</div>' +
          '<div class="c-ch5-mini-row" id="c-ch5-4-minis">' +
            '<div class="c-ch5-mini">' +
              '<h4><span class="way1">姿势 ①</span> 分离头指针 · 只看不挂</h4>' +
              '<div class="c-ch5-graphbox" id="c-ch5-4-m1" style="margin:0;"></div>' +
              '<div class="cap">HEAD 直接钉到 B，main 不动还在 D。看完切走，B 上若有新提交就成孤儿。</div>' +
            '</div>' +
            '<div class="c-ch5-mini">' +
              '<h4><span class="way2">姿势 ②</span> 给历史建分支 · 留得住</h4>' +
              '<div class="c-ch5-graphbox" id="c-ch5-4-m2" style="margin:0;"></div>' +
              '<div class="cap">在 B 上拉出一条 look 分支，HEAD 正常挂着它 —— 在这往后随便提交都有人收着。</div>' +
            '</div>' +
          '</div>' +
        '</div>';

      // 两个迷你画布
      var m1box = stage.querySelector('#c-ch5-4-m1');
      var m2box = stage.querySelector('#c-ch5-4-m2');
      var g1 = api.graph(m1box, {});
      var g2 = api.graph(m2box, {});
      g1.init('main', ['A', 'B', 'C', 'D']);
      g2.init('main', ['A', 'B', 'C', 'D']);

      // 三行洞察分步淡入
      api.frag(stage.querySelector('#c-ch5-4-i1'));
      api.frag(stage.querySelector('#c-ch5-4-i2'));
      api.frag(stage.querySelector('#c-ch5-4-i3'));

      // step 4：姿势① 演示一次回看（分离态钉 B）
      var demoed1 = false;
      api.step(function (animated) {
        g1.checkout('B');
        demoed1 = true;
      });
      // step 5：姿势② 演示给历史 commit 建分支（look 分支挂 B，正常态）
      var demoed2 = false;
      api.step(function (animated) {
        if (!demoed2) {
          g2.createBranch('look', 'B', '#2DD4BF');
          g2.checkout('look');
          g2.highlight('B', true);
          demoed2 = true;
        }
      });

      api.onReset(function () {
        g1.reset(); g1.init('main', ['A', 'B', 'C', 'D']);
        g2.reset(); g2.init('main', ['A', 'B', 'C', 'D']);
        demoed1 = false; demoed2 = false;
      });
    }
  });

})();
