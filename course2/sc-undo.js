/* ============================================================
   sc-undo.js — 第 4 章 · 三颗后悔药（王琦的故事）
   ------------------------------------------------------------
   v2 分镜核心新内容：后悔药被提到「分支」之前先讲，
   只讲【效果】和【场景】，绝不碰原理。用王琦的具体故事讲。
   只有三颗药：discard / reset / revert。第四颗一个字都不提。

   ⭐ 知识锁（本文件逐字把关，绝对不出现）：
     分支 / branch / main / HEAD / 指针 / 分离头指针 / 孤儿 /
     merge / checkout / 快照 / 父节点 / 移动指针 / 工作区 / 暂存区
   这条线只叫「提交历史 / 提交线」，不叫 main；
   最新点标「你在这一版」，不叫 HEAD。

   框架由另一 agent 提供，本文件只调用契约：
     window.registerScreen({ chapter, chapterName, id, title, play?, render })
     api.step(fn) / api.frag(el) / api.aiCard({effect,say,cmd}) /
     api.onReset(fn) / api.isReplay
     g = api.graph(container, opts)
     g.init('main', ['A','B','C','D'], {bare:true, hashes:true, here:true})
        —— 裸提交线：无分支标签、无旗帜，每点下方短 hash，最新点标「你在这一版」。
        ("main" 仅是内部名，bare 模式下不显示，文案里绝不写出来。)
     g.addCommit('main','E') / g.highlight(id,bool) / g.setGhost(id,bool) /
     g.getNodeXY(id) / g.reset()
   所有 render 幂等：每次进入(含后退/resize)都从干净状态重建。
   class 前缀 c-undo-
   ============================================================ */
(function () {
  'use strict';

  var CH = 4;
  var CHNAME = '三颗后悔药';

  /* 每个提交点的「短 hash」——你和 AI 指认某一版的通用代号。
     场景文案里出现的 c3d4e5f / b2c3d4e 就来自这里，保证屏上和「对 AI 说」框里一字不差。 */
  var HASH = {
    A: 'a1b2c3d',
    B: 'b2c3d4e',
    C: 'c3d4e5f',
    D: 'd4e5f6a',
    E: 'e5f6a7b',
    F: 'f6a7b8c'
  };

  function register(def) {
    if (typeof window.registerScreen === 'function') { window.registerScreen(def); }
    else { (window.__pendingScreens = window.__pendingScreens || []).push(def); }
  }

  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ------------------------------------------------------------
     一次性注入本章样式
     ------------------------------------------------------------ */
  function injectCSS() {
    if (document.getElementById('c-undo-style')) return;
    var st = document.createElement('style');
    st.id = 'c-undo-style';
    st.textContent = [
      '.c-undo-wrap{width:100%;display:flex;flex-direction:column;gap:clamp(12px,2vh,20px)}',
      '.c-undo-head{display:flex;flex-direction:column;gap:8px}',
      '.c-undo-head .sc-pill{align-self:flex-start}',
      '.c-undo-lead{max-width:64ch}',
      '.c-undo-lead b{color:var(--c-teal)}',
      '.c-undo-lead .wq{color:var(--c-amber);font-weight:800}',     /* 王琦高亮 */
      '.c-undo-lead .bad{color:var(--git);font-weight:800}',
      '.c-undo-mono{font-family:var(--font-mono);color:var(--c-teal)}',

      /* 画布卡：裸提交线居中 */
      '.c-undo-canvas{position:relative;display:flex;align-items:center;justify-content:center;',
        'min-height:240px;padding:clamp(16px,2.4vw,30px);overflow:visible}',
      '.c-undo-canvas .cg-wrap{width:100%}',

      /* 自绘的 hash 小标（覆盖在画布上，保证与「对 AI 说」框一字不差） */
      '.c-undo-haslayer{position:absolute;inset:0;pointer-events:none;z-index:3}',
      '.c-undo-hcap{position:absolute;transform:translate(-50%,0);font-family:var(--font-mono);',
        'font-size:11px;font-weight:500;color:var(--dim);letter-spacing:.02em;white-space:nowrap}',

      /* 「你在这一版」纯标记（绝非旗帜，story 用语） */
      '.c-undo-here{position:absolute;transform:translate(-50%,-100%);z-index:4;',
        'display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none}',
      '.c-undo-here .lab{background:var(--git);color:#fff;font-family:var(--font-sans);',
        'font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:6px;white-space:nowrap;',
        'box-shadow:0 2px 8px rgba(240,81,51,.4)}',
      '.c-undo-here .stem{width:2.5px;height:14px;background:var(--git)}',

      /* 一团「未提交的乱改」——零散抖动小方块 */
      '.c-undo-mess{position:absolute;z-index:5;transform:translate(-50%,-50%);',
        'transition:opacity .4s var(--ease),transform .4s var(--ease)}',
      '.c-undo-mess.gone{opacity:0;transform:translate(-50%,-50%) scale(.3)}',
      '.c-undo-blk{position:absolute;width:13px;height:13px;border-radius:3px;',
        'background:var(--c-amber);opacity:.9;animation:c-undo-jit 1.1s ease-in-out infinite}',
      '@keyframes c-undo-jit{0%,100%{transform:translate(0,0) rotate(-6deg)}',
        '50%{transform:translate(2px,-3px) rotate(7deg)}}',
      '.c-undo-mess .tag{position:absolute;top:-22px;left:50%;transform:translateX(-50%);',
        'white-space:nowrap;font-size:11px;color:var(--c-amber);font-weight:700;font-family:var(--font-sans)}',

      /* D「干净复位」光效 */
      '@keyframes c-undo-clean{0%{box-shadow:0 0 0 0 rgba(45,212,191,.6)}',
        '100%{box-shadow:0 0 0 26px rgba(45,212,191,0)}}',
      '.c-undo-cleanring{position:absolute;z-index:2;width:34px;height:34px;border-radius:50%;',
        'transform:translate(-50%,-50%);animation:c-undo-clean .8s var(--ease) forwards;pointer-events:none}',

      /* 操作 + AI 区 */
      '.c-undo-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:4px}',
      '.c-undo-ai{display:flex;justify-content:center;width:100%}',
      '.c-undo-ai .aicard{max-width:620px;width:100%}',

      /* 「对你来说」小卡 */
      '.c-undo-foryou{background:linear-gradient(135deg,rgba(45,212,191,.10),rgba(167,139,250,.08));',
        'border:1px solid var(--c-teal);border-radius:14px;padding:14px 18px;max-width:620px;',
        'width:100%;margin:0 auto;line-height:1.6}',
      '.c-undo-foryou .t{font-weight:800;color:var(--c-teal);margin-bottom:4px;display:block;font-size:14px}',
      '.c-undo-foryou .p{font-size:14.5px;color:var(--text)}',
      '.c-undo-foryou .p b{color:var(--c-amber)}',

      /* 自做的「对 AI 说」复制框（屏 4.1 用） */
      '.c-undo-saybox{display:flex;align-items:center;gap:10px;flex-wrap:wrap;max-width:620px;',
        'width:100%;margin:0 auto;background:var(--pane);border:1px solid var(--border);',
        'border-radius:14px;padding:12px 16px}',
      '.c-undo-saybox .ico{font-size:20px}',
      '.c-undo-saybox .say{flex:1;min-width:200px;font-size:15px;line-height:1.45}',
      '.c-undo-saybox .say .h{font-family:var(--font-mono);color:var(--c-teal);font-weight:700}',
      '.c-undo-saybox .say .pl{color:var(--dim)}',
      '.c-undo-copy{cursor:pointer;border:1px solid var(--border);background:var(--pane2);',
        'color:var(--text);font-size:13px;font-weight:600;border-radius:9px;padding:7px 14px;',
        'transition:background .15s,border-color .15s,color .15s;white-space:nowrap}',
      '.c-undo-copy:hover{background:#272e3d;border-color:#454d5e}',
      '.c-undo-copy.ok{color:var(--c-teal);border-color:var(--c-teal)}',

      /* 三栏对比（屏 4.5） */
      '.c-undo-cmp{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%;margin-top:4px}',
      '@media(max-width:820px){.c-undo-cmp{grid-template-columns:1fr}}',
      '.c-undo-col{background:var(--pane);border:1px solid var(--border);border-radius:16px;',
        'padding:16px;display:flex;flex-direction:column;gap:10px;cursor:pointer;',
        'transition:border-color .2s var(--ease),transform .2s var(--ease),background .2s}',
      '.c-undo-col:hover{transform:translateY(-3px);border-color:#454d5e}',
      '.c-undo-col.active{border-color:var(--git);box-shadow:0 0 0 1px var(--git) inset,0 0 22px rgba(240,81,51,.18)}',
      '.c-undo-col h3{font-size:17px;font-weight:800;display:flex;align-items:center;gap:8px}',
      '.c-undo-col .pill{font-family:var(--font-mono);font-size:12px;font-weight:700;',
        'padding:2px 8px;border-radius:6px;background:rgba(45,212,191,.14);color:var(--c-teal)}',
      '.c-undo-col .mini{width:100%;height:96px;border-radius:10px;background:#010409;',
        'border:1px solid var(--border);position:relative;overflow:hidden}',
      '.c-undo-col .desc{font-size:13.5px;color:var(--dim);line-height:1.5}',
      '.c-undo-col .desc b{color:var(--text)}',

      /* 三句口诀行 */
      '.c-undo-three{display:flex;flex-direction:column;gap:8px;max-width:680px;margin:10px auto 0;width:100%}',
      '.c-undo-three .row{display:flex;align-items:baseline;gap:10px;font-size:15.5px;line-height:1.5}',
      '.c-undo-three .k{font-family:var(--font-mono);font-weight:800;color:var(--git);min-width:74px}',
      '.c-undo-three .v b{color:var(--c-teal)}',

      '.c-undo-quote-wrap{text-align:center;margin:14px auto 0;max-width:760px}',

      /* 轻预告条 */
      '.c-undo-tease{max-width:720px;width:100%;margin:6px auto 0;background:rgba(167,139,250,.08);',
        'border:1px dashed var(--c-purple);border-radius:14px;padding:14px 18px;',
        'color:var(--text);font-size:14.5px;line-height:1.6;text-align:center}',
      '.c-undo-tease b{color:var(--c-purple)}',

      '.c-undo-foot{display:flex;align-items:center;gap:14px;flex-wrap:wrap;',
        'border-top:1px solid var(--border);padding-top:12px;margin-top:4px}',
      '.c-undo-hint{font-size:13px;color:var(--dim)}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------
     共用：在裸线上自绘 hash 小标 + 「你在这一版」标记。
     用 getNodeXY(页面坐标) 反算到画布卡内部坐标，绝对定位覆盖。
     —— 这样无论框架那侧 hashes/here 是否已画，屏上显示的 hash
        都与「对 AI 说」框里的字符串一字不差。
     需在布局稳定后调用（rAF + 轻量重试）。
     ------------------------------------------------------------ */
  function decorate(canvas, g, ids, hereId, opts) {
    opts = opts || {};
    // 清掉旧覆盖层（幂等）
    var old = canvas.querySelectorAll('.c-undo-haslayer,.c-undo-here');
    for (var i = 0; i < old.length; i++) { old[i].parentNode.removeChild(old[i]); }

    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return; // 还没布局，跳过（resize/replay 会再来）

    var layer = el('div', 'c-undo-haslayer');
    var placedAny = false;

    ids.forEach(function (id) {
      var xy = g.getNodeXY(id);
      if (!xy) return;
      var lx = xy.x - rect.left;
      var ly = xy.y - rect.top;
      placedAny = true;

      // hash 小标：放在节点下方
      var cap = el('div', 'c-undo-hcap', HASH[id] || id);
      cap.style.left = lx + 'px';
      cap.style.top = (ly + 24) + 'px';
      layer.appendChild(cap);
    });

    if (!placedAny) return;
    canvas.appendChild(layer);

    // 「你在这一版」标记
    if (hereId) {
      var hxy = g.getNodeXY(hereId);
      if (hxy) {
        var here = el('div', 'c-undo-here',
          '<div class="lab">' + (opts.hereText || '你在这一版') + '</div><div class="stem"></div>');
        here.style.left = (hxy.x - rect.left) + 'px';
        here.style.top = (hxy.y - rect.top - 22) + 'px';
        canvas.appendChild(here);
      }
    }
  }

  /* 布局稳定后再装饰（rAF 两帧 + 一次 80ms 兜底，覆盖首帧 viewBox 还没定的情况） */
  function decorateSoon(canvas, g, ids, hereId, opts) {
    function run() { try { decorate(canvas, g, ids, hereId, opts); } catch (e) {} }
    requestAnimationFrame(function () { requestAnimationFrame(run); });
    setTimeout(run, 90);
    setTimeout(run, 260);
  }

  /* 复制按钮：navigator.clipboard，带降级 */
  function wireCopy(btn, getText) {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var txt = getText();
      function done() {
        var old = btn.textContent;
        btn.textContent = '✓ 已复制';
        btn.classList.add('ok');
        setTimeout(function () { btn.textContent = old; btn.classList.remove('ok'); }, 1400);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, fallback);
      } else { fallback(); }
      function fallback() {
        try {
          var ta = document.createElement('textarea');
          ta.value = txt; ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          document.execCommand('copy'); document.body.removeChild(ta);
        } catch (err) {}
        done();
      }
    });
  }

  /* ============================================================
     屏 4.1 — 你的提交历史就是一条线 + 用 hash 指认版本
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-line',
    title: '你的提交历史就是一条线',
    subtitle: '每个版本都有自己的 hash，用它和 AI 指认',
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '💊 三颗后悔药'));
      head.appendChild(el('h2', 'sc-h2',
        '你的提交历史，就是<span style="color:var(--git)">一条按时间排开的线</span>'));
      head.appendChild(el('p', 'sc-p c-undo-lead',
        '到目前为止，你的项目就是这样<b>一条按时间排开的提交线</b>。' +
        '每个点都是你保存过的一个版本，每个点都有自己的 <span class="c-undo-mono">hash</span>。'));
      wrap.appendChild(head);

      var canvas = el('div', 'sc-card c-undo-canvas');
      wrap.appendChild(canvas);

      var g = api.graph(canvas, {});
      var IDS = ['A', 'B', 'C', 'D'];
      g.init('main', IDS, { bare: true, hashes: true, here: true });

      // 自绘 hash 小标 + 「你现在在这一版」
      var hereTxt = '你现在在这一版';
      decorateSoon(canvas, g, IDS, 'D', { hereText: hereTxt });

      // 自做的「对 AI 说」复制框（随点击更新）
      var sayBox = el('div', 'c-undo-saybox');
      sayBox.setAttribute('data-interactive', '1');
      sayBox.innerHTML =
        '<span class="ico">🤖</span>' +
        '<span class="say"><span class="pl">点上面任意一个点，自动生成「指认这一版」的话术 →</span></span>' +
        '<button class="c-undo-copy" disabled style="opacity:.45;cursor:default">复制</button>';
      var sayEl = sayBox.querySelector('.say');
      var copyBtn = sayBox.querySelector('.c-undo-copy');
      var currentSay = '';
      wireCopy(copyBtn, function () { return currentSay; });
      wrap.appendChild(sayBox);

      // 点击任意点 → 高亮它 + 生成话术
      function pick(id) {
        IDS.forEach(function (x) { try { g.highlight(x, x === id); } catch (e) {} });
        // highlight 触发 _render，覆盖层要重画
        decorateSoon(canvas, g, IDS, 'D', { hereText: hereTxt });
        var h = HASH[id];
        currentSay = '我说的是 ' + h + ' 这一版';
        sayEl.innerHTML = '我说的是 <span class="h">' + h + '</span> 这一版';
        copyBtn.disabled = false;
        copyBtn.style.opacity = '1';
        copyBtn.style.cursor = 'pointer';
      }

      // 点击命中：用 getNodeXY 反查最近的点
      canvas.addEventListener('click', function (e) {
        var rect = canvas.getBoundingClientRect();
        var px = e.clientX, py = e.clientY;
        var best = null, bestD = 1e9;
        IDS.forEach(function (id) {
          var xy = g.getNodeXY(id);
          if (!xy) return;
          var dx = xy.x - px, dy = xy.y - py;
          var d = dx * dx + dy * dy;
          if (d < bestD) { bestD = d; best = id; }
        });
        if (best && bestD < 44 * 44) {
          e.stopPropagation(); // 别让点击翻页
          pick(best);
        }
      }, true);

      // 讲解锚点（帧揭示）
      var anchor = el('div', 'c-undo-foryou');
      anchor.innerHTML =
        '<span class="t">📌 记住这一点</span>' +
        '<span class="p">接下来三颗后悔药，本质都是一句话：' +
        '<b>「我想回到 / 撤销某一版」</b>。你要做的，就是用 <span style="color:var(--c-teal);font-family:var(--font-mono)">hash</span> ' +
        '告诉 AI 是哪一版。hash，就是你和 AI 之间指认版本的通用代号。</span>';
      api.frag(anchor);
      wrap.appendChild(anchor);

      api.onReset(function () {
        IDS.forEach(function (x) { try { g.highlight(x, false); } catch (e) {} });
        currentSay = '';
        sayEl.innerHTML = '<span class="pl">点上面任意一个点，自动生成「指认这一版」的话术 →</span>';
        copyBtn.disabled = true; copyBtn.style.opacity = '.45'; copyBtn.style.cursor = 'default';
        decorateSoon(canvas, g, IDS, 'D', { hereText: hereTxt });
      });
    }
  });

  /* ============================================================
     屏 4.2 — 后悔药① discard：还没保存的，直接丢
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-discard',
    title: '后悔药① discard',
    subtitle: '还没保存的改动，直接丢掉',
    play: true,
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '💊① discard'));
      head.appendChild(el('h2', 'sc-h2',
        '后悔药① <span style="color:var(--git)">discard</span>：还没保存的，直接丢'));
      wrap.appendChild(head);

      // 场景故事
      var story = el('p', 'sc-p c-undo-lead');
      story.innerHTML =
        '你在写一篇活动推文，上一次提交已经基本写完了。这次你打开嘉宾 <span class="wq">王琦</span> 的人物介绍，' +
        '正准备给他加点幺蛾子——<b class="bad">还没保存提交</b>。结果王琦从背后探头，发现你在憋坏，' +
        '一把抢过电脑，啪地一个 <span class="c-undo-mono">discard</span>。' +
        '你这次<b>还没保存的改动，全没了</b>。';
      wrap.appendChild(story);

      var canvas = el('div', 'sc-card c-undo-canvas');
      wrap.appendChild(canvas);

      var g = api.graph(canvas, {});
      var IDS = ['A', 'B', 'C', 'D'];
      g.init('main', IDS, { bare: true, hashes: true, here: true });

      // 在 D 旁边漂一团「未提交的乱改」
      var mess = el('div', 'c-undo-mess');
      mess.innerHTML = '<div class="tag">未保存的乱改</div>';
      // 5 个抖动小方块，随机错落
      var POS = [[0, 0], [16, -10], [-14, 6], [10, 14], [-6, -16]];
      POS.forEach(function (p, i) {
        var b = el('div', 'c-undo-blk');
        b.style.left = (p[0]) + 'px';
        b.style.top = (p[1]) + 'px';
        b.style.animationDelay = (i * 0.13) + 's';
        mess.appendChild(b);
      });
      canvas.appendChild(mess);

      var IDS_HERE = 'D';
      function placeMess() {
        var rect = canvas.getBoundingClientRect();
        var xy = g.getNodeXY('D');
        if (rect.width && xy) {
          mess.style.left = (xy.x - rect.left + 48) + 'px';
          mess.style.top = (xy.y - rect.top + 4) + 'px';
        }
      }
      function redraw() {
        decorate(canvas, g, IDS, IDS_HERE, { hereText: '你在这一版' });
        placeMess();
      }
      function redrawSoon() {
        requestAnimationFrame(function () { requestAnimationFrame(redraw); });
        setTimeout(redraw, 90); setTimeout(redraw, 260);
      }
      redrawSoon();

      var discarded = false;
      function doDiscard(animated) {
        discarded = true;
        if (!animated) { mess.style.transition = 'none'; }
        mess.classList.add('gone');
        // D「干净复位」光效
        if (animated) {
          var rect = canvas.getBoundingClientRect();
          var xy = g.getNodeXY('D');
          if (rect.width && xy) {
            var ring = el('div', 'c-undo-cleanring');
            ring.style.left = (xy.x - rect.left) + 'px';
            ring.style.top = (xy.y - rect.top) + 'px';
            canvas.appendChild(ring);
            setTimeout(function () { if (ring.parentNode) ring.parentNode.removeChild(ring); }, 850);
          }
        }
        if (!animated) { void mess.offsetWidth; mess.style.transition = ''; }
        btn.disabled = true; btn.style.opacity = '.5'; btn.textContent = '✓ 已丢弃，回到干净的这一版';
      }

      var actions = el('div', 'c-undo-actions');
      var btn = el('button', 'sc-btn primary', '把还没提交的改动丢弃');
      btn.setAttribute('data-interactive', '1');
      btn.addEventListener('click', function (e) { e.stopPropagation(); if (!discarded) { doDiscard(true); } });
      actions.appendChild(btn);
      wrap.appendChild(actions);

      // step：键盘流也能演示
      api.step(function (animated) { doDiscard(animated); });

      // aiCard
      var aiHolder = el('div', 'c-undo-ai');
      aiHolder.appendChild(api.aiCard({
        effect: '把还没提交的改动直接扔掉，回到上一次提交的样子；已提交的历史完全不动',
        say: '把我没提交的改动全撤了',
        cmd: 'git restore .'
      }));
      api.frag(aiHolder);
      wrap.appendChild(aiHolder);

      // 「对你来说」小卡
      var foryou = el('div', 'c-undo-foryou');
      foryou.innerHTML =
        '<span class="t">💡 对你来说</span>' +
        '<span class="p">AI 一通乱改、还<b>没保存提交</b>，把项目改崩了——' +
        '一键 discard 回到上次能跑的存档，比让它一条条撤又快又稳。</span>';
      api.frag(foryou);
      wrap.appendChild(foryou);

      // 强调：历史线一点没动
      var note = el('div', 'sc-warn-banner');
      note.style.maxWidth = '620px'; note.style.margin = '0 auto';
      note.textContent = '注意：那条提交线一个点都没动——丢掉的只是「还没保存」的那团乱改。';
      api.frag(note);
      wrap.appendChild(note);

      api.onReset(function () {
        discarded = false;
        mess.style.transition = 'none';
        mess.classList.remove('gone');
        void mess.offsetWidth; mess.style.transition = '';
        btn.disabled = false; btn.style.opacity = '1'; btn.textContent = '把还没提交的改动丢弃';
        redrawSoon();
      });
    }
  });

  /* ============================================================
     屏 4.3 — 后悔药② reset：已经保存了，整个退回去
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-reset',
    title: '后悔药② reset',
    subtitle: '已经提交了，把项目整个退回某一版',
    play: true,
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '💊② reset'));
      head.appendChild(el('h2', 'sc-h2',
        '后悔药② <span style="color:var(--git)">reset</span>：已经保存了，整个退回去'));
      wrap.appendChild(head);

      var story = el('p', 'sc-p c-undo-lead');
      story.innerHTML =
        '这次你手快，已经把「上传王琦丑照」这次改动<b class="bad">提交</b>了。' +
        '<span class="wq">王琦</span>看到，雷霆大怒，直接把你的仓库 <span class="c-undo-mono">reset</span> ' +
        '到上一张没有丑照的历史版本——丑照那次提交、连同它之后的东西，<b>一起没了</b>。';
      wrap.appendChild(story);

      var canvas = el('div', 'sc-card c-undo-canvas');
      wrap.appendChild(canvas);

      var g = api.graph(canvas, {});
      var FULL = ['A', 'B', 'C', 'D']; // D = 丑照那次
      var BACK = ['A', 'B', 'C'];      // reset 后

      var reset = false;
      function build(after, animated) {
        g.reset();
        var ids = after ? BACK : FULL;
        var here = after ? 'C' : 'D';
        g.init('main', ids, { bare: true, hashes: true, here: true });
        if (!after) {
          // 把 D 高亮成「丑照」坏点
          try { g.highlight('D', true); } catch (e) {}
        }
        decorateSoon(canvas, g, ids, here, { hereText: '你在这一版' });
        return here;
      }
      build(false, false);

      var hintBanner = el('div', 'sc-warn-banner');
      hintBanner.style.maxWidth = '640px'; hintBanner.style.margin = '0 auto';
      hintBanner.textContent = 'D（丑照那次提交）之后的东西，reset 之后都被丢弃了——线缩回到 C 这一版。';
      hintBanner.style.display = 'none';
      wrap.appendChild(hintBanner);

      function doReset(animated) {
        if (reset) return;
        reset = true;
        build(true, animated);
        hintBanner.style.display = '';
        btn.disabled = true; btn.style.opacity = '.5'; btn.textContent = '✓ 已退回到 ' + HASH.C + ' 这一版';
      }

      var actions = el('div', 'c-undo-actions');
      var btn = el('button', 'sc-btn primary', '把仓库退回到 ' + HASH.C + ' 这一版（没丑照的那张）');
      btn.setAttribute('data-interactive', '1');
      btn.addEventListener('click', function (e) { e.stopPropagation(); doReset(true); });
      actions.appendChild(btn);
      wrap.appendChild(actions);

      api.step(function (animated) { doReset(animated); });

      var aiHolder = el('div', 'c-undo-ai');
      aiHolder.appendChild(api.aiCard({
        effect: '让项目整个退回到某个历史提交的状态，那个点之后的提交都被丢弃',
        say: '帮我 reset 到 ' + HASH.C + '（没丑照的那一版）',
        cmd: 'git reset --hard ' + HASH.C
      }));
      api.frag(aiHolder);
      wrap.appendChild(aiHolder);

      var foryou = el('div', 'c-undo-foryou');
      foryou.innerHTML =
        '<span class="t">💡 对你来说</span>' +
        '<span class="p">最近几次提交是死路，想<b>整个放弃、回到能跑的版本</b>——reset 一步到位。' +
        '记住它的脾气：退回去之后，<b>后面的提交就不要了</b>。</span>';
      api.frag(foryou);
      wrap.appendChild(foryou);

      api.onReset(function () {
        reset = false;
        build(false, false);
        hintBanner.style.display = 'none';
        btn.disabled = false; btn.style.opacity = '1';
        btn.textContent = '把仓库退回到 ' + HASH.C + ' 这一版（没丑照的那张）';
      });
    }
  });

  /* ============================================================
     屏 4.4 — 后悔药③ revert：生米煮成熟饭，只挑那一次撤掉
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-revert',
    title: '后悔药③ revert',
    subtitle: '只精准撤掉指定那一次，后面的全留着',
    play: true,
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '💊③ revert'));
      head.appendChild(el('h2', 'sc-h2',
        '后悔药③ <span style="color:var(--git)">revert</span>：只挑那一次撤掉'));
      wrap.appendChild(head);

      var story = el('p', 'sc-p c-undo-lead');
      story.innerHTML =
        '可这次生米早煮成熟饭了——丑照那次提交（<span class="c-undo-mono">' + HASH.B + '</span>）是<b>很久以前</b>提交的，' +
        '之后你又写了一大堆新内容、提交了好多次。如果像上次那样 reset 回没丑照的版本，' +
        '后面那一大段辛苦劳动<b class="bad">全得陪葬</b>。善良的<span class="wq">王琦</span>不忍心，他想：' +
        '能不能<b>只把那张丑照撤掉，你后面写的全留着</b>？这就是 <span class="c-undo-mono">revert</span>。';
      wrap.appendChild(story);

      var canvas = el('div', 'sc-card c-undo-canvas');
      wrap.appendChild(canvas);

      var g = api.graph(canvas, {});
      var BASE = ['A', 'B', 'C', 'D', 'E']; // B = 丑照（埋中间）；C/D/E = 辛苦劳动
      var WITH_F = ['A', 'B', 'C', 'D', 'E', 'F']; // F = 反向提交

      var reverted = false;
      function build(withF, animated) {
        g.reset();
        var ids = withF ? WITH_F : BASE;
        var here = withF ? 'F' : 'E';
        g.init('main', ids, { bare: true, hashes: true, here: here ? true : true });
        // 坏点 B 始终高亮
        try { g.highlight('B', true); } catch (e) {}
        if (withF) { try { g.highlight('F', true); } catch (e) {} }
        decorateSoon(canvas, g, ids, here, { hereText: '你在这一版' });
        return here;
      }
      build(false, false);

      // F 的注解（撤掉后出现）
      var fNote = el('div', 'sc-warn-banner');
      fNote.style.maxWidth = '700px'; fNote.style.margin = '0 auto';
      fNote.innerHTML = '末尾新长出的 ' + HASH.F + ' ＝把 ' + HASH.B +
        ' 的改动反着做一遍，专门抵消那张丑照。B、C、D、E 全保留——历史没删，后面劳动全在，只是末尾多了一次反向提交。';
      fNote.style.display = 'none';
      wrap.appendChild(fNote);

      function doRevert(animated) {
        if (reverted) return;
        reverted = true;
        build(true, animated);
        fNote.style.display = '';
        btn.disabled = true; btn.style.opacity = '.5'; btn.textContent = '✓ 已撤掉 ' + HASH.B + '（末尾长出抵消点 ' + HASH.F + '）';
      }

      var actions = el('div', 'c-undo-actions');
      var btn = el('button', 'sc-btn primary', '只撤掉 ' + HASH.B + ' 这次提交（那张丑照）');
      btn.setAttribute('data-interactive', '1');
      btn.addEventListener('click', function (e) { e.stopPropagation(); doRevert(true); });
      actions.appendChild(btn);
      wrap.appendChild(actions);

      api.step(function (animated) { doRevert(animated); });

      var aiHolder = el('div', 'c-undo-ai');
      aiHolder.appendChild(api.aiCard({
        effect: '不丢后面的提交，在末尾新增一次反向提交，精准抵消掉你指定的那一次提交',
        say: '帮我 revert 掉 ' + HASH.B + ' 这次提交（那张丑照）',
        cmd: 'git revert ' + HASH.B
      }));
      api.frag(aiHolder);
      wrap.appendChild(aiHolder);

      var foryou = el('div', 'c-undo-foryou');
      foryou.innerHTML =
        '<span class="t">💡 对你来说</span>' +
        '<span class="p">坏改动早提交了、上面还压着一堆好提交，<b>舍不得 reset</b>——' +
        'revert 精准拆弹：只拆掉那一颗，上面盖的好东西原封不动。</span>';
      api.frag(foryou);
      wrap.appendChild(foryou);

      api.onReset(function () {
        reverted = false;
        build(false, false);
        fNote.style.display = 'none';
        btn.disabled = false; btn.style.opacity = '1';
        btn.textContent = '只撤掉 ' + HASH.B + ' 这次提交（那张丑照）';
      });
    }
  });

  /* ============================================================
     屏 4.5 — 三颗药一图对比 + 口诀 + 轻预告
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-compare',
    title: '三颗药一图对比',
    subtitle: 'discard / reset / revert · 一句话口诀',
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '🎯 三颗药对比'));
      head.appendChild(el('h2', 'sc-h2',
        '三颗后悔药，<span style="color:var(--git)">一图看懂</span>'));
      head.appendChild(el('p', 'sc-p c-undo-lead',
        '同一条 <span class="c-undo-mono">A—B—C—D</span> 提交线，三颗药各做各的事。点卡片看它怎么动。'));
      wrap.appendChild(head);

      /* ---- 三栏 mini SVG 对比 ---- */
      var SVGNS = 'http://www.w3.org/2000/svg';
      function svg(name, attrs) {
        var e = document.createElementNS(SVGNS, name);
        if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
        return e;
      }
      // mini 画一条 A B C D 线（4 点），返回 {svg, nodeX, y, append}
      function miniLine(host, n) {
        n = n || 4;
        var W = 240, H = 96;
        var s = svg('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: '100%' });
        var y = 56, x0 = 30, gap = 50;
        // 连线
        var line = svg('line', { x1: x0, y1: y, x2: x0 + (n - 1) * gap, y2: y, stroke: 'var(--border)', 'stroke-width': 3 });
        s.appendChild(line);
        var xs = [];
        for (var i = 0; i < n; i++) {
          var cx = x0 + i * gap; xs.push(cx);
          var c = svg('circle', { cx: cx, cy: y, r: 11, fill: 'var(--c-main)', stroke: '#010409', 'stroke-width': 2 });
          c.setAttribute('data-i', i);
          s.appendChild(c);
        }
        host.appendChild(s);
        return { s: s, line: line, xs: xs, y: y, W: W, H: H, x0: x0, gap: gap };
      }

      var cmp = el('div', 'c-undo-cmp');
      wrap.appendChild(cmp);

      var COLS = [
        {
          key: 'discard', icon: '💊①', name: 'discard', pill: '丢没保存的',
          desc: '旁边那团<b>没保存</b>的改动被丢掉，<b>提交线一点不变</b>。'
        },
        {
          key: 'reset', icon: '💊②', name: 'reset', pill: '整个退回',
          desc: '线<b>缩回历史点</b>，后面的点<b>消失</b>。'
        },
        {
          key: 'revert', icon: '💊③', name: 'revert', pill: '末尾加抵消点',
          desc: '线末尾<b>多一个抵消点</b>，前面的全<b>保留</b>。'
        }
      ];

      var colObjs = [];
      COLS.forEach(function (c) {
        var col = el('div', 'c-undo-col');
        col.setAttribute('data-interactive', '1');
        col.innerHTML =
          '<h3>' + c.icon + ' <span style="color:var(--git)">' + c.name + '</span> ' +
          '<span class="pill">' + c.pill + '</span></h3>';
        var mini = el('div', 'mini');
        col.appendChild(mini);
        col.appendChild(el('div', 'desc', c.desc));
        cmp.appendChild(col);

        var L = miniLine(mini, 4);

        // 各栏专属装饰元素
        var extra = {};
        if (c.key === 'discard') {
          // D 旁一团没保存的小方块
          var m = el('div');
          m.style.position = 'absolute';
          m.style.zIndex = '2';
          m.style.left = '0'; m.style.top = '0';
          mini.appendChild(m);
          extra.mess = m;
        }

        colObjs.push({ def: c, col: col, mini: mini, L: L, extra: extra });
      });

      // 把一栏「演示」一遍（点击或自动）
      function playCol(o, on) {
        var L = o.L, key = o.def.key;
        // 先复位
        // 复位：重画 4 点线
        resetCol(o);
        if (!on) return;
        if (key === 'discard') {
          // 画一团乱改在 D 右侧，然后淡掉
          var rect = o.mini.getBoundingClientRect();
          var dot = L.xs[3], scale = rect.width ? rect.width / L.W : 1;
          var mx = (dot + 16) * scale, my = L.y * scale;
          var blkWrap = el('div');
          blkWrap.style.position = 'absolute';
          blkWrap.style.left = mx + 'px'; blkWrap.style.top = my + 'px';
          blkWrap.style.transition = 'opacity .5s var(--ease),transform .5s var(--ease)';
          for (var i = 0; i < 3; i++) {
            var b = el('div', 'c-undo-blk');
            b.style.left = (i * 5 - 5) + 'px'; b.style.top = (i % 2 ? -6 : 4) + 'px';
            b.style.animationDelay = (i * 0.12) + 's';
            blkWrap.appendChild(b);
          }
          o.mini.appendChild(blkWrap);
          setTimeout(function () {
            blkWrap.style.opacity = '0'; blkWrap.style.transform = 'scale(.3)';
          }, 420);
          setTimeout(function () { if (blkWrap.parentNode) blkWrap.parentNode.removeChild(blkWrap); }, 1000);
        } else if (key === 'reset') {
          // D 点淡出 + 线缩短
          var nodes = o.L.s.querySelectorAll('circle');
          var dNode = nodes[3];
          dNode.style.transition = 'opacity .5s var(--ease),transform .5s var(--ease)';
          dNode.style.transformOrigin = 'center';
          requestAnimationFrame(function () {
            dNode.style.opacity = '0';
            dNode.style.transform = 'scale(.2) translateX(-14px)';
          });
          o.L.line.style.transition = 'all .5s var(--ease)';
          o.L.line.setAttribute('x2', o.L.xs[2]);
        } else if (key === 'revert') {
          // 末尾长出第 5 点 F（git 橙），高亮
          var f = svg('circle', { cx: o.L.xs[3] + o.L.gap, cy: o.L.y, r: 11, fill: 'var(--git)', stroke: '#010409', 'stroke-width': 2 });
          f.style.opacity = '0';
          f.style.transition = 'opacity .5s var(--ease)';
          var fl = svg('line', { x1: o.L.xs[3], y1: o.L.y, x2: o.L.xs[3] + o.L.gap, y2: o.L.y, stroke: 'var(--git)', 'stroke-width': 3 });
          fl.style.opacity = '0'; fl.style.transition = 'opacity .5s var(--ease)';
          o.L.s.appendChild(fl); o.L.s.appendChild(f);
          // 扩展 viewBox 容下第 5 点
          o.L.s.setAttribute('viewBox', '0 0 ' + (o.L.x0 + 4 * o.L.gap + 20) + ' ' + o.L.H);
          requestAnimationFrame(function () { f.style.opacity = '1'; fl.style.opacity = '1'; });
        }
      }

      function resetCol(o) {
        // 删除附加元素，重画基础线
        var adds = o.mini.querySelectorAll('div:not(.mini)');
        // 重建 mini 内容最简单：清空再画
        o.mini.innerHTML = '';
        o.L = miniLine(o.mini, 4);
      }

      var activeKey = null;
      colObjs.forEach(function (o) {
        o.col.addEventListener('click', function (e) {
          e.stopPropagation();
          // 切换：本栏激活并播放，其余复位
          colObjs.forEach(function (x) {
            x.col.classList.toggle('active', x === o);
            if (x !== o) resetCol(x);
          });
          activeKey = o.def.key;
          playCol(o, true);
        });
      });

      // step：依次自动演示三栏
      api.step(function (animated) { colObjs[0].col.classList.add('active'); playCol(colObjs[0], animated); });
      api.step(function (animated) {
        colObjs[0].col.classList.remove('active'); resetCol(colObjs[0]);
        colObjs[1].col.classList.add('active'); playCol(colObjs[1], animated);
      });
      api.step(function (animated) {
        colObjs[1].col.classList.remove('active'); resetCol(colObjs[1]);
        colObjs[2].col.classList.add('active'); playCol(colObjs[2], animated);
      });

      /* ---- 三句话 ---- */
      var three = el('div', 'c-undo-three');
      three.innerHTML =
        '<div class="row"><span class="k">discard</span><span class="v">丢「<b>没保存的</b>」。</span></div>' +
        '<div class="row"><span class="k">reset</span><span class="v">「<b>整个退回、后面不要了</b>」。</span></div>' +
        '<div class="row"><span class="k">revert</span><span class="v">「<b>留着后面、只撤指定那次</b>」。</span></div>';
      api.frag(three);
      wrap.appendChild(three);

      /* ---- 口诀（文楷金句） ---- */
      var qw = el('div', 'c-undo-quote-wrap');
      qw.innerHTML =
        '<div class="sc-quote big">你不用记它们底层怎么实现，<br>' +
        '你只要说清<span class="accent">『我想要的效果』</span>，AI 就能帮你做。</div>';
      api.frag(qw);
      wrap.appendChild(qw);

      /* ---- 轻预告（只签路标、不剧透） ---- */
      var tease = el('div', 'c-undo-tease');
      tease.innerHTML =
        '这三颗药背后的门道——比如 <b>reset</b> 「丢掉」的提交是不是真的没了——' +
        '还有传说中的<b>第四颗药</b>，等我们讲完核心概念再回来揭晓 👀';
      api.frag(tease);
      wrap.appendChild(tease);

      api.onReset(function () {
        activeKey = null;
        colObjs.forEach(function (o) { o.col.classList.remove('active'); resetCol(o); });
      });
    }
  });

})();
