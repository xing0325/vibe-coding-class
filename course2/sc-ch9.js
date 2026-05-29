/* ============================================================
 * 第 9 章 · Worktree（进阶 / 彩蛋）
 *   屏 9.1 worktree-what       · 什么是 worktree（左右两个工作窗口）
 *   屏 9.2 worktree-projection · 不是平行宇宙，是投影（两双眼睛望向同一张图）
 *   屏 9.3 worktree-qa         · Q&A：触摸 git 本质（悬念式 reveal）
 *   屏 9.4 worktree-killer     · Vibe coder 杀手级用法（3 个 agent 并行）
 * 样式前缀: c-ch9-
 * 仅调用框架契约：registerScreen / api.step / api.frag / api.next / api.onReset /
 *   api.graph → g.init / g.addCommit / g.createBranch / g.highlight / g.reset
 *
 * 重要：framework 每次进入屏(含后退/resize)都会 fresh 调 render，并把 step
 * 以 animated=false 重放。所以 render 建初始 DOM + 全新 graph，每个 step(fn)
 * 都从干净状态幂等重建，不依赖上一次 render 的残留。
 * ============================================================ */
(function () {
  'use strict';

  var TEAL = '#2DD4BF';
  var PURPLE = '#A78BFA';
  var AMBER = '#FBBF24';
  var MAIN = '#E6EDF3';

  /* 注册：引擎可能还没加载，落到 __pendingScreens 队列 */
  function register(def) {
    if (typeof window.registerScreen === 'function') { window.registerScreen(def); }
    else { (window.__pendingScreens = window.__pendingScreens || []).push(def); }
  }

  /* 本章作用域样式，仅注入一次（多屏共用） */
  function injectStyle() {
    if (document.getElementById('c-ch9-style')) return;
    var s = document.createElement('style');
    s.id = 'c-ch9-style';
    s.textContent = [
      /* ---------- 通用头 ---------- */
      '.c-ch9-wrap{width:100%;display:flex;flex-direction:column;gap:clamp(12px,2.2vh,22px);}',
      '.c-ch9-head{display:flex;flex-direction:column;gap:8px;}',
      '.c-ch9-head .sc-pill{align-self:flex-start;}',
      '.c-ch9-narrate{min-height:2.6em;max-width:70ch;color:var(--text);transition:opacity .3s var(--ease);}',
      '.c-ch9-narrate b{color:var(--c-teal);}',
      '.c-ch9-narrate .amb{color:var(--c-amber);}',
      '.c-ch9-narrate .pur{color:var(--c-purple);}',
      '.c-ch9-foot{display:flex;align-items:center;gap:14px;flex-wrap:wrap;}',
      '.c-ch9-hint{font-size:13px;color:var(--dim);}',

      /* ---------- 工作窗口面板（屏 9.1 / 9.2 / 9.4 复用） ---------- */
      '.c-ch9-panes{display:grid;gap:clamp(14px,2vw,24px);align-items:stretch;}',
      '.c-ch9-panes.two{grid-template-columns:1fr 1fr;}',
      '.c-ch9-panes.three{grid-template-columns:repeat(3,1fr);}',
      '@media (max-width:820px){.c-ch9-panes.two,.c-ch9-panes.three{grid-template-columns:1fr;}}',
      '.c-ch9-pane{background:var(--pane);border:1px solid var(--border);border-radius:14px;overflow:hidden;display:flex;flex-direction:column;min-width:0;}',
      /* 窗口标题栏：仿编辑器 traffic-light */
      '.c-ch9-bar{display:flex;align-items:center;gap:8px;padding:9px 13px;background:var(--pane2);border-bottom:1px solid var(--border);}',
      '.c-ch9-dots{display:flex;gap:6px;}',
      '.c-ch9-dot{width:11px;height:11px;border-radius:50%;background:#3a4250;}',
      '.c-ch9-dot.r{background:#ff5f57;}.c-ch9-dot.y{background:#febc2e;}.c-ch9-dot.g{background:#28c840;}',
      '.c-ch9-bar-title{font-family:var(--font-mono);font-size:12.5px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '.c-ch9-bar-title b{color:var(--text);}',
      '.c-ch9-body{padding:14px 15px;display:flex;flex-direction:column;gap:10px;flex:1;}',
      /* 当前所在分支的小标签 */
      '.c-ch9-branchtag{display:inline-flex;align-items:center;gap:7px;align-self:flex-start;font-family:var(--font-mono);font-size:12.5px;font-weight:700;padding:4px 11px;border-radius:999px;border:1px solid;}',
      '.c-ch9-branchtag::before{content:"";width:9px;height:9px;border-radius:50%;background:currentColor;}',
      '.c-ch9-path{font-family:var(--font-mono);font-size:12px;color:var(--dim);word-break:break-all;}',
      '.c-ch9-files{display:flex;flex-direction:column;gap:6px;margin-top:2px;}',
      '.c-ch9-file{display:flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:12.5px;color:var(--text);}',
      '.c-ch9-file .ic{opacity:.8;}',
      '.c-ch9-file.new{color:var(--c-teal);}',
      '.c-ch9-eyes{font-size:22px;line-height:1;}',
      '.c-ch9-emptyslot{display:flex;align-items:center;justify-content:center;min-height:170px;color:var(--dim);text-align:center;padding:18px;}',

      /* 第二个 worktree 滑出动画（屏 9.1） */
      '.c-ch9-pane.slot{border-style:dashed;background:transparent;}',
      '.c-ch9-pane.spawned{animation:c-ch9-slide .5s var(--ease);}',
      '@keyframes c-ch9-slide{from{opacity:0;transform:translateX(26px);}to{opacity:1;transform:none;}}',

      /* ---------- 共享 commit 图（中间/底部） ---------- */
      '.c-ch9-shared{background:var(--pane);border:1px solid var(--border);border-radius:14px;padding:clamp(12px,1.8vw,22px);position:relative;}',
      '.c-ch9-shared-label{position:absolute;top:10px;left:14px;font-family:var(--font-mono);font-size:11.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--dim);}',
      '.c-ch9-shared .cg-wrap{width:100%;}',
      '.c-ch9-shared.compact{min-height:150px;display:flex;align-items:center;justify-content:center;}',

      /* 两束视线（屏 9.2）：从两个面板汇向中央 .git */
      '.c-ch9-gaze-row{display:flex;align-items:center;justify-content:space-around;margin-bottom:4px;}',
      '.c-ch9-gaze{display:flex;flex-direction:column;align-items:center;gap:4px;color:var(--dim);font-family:var(--font-mono);font-size:11.5px;}',
      '.c-ch9-gaze .c-ch9-eyes{filter:drop-shadow(0 0 6px rgba(45,212,191,.4));}',
      '.c-ch9-gitcore{display:inline-flex;align-items:center;gap:8px;font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--git);padding:5px 13px;border-radius:999px;background:rgba(240,81,51,.1);border:1px solid rgba(240,81,51,.35);}',

      /* ---------- 屏 9.3 Q&A 卡 ---------- */
      '.c-ch9-qa{max-width:760px;margin:0 auto;display:flex;flex-direction:column;gap:18px;}',
      '.c-ch9-q{background:var(--pane);border:1px solid var(--border);border-left:4px solid var(--c-purple);border-radius:14px;padding:22px 24px;}',
      '.c-ch9-q .tag{font-family:var(--font-mono);font-size:13px;font-weight:800;color:var(--c-purple);letter-spacing:.06em;}',
      '.c-ch9-q .qtext{font-size:clamp(18px,2.4vw,26px);font-weight:700;line-height:1.4;margin-top:8px;}',
      '.c-ch9-reveal{display:flex;align-items:center;justify-content:center;gap:8px;color:var(--dim);font-size:13px;font-family:var(--font-mono);padding:6px;}',
      '.c-ch9-reveal .blink{display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--c-amber);animation:c-ch9-blink 1.1s ease-in-out infinite;}',
      '@keyframes c-ch9-blink{0%,100%{opacity:.25;}50%{opacity:1;}}',
      '.c-ch9-a{background:var(--pane);border:1px solid var(--border);border-left:4px solid var(--c-amber);border-radius:14px;padding:22px 24px;}',
      '.c-ch9-a .tag{font-family:var(--font-mono);font-size:13px;font-weight:800;color:var(--c-amber);letter-spacing:.06em;}',
      '.c-ch9-a .atext{font-size:clamp(15px,1.8vw,20px);line-height:1.6;margin-top:8px;}',
      '.c-ch9-a .atext b{color:var(--c-amber);}',
      '.c-ch9-a .atext .astro{font-style:normal;}',
      '.c-ch9-callback{margin-top:14px;font-size:13px;color:var(--dim);border-top:1px dashed var(--border);padding-top:12px;}',
      '.c-ch9-callback b{color:var(--text);}',

      /* ---------- 屏 9.4 agent 头 ---------- */
      '.c-ch9-agent{font-size:20px;line-height:1;}',
      '.c-ch9-pane.agent .c-ch9-body{gap:8px;}',
      '.c-ch9-status{font-family:var(--font-mono);font-size:12px;color:var(--dim);display:flex;align-items:center;gap:7px;min-height:1.3em;}',
      '.c-ch9-status .spin{display:inline-block;width:9px;height:9px;border-radius:50%;border:2px solid var(--border);border-top-color:currentColor;animation:c-ch9-spin .8s linear infinite;}',
      '@keyframes c-ch9-spin{to{transform:rotate(360deg);}}',
      '.c-ch9-status.done{color:var(--c-teal);}',
      '.c-ch9-status.idle{color:var(--dim);}'
    ].join('');
    document.head.appendChild(s);
  }

  /* 工作窗口面板（标题栏 + 主体）。返回 {el, body} 供填充。 */
  function makePane(opts) {
    opts = opts || {};
    var pane = document.createElement('div');
    pane.className = 'c-ch9-pane' + (opts.cls ? ' ' + opts.cls : '');
    var bar = document.createElement('div');
    bar.className = 'c-ch9-bar';
    bar.innerHTML =
      '<span class="c-ch9-dots"><i class="c-ch9-dot r"></i><i class="c-ch9-dot y"></i><i class="c-ch9-dot g"></i></span>' +
      '<span class="c-ch9-bar-title">' + (opts.title || '') + '</span>';
    var body = document.createElement('div');
    body.className = 'c-ch9-body';
    if (opts.bodyHTML) body.innerHTML = opts.bodyHTML;
    pane.appendChild(bar);
    pane.appendChild(body);
    return { el: pane, body: body, bar: bar };
  }

  /* 分支小标签 */
  function branchTag(name, color) {
    return '<span class="c-ch9-branchtag" style="color:' + color + ';border-color:' + color + ';">' + name + '</span>';
  }

  /* ====================================================== */
  /* 屏 9.1 — 什么是 worktree                               */
  /* ====================================================== */
  register({
    chapter: 9,
    chapterName: 'Worktree（进阶/彩蛋）',
    id: 'worktree-what',
    title: '什么是 worktree',
    subtitle: '同一仓库的第二个工作副本',
    play: true,
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<div class="c-ch9-wrap">' +
          '<div class="c-ch9-head">' +
            '<span class="sc-pill">🪟 git worktree</span>' +
            '<h2 class="sc-h2">什么是 <span style="color:' + TEAL + '">worktree</span>？</h2>' +
            '<p class="sc-p c-ch9-narrate" id="c-ch9-1-narrate"></p>' +
          '</div>' +
          '<div class="c-ch9-panes two" id="c-ch9-1-panes"></div>' +
          '<div class="c-ch9-foot">' +
            '<button class="sc-btn primary" id="c-ch9-1-btn" data-interactive="1">＋ 新建 worktree</button>' +
            '<span class="c-ch9-hint">branch＝仓库内的一条开发线；worktree＝同一仓库的多个并存工作目录。</span>' +
          '</div>' +
        '</div>';

      var panes = stage.querySelector('#c-ch9-1-panes');
      var narrate = stage.querySelector('#c-ch9-1-narrate');
      var btn = stage.querySelector('#c-ch9-1-btn');

      var INITIAL =
        'worktree ＝ <b>同一个仓库的另一个工作副本</b>，可以同时编辑，各开各的分支互不打架。' +
        '<br>现在只有<b style="color:' + MAIN + '">主 worktree</b> 一个窗口，挂在 <span class="sc-mono">main</span> 上。';

      /* 把状态(level 0/1)幂等重建到面板。level 1 = 已新建第二个 worktree。 */
      function build(level, anim) {
        panes.innerHTML = '';

        // 左：主 worktree
        var left = makePane({
          title: '终端 · <b>主 worktree</b> ~/project',
          bodyHTML:
            branchTag('main', MAIN) +
            '<div class="c-ch9-path">~/project</div>' +
            '<div class="c-ch9-files">' +
              '<div class="c-ch9-file"><span class="ic">📄</span> index.html</div>' +
              '<div class="c-ch9-file"><span class="ic">📄</span> app.js</div>' +
            '</div>'
        });
        panes.appendChild(left.el);

        if (level >= 1) {
          // 右：新建的第二个 worktree，切到独立分支
          var right = makePane({
            title: '终端 · <b>第二个 worktree</b> ~/project-hotfix',
            cls: anim ? 'spawned' : '',
            bodyHTML:
              branchTag('hotfix', TEAL) +
              '<div class="c-ch9-path">~/project-hotfix</div>' +
              '<div class="c-ch9-files">' +
                '<div class="c-ch9-file"><span class="ic">📄</span> index.html</div>' +
                '<div class="c-ch9-file"><span class="ic">📄</span> app.js</div>' +
              '</div>'
          });
          panes.appendChild(right.el);
        } else {
          // 占位空槽
          var slot = makePane({
            title: '—— 还没有第二个 worktree ——',
            cls: 'slot',
            bodyHTML: '<div class="c-ch9-emptyslot">点「＋ 新建 worktree」<br>开出第二个工作窗口</div>'
          });
          panes.appendChild(slot.el);
        }
      }

      function setBtn(level) {
        if (level >= 1) {
          btn.textContent = '✓ 已开出第二个 worktree';
          btn.disabled = true;
          btn.classList.remove('primary');
        } else {
          btn.textContent = '＋ 新建 worktree';
          btn.disabled = false;
          btn.classList.add('primary');
        }
      }

      // 初始态
      build(0, false);
      narrate.innerHTML = INITIAL;
      setBtn(0);

      // 单步：新建第二个 worktree（右面板滑出，切到 hotfix 分支）
      api.step(function (animated) {
        build(1, animated);
        setBtn(1);
        narrate.innerHTML =
          '右边滑出的是<b>同一个仓库</b>的第二个工作目录 —— 同样的文件，' +
          '但它<b>独立切到了 hotfix 分支</b>。两个窗口可以同时改，互不打架。' +
          '<br>注意：它们共享同一个 <span class="sc-mono">.git</span>，<b>不是</b>把仓库复制了一份。';
      });

      // 按钮＝推进框架 step（保证后退/重放一致）
      btn.addEventListener('click', function () { api.next(); });

      api.onReset(function () {
        build(0, false);
        narrate.innerHTML = INITIAL;
        setBtn(0);
      });
    }
  });

  /* ====================================================== */
  /* 屏 9.2 — 不是平行宇宙，是投影                          */
  /* ====================================================== */
  register({
    chapter: 9,
    chapterName: 'Worktree（进阶/彩蛋）',
    id: 'worktree-projection',
    title: '不是平行宇宙，是投影',
    subtitle: '两双眼睛，同一张提交图',
    play: true,
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<div class="c-ch9-wrap">' +
          '<div class="c-ch9-head">' +
            '<span class="sc-pill">👁️ 同一套 .git</span>' +
            '<h2 class="sc-h2">不是平行宇宙，是<span style="color:' + TEAL + '">投影</span></h2>' +
            '<p class="sc-p c-ch9-narrate" id="c-ch9-2-narrate"></p>' +
          '</div>' +

          /* 两个面板各有一双眼睛，都望向中间 */
          '<div class="c-ch9-gaze-row">' +
            '<div class="c-ch9-gaze"><span class="c-ch9-eyes">👀</span>主 worktree</div>' +
            '<div class="c-ch9-gitcore">⬇ 同一套 .git / 同一张提交图 ⬇</div>' +
            '<div class="c-ch9-gaze"><span class="c-ch9-eyes">👀</span>第二个 worktree</div>' +
          '</div>' +

          /* 中央共享 commit 图 */
          '<div class="c-ch9-shared" id="c-ch9-2-shared">' +
            '<span class="c-ch9-shared-label">shared object store · 共享提交图</span>' +
          '</div>' +

          /* 底部两面板：各自的视图 */
          '<div class="c-ch9-panes two" id="c-ch9-2-panes"></div>' +

          '<div class="c-ch9-foot">' +
            '<button class="sc-btn primary" id="c-ch9-2-btn" data-interactive="1">在主 worktree 提交一次</button>' +
            '<span class="c-ch9-hint">提交落进共享的 .git，两个窗口立刻都能看到。</span>' +
          '</div>' +
        '</div>';

      var sharedHost = stage.querySelector('#c-ch9-2-shared');
      var panes = stage.querySelector('#c-ch9-2-panes');
      var narrate = stage.querySelector('#c-ch9-2-narrate');
      var btn = stage.querySelector('#c-ch9-2-btn');

      // 共享图：每次 render 新建，step 重放重建
      var g = api.graph(sharedHost, {});

      var INITIAL =
        '新建 worktree <b>没有创建平行宇宙</b> —— 两边看的是<b>同一套 .git、同一张提交图</b>。' +
        '它只是第二双眼睛 / 第二个视窗。';

      /* level 0：main A B C。level 1：再 +D（在主 worktree 提交）。 */
      function buildGraph(level, anim) {
        g.reset();
        g.init('main', ['A', 'B', 'C']);
        if (level >= 1) {
          g.addCommit('main', 'D', { anim: anim });
        }
      }

      /* 两个底部面板：同样的「最新看到的提交」。level 1 时两边都显示 D。 */
      function buildPanes(level) {
        panes.innerHTML = '';
        var latest = level >= 1 ? 'D' : 'C';
        var leftFiles =
          '<div class="c-ch9-status idle">📍 当前看到的最新提交：<b style="color:var(--text)">' + latest + '</b></div>';
        var left = makePane({
          title: '主 worktree · <b>main</b>',
          bodyHTML: branchTag('main', MAIN) + leftFiles +
            (level >= 1 ? '<div class="c-ch9-file new">✚ 刚提交了 ' + 'D' + '</div>' : '')
        });
        var right = makePane({
          title: '第二个 worktree · <b>看的是同一张图</b>',
          bodyHTML: branchTag('main 的提交它也看得到', TEAL) +
            '<div class="c-ch9-status idle">📍 它看到的最新提交：<b style="color:var(--text)">' + latest + '</b></div>' +
            (level >= 1 ? '<div class="c-ch9-file new">↺ 没动手，也立刻看到了 D</div>' : '<div class="c-ch9-path">（在另一条分支上闲着，但底层数据共享）</div>')
        });
        panes.appendChild(left.el);
        panes.appendChild(right.el);
      }

      // 初始态
      buildGraph(0, false);
      buildPanes(0);
      narrate.innerHTML = INITIAL;
      btn.disabled = false;

      // 单步：在主 worktree 提交一个新 commit → 共享图长 D，右面板也立刻看到
      api.step(function (animated) {
        buildGraph(1, animated);
        buildPanes(1);
        if (animated) { try { g.highlight('D', true); } catch (e) {} }
        narrate.innerHTML =
          '在主 worktree 提交的 <b>D</b> 直接长在<b>共享的那张图</b>上 —— ' +
          '第二个 worktree 一行命令没敲，<b>也立刻看到了 D</b>。' +
          '<br>因为根本没有两份数据，只有<b>两个看同一份数据的窗口</b>。';
        btn.textContent = '✓ 已提交 D（两边都看到了）';
        btn.disabled = true;
        btn.classList.remove('primary');
      });

      btn.addEventListener('click', function () { api.next(); });

      api.onReset(function () {
        buildGraph(0, false);
        buildPanes(0);
        narrate.innerHTML = INITIAL;
        btn.textContent = '在主 worktree 提交一次';
        btn.disabled = false;
        btn.classList.add('primary');
      });
    }
  });

  /* ====================================================== */
  /* 屏 9.3 — Q&A：触摸 git 本质（悬念式 reveal）           */
  /* ====================================================== */
  register({
    chapter: 9,
    chapterName: 'Worktree（进阶/彩蛋）',
    id: 'worktree-qa',
    title: 'Q&A：触摸 git 本质',
    subtitle: '“删掉” commit 到底发生了什么',
    play: true,
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<div class="c-ch9-wrap">' +
          '<div class="c-ch9-head">' +
            '<span class="sc-pill">🧠 触摸 git 本质</span>' +
            '<h2 class="sc-h2">Q<span style="color:' + TEAL + '">&amp;</span>A</h2>' +
          '</div>' +

          '<div class="c-ch9-qa">' +
            '<div class="c-ch9-q">' +
              '<div class="tag">Q ——</div>' +
              '<div class="qtext">既然 worktree 只是投影，那主 worktree 上「删掉」某个 commit，' +
              '第二个 worktree 上它也会跟着消失吗？</div>' +
            '</div>' +

            /* 揭晓提示（reveal 前） */
            '<div class="c-ch9-reveal" id="c-ch9-3-reveal">' +
              '<span class="blink"></span> 按 空格 / → 揭晓答案' +
            '</div>' +

            /* 答案（reveal 后） */
            '<div class="c-ch9-a" id="c-ch9-3-answer">' +
              '<div class="tag">A ——</div>' +
              '<div class="atext">' +
                'git 里<b>根本不存在「真的删掉分支 / 提交」</b>这回事 —— ' +
                '它只是把<b>分支指针往前（或往别处）挪了一下</b>。' +
                '<br>那个旧 commit<b>还在数据海里</b>，只是没人牵着它了，变成了' +
                '<span class="astro">🧑‍🚀 孤儿 commit</span>，飘着，直到日后被 git 回收。' +
              '</div>' +
              '<div class="c-ch9-callback">' +
                '↩ 呼应<b>第 5 章</b>：你以为「删没了」，其实只是指针挪了位 —— ' +
                '所以才有 reflog 能把它捞回来。' +
              '</div>' +
            '</div>' +
          '</div>' +

          '<div class="c-ch9-foot c-ch9-qa" style="margin:0 auto;">' +
            '<span class="c-ch9-hint" id="c-ch9-3-hint">悬念：先想想你的答案，再揭晓。</span>' +
          '</div>' +
        '</div>';

      var reveal = stage.querySelector('#c-ch9-3-reveal');
      var answer = stage.querySelector('#c-ch9-3-answer');
      var hint = stage.querySelector('#c-ch9-3-hint');

      // 初始：答案藏起来，只显示 Q + 揭晓提示
      function hideAnswer() {
        answer.style.display = 'none';
        reveal.style.display = 'flex';
        hint.textContent = '悬念：先想想你的答案，再揭晓。';
      }
      function showAnswer(animated) {
        reveal.style.display = 'none';
        answer.style.display = 'block';
        hint.textContent = '👉 这就是 git 的底层真相：分支 / HEAD 都只是「指针」。';
        if (animated) {
          // 用 frag 同款淡入手感（手动，避免依赖 frag 时序）
          answer.classList.add('frag-hidden');
          void answer.offsetWidth;
          answer.classList.remove('frag-hidden');
          answer.classList.add('frag-show');
        }
      }

      hideAnswer();

      // 单步：揭晓答案
      api.step(function (animated) {
        showAnswer(animated);
      });

      api.onReset(function () { hideAnswer(); });
    }
  });

  /* ====================================================== */
  /* 屏 9.4 — Vibe coder 的杀手级用法（3 个 agent 并行）     */
  /* ====================================================== */
  register({
    chapter: 9,
    chapterName: 'Worktree（进阶/彩蛋）',
    id: 'worktree-killer',
    title: 'Vibe coder 的杀手级用法',
    subtitle: '多个 agent · 各占一个 worktree + 分支',
    play: true,
    render: function (stage, api) {
      injectStyle();

      stage.innerHTML =
        '<div class="c-ch9-wrap">' +
          '<div class="c-ch9-head">' +
            '<span class="sc-pill">⚡ 杀手级用法</span>' +
            '<h2 class="sc-h2">同时跑好几个 <span style="color:' + TEAL + '">agent</span></h2>' +
            '<p class="sc-p c-ch9-narrate" id="c-ch9-4-narrate"></p>' +
          '</div>' +

          /* 三个 agent 工作窗口 */
          '<div class="c-ch9-panes three" id="c-ch9-4-panes"></div>' +

          /* 底部共享图：三条分支并行生长 */
          '<div class="c-ch9-shared" id="c-ch9-4-shared">' +
            '<span class="c-ch9-shared-label">shared .git · 三条分支并行</span>' +
          '</div>' +

          '<div class="c-ch9-foot">' +
            '<button class="sc-btn primary" id="c-ch9-4-btn" data-interactive="1">▶ 启动 3 个 agent</button>' +
            '<span class="c-ch9-hint">每个 agent 一个 worktree、一条分支，各改各的互不冲突，最后分别合并。</span>' +
          '</div>' +
        '</div>';

      var panes = stage.querySelector('#c-ch9-4-panes');
      var sharedHost = stage.querySelector('#c-ch9-4-shared');
      var narrate = stage.querySelector('#c-ch9-4-narrate');
      var btn = stage.querySelector('#c-ch9-4-btn');

      var g = api.graph(sharedHost, {});

      var AGENTS = [
        { name: 'agent-A', icon: '🤖', branch: 'feat/login', color: TEAL, task: '写登录页', commit: 'L' },
        { name: 'agent-B', icon: '🦾', branch: 'feat/pay', color: PURPLE, task: '接支付', commit: 'P' },
        { name: 'agent-C', icon: '👾', branch: 'feat/i18n', color: AMBER, task: '做多语言', commit: 'I' }
      ];

      var INITIAL =
        '最适合 vibe coder 的场景：<b>同时跑好几个 agent</b>，' +
        '每个 agent 待在<b>自己的一个 worktree + 一条分支</b>里并行干活。' +
        '<br>下面三个窗口现在都在待命 —— 点「启动」让它们一起开工。';

      /* 共享图：main A B C，三条分支从 C 开。level=已开工的 agent 数(0..3)。 */
      function buildGraph(level, anim) {
        g.reset();
        g.init('main', ['A', 'B', 'C']);
        for (var i = 0; i < AGENTS.length; i++) {
          var a = AGENTS[i];
          // 三条分支总是从 C 拉出（并行）
          g.createBranch(a.branch, 'C', a.color);
          if (level > i) {
            // 这个 agent 已开工：在自己分支上长一个 commit
            g.addCommit(a.branch, a.commit, { anim: anim });
          }
        }
      }

      /* 三个 agent 面板。level 个已开工（spinner→done），其余 idle。 */
      function buildPanes(level) {
        panes.innerHTML = '';
        AGENTS.forEach(function (a, i) {
          var working = level > i;
          var statusHTML = working
            ? '<div class="c-ch9-status done">✓ 已提交 ' + a.commit + '（在 ' + a.branch + ' 上）</div>'
            : (level === i
                ? '<div class="c-ch9-status"><span class="spin"></span> 待命中…</div>'
                : '<div class="c-ch9-status idle">○ 待命中</div>');
          var pane = makePane({
            cls: 'agent',
            title: '<span class="c-ch9-agent">' + a.icon + '</span> <b>' + a.name + '</b>',
            bodyHTML:
              branchTag(a.branch, a.color) +
              '<div class="c-ch9-path">~/project-' + a.name + '</div>' +
              '<div class="c-ch9-file"><span class="ic">🎯</span> 任务：' + a.task + '</div>' +
              statusHTML
          });
          panes.appendChild(pane.el);
        });
      }

      function setBtn(level) {
        if (level >= AGENTS.length) {
          btn.textContent = '✓ 3 个 agent 各自交了活';
          btn.disabled = true;
          btn.classList.remove('primary');
        } else {
          btn.textContent = level === 0 ? '▶ 启动 3 个 agent' : '▶ 让下一个 agent 开工';
          btn.disabled = false;
          btn.classList.add('primary');
        }
      }

      // 初始态
      buildGraph(0, false);
      buildPanes(0);
      narrate.innerHTML = INITIAL;
      setBtn(0);

      // 三步：每步一个 agent 在自己分支上提交（并行生长）
      AGENTS.forEach(function (a, i) {
        api.step(function (animated) {
          var level = i + 1;
          buildGraph(level, animated);
          buildPanes(level);
          if (animated) { try { g.highlight(a.commit, true); } catch (e) {} }
          var done = AGENTS.slice(0, level).map(function (x) {
            return '<b style="color:' + x.color + '">' + x.name + '</b>';
          }).join('、');
          if (level < AGENTS.length) {
            narrate.innerHTML = done + ' 开工，在<b>自己的分支</b>上提交了一笔 —— ' +
              '看底部图：' + level + ' 条彩线已经在并行往前长，<b>互不冲突</b>。';
          } else {
            narrate.innerHTML = '三个 agent <b>各占一个 worktree、各走一条分支</b>，' +
              '同时长出 <b style="color:' + TEAL + '">L</b>、<b style="color:' + PURPLE + '">P</b>、' +
              '<b style="color:' + AMBER + '">I</b> 三笔，全程互不踩脚。' +
              '<br>最后把三条线<b>分别 merge 回 main</b> 就收工了 —— 这就是 worktree 给 vibe coder 的杀手级用法。🎉';
          }
          setBtn(level);
        });
      });

      btn.addEventListener('click', function () { api.next(); });

      api.onReset(function () {
        buildGraph(0, false);
        buildPanes(0);
        narrate.innerHTML = INITIAL;
        setBtn(0);
      });
    }
  });

})();
