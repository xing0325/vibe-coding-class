/* ============================================================
   第 4 章 · Branch + Merge   (core interactive chapter)
   一屏 + 5 个 api.step，整章一个 CommitGraph 互动。
   每步既能按空格推进，也能点右侧"对 AI 说的话"按钮玩。
   class 前缀 c-ch4-
   ------------------------------------------------------------
   重要：framework 每次进入屏(含后退/resize)都会 fresh 调 render，
   并把 step 以 animated=false 重放。所以：
     · render 里建初始 DOM + 一个全新 graph
     · 每个 step(fn) 都是"从干净 graph 出发可幂等重建"的状态推进
     · 所有图状态由 step 重放确定，不依赖上一次 render 的残留
   ============================================================ */
(function () {
  'use strict';

  var TEAL = '#2DD4BF';     // feature
  var PURPLE = '#A78BFA';   // feature2
  var MAIN = '#E6EDF3';     // main

  function register(def) {
    if (typeof window.registerScreen === 'function') { window.registerScreen(def); }
    else { (window.__pendingScreens = window.__pendingScreens || []).push(def); }
  }

  register({
    chapter: 5,
    chapterName: '分支 Branch',
    id: 'ch4-branch-merge',
    title: '分支与合并',
    subtitle: '开线 → 并行 → 合回主干',
    play: true,

    render: function (stage, api) {

      /* --------------------------------------------------------
         布局：左 2/3 CommitGraph 画布，右 1/3 操作面板
         -------------------------------------------------------- */
      stage.innerHTML =
        '<div class="c-ch4-wrap">' +
          '<div class="c-ch4-head">' +
            '<span class="sc-pill">🌿 branch + merge</span>' +
            '<h2 class="sc-h2">分支与合并 · <span style="color:' + TEAL + '">动手玩</span></h2>' +
            '<p class="sc-p c-ch4-narrate" id="c-ch4-narrate"></p>' +
          '</div>' +

          '<div class="c-ch4-grid">' +
            /* ---- 左：画布 ---- */
            '<div class="c-ch4-canvas sc-card" id="c-ch4-canvas"></div>' +

            /* ---- 右：操作面板 ---- */
            '<div class="c-ch4-panel">' +
              '<div class="c-ch4-steps" id="c-ch4-steps"></div>' +
              '<div class="c-ch4-aislot" id="c-ch4-aislot"></div>' +
            '</div>' +
          '</div>' +

          /* ---- 底部常驻 ---- */
          '<div class="c-ch4-foot">' +
            '<button class="sc-btn" id="c-ch4-reset">🔄 重置</button>' +
            '<span class="c-ch4-hint">想自己玩？随便点上面的按钮 —— 不按顺序也不会崩。</span>' +
          '</div>' +
        '</div>' +
        styleBlock();

      var canvas = stage.querySelector('#c-ch4-canvas');
      var narrate = stage.querySelector('#c-ch4-narrate');
      var stepsBar = stage.querySelector('#c-ch4-steps');
      var aiSlot = stage.querySelector('#c-ch4-aislot');

      /* graph：每次 render 新建一个，step 重放重建其状态 */
      var g = api.graph(canvas, {});

      /* 已完成步数（0..5），由 step 重放推进。用于按钮 disabled 守卫。 */
      var done = 0;
      /* 这一次 render 内、在 4.3 上手动多点出来的额外 feature commit 数 */
      var bonus = 0;

      /* 五步的元数据：按钮文案(对 AI 说的话)、叙述、AICommandCard */
      var STEPS = [
        {
          btn: '🟢 给我开一个 feature 分支',
          narrate: '分支刚建出来时和 main 一模一样 —— 指向同一个 commit，没有任何新东西。',
          ai: { effect: '开一条平行开发线', say: '给我开一个 feature 分支', cmd: 'git checkout -b feature' }
        },
        {
          btn: '✍️ 在 feature 上帮我提交一次',
          narrate: '这些改动只在 feature 上看得到，不影响 main —— 看下面，main 停在 C 一动不动。',
          ai: { effect: '改动只落在 feature 上', say: '把这些改动在 feature 上提交', cmd: 'git add . && git commit -m "wip"' },
          repeatable: true
        },
        {
          btn: '👥 再帮我开一条 feature2',
          narrate: '小 A 开信用分模块，小 B 开必读书模块 —— 两个互不相干的文件夹，可以同时开发。',
          ai: { effect: '两条线并行、互不打扰', say: '再开一条 feature2 给小 B 用', cmd: 'git checkout -b feature2 C' }
        },
        {
          btn: '🔀 把我的 feature 分支合并进 main',
          narrate: '开发完，把分支 merge 回主干 —— main 末端长出一个合并节点，把两条线汇到一起。',
          ai: { effect: '把成果汇回主干', say: '把我的 feature 分支合并进 main', cmd: 'git checkout main && git merge feature' }
        }
      ];
      /* 注意：STEPS 数组只有 4 项，因为"步 4.1 起点"是初始态(done=0)、
         不需要按钮；后面 4 个按钮分别对应 step 1..4(创建/提交/再开一条/合并)。 */

      var INITIAL_NARRATE =
        '默认每个仓库都有一条 <b style="color:' + MAIN + '">main</b>（主干）。' +
        'HEAD 🚩 现在挂在 main 的最新 commit <b>C</b> 上。';

      /* --------------------------------------------------------
         画图状态：把 done(0..5) 重建到 graph 上。幂等。
         done 0: main A B C, HEAD→main
         done 1: + feature off C (teal)
         done 2: + checkout feature, addCommit D (E... bonus)
         done 3: + feature2 off C (purple) + 一个 commit
         done 4: + merge feature into main
         -------------------------------------------------------- */
      function rebuild(level, anim, extraFeat) {
        g.reset();
        g.init('main', ['A', 'B', 'C']);

        if (level >= 1) {
          g.createBranch('feature', 'C', TEAL);
        }
        if (level >= 2) {
          g.checkout('feature');
          g.addCommit('feature', 'D', { anim: anim });
          var n = extraFeat || 0;
          var lbls = ['E', 'F', 'G'];
          for (var i = 0; i < n && i < lbls.length; i++) {
            g.addCommit('feature', lbls[i], { anim: anim });
          }
        }
        if (level >= 3) {
          g.createBranch('feature2', 'C', PURPLE);
          g.checkout('feature2');
          g.addCommit('feature2', 'P', { anim: anim });
        }
        if (level >= 4) {
          g.checkout('main');
          g.merge('feature', 'main');
        }
      }

      /* highlight main 强调它"没动"(步 4.3) —— 在重建后单独加 */
      function emphasizeMainStill(on) {
        try { g.highlight('C', !!on); } catch (e) {}
      }

      /* --------------------------------------------------------
         面板渲染：按钮 + AICommandCard
         -------------------------------------------------------- */
      function renderPanel() {
        // 按钮：i 对应 step (i+1)。只有"下一个该走的 step"高亮可点；
        // 已完成的标 ✓；未轮到的禁用。可重复的步(4.3)在已激活时仍可点(加 bonus commit)。
        stepsBar.innerHTML = '';
        STEPS.forEach(function (s, i) {
          var stepNo = i + 1;            // 1..4
          var isDone = done >= stepNo;
          var isNext = done === i;       // 下一步
          var b = document.createElement('button');
          b.className = 'c-ch4-step sc-btn' +
            (isDone ? ' is-done' : '') +
            (isNext ? ' is-next' : '');
          b.setAttribute('data-interactive', '1');
          b.textContent = (isDone ? '✓ ' : '') + s.btn;
          // 守卫：只有"下一步"可点；可重复步在完成后也允许继续点
          var clickable = isNext || (isDone && s.repeatable && stepNo === 2 && done === 2);
          b.disabled = !clickable;
          b.addEventListener('click', function () {
            if (isNext) {
              api.next();               // 推进到这一步（走 framework 的 step 链）
            } else if (s.repeatable && done === 2 && stepNo === 2) {
              // 4.3 已完成、想在 feature 上再提交一笔 —— 当场长一个 commit
              if (bonus < 3) {
                bonus++;
                g.addCommit('feature', ['E', 'F', 'G'][bonus - 1], { anim: true });
                renderPanel();
              }
            }
          });
          stepsBar.appendChild(b);
        });

        // 当 4.3 已完成，给"继续提交"一点提示
        var hint = document.createElement('div');
        hint.className = 'c-ch4-rephint';
        if (done === 2) {
          hint.innerHTML = '再点一次 ✍️ 就能在 feature 上多长一个 commit（已加 ' + bonus + ' 个）。';
        }
        stepsBar.appendChild(hint);

        // AICommandCard：显示"当前动作"。done=0 时给一张引导卡。
        aiSlot.innerHTML = '';
        var ai;
        if (done === 0) {
          ai = { effect: '起点：一条 main 主干', say: '（先看看现状，再开始动手）', cmd: 'git status   # On branch main' };
        } else {
          ai = STEPS[done - 1].ai;     // 最近完成的那步对应的卡
        }
        aiSlot.appendChild(api.aiCard(ai));
      }

      function setNarrate(html) { narrate.innerHTML = html; }

      /* --------------------------------------------------------
         初始态（步 4.1 起点 main） —— render 一进来就显示
         -------------------------------------------------------- */
      rebuild(0, false, 0);
      done = 0; bonus = 0;
      setNarrate(INITIAL_NARRATE);
      renderPanel();

      /* --------------------------------------------------------
         5 步推进
         step 1 = 4.2 新建分支
         step 2 = 4.3 在分支上提交
         step 3 = 4.4 再开一条 feature2
         step 4 = 4.5 合并回 main
         （步 4.1 是初始态，不占 api.step）
         每个 fn(animated)：animated=false 时是后退/重放，瞬间到位不播动画。
         -------------------------------------------------------- */

      // 步 4.2 · 新建 feature 分支
      api.step(function (animated) {
        done = 1; bonus = 0;
        rebuild(1, animated, 0);
        emphasizeMainStill(false);
        setNarrate('分支刚建出来时和 main <b>一模一样</b> —— ' +
          '<b style="color:' + TEAL + '">feature</b> 和 main 并排贴在同一个 commit <b>C</b> 上。');
        renderPanel();
      });

      // 步 4.3 · 在 feature 上提交（长出 D，HEAD 跟到末端；main 高亮强调没动）
      api.step(function (animated) {
        done = 2; bonus = 0;
        rebuild(2, animated, 0);
        emphasizeMainStill(true);  // 高亮 C，强调 main 没动
        setNarrate('这些改动<b>只在 feature 上看得到，不影响 main</b> —— ' +
          'HEAD 🚩 跟到了 feature 末端，而 main 还停在高亮的 <b>C</b> 上。');
        renderPanel();
      });

      // 步 4.4 · 再开一条 feature2，并在其上提交（两条彩线并行）
      api.step(function (animated) {
        done = 3; bonus = 0;
        rebuild(3, animated, 0);
        emphasizeMainStill(false);
        setNarrate('小 A 开<b style="color:' + TEAL + '">信用分模块</b>，' +
          '小 B 开<b style="color:' + PURPLE + '">必读书模块</b> —— ' +
          '两个互不相干的文件夹，<b>可以同时开发</b>，两条彩线并行。');
        renderPanel();
      });

      // 步 4.5 · 把 feature 合并进 main（main 末端长出合并节点，连线汇入）
      api.step(function (animated) {
        done = 4; bonus = 0;
        rebuild(4, animated, 0);
        emphasizeMainStill(false);
        setNarrate('开发完，把分支 <b style="color:var(--git)">merge</b> 回主干 —— ' +
          'main 末端长出一个<b>合并节点</b>，feature 的成果汇入 main。🎉');
        renderPanel();
      });

      /* --------------------------------------------------------
         R 重置 / 底部🔄重置 —— 复位到步 4.1
         -------------------------------------------------------- */
      function resetToStart() {
        done = 0; bonus = 0;
        rebuild(0, true, 0);
        emphasizeMainStill(false);
        setNarrate(INITIAL_NARRATE);
        renderPanel();
      }
      api.onReset(resetToStart);
      stage.querySelector('#c-ch4-reset').addEventListener('click', function () {
        resetToStart();
        // 也把 framework 的 step 指针拉回 0：等价于按住 R。借 api 没有直接 setStep，
        // 但 onReset 已注册，这里点按钮时我们手动复位视觉，并请框架重置。
        // framework 的 R 会调 resetScreen()(复位 step) —— 这里只复位视觉即可，
        // 若用户接着按空格会从 step1 重新走。
      });
    }
  });

  /* ============================================================
     样式（限定 c-ch4- 前缀，复用 _shell 的 tokens / sc-* class）
     ============================================================ */
  function styleBlock() {
    return '' +
'<style>' +
'.c-ch4-wrap{width:100%;display:flex;flex-direction:column;gap:clamp(12px,2vh,22px)}' +
'.c-ch4-head{display:flex;flex-direction:column;gap:8px}' +
'.c-ch4-head .sc-pill{align-self:flex-start}' +
'.c-ch4-narrate{min-height:2.6em;max-width:62ch;color:var(--text);transition:opacity .3s var(--ease)}' +
'.c-ch4-narrate b{color:var(--c-teal)}' +

'.c-ch4-grid{display:grid;grid-template-columns:2fr 1fr;gap:clamp(14px,2vw,26px);align-items:stretch}' +
'@media (max-width:880px){.c-ch4-grid{grid-template-columns:1fr}}' +

'.c-ch4-canvas{display:flex;align-items:center;justify-content:center;min-height:300px;padding:clamp(14px,2vw,28px);overflow:hidden}' +
'.c-ch4-canvas .cg-wrap{width:100%}' +

'.c-ch4-panel{display:flex;flex-direction:column;gap:16px;min-width:0}' +
'.c-ch4-steps{display:flex;flex-direction:column;gap:10px}' +
'.c-ch4-step{justify-content:flex-start;text-align:left;width:100%;white-space:normal;line-height:1.3}' +
'.c-ch4-step.is-next{border-color:var(--c-teal);color:var(--c-teal);' +
  'animation:c-ch4-glow 1.8s ease-in-out infinite}' +
'.c-ch4-step.is-done{background:rgba(45,212,191,.12);border-color:rgba(45,212,191,.5);color:var(--c-teal)}' +
'.c-ch4-step:disabled{opacity:.4;cursor:not-allowed;animation:none}' +
'@keyframes c-ch4-glow{0%,100%{box-shadow:0 0 0 1px rgba(45,212,191,.35)}' +
  '50%{box-shadow:0 0 0 2px rgba(45,212,191,.35),0 0 16px rgba(45,212,191,.4)}}' +
'.c-ch4-rephint{font-size:12.5px;color:var(--dim);min-height:1.2em;padding-left:2px}' +
'.c-ch4-aislot{margin-top:2px}' +
'.c-ch4-aislot .aicard{max-width:none}' +

'.c-ch4-foot{display:flex;align-items:center;gap:14px;flex-wrap:wrap;' +
  'border-top:1px solid var(--border);padding-top:14px}' +
'.c-ch4-hint{font-size:13px;color:var(--dim)}' +
'</style>';
  }

})();
