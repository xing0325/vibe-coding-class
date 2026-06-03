/* ============================================================
   sc-undo.js — 第 4 章 · 后悔药（王琦 + 你 · 漫画版）
   ------------------------------------------------------------
   v3 漫画改写：把纯文字场景改成「你」和「王琦」两个线性小人演的漫画。
   主角「你」爱搞幺蛾子（丑照 / 幺蛾子简介），嘉宾「王琦」被整、出手收拾。
   只讲【效果】和【场景】，绝不碰原理。三颗药：discard / reset / revert。
   revert 降级为「记住它存在」一屏，诚实说明日常用不上。

   ⭐ 知识锁（本文件逐字把关，绝对不出现于可见文案/按钮/气泡/tooltip）：
     分支 / branch / main / HEAD / 指针 / 分离 / 孤儿 /
     merge / checkout / 快照 / 父节点 / 移动指针 / 工作区 / 暂存区
   这条线只叫「提交线 / 项目这一版」，不叫 main；
   最新点标「你在这一版」，不叫 HEAD。

   框架由另一 agent 提供，本文件只调用契约：
     window.registerScreen({ chapter, chapterName, id, title, render })
     api.step(fn) / api.frag(el) / api.aiCard({effect,say,cmd}) /
     api.onReset(fn) / api.isReplay
     g = api.graph(container, opts)
     g.init('main', ['A','B','C','D'], {bare:true, hashes:true, here:true})
        —— 裸提交线：单色橙、每点下方短 hash、最新点标「你在这一版」。
        ("main" 仅是内部名，bare 模式下不显示，文案里绝不写出来。)
     g.addCommit('main','E') / g.highlight(id,bool) / g.setGhost(id,bool) /
     g.getNodeXY(id) / g.reset()
   所有 render 幂等：每次进入(含后退/resize)都从干净状态重建。
   class 前缀 c-undo-
   ============================================================ */
(function () {
  'use strict';

  var CH = 4;
  var CHNAME = '后悔药';

  /* 每个提交点的「短 hash」——你和 AI 指认某一版的通用代号。
     场景文案里出现的 c3d4e5f / a1b2c3d 就来自这里，保证屏上和「对 AI 说」框里一字不差。 */
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

  /* ============================================================
     两个小人 sprite —— 全章复用
     线性小人：圆头 + 线条身体，深空终端线性风；下方名字牌。
     makePerson(name, opts) -> 返回一个 .c-undo-person DOM（内含 SVG + 名字牌）
       name: '你' | '王琦'
       opts.mood: 'smirk'(坏笑) | 'angry'(瞪眼) | 'calm'(平和) | 'shout'(喊)
       opts.color: 主体描边色（默认 你=teal，王琦=amber）
       opts.flip: true 水平翻转（让两人面对面）
     ------------------------------------------------------------ */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function sv(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function makePerson(name, opts) {
    opts = opts || {};
    var isYou = (name === '你');
    var col = opts.color || (isYou ? 'var(--c-teal)' : 'var(--c-amber)');
    var mood = opts.mood || 'calm';

    var box = el('div', 'c-undo-person' + (opts.flip ? ' flip' : ''));

    var s = sv('svg', { viewBox: '0 0 80 110', width: '80', height: '110', 'class': 'c-undo-psvg' });
    s.style.setProperty('--pcol', col);

    // 头
    s.appendChild(sv('circle', { cx: 40, cy: 26, r: 16, fill: 'none', stroke: col, 'stroke-width': 3 }));

    // 眼睛（随 mood 变）
    if (mood === 'angry') {
      // 怒眉 + 竖瞪眼
      s.appendChild(sv('line', { x1: 30, y1: 19, x2: 37, y2: 23, stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
      s.appendChild(sv('line', { x1: 50, y1: 19, x2: 43, y2: 23, stroke: col, 'stroke-width': 2.4, 'stroke-linecap': 'round' }));
      s.appendChild(sv('circle', { cx: 33.5, cy: 27, r: 2.1, fill: col }));
      s.appendChild(sv('circle', { cx: 46.5, cy: 27, r: 2.1, fill: col }));
    } else if (mood === 'smirk') {
      // 坏笑：眯眼弧线
      s.appendChild(sv('path', { d: 'M30 26 q3.5 -3 7 0', fill: 'none', stroke: col, 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
      s.appendChild(sv('path', { d: 'M43 26 q3.5 -3 7 0', fill: 'none', stroke: col, 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
    } else {
      s.appendChild(sv('circle', { cx: 33.5, cy: 25, r: 2, fill: col }));
      s.appendChild(sv('circle', { cx: 46.5, cy: 25, r: 2, fill: col }));
    }

    // 嘴（随 mood 变）
    if (mood === 'smirk') {
      s.appendChild(sv('path', { d: 'M32 33 q8 5 15 -1', fill: 'none', stroke: col, 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
    } else if (mood === 'angry') {
      s.appendChild(sv('path', { d: 'M32 35 q8 -5 15 1', fill: 'none', stroke: col, 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
    } else if (mood === 'shout') {
      s.appendChild(sv('ellipse', { cx: 40, cy: 33, rx: 4.5, ry: 5.5, fill: 'none', stroke: col, 'stroke-width': 2.2 }));
    } else {
      s.appendChild(sv('line', { x1: 34, y1: 33, x2: 46, y2: 33, stroke: col, 'stroke-width': 2.2, 'stroke-linecap': 'round' }));
    }

    // 身体（脊柱）
    s.appendChild(sv('line', { x1: 40, y1: 42, x2: 40, y2: 78, stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    // 手臂（angry/shout 抬手，calm/smirk 自然垂）
    if (mood === 'angry' || mood === 'shout') {
      s.appendChild(sv('path', { d: 'M40 52 L22 44', fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }));
      s.appendChild(sv('path', { d: 'M40 52 L58 44', fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    } else {
      s.appendChild(sv('path', { d: 'M40 52 L24 60', fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }));
      s.appendChild(sv('path', { d: 'M40 52 L56 60', fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    }
    // 腿
    s.appendChild(sv('path', { d: 'M40 78 L28 100', fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }));
    s.appendChild(sv('path', { d: 'M40 78 L52 100', fill: 'none', stroke: col, 'stroke-width': 3, 'stroke-linecap': 'round' }));

    box.appendChild(s);

    // 名字牌
    var tag = el('div', 'c-undo-ptag' + (isYou ? ' me' : ''), name);
    box.appendChild(tag);
    return box;
  }

  /* 气泡对话：speech(person, text, opts)
     person: '你' | '王琦'（决定气泡尾巴方向/配色）
     opts.tail: 'left'|'right'（尾巴指向哪个小人，默认按 person 自动）*/
  function speech(person, text, opts) {
    opts = opts || {};
    var isYou = (person === '你');
    var cls = 'c-undo-bubble ' + (isYou ? 'from-you' : 'from-wq') +
      ' tail-' + (opts.tail || (isYou ? 'left' : 'right'));
    var b = el('div', cls);
    b.innerHTML = '<span class="who">' + person + '</span><span class="txt">' + text + '</span>';
    return b;
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
      '.c-undo-lead .me{color:var(--c-teal);font-weight:800}',      /* 你 高亮 */
      '.c-undo-lead .bad{color:var(--git);font-weight:800}',
      '.c-undo-mono{font-family:var(--font-mono);color:var(--c-teal)}',

      /* 画布卡：裸提交线居中 */
      '.c-undo-canvas{position:relative;display:flex;align-items:center;justify-content:center;',
        'min-height:240px;padding:clamp(16px,2.4vw,30px);overflow:visible}',
      '.c-undo-canvas .cg-wrap{width:100%}',

      /* 自绘的 hash 小标 */
      '.c-undo-haslayer{position:absolute;inset:0;pointer-events:none;z-index:3}',
      '.c-undo-hcap{position:absolute;transform:translate(-50%,0);font-family:var(--font-mono);',
        'font-size:11px;font-weight:500;color:var(--dim);letter-spacing:.02em;white-space:nowrap}',

      /* 「你在这一版」纯标记 */
      '.c-undo-here{position:absolute;transform:translate(-50%,-100%);z-index:4;',
        'display:flex;flex-direction:column;align-items:center;gap:2px;pointer-events:none}',
      '.c-undo-here .lab{background:var(--git);color:#fff;font-family:var(--font-sans);',
        'font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:6px;white-space:nowrap;',
        'box-shadow:0 2px 8px rgba(240,81,51,.4)}',
      '.c-undo-here .stem{width:2.5px;height:14px;background:var(--git)}',

      /* ---- 小人 sprite ---- */
      '.c-undo-person{display:flex;flex-direction:column;align-items:center;gap:6px;flex:0 0 auto}',
      '.c-undo-person.flip .c-undo-psvg{transform:scaleX(-1)}',
      '.c-undo-psvg{filter:drop-shadow(0 0 6px color-mix(in srgb,var(--pcol) 35%,transparent))}',
      '.c-undo-ptag{font-family:var(--font-sans);font-size:12px;font-weight:800;letter-spacing:.04em;',
        'padding:2px 11px;border-radius:999px;color:var(--c-amber);',
        'border:1px solid var(--c-amber);background:rgba(251,191,36,.10)}',
      '.c-undo-ptag.me{color:var(--c-teal);border-color:var(--c-teal);background:rgba(57,208,216,.10)}',

      /* ---- 气泡 ---- */
      '.c-undo-bubble{position:relative;max-width:30ch;background:var(--pane2);border:1px solid var(--border);',
        'border-radius:14px;padding:10px 14px;font-size:14px;line-height:1.5;color:var(--text)}',
      '.c-undo-bubble .who{display:block;font-size:11px;font-weight:800;margin-bottom:2px}',
      '.c-undo-bubble.from-you{border-color:var(--c-teal)}',
      '.c-undo-bubble.from-you .who{color:var(--c-teal)}',
      '.c-undo-bubble.from-wq{border-color:var(--c-amber)}',
      '.c-undo-bubble.from-wq .who{color:var(--c-amber)}',
      '.c-undo-bubble .txt b{color:var(--c-amber)}',
      '.c-undo-bubble.from-you .txt b{color:var(--c-teal)}',
      /* 尾巴 */
      '.c-undo-bubble::after{content:"";position:absolute;bottom:-8px;width:14px;height:14px;',
        'background:var(--pane2);border-right:1px solid;border-bottom:1px solid;',
        'border-color:inherit;transform:rotate(45deg)}',
      '.c-undo-bubble.tail-left::after{left:22px}',
      '.c-undo-bubble.tail-right::after{right:22px}',

      /* ---- 漫画格 ---- */
      '.c-undo-comic{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;width:100%}',
      '@media(max-width:860px){.c-undo-comic{grid-template-columns:1fr}}',
      '.c-undo-panel{position:relative;background:var(--pane);border:1px solid var(--border);',
        'border-radius:16px;padding:16px 14px 14px;display:flex;flex-direction:column;gap:12px;',
        'min-height:230px;overflow:hidden}',
      '.c-undo-panel .pnum{position:absolute;top:10px;right:12px;font-family:var(--font-mono);',
        'font-size:12px;font-weight:800;color:var(--dim);opacity:.8}',
      '.c-undo-panel .stagea{flex:1;display:flex;align-items:center;justify-content:center;',
        'gap:14px;position:relative;min-height:120px}',
      '.c-undo-panel .bubbox{display:flex;justify-content:center}',
      /* 入场（step 推进时） */
      '.c-undo-panel.pending{opacity:.18;filter:grayscale(.7)}',
      '.c-undo-panel{transition:opacity .45s var(--ease),filter .45s var(--ease)}',
      '.c-undo-panel.live{box-shadow:0 0 0 1px var(--git) inset,0 0 22px rgba(240,81,51,.16)}',

      /* 电脑屏（你坐电脑前） */
      '.c-undo-laptop{position:relative;width:54px;height:40px;flex:0 0 auto}',
      '.c-undo-laptop .scr{position:absolute;top:0;left:6px;width:42px;height:28px;border-radius:4px;',
        'border:2px solid var(--dim);background:#010409;overflow:hidden}',
      '.c-undo-laptop .base{position:absolute;bottom:0;left:0;width:54px;height:6px;border-radius:0 0 5px 5px;',
        'background:var(--dim)}',

      /* 一团「还没保存的乱改」——抖动小方块 */
      '.c-undo-mess{position:relative;width:46px;height:42px;flex:0 0 auto;',
        'transition:opacity .45s var(--ease),transform .45s var(--ease)}',
      '.c-undo-mess.gone{opacity:0;transform:scale(.25)}',
      '.c-undo-blk{position:absolute;width:12px;height:12px;border-radius:3px;',
        'background:var(--c-amber);opacity:.92;animation:c-undo-jit 1.1s ease-in-out infinite}',
      '@keyframes c-undo-jit{0%,100%{transform:translate(0,0) rotate(-6deg)}',
        '50%{transform:translate(2px,-3px) rotate(7deg)}}',
      '.c-undo-mess .tag{position:absolute;top:-20px;left:50%;transform:translateX(-50%);',
        'white-space:nowrap;font-size:11px;color:var(--c-amber);font-weight:700;font-family:var(--font-sans)}',
      /* 干净复位的「✓ 没了」 */
      '.c-undo-clean{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;',
        'font-size:13px;font-weight:800;color:var(--c-teal);opacity:0;transition:opacity .4s var(--ease)}',
      '.c-undo-clean.show{opacity:1}',

      /* 操作 + AI 区 */
      '.c-undo-actions{display:flex;gap:12px;flex-wrap:wrap;justify-content:center;margin-top:4px}',
      '.c-undo-ai{display:flex;justify-content:center;width:100%}',
      '.c-undo-ai .aicard{max-width:620px;width:100%}',

      /* 「对你来说」小卡 */
      '.c-undo-foryou{background:linear-gradient(135deg,rgba(57,208,216,.10),rgba(167,139,250,.08));',
        'border:1px solid var(--c-teal);border-radius:14px;padding:14px 18px;max-width:680px;',
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

      /* 小字说明 */
      '.c-undo-fine{font-size:13px;color:var(--dim);line-height:1.55;max-width:680px;margin:0 auto;text-align:center}',
      '.c-undo-fine b{color:var(--text)}',

      /* revert 两栏对比（屏 4.4） */
      '.c-undo-rv-toggle{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}',
      '.c-undo-rv-tab{cursor:pointer;border:1px solid var(--border);background:var(--pane2);',
        'color:var(--dim);font-size:14px;font-weight:700;border-radius:10px;padding:8px 18px;',
        'transition:all .18s var(--ease)}',
      '.c-undo-rv-tab.active{color:#fff;background:var(--git);border-color:var(--git)}',
      '.c-undo-two{display:grid;grid-template-columns:1fr 1fr;gap:14px;width:100%}',
      '@media(max-width:820px){.c-undo-two{grid-template-columns:1fr}}',
      '.c-undo-tcol{background:var(--pane);border:1px solid var(--border);border-radius:16px;',
        'padding:16px;display:flex;flex-direction:column;gap:10px;transition:border-color .2s var(--ease),opacity .2s}',
      '.c-undo-tcol.dim{opacity:.4}',
      '.c-undo-tcol.hot{border-color:var(--git);box-shadow:0 0 0 1px var(--git) inset,0 0 22px rgba(240,81,51,.16)}',
      '.c-undo-tcol h3{font-size:16px;font-weight:800;display:flex;align-items:center;gap:8px}',
      '.c-undo-tcol .badge{font-size:12px;font-weight:700;padding:2px 9px;border-radius:6px}',
      '.c-undo-tcol .badge.easy{background:rgba(57,208,216,.14);color:var(--c-teal)}',
      '.c-undo-tcol .badge.hard{background:rgba(251,191,36,.14);color:var(--c-amber)}',
      '.c-undo-tcol p{font-size:14px;color:var(--dim);line-height:1.6}',
      '.c-undo-tcol p b{color:var(--text)}',
      '.c-undo-tcol .talk{font-family:var(--font-mono);font-size:13px;color:var(--c-teal);',
        'background:#010409;border:1px solid var(--border);border-radius:9px;padding:8px 11px;line-height:1.5}',

      /* 三句口诀行（屏 4.5） */
      '.c-undo-three{display:flex;flex-direction:column;gap:8px;max-width:700px;margin:10px auto 0;width:100%}',
      '.c-undo-three .row{display:flex;align-items:baseline;gap:10px;font-size:15.5px;line-height:1.5}',
      '.c-undo-three .k{font-family:var(--font-mono);font-weight:800;color:var(--git);min-width:74px}',
      '.c-undo-three .v b{color:var(--c-teal)}',
      '.c-undo-three .v .soft{color:var(--dim);font-size:13px}',

      /* 两人并排 */
      '.c-undo-duo{display:flex;align-items:flex-end;justify-content:center;gap:30px;',
        'padding:6px 0 2px}',

      '.c-undo-quote-wrap{text-align:center;margin:14px auto 0;max-width:760px}',

      /* 轻预告条 */
      '.c-undo-tease{max-width:720px;width:100%;margin:6px auto 0;background:rgba(167,139,250,.08);',
        'border:1px dashed var(--c-purple);border-radius:14px;padding:14px 18px;',
        'color:var(--text);font-size:14.5px;line-height:1.6;text-align:center}',
      '.c-undo-tease b{color:var(--c-purple)}'
    ].join('');
    document.head.appendChild(st);
  }

  /* ------------------------------------------------------------
     共用：在裸线上自绘 hash 小标 + 「你在这一版」标记。
     ------------------------------------------------------------ */
  function decorate(canvas, g, ids, hereId, opts) {
    opts = opts || {};
    var old = canvas.querySelectorAll('.c-undo-haslayer,.c-undo-here');
    for (var i = 0; i < old.length; i++) { old[i].parentNode.removeChild(old[i]); }

    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    var layer = el('div', 'c-undo-haslayer');
    var placedAny = false;

    ids.forEach(function (id) {
      var xy = g.getNodeXY(id);
      if (!xy) return;
      var lx = xy.x - rect.left;
      var ly = xy.y - rect.top;
      placedAny = true;
      var cap = el('div', 'c-undo-hcap', HASH[id] || id);
      cap.style.left = lx + 'px';
      cap.style.top = (ly + 24) + 'px';
      layer.appendChild(cap);
    });

    if (!placedAny) return;
    canvas.appendChild(layer);

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

  /* 一团「还没保存的乱改」抖动小方块（可复用） */
  function makeMess(label) {
    var mess = el('div', 'c-undo-mess');
    if (label) { mess.appendChild(el('div', 'tag', label)); }
    var POS = [[16, 12], [30, 4], [6, 22], [24, 26], [12, 2]];
    POS.forEach(function (p, i) {
      var b = el('div', 'c-undo-blk');
      b.style.left = p[0] + 'px';
      b.style.top = p[1] + 'px';
      b.style.animationDelay = (i * 0.13) + 's';
      mess.appendChild(b);
    });
    mess.appendChild(el('div', 'c-undo-clean', '✓ 没了'));
    return mess;
  }

  /* 简易笔记本电脑（你坐它前面） */
  function makeLaptop() {
    var lap = el('div', 'c-undo-laptop');
    lap.innerHTML = '<div class="scr"></div><div class="base"></div>';
    return lap;
  }

  /* ============================================================
     屏 4.1 — undo-line：你的项目就是一条提交线 + 用 hash 指认版本
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-line',
    title: '你的项目就是一条提交线',
    subtitle: '每个版本都有自己的 hash，用它和 AI 指认',
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '💊 后悔药'));
      head.appendChild(el('h2', 'sc-h2',
        '你的项目，就是<span style="color:var(--git)">一条按时间排开的提交线</span>'));
      head.appendChild(el('p', 'sc-p c-undo-lead',
        '你的项目就是这样<b>一条按时间排开的提交线</b>，每个点都是你保存过的一个版本，' +
        '每个点都有自己的 <span class="c-undo-mono">hash</span>。'));
      wrap.appendChild(head);

      var canvas = el('div', 'sc-card c-undo-canvas');
      wrap.appendChild(canvas);

      var g = api.graph(canvas, {});
      var IDS = ['A', 'B', 'C', 'D'];
      g.init('main', IDS, { bare: true, hashes: true, here: true });

      var hereTxt = '你现在在这一版';
      decorateSoon(canvas, g, IDS, 'D', { hereText: hereTxt });

      // 自做的「对 AI 说」复制框
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

      function pick(id) {
        IDS.forEach(function (x) { try { g.highlight(x, x === id); } catch (e) {} });
        decorateSoon(canvas, g, IDS, 'D', { hereText: hereTxt });
        var h = HASH[id];
        currentSay = '我说的是 ' + h + ' 这一版';
        sayEl.innerHTML = '我说的是 <span class="h">' + h + '</span> 这一版';
        copyBtn.disabled = false;
        copyBtn.style.opacity = '1';
        copyBtn.style.cursor = 'pointer';
      }

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
          e.stopPropagation();
          pick(best);
        }
      }, true);

      var anchor = el('div', 'c-undo-foryou');
      anchor.innerHTML =
        '<span class="t">📌 记住这一点</span>' +
        '<span class="p">接下来的后悔药，本质都是『<b>回到 / 撤销某一版</b>』。' +
        '你要做的，就是用 <span style="color:var(--c-teal);font-family:var(--font-mono)">hash</span> ' +
        '告诉 AI 是哪一版——hash，就是你和 AI 之间指认版本的通用代号。</span>';
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
     屏 4.2 — undo-discard：三格漫画（你搞幺蛾子 → 王琦抢电脑 → discard）
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-discard',
    title: '后悔药① discard（漫画）',
    subtitle: '还没保存的改动，王琦一键丢掉',
    play: true,
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '💊① discard'));
      head.appendChild(el('h2', 'sc-h2',
        '后悔药① <span style="color:var(--git)">discard</span>：还没保存的，直接丢'));
      head.appendChild(el('p', 'sc-p c-undo-lead',
        '<span class="me">你</span>又在憋坏，<span class="wq">王琦</span>出手收拾——三格漫画，点按钮往下推。'));
      wrap.appendChild(head);

      /* ---- 三格漫画 ---- */
      var comic = el('div', 'c-undo-comic');
      wrap.appendChild(comic);

      // 格1：你坐电脑前坏笑，给王琦简介加幺蛾子，屏上一团没保存的乱改
      var p1 = el('div', 'c-undo-panel pending');
      p1.appendChild(el('div', 'pnum', '格 1'));
      var st1 = el('div', 'stagea');
      var youSmirk = makePerson('你', { mood: 'smirk' });
      st1.appendChild(youSmirk);
      st1.appendChild(makeLaptop());
      var mess1 = makeMess('还没保存的乱改');
      st1.appendChild(mess1);
      p1.appendChild(st1);
      var bb1 = el('div', 'bubbox');
      bb1.appendChild(speech('你', '嘿嘿，给王琦的简介加点<b>幺蛾子</b>……'));
      p1.appendChild(bb1);
      comic.appendChild(p1);

      // 格2：王琦从背后探头瞪眼，一把抢过电脑
      var p2 = el('div', 'c-undo-panel pending');
      p2.appendChild(el('div', 'pnum', '格 2'));
      var st2 = el('div', 'stagea');
      st2.appendChild(makePerson('你', { mood: 'calm' }));
      st2.appendChild(makePerson('王琦', { mood: 'angry', flip: true }));
      p2.appendChild(st2);
      var bb2 = el('div', 'bubbox');
      bb2.appendChild(speech('王琦', '你在干嘛！'));
      p2.appendChild(bb2);
      comic.appendChild(p2);

      // 格3：王琦点 discard，那团乱改「啪」消失，回到上次保存的样子
      var p3 = el('div', 'c-undo-panel pending');
      p3.appendChild(el('div', 'pnum', '格 3'));
      var st3 = el('div', 'stagea');
      st3.appendChild(makePerson('王琦', { mood: 'calm' }));
      var mess3 = makeMess('还没保存的乱改');
      st3.appendChild(mess3);
      p3.appendChild(st3);
      var bb3 = el('div', 'bubbox');
      bb3.appendChild(speech('王琦', '还没提交吧？没了。'));
      p3.appendChild(bb3);
      comic.appendChild(p3);

      var panels = [p1, p2, p3];

      // 提交线：始终纹丝不动
      var canvas = el('div', 'sc-card c-undo-canvas');
      wrap.appendChild(canvas);
      var g = api.graph(canvas, {});
      var IDS = ['A', 'B', 'C', 'D'];
      g.init('main', IDS, { bare: true, hashes: true, here: true });
      decorateSoon(canvas, g, IDS, 'D', { hereText: '你在这一版' });

      var lineNote = el('div', 'c-undo-fine');
      lineNote.innerHTML = '提交线<b>纹丝不动</b>——丢掉的只是「还没保存」的那团乱改。';
      wrap.appendChild(lineNote);

      var discarded = false;

      // 逐格推进：用 api.step
      function lightPanel(i) {
        panels.forEach(function (p, k) {
          p.classList.toggle('pending', k > i);
          p.classList.toggle('live', k === i);
        });
      }
      function doDiscard(animated) {
        discarded = true;
        if (!animated) { mess3.style.transition = 'none'; mess1.style.transition = 'none'; }
        mess3.classList.add('gone');
        mess1.classList.add('gone');
        var ck3 = p3.querySelector('.c-undo-clean');
        if (ck3) ck3.classList.add('show');
        if (!animated) {
          void mess3.offsetWidth; mess3.style.transition = '';
          void mess1.offsetWidth; mess1.style.transition = '';
        }
        btn.disabled = true; btn.style.opacity = '.5';
        btn.textContent = '✓ 已丢掉，回到上次保存的样子';
      }

      // step1: 点亮格1  step2: 点亮格2  step3: 点亮格3 + 执行 discard
      api.step(function () { lightPanel(0); });
      api.step(function () { lightPanel(1); });
      api.step(function (animated) { lightPanel(2); doDiscard(animated); });

      var actions = el('div', 'c-undo-actions');
      var btn = el('button', 'sc-btn primary', '王琦：丢掉这些没保存的改动');
      btn.setAttribute('data-interactive', '1');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        // 一键把三格走完
        lightPanel(2);
        if (!discarded) { doDiscard(true); }
      });
      actions.appendChild(btn);
      wrap.appendChild(actions);

      var aiHolder = el('div', 'c-undo-ai');
      aiHolder.appendChild(api.aiCard({
        effect: '把还没提交的改动全部丢掉，回到上次保存的样子',
        say: '把我没提交的改动都还原了',
        cmd: 'git restore .'
      }));
      api.frag(aiHolder);
      wrap.appendChild(aiHolder);

      var fine = el('div', 'c-undo-fine');
      fine.innerHTML = 'discard = 丢掉「还没 commit」的改动，<b>已提交的历史一点不动</b>。' +
        '（日常：AI 乱改还没提交、一键还原。）';
      api.frag(fine);
      wrap.appendChild(fine);

      api.onReset(function () {
        discarded = false;
        [mess1, mess3].forEach(function (m) {
          m.style.transition = 'none';
          m.classList.remove('gone');
          void m.offsetWidth; m.style.transition = '';
        });
        var ck3 = p3.querySelector('.c-undo-clean');
        if (ck3) ck3.classList.remove('show');
        panels.forEach(function (p) { p.classList.add('pending'); p.classList.remove('live'); });
        btn.disabled = false; btn.style.opacity = '1'; btn.textContent = '王琦：丢掉这些没保存的改动';
        decorateSoon(canvas, g, IDS, 'D', { hereText: '你在这一版' });
      });
    }
  });

  /* ============================================================
     屏 4.3 — undo-reset：漫画（你先存了丑照 → 王琦气炸 → reset 回 C）
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-reset',
    title: '后悔药② reset（漫画）',
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
      head.appendChild(el('p', 'sc-p c-undo-lead',
        '这次<span class="me">你</span>手快，<b class="bad">先存了再说</b>；<span class="wq">王琦</span>看到立刻收拾。'));
      wrap.appendChild(head);

      /* ---- 三格漫画 ---- */
      var comic = el('div', 'c-undo-comic');
      wrap.appendChild(comic);

      // 格1：你手快，已把「上传王琦丑照」commit 了（D）
      var p1 = el('div', 'c-undo-panel pending');
      p1.appendChild(el('div', 'pnum', '格 1'));
      var st1 = el('div', 'stagea');
      st1.appendChild(makePerson('你', { mood: 'smirk' }));
      st1.appendChild(makeLaptop());
      st1.appendChild(el('div', '', '<span style="font-size:30px">📷</span>'));
      p1.appendChild(st1);
      var bb1 = el('div', 'bubbox');
      bb1.appendChild(speech('你', '这次<b>先存了再说</b>！丑照上传搞定～'));
      p1.appendChild(bb1);
      comic.appendChild(p1);

      // 格2：王琦看到 D 气炸
      var p2 = el('div', 'c-undo-panel pending');
      p2.appendChild(el('div', 'pnum', '格 2'));
      var st2 = el('div', 'stagea');
      st2.appendChild(makePerson('王琦', { mood: 'shout' }));
      st2.appendChild(el('div', '', '<span style="font-size:30px">📷</span>'));
      p2.appendChild(st2);
      var bb2 = el('div', 'bubbox');
      bb2.appendChild(speech('王琦', '这张照片<b>给我撤了</b>！'));
      p2.appendChild(bb2);
      comic.appendChild(p2);

      // 格3：王琦 reset 回 C，「你在这一版」落到 C
      var p3 = el('div', 'c-undo-panel pending');
      p3.appendChild(el('div', 'pnum', '格 3'));
      var st3 = el('div', 'stagea');
      st3.appendChild(makePerson('王琦', { mood: 'calm' }));
      p3.appendChild(st3);
      var bb3 = el('div', 'bubbox');
      bb3.appendChild(speech('王琦', '退回到没丑照那版，干净了。'));
      p3.appendChild(bb3);
      comic.appendChild(p3);

      var panels = [p1, p2, p3];

      /* ---- 提交线：A—B—C—D（D 标丑照），reset 后缩回 A—B—C ---- */
      var canvas = el('div', 'sc-card c-undo-canvas');
      wrap.appendChild(canvas);

      var g = api.graph(canvas, {});
      var FULL = ['A', 'B', 'C', 'D']; // D = 丑照那次
      var BACK = ['A', 'B', 'C'];      // reset 后

      function build(after) {
        g.reset();
        var ids = after ? BACK : FULL;
        var here = after ? 'C' : 'D';
        g.init('main', ids, { bare: true, hashes: true, here: true });
        if (!after) { try { g.highlight('D', true); } catch (e) {} }
        decorateSoon(canvas, g, ids, here, { hereText: '你在这一版' });
      }
      build(false);

      // D 旁的「丑照📷」标
      var dTag = el('div', 'c-undo-haslayer');
      dTag.style.zIndex = '4';
      var dCap = el('div', 'c-undo-hcap');
      dCap.style.color = 'var(--git)';
      dCap.style.fontWeight = '800';
      dCap.style.fontFamily = 'var(--font-sans)';
      dCap.textContent = '丑照📷';
      dTag.appendChild(dCap);
      function placeDTag() {
        if (reset) { dCap.style.display = 'none'; return; }
        dCap.style.display = '';
        var rect = canvas.getBoundingClientRect();
        var xy = g.getNodeXY('D');
        if (rect.width && xy) {
          dCap.style.left = (xy.x - rect.left) + 'px';
          dCap.style.top = (xy.y - rect.top - 44) + 'px';
        }
      }
      canvas.appendChild(dTag);
      function placeDTagSoon() {
        requestAnimationFrame(function () { requestAnimationFrame(placeDTag); });
        setTimeout(placeDTag, 100); setTimeout(placeDTag, 280);
      }
      placeDTagSoon();

      var hintBanner = el('div', 'c-undo-fine');
      hintBanner.innerHTML = 'D（丑照那次）之后的东西，reset 之后都<b>没了</b>——线缩回到 C 这一版。';
      hintBanner.style.display = 'none';
      wrap.appendChild(hintBanner);

      var reset = false;
      function lightPanel(i) {
        panels.forEach(function (p, k) {
          p.classList.toggle('pending', k > i);
          p.classList.toggle('live', k === i);
        });
      }
      function doReset() {
        if (reset) return;
        reset = true;
        build(true);
        placeDTagSoon();
        hintBanner.style.display = '';
        btn.disabled = true; btn.style.opacity = '.5';
        btn.textContent = '✓ 已退回到 ' + HASH.C + ' 这一版';
      }

      api.step(function () { lightPanel(0); });
      api.step(function () { lightPanel(1); });
      api.step(function () { lightPanel(2); doReset(); });

      var actions = el('div', 'c-undo-actions');
      var btn = el('button', 'sc-btn primary', '王琦：退回到没丑照的 C 版（' + HASH.C + '）');
      btn.setAttribute('data-interactive', '1');
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        lightPanel(2); doReset();
      });
      actions.appendChild(btn);
      wrap.appendChild(actions);

      var aiHolder = el('div', 'c-undo-ai');
      aiHolder.appendChild(api.aiCard({
        effect: '项目整个退回到某个历史版本，那之后的提交都丢弃',
        say: '帮我 reset 到 ' + HASH.C + '（没丑照那版）',
        cmd: 'git reset --hard ' + HASH.C
      }));
      api.frag(aiHolder);
      wrap.appendChild(aiHolder);

      var fine = el('div', 'c-undo-fine');
      fine.innerHTML = 'reset = 退回某个历史版本，那之后的提交都被丢弃。' +
        '（日常：最近几步走死了，整个退回能跑的那版。）';
      api.frag(fine);
      wrap.appendChild(fine);

      api.onReset(function () {
        reset = false;
        build(false);
        placeDTagSoon();
        hintBanner.style.display = 'none';
        panels.forEach(function (p) { p.classList.add('pending'); p.classList.remove('live'); });
        btn.disabled = false; btn.style.opacity = '1';
        btn.textContent = '王琦：退回到没丑照的 C 版（' + HASH.C + '）';
      });
    }
  });

  /* ============================================================
     屏 4.4 — undo-revert：降级为一屏，诚实说明日常用不上
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-revert',
    title: '第三颗药 revert（了解即可）',
    subtitle: '记住它存在——等项目复杂到要精确拆弹再说',
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '💊③ revert'));
      head.appendChild(el('h2', 'sc-h2',
        '还有第三颗药叫 <span style="color:var(--git)">revert</span>'));
      head.appendChild(el('p', 'sc-p c-undo-lead',
        '它在最新版后面加一次『<b>反向提交</b>』，专门撤掉历史里某一次的改动、<b>其他全留着</b>。' +
        '——但说实话，它不是你日常会主动用的，先看看下面这两栏对比。'));
      wrap.appendChild(head);

      // 切换
      var toggle = el('div', 'c-undo-rv-toggle');
      var tabSimple = el('button', 'c-undo-rv-tab active', '简单项目');
      var tabComplex = el('button', 'c-undo-rv-tab', '复杂项目');
      tabSimple.setAttribute('data-interactive', '1');
      tabComplex.setAttribute('data-interactive', '1');
      toggle.appendChild(tabSimple); toggle.appendChild(tabComplex);
      wrap.appendChild(toggle);

      // 两栏
      var two = el('div', 'c-undo-two');
      var colSimple = el('div', 'c-undo-tcol hot');
      colSimple.innerHTML =
        '<h3>🟢 简单项目 <span class="badge easy">不用 revert</span></h3>' +
        '<p>你<b>根本不用去翻 hash</b> 来 revert——直接把需求说给 AI，在最新版上改就行。' +
        '「把王琦的丑照换成正常照片」，<b>一句话的事</b>。</p>' +
        '<div class="talk">「把王琦的丑照换成正常照片」</div>';
      var colComplex = el('div', 'c-undo-tcol dim');
      colComplex.innerHTML =
        '<h3>🟡 复杂项目 <span class="badge hard">才用 revert</span></h3>' +
        '<p>项目大了、怕 AI 一改<b>动到别处</b>，才需要指哪打哪——精确告诉它' +
        '「只撤 <span class="c-undo-mono">a1b2c3d</span> 这次的改动，别碰其他」，' +
        '这时 revert 才<b>真派上用场</b>。</p>' +
        '<div class="talk">「只撤掉 a1b2c3d 这次的改动，别碰其他」</div>';
      two.appendChild(colSimple); two.appendChild(colComplex);
      wrap.appendChild(two);

      function selectTab(which) {
        var simple = (which === 'simple');
        tabSimple.classList.toggle('active', simple);
        tabComplex.classList.toggle('active', !simple);
        colSimple.classList.toggle('hot', simple);
        colSimple.classList.toggle('dim', !simple);
        colComplex.classList.toggle('hot', !simple);
        colComplex.classList.toggle('dim', simple);
      }
      tabSimple.addEventListener('click', function (e) { e.stopPropagation(); selectTab('simple'); });
      tabComplex.addEventListener('click', function (e) { e.stopPropagation(); selectTab('complex'); });

      var aiHolder = el('div', 'c-undo-ai');
      aiHolder.appendChild(api.aiCard({
        effect: '在最新版后面加一次反向提交，精准撤掉历史某一次改动',
        say: '只撤掉 a1b2c3d 这次的改动，别碰其他',
        cmd: 'git revert a1b2c3d'
      }));
      api.frag(aiHolder);
      wrap.appendChild(aiHolder);

      var fine = el('div', 'c-undo-fine');
      fine.innerHTML = 'revert <b>不是你日常会主动用的</b>——记住它存在，等项目复杂到要精确拆弹时再说。';
      api.frag(fine);
      wrap.appendChild(fine);

      api.onReset(function () { selectTab('simple'); });
    }
  });

  /* ============================================================
     屏 4.5 — undo-compare：小结 + 口诀 + 轻预告（两个小人并排）
     ============================================================ */
  register({
    chapter: CH,
    chapterName: CHNAME,
    id: 'undo-compare',
    title: '三颗药小结 · 口诀',
    subtitle: 'discard / reset / revert · 说清效果，AI 帮你做',
    render: function (stage, api) {
      injectCSS();

      var wrap = el('div', 'c-undo-wrap');
      stage.appendChild(wrap);

      var head = el('div', 'c-undo-head');
      head.appendChild(el('span', 'sc-pill', '🎯 三颗药小结'));
      head.appendChild(el('h2', 'sc-h2',
        '三颗后悔药，<span style="color:var(--git)">一句话记住</span>'));
      wrap.appendChild(head);

      // 两个小人并排
      var duo = el('div', 'c-undo-duo');
      duo.appendChild(makePerson('你', { mood: 'calm' }));
      duo.appendChild(makePerson('王琦', { mood: 'calm', flip: true }));
      wrap.appendChild(duo);

      // 三行口诀
      var three = el('div', 'c-undo-three');
      three.innerHTML =
        '<div class="row"><span class="k">discard</span><span class="v">还没保存的，<b>丢掉</b>。</span></div>' +
        '<div class="row"><span class="k">reset</span><span class="v">已经保存了，<b>整个退回去</b>。</span></div>' +
        '<div class="row"><span class="k">revert</span><span class="v"><b>只撤历史里某一次</b> <span class="soft">（复杂项目才用）</span>。</span></div>';
      api.frag(three);
      wrap.appendChild(three);

      // 文楷金句
      var qw = el('div', 'c-undo-quote-wrap');
      qw.innerHTML =
        '<div class="sc-quote big">你不用记它们底层怎么实现，<br>' +
        '说清你要的<span class="accent">『效果』</span>，AI 就能帮你做。</div>';
      api.frag(qw);
      wrap.appendChild(qw);

      // 轻预告（只签路标、不剧透）
      var tease = el('div', 'c-undo-tease');
      tease.innerHTML =
        '<b>reset</b> 为什么能把提交『退掉』、这些提交是不是真的没了——' +
        '等讲完后面的内容，我们再回来揭晓 👀';
      api.frag(tease);
      wrap.appendChild(tease);

      api.onReset(function () {});
    }
  });

})();
