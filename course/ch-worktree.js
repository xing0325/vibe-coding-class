(function () {
  'use strict';

  // ============================================================
  // 第6章 · Worktree & 合并冲突
  // theme: #db61a2  emoji: 🪟
  // 样式前缀: c-worktree-
  //   Part A：git worktree（是什么 / vs branch / 投影误区 / Q&A / vibe coder）
  //   Part B：merge conflict（怎么发生 / 真实例子 / 怎么解 / 小结）
  // 约定：commit = 圆点(白描边) + 短 hash；branch = pill 指向 commit；
  //       HEAD = 金黄 #e3b341 pill；孤儿/虚影用虚线半透明。
  // ============================================================

  var GOLD = '#e3b341';

  // 复用：画一个 commit 圆点（白描边）+ 短 hash 文字
  function commitDot(cx, cy, hash, opts) {
    opts = opts || {};
    var r = opts.r || 16;
    var fill = opts.fill || 'var(--course-accent)';
    var op = opts.ghost ? ' opacity="0.4"' : '';
    var dash = opts.ghost ? ' stroke-dasharray="4 3"' : '';
    return (
      '<g' + op + '>' +
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '" stroke="#fff" stroke-width="3"' + dash + '/>' +
        (hash ? '<text x="' + cx + '" y="' + (cy + r + 16) + '" text-anchor="middle" font-size="12" fill="var(--c-fg-muted)" font-family="ui-monospace,monospace">' + hash + '</text>' : '') +
      '</g>'
    );
  }

  // 复用：分支 / HEAD 的 pill 标签
  function branchPill(x, y, label, opts) {
    opts = opts || {};
    var w = opts.w || (label.length * 8 + 22);
    var fill = opts.head ? GOLD : 'var(--c-bg-soft)';
    var stroke = opts.head ? GOLD : 'var(--course-accent)';
    var tcolor = opts.head ? '#0d1117' : 'var(--c-fg)';
    return (
      '<g>' +
        '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="22" rx="11" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2"/>' +
        '<text x="' + (x + w / 2) + '" y="' + (y + 15) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + tcolor + '" font-family="ui-monospace,monospace">' + label + '</text>' +
      '</g>'
    );
  }

  window.registerChapter({
    id: 'worktree',
    index: 6,
    emoji: '🪟',
    title: 'Worktree & 合并冲突',
    subtitle: '投影、视窗与冲突',
    theme: '#db61a2',
    slides: [

      // ============================================================
      // Part A · git worktree
      // ============================================================

      // ---------- Slide 1：worktree 是什么（一式几份，同时编辑） ----------
      {
        title: 'Worktree 是什么',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<p class="deck-lead">上一章的分支让多条开发线<b>并存</b>，但一个工作目录一次只能站在一条线上、切来切去。' +
              '这一章的 <b style="color:var(--course-accent)">worktree</b> 更进一步——它是对你某个版本的' +
                '<b>"一式两份 / 一式几份"</b>，而这几份可以<b>同时编辑</b>。</p>' +
              '<div class="c-worktree-copies" id="c-worktree-copies">' +
                '<div class="c-worktree-copy" style="animation-delay:0ms">' +
                  '<div class="c-worktree-win-bar"><span></span><span></span><span></span></div>' +
                  '<div class="c-worktree-win-body">📁 副本①<br><span class="c-worktree-edit">✏️ 正在改</span></div>' +
                '</div>' +
                '<div class="c-worktree-copy" style="animation-delay:140ms">' +
                  '<div class="c-worktree-win-bar"><span></span><span></span><span></span></div>' +
                  '<div class="c-worktree-win-body">📁 副本②<br><span class="c-worktree-edit">✏️ 也在改</span></div>' +
                '</div>' +
                '<div class="c-worktree-copy" style="animation-delay:280ms">' +
                  '<div class="c-worktree-win-bar"><span></span><span></span><span></span></div>' +
                  '<div class="c-worktree-win-body">📁 副本③<br><span class="c-worktree-edit">✏️ 同时改</span></div>' +
                '</div>' +
              '</div>' +
              '<div class="deck-callout">' +
                '平时你的项目只有<b>一个</b>工作目录，改东西只能在那一个文件夹里。' +
                '开了 worktree，你就能多出几个一模一样的工作目录，<b>各干各的、互不打扰</b>。' +
              '</div>' +
            '</div>' +
            '<style>' +
            '.c-worktree-copies{display:flex;justify-content:center;flex-wrap:wrap;gap:18px;margin:30px 0 8px;}' +
            '.c-worktree-copy{width:150px;border-radius:12px;overflow:hidden;background:var(--c-bg-card);border:1px solid var(--c-border);box-shadow:0 8px 22px rgba(0,0,0,.3);animation:c-worktree-rise .5s both cubic-bezier(.34,1.56,.64,1);}' +
            '.c-worktree-win-bar{display:flex;gap:5px;padding:8px 10px;background:var(--c-bg-soft);border-bottom:1px solid var(--c-border);}' +
            '.c-worktree-win-bar span{width:9px;height:9px;border-radius:50%;background:var(--c-fg-muted);opacity:.5;}' +
            '.c-worktree-win-bar span:first-child{background:var(--course-accent);opacity:1;}' +
            '.c-worktree-win-body{padding:20px 12px;text-align:center;font-size:26px;line-height:1.5;}' +
            '.c-worktree-edit{font-size:12px;color:var(--course-accent);font-weight:600;}' +
            '@keyframes c-worktree-rise{from{opacity:0;transform:translateY(16px) scale(.95)}to{opacity:1;transform:none}}' +
            '</style>';
        }
      },

      // ---------- Slide 2：branch vs worktree 对比（重点页） ----------
      {
        title: 'branch vs worktree',
        render: function (stage, api) {
          // 左：一个仓库里有多条 branch（一个目录，内部多条线）
          var leftSvg =
            '<svg class="c-worktree-cmp-svg" viewBox="0 0 240 220" width="100%" aria-hidden="true">' +
              // 仓库外框
              '<rect x="14" y="14" width="212" height="192" rx="14" fill="var(--c-bg-soft)" stroke="var(--c-border)" stroke-width="2"/>' +
              '<text x="120" y="36" text-anchor="middle" font-size="12" fill="var(--c-fg-muted)">同一个工作目录</text>' +
              // 主干
              '<line x1="50" y1="170" x2="50" y2="80" stroke="var(--course-accent)" stroke-width="4"/>' +
              commitDot(50, 170, '', { r: 11 }) +
              commitDot(50, 120, '', { r: 11 }) +
              // 岔出两条 branch
              '<path d="M50,120 C50,100 110,100 110,80" fill="none" stroke="var(--course-accent)" stroke-width="4"/>' +
              '<path d="M50,120 C50,100 180,108 180,80" fill="none" stroke="var(--course-accent)" stroke-width="4"/>' +
              commitDot(50, 80, '', { r: 11 }) +
              commitDot(110, 80, '', { r: 11 }) +
              commitDot(180, 80, '', { r: 11 }) +
              branchPill(20, 184, 'main', { w: 50 }) +
              branchPill(82, 50, 'feat', { w: 50 }) +
              branchPill(152, 50, 'fix', { w: 46 }) +
            '</svg>';

          // 右：同一仓库变出几个并排工作目录窗口，每个可独立开分支
          var rightSvg =
            '<svg class="c-worktree-cmp-svg" viewBox="0 0 240 220" width="100%" aria-hidden="true">' +
              // 三个并排窗口
              '<g>' +
                '<rect x="10"  y="40" width="64" height="120" rx="10" fill="var(--c-bg-card)" stroke="var(--course-accent)" stroke-width="2"/>' +
                '<rect x="10"  y="40" width="64" height="20" rx="10" fill="var(--c-bg-soft)"/>' +
                '<text x="42"  y="100" text-anchor="middle" font-size="22">📁</text>' +
                '<text x="42"  y="130" text-anchor="middle" font-size="10" fill="var(--c-fg-muted)" font-family="ui-monospace,monospace">main</text>' +
              '</g>' +
              '<g>' +
                '<rect x="88"  y="40" width="64" height="120" rx="10" fill="var(--c-bg-card)" stroke="var(--course-accent)" stroke-width="2"/>' +
                '<rect x="88"  y="40" width="64" height="20" rx="10" fill="var(--c-bg-soft)"/>' +
                '<text x="120" y="100" text-anchor="middle" font-size="22">📁</text>' +
                '<text x="120" y="130" text-anchor="middle" font-size="10" fill="var(--c-fg-muted)" font-family="ui-monospace,monospace">feat</text>' +
              '</g>' +
              '<g>' +
                '<rect x="166" y="40" width="64" height="120" rx="10" fill="var(--c-bg-card)" stroke="var(--course-accent)" stroke-width="2"/>' +
                '<rect x="166" y="40" width="64" height="20" rx="10" fill="var(--c-bg-soft)"/>' +
                '<text x="198" y="100" text-anchor="middle" font-size="22">📁</text>' +
                '<text x="198" y="130" text-anchor="middle" font-size="10" fill="var(--c-fg-muted)" font-family="ui-monospace,monospace">fix</text>' +
              '</g>' +
              // 各自的 ✏️ 同时干活
              '<text x="42"  y="182" text-anchor="middle" font-size="13" fill="var(--course-accent)">✏️</text>' +
              '<text x="120" y="182" text-anchor="middle" font-size="13" fill="var(--course-accent)">✏️</text>' +
              '<text x="198" y="182" text-anchor="middle" font-size="13" fill="var(--course-accent)">✏️</text>' +
              '<text x="120" y="208" text-anchor="middle" font-size="11" fill="var(--c-fg-muted)">三个目录并排，同时改</text>' +
            '</svg>';

          stage.innerHTML =
            '<h2 class="deck-h2">别搞混：<span style="color:var(--course-accent)">branch</span> 和 <span style="color:var(--course-accent)">worktree</span> 不是一回事</h2>' +
            '<div class="deck-grid c-worktree-cmp">' +
              '<div class="deck-card">' +
                '<div class="c-worktree-cmp-h">🌿 branch（分支）</div>' +
                leftSvg +
                '<p class="deck-p" style="margin:8px 0 0">是<b>同一个</b>工作目录<b>里面</b>的不同开发线。' +
                  '你一次只能站在其中一条线上，切来切去。</p>' +
              '</div>' +
              '<div class="deck-card">' +
                '<div class="c-worktree-cmp-h">🪟 worktree</div>' +
                rightSvg +
                '<p class="deck-p" style="margin:8px 0 0">是同一个仓库的不同<b>副本</b>——几份一样的工作目录，' +
                  '每一份都能自己开分支，<b>同时改动、互不影响</b>。</p>' +
              '</div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '一句话区分：<b>branch 在仓库里头</b>分线，<b>worktree 把仓库变出好几个并排的窗口</b>。' +
              '分支要切换，副本能并存。' +
            '</div>' +
            '<style>' +
            '.c-worktree-cmp{grid-template-columns:1fr 1fr;gap:18px;margin:18px 0 10px;}' +
            '.c-worktree-cmp .deck-card{display:flex;flex-direction:column;}' +
            '.c-worktree-cmp-h{font-weight:700;color:var(--c-fg);margin-bottom:10px;font-size:15px;}' +
            '.c-worktree-cmp-svg{display:block;width:100%;max-width:280px;margin:0 auto;}' +
            '@media(max-width:640px){.c-worktree-cmp{grid-template-columns:1fr;}}' +
            '</style>';
        }
      },

      // ---------- Slide 3：关键误区——不是平行宇宙，只是投影 ----------
      {
        title: '关键误区：没有平行宇宙',
        render: function (stage, api) {
          // 一个仓库本体 + 几个"视窗/投影"框对着它
          var svg =
            '<svg class="c-worktree-proj-svg" viewBox="0 0 560 260" width="100%" aria-hidden="true">' +
              '<defs>' +
                '<marker id="c-worktree-pm" markerWidth="9" markerHeight="9" refX="2" refY="4.5" orient="auto">' +
                  '<path d="M9,0 L0,4.5 L9,9 Z" fill="var(--course-accent)" opacity="0.7"/>' +
                '</marker>' +
              '</defs>' +
              // 中央：仓库本体（唯一的对象库）
              '<rect x="218" y="86" width="124" height="92" rx="14" fill="var(--c-bg-soft)" stroke="var(--course-accent)" stroke-width="3"/>' +
              '<text x="280" y="120" text-anchor="middle" font-size="30">🗃️</text>' +
              '<text x="280" y="146" text-anchor="middle" font-size="12" fill="var(--c-fg)" font-weight="700">仓库本体</text>' +
              '<text x="280" y="164" text-anchor="middle" font-size="10" fill="var(--c-fg-muted)" font-family="ui-monospace,monospace">同一套对象库</text>' +
              // 三个"视窗 / 投影"框对着它（虚线，半透明，像投影）
              '<g stroke="var(--course-accent)" stroke-width="2" stroke-dasharray="6 4" fill="var(--c-bg-card)" opacity="0.85">' +
                '<rect x="30"  y="20"  width="100" height="60" rx="8"/>' +
                '<rect x="30"  y="180" width="100" height="60" rx="8"/>' +
                '<rect x="430" y="100" width="100" height="60" rx="8"/>' +
              '</g>' +
              '<g font-size="11" fill="var(--c-fg-muted)" text-anchor="middle">' +
                '<text x="80"  y="44">🪟 视窗 A</text><text x="80"  y="62" font-family="ui-monospace,monospace">worktree</text>' +
                '<text x="80"  y="204">🪟 视窗 B</text><text x="80" y="222" font-family="ui-monospace,monospace">worktree</text>' +
                '<text x="480" y="124">🪟 视窗 C</text><text x="480" y="142" font-family="ui-monospace,monospace">worktree</text>' +
              '</g>' +
              // 投影连线（从仓库射向各视窗）
              '<g stroke="var(--course-accent)" stroke-width="2" fill="none" opacity="0.6" stroke-dasharray="4 4" marker-end="url(#c-worktree-pm)">' +
                '<path d="M218,110 C170,80 130,60 132,52"/>' +
                '<path d="M218,154 C170,180 130,200 132,208"/>' +
                '<path d="M342,132 C390,128 420,130 428,130"/>' +
              '</g>' +
            '</svg>';

          stage.innerHTML =
            '<h2 class="deck-h2">⚠️ 最容易想歪的一点</h2>' +
            '<div class="deck-callout warn c-worktree-bigwarn">' +
              '新建 worktree <b>并没有创建一个平行宇宙！</b><br>' +
              '新 worktree 上的新 commit，仍然指向<b>主 worktree 的同一套对象库</b>。' +
            '</div>' +
            svg +
            '<p class="deck-p c-worktree-proj-note">' +
              '新建 worktree 只是新开了一个<b>投影</b>——给你<b style="color:var(--course-accent)">新开了一双眼睛、一个视窗</b>，' +
              '去看<b>同一个仓库</b>。下面那些虚线框就是"视窗"，它们都盯着中间那个唯一的仓库本体。' +
              '<br>所以你在任何一个视窗里 commit，存进去的都是<b>同一个</b>仓库。' +
            '</p>' +
            '<style>' +
            '.c-worktree-bigwarn{font-size:16px;line-height:1.7;text-align:left;}' +
            '.c-worktree-proj-svg{display:block;margin:18px auto 6px;max-width:560px;}' +
            '.c-worktree-proj-svg rect[stroke-dasharray]{animation:c-worktree-pulse 2.4s ease-in-out infinite;}' +
            '@keyframes c-worktree-pulse{0%,100%{opacity:.7}50%{opacity:1}}' +
            '.c-worktree-proj-note{max-width:600px;margin:6px auto 0;text-align:left;}' +
            '</style>';
        }
      },

      // ---------- Slide 4：触及本质的 Q&A（删 commit 不是"真删"） ----------
      {
        title: '一个触及本质的问题',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h2 class="deck-h2">既然只是投影，那……</h2>' +
              '<div class="c-worktree-qa">' +
                '<div class="c-worktree-q">' +
                  '<span class="c-worktree-tag c-worktree-tag-q">Q</span>' +
                  '<p>既然 worktree 只是投影，那主 worktree 删掉某个 commit，' +
                    '是不是在新建的 worktree 上也会跟着消失？</p>' +
                '</div>' +
                '<button class="deck-btn" id="c-worktree-revealA">🤔 看答案</button>' +
                '<div class="c-worktree-a" id="c-worktree-a" style="display:none">' +
                  '<span class="c-worktree-tag c-worktree-tag-a">A</span>' +
                  '<div>' +
                    '<p style="margin:0 0 10px">这是个能让你<b>触摸到 git 本质</b>的好问题。答案的关键是——</p>' +
                    '<div class="deck-callout" style="margin:0 0 12px">' +
                      'git 里<b>根本不存在"真正删掉"分支 / commit 这回事</b>。' +
                      '所谓的删除，只是把<b style="color:var(--course-accent)">分支指针向前 / 向别处移动了</b>而已。' +
                      '<br>对象还在那儿，只是<b>没有指针指向它</b>了。' +
                    '</div>' +
                    '<p style="margin:0;color:var(--c-fg-muted)">（呼应前面讲过的：这也是为什么<b>孤儿 commit</b> 一时半会儿不会消失——' +
                      '它只是没人指着它，但东西还躺在对象库里。）</p>' +
                  '</div>' +
                '</div>' +
              '</div>' +
              // 小图解：指针移走 → commit 变孤儿（虚影）但还在
              '<svg class="c-worktree-ptr-svg" id="c-worktree-ptr-svg" viewBox="0 0 420 130" width="100%" aria-hidden="true" style="display:none">' +
                '<line x1="70" y1="80" x2="200" y2="80" stroke="var(--course-accent)" stroke-width="4"/>' +
                commitDot(70, 80, 'a1b2', { r: 14 }) +
                commitDot(200, 80, 'c3d4', { r: 14 }) +
                // 被"删"的 commit：虚影，仍然画着
                commitDot(330, 80, 'e5f6', { r: 14, ghost: true }) +
                '<line x1="200" y1="80" x2="330" y2="80" stroke="var(--course-accent)" stroke-width="3" stroke-dasharray="4 3" opacity="0.4"/>' +
                // HEAD 指针：从 e5f6 上方移回 c3d4
                '<path d="M300,40 C260,30 230,40 210,62" fill="none" stroke="' + GOLD + '" stroke-width="2" stroke-dasharray="5 4"/>' +
                branchPill(176, 30, 'HEAD', { head: true, w: 50 }) +
                '<text x="330" y="116" text-anchor="middle" font-size="11" fill="var(--c-fg-muted)">指针移走了，但对象还在（虚影）</text>' +
              '</svg>' +
            '</div>' +
            '<style>' +
            '.c-worktree-qa{max-width:600px;margin:18px auto 0;text-align:left;}' +
            '.c-worktree-q,.c-worktree-a{display:flex;gap:12px;align-items:flex-start;}' +
            '.c-worktree-q p{margin:0;font-size:16px;font-weight:600;line-height:1.6;}' +
            '.c-worktree-tag{flex:none;width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;}' +
            '.c-worktree-tag-q{background:var(--course-accent-soft);color:var(--course-accent);}' +
            '.c-worktree-tag-a{background:rgba(63,185,80,.16);color:#3fb950;}' +
            '#c-worktree-revealA{margin:18px 0;}' +
            '.c-worktree-a{animation:c-worktree-pop .45s cubic-bezier(.34,1.56,.64,1);}' +
            '@keyframes c-worktree-pop{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
            '.c-worktree-ptr-svg{margin:22px auto 0;max-width:420px;animation:c-worktree-pop .5s both;}' +
            '</style>';

          var btn = stage.querySelector('#c-worktree-revealA');
          var ans = stage.querySelector('#c-worktree-a');
          var svg = stage.querySelector('#c-worktree-ptr-svg');
          btn.addEventListener('click', function () {
            ans.style.display = 'flex';
            svg.style.display = 'block';
            btn.style.display = 'none';
          });
        }
      },

      // ---------- Slide 5：vibe coder 为什么爱 worktree ----------
      {
        title: 'Vibe coder 为啥爱它',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h2 class="deck-h2">在 AI 时代，worktree 突然变香了 🔥</h2>' +
              '<p class="deck-lead">因为你可以让<b>好几个 AI agent 同时</b>在不同 worktree 里干活，互不打架。</p>' +
              '<div class="deck-grid c-worktree-uses">' +
                '<div class="deck-card c-worktree-use">' +
                  '<div class="c-worktree-use-ico">🤖✍️</div>' +
                  '<div class="c-worktree-use-h">agent A 写新功能</div>' +
                  '<p class="deck-p" style="margin:0">在副本①里专心开发一个新特性。</p>' +
                '</div>' +
                '<div class="deck-card c-worktree-use">' +
                  '<div class="c-worktree-use-ico">🤖🐛</div>' +
                  '<div class="c-worktree-use-h">agent B 改 bug</div>' +
                  '<p class="deck-p" style="margin:0">同时在副本②里修一个急 bug，不用等 A 写完。</p>' +
                '</div>' +
                '<div class="deck-card c-worktree-use">' +
                  '<div class="c-worktree-use-ico">🧍👀</div>' +
                  '<div class="c-worktree-use-h">你看稳定版</div>' +
                  '<p class="deck-p" style="margin:0">让 AI 在副本里折腾，你自己在主目录盯着<b>能跑的稳定版</b>。</p>' +
                '</div>' +
              '</div>' +
              '<div class="deck-callout">' +
                '关键在于：它们改的是<b>同一个仓库</b>的不同副本，所以谁也<b>不会覆盖谁的文件</b>。' +
                '一边让 AI 大胆乱试，一边自己手里始终留着一份不被打扰的版本——这就是 worktree 的爽点。' +
              '</div>' +
            '</div>' +
            '<style>' +
            '.c-worktree-uses{grid-template-columns:repeat(3,1fr);max-width:660px;margin:22px auto 0;}' +
            '.c-worktree-use{text-align:center;}' +
            '.c-worktree-use-ico{font-size:30px;line-height:1;margin-bottom:8px;}' +
            '.c-worktree-use-h{font-weight:700;color:var(--c-fg);margin-bottom:6px;font-size:14px;}' +
            '@media(max-width:640px){.c-worktree-uses{grid-template-columns:1fr;}}' +
            '</style>';
        }
      },

      // ============================================================
      // Part B · merge conflict 合并冲突
      // ============================================================

      // ---------- Slide 6：冲突是怎么发生的 ----------
      {
        title: '合并冲突怎么发生',
        render: function (stage, api) {
          // 同一父节点岔出两条线，各改同一行，merge 处红色 ⚡
          var svg =
            '<svg class="c-worktree-conf-svg" viewBox="0 0 480 240" width="100%" aria-hidden="true">' +
              // 共同父节点
              commitDot(70, 120, 'p0', { r: 16 }) +
              '<text x="70" y="92" text-anchor="middle" font-size="11" fill="var(--c-fg-muted)">共同的父节点</text>' +
              // 上岔（小C）
              '<path d="M86,114 C150,90 200,70 250,64" fill="none" stroke="var(--course-accent)" stroke-width="4"/>' +
              commitDot(250, 60, 'c1', { r: 15 }) +
              '<text x="250" y="36" text-anchor="middle" font-size="11" fill="var(--course-accent)" font-weight="700">改了同一行</text>' +
              // 下岔（小D）
              '<path d="M86,126 C150,150 200,170 250,176" fill="none" stroke="var(--course-accent)" stroke-width="4"/>' +
              commitDot(250, 180, 'd1', { r: 15 }) +
              '<text x="250" y="214" text-anchor="middle" font-size="11" fill="var(--course-accent)" font-weight="700">也改了同一行</text>' +
              // merge 汇合，红色闪电
              '<path d="M266,60 C330,72 370,100 392,116" fill="none" stroke="#f85149" stroke-width="4" stroke-dasharray="6 4"/>' +
              '<path d="M266,180 C330,168 370,140 392,124" fill="none" stroke="#f85149" stroke-width="4" stroke-dasharray="6 4"/>' +
              '<circle cx="408" cy="120" r="22" fill="rgba(248,81,73,.14)" stroke="#f85149" stroke-width="2"/>' +
              '<text x="408" y="129" text-anchor="middle" font-size="24">⚡</text>' +
              '<text x="408" y="166" text-anchor="middle" font-size="12" fill="#f85149" font-weight="700">CONFLICT</text>' +
            '</svg>';

          stage.innerHTML =
            '<h2 class="deck-h2">Part B：什么是<span style="color:#f85149">合并冲突</span> ⚡</h2>' +
            '<p class="deck-lead">第 5 章的 <b>merge</b> 大多数时候 git 自己就拼好了。但并行一多，' +
            '总有失手的一次——冲突的触发条件其实很具体，记住这三个"同"：</p>' +
            svg +
            '<div class="deck-callout warn">' +
              '当两个<b>共享同一个父节点</b>的 commit，改动了<b>同一个文件的同一行</b>代码，' +
              'merge（合并）时 git <b>不知道该听谁的</b>——这就是合并冲突。' +
            '</div>' +
            '<p class="deck-p" style="text-align:center;color:var(--c-fg-muted)">' +
              '注意：只要不是<b>同一行</b>，git 自己就能拼好；只有撞在同一行，才需要有人来拍板。' +
            '</p>' +
            '<style>' +
            '.c-worktree-conf-svg{display:block;margin:14px auto;max-width:500px;}' +
            '.c-worktree-conf-svg circle[stroke="#f85149"]{animation:c-worktree-zap 1.4s ease-in-out infinite;}' +
            '@keyframes c-worktree-zap{0%,100%{opacity:.7}50%{opacity:1}}' +
            '</style>';
        }
      },

      // ---------- Slide 7：真实例子（小C 实时 vs 小D 每周） ----------
      {
        title: '真实例子：信用分结算',
        render: function (stage, api) {
          stage.innerHTML =
            '<h2 class="deck-h2">来个真实场景：信用积分系统 💳</h2>' +
            '<p class="deck-lead">小 C 和小 D 各管一块，按职责开发——大部分时候完全不打架。</p>' +
            '<div class="deck-grid c-worktree-dev">' +
              '<div class="deck-card c-worktree-devcard">' +
                '<div class="c-worktree-dev-name">🧑‍💻 小 C 的模块</div>' +
                '<p class="deck-p" style="margin:0">需要信用分 <b style="color:var(--course-accent)">实时</b> 结算。</p>' +
              '</div>' +
              '<div class="deck-card c-worktree-devcard">' +
                '<div class="c-worktree-dev-name">🧑‍💻 小 D 的模块</div>' +
                '<p class="deck-p" style="margin:0">需要信用分 <b style="color:var(--course-accent)">每周</b> 结算。</p>' +
              '</div>' +
            '</div>' +
            // 文件示意：不冲突的部分都更新上去；同一段逻辑撞车
            '<div class="c-worktree-file">' +
              '<div class="c-worktree-file-bar">📄 credit.js</div>' +
              '<div class="c-worktree-line c-worktree-ok"><span>✓</span> 引入用户表（两边都没动）</div>' +
              '<div class="c-worktree-line c-worktree-ok"><span>✓</span> 读取消费记录（两边都没动）</div>' +
              '<div class="c-worktree-line c-worktree-clash"><span>⚡</span> 信用积分结算逻辑 ← 这一段两边都改了！</div>' +
              '<div class="c-worktree-line c-worktree-ok"><span>✓</span> 写回数据库（两边都没动）</div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '他们各自负责的<b>不冲突的部分</b>，都能舒舒服服地更新上去；' +
              '可是俩人对"<b>信用积分结算</b>"这<b>同一段逻辑</b>的改动——一个要实时、一个要每周——<b style="color:#f85149">撞车了</b>。' +
            '</div>' +
            '<style>' +
            '.c-worktree-dev{grid-template-columns:1fr 1fr;max-width:600px;margin:18px auto;gap:16px;}' +
            '.c-worktree-dev-name{font-weight:700;margin-bottom:6px;}' +
            '.c-worktree-file{max-width:560px;margin:18px auto 0;border:1px solid var(--c-border);border-radius:12px;overflow:hidden;background:var(--c-bg-card);font-family:ui-monospace,monospace;}' +
            '.c-worktree-file-bar{padding:9px 14px;background:var(--c-bg-soft);border-bottom:1px solid var(--c-border);font-size:12px;color:var(--c-fg-muted);}' +
            '.c-worktree-line{display:flex;gap:10px;align-items:center;padding:11px 14px;font-size:13px;border-bottom:1px solid var(--c-border);}' +
            '.c-worktree-line:last-child{border-bottom:none;}' +
            '.c-worktree-line span{flex:none;font-family:initial;}' +
            '.c-worktree-ok{color:var(--c-fg-muted);}' +
            '.c-worktree-ok span{color:#3fb950;}' +
            '.c-worktree-clash{color:var(--c-fg);font-weight:700;background:rgba(248,81,73,.1);}' +
            '.c-worktree-clash span{color:#f85149;}' +
            '@media(max-width:640px){.c-worktree-dev{grid-template-columns:1fr;}}' +
            '</style>';
        }
      },

      // ---------- Slide 8：怎么解决（人为干预 + AI 时代） ----------
      {
        title: '冲突怎么解',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h2 class="deck-h2">谁来拍板？<span style="color:var(--course-accent)">人</span>。</h2>' +
              '<p class="deck-lead">冲突需要<b>人为干预</b>——由人来决定留下哪一个版本，或者怎么把两边<b>融合</b>。</p>' +
              '<div class="c-worktree-pick" id="c-worktree-pick">' +
                '<button class="c-worktree-opt" data-pick="c">' +
                  '<div class="c-worktree-opt-ico">⏱️</div>留小 C 的：<b>实时结算</b>' +
                '</button>' +
                '<button class="c-worktree-opt" data-pick="d">' +
                  '<div class="c-worktree-opt-ico">📅</div>留小 D 的：<b>每周结算</b>' +
                '</button>' +
                '<button class="c-worktree-opt" data-pick="mix">' +
                  '<div class="c-worktree-opt-ico">🔀</div>融合：<b>平时实时、周末汇总</b>' +
                '</button>' +
              '</div>' +
              '<p class="deck-p c-worktree-picked" id="c-worktree-picked" style="visibility:hidden">' +
                '👆 看到没？拍这个板的，必须是<b>懂业务的你</b>。' +
              '</p>' +
              '<div class="deck-callout c-worktree-ai">' +
                '<div class="c-worktree-ai-h">🤖 AI 时代怎么做</div>' +
                '把冲突直接丢给 AI："<span class="deck-kbd">帮我看看这个 conflict 怎么解，两边各要保留什么</span>"，' +
                '它会很快给你方案、解释两边的差异。<br>' +
                '<b>但最终拍板留哪个</b>，还是得你这个<b style="color:var(--course-accent)">懂业务的人</b>来定——' +
                '因为"实时 还是 每周"是个<b>产品决策</b>，不是代码问题。' +
              '</div>' +
            '</div>' +
            '<style>' +
            '.c-worktree-pick{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin:24px 0 4px;}' +
            '.c-worktree-opt{cursor:pointer;font-family:inherit;font-size:14px;color:var(--c-fg);background:var(--c-bg-card);border:2px solid var(--c-border);border-radius:14px;padding:16px 18px;min-width:150px;transition:all .25s cubic-bezier(.34,1.56,.64,1);}' +
            '.c-worktree-opt:hover{border-color:var(--course-accent);transform:translateY(-3px);box-shadow:0 12px 26px rgba(0,0,0,.3);}' +
            '.c-worktree-opt.chosen{border-color:var(--course-accent);background:var(--course-accent-soft);box-shadow:0 0 0 3px var(--course-accent-soft);}' +
            '.c-worktree-opt.faded{opacity:.4;}' +
            '.c-worktree-opt-ico{font-size:26px;margin-bottom:6px;}' +
            '.c-worktree-picked{margin:6px 0 4px;}' +
            '.c-worktree-ai{text-align:left;max-width:600px;margin:22px auto 0;}' +
            '.c-worktree-ai-h{font-weight:700;margin-bottom:8px;color:var(--c-fg);}' +
            '</style>';

          var pick = stage.querySelector('#c-worktree-pick');
          var picked = stage.querySelector('#c-worktree-picked');
          var opts = Array.prototype.slice.call(pick.querySelectorAll('.c-worktree-opt'));
          opts.forEach(function (o) {
            o.addEventListener('click', function () {
              opts.forEach(function (x) {
                x.classList.toggle('chosen', x === o);
                x.classList.toggle('faded', x !== o);
              });
              picked.style.visibility = 'visible';
            });
          });
        }
      },

      // ---------- Slide 9：小结 ----------
      {
        title: '本章小结',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<div class="c-worktree-sum-emoji">🪟 ⚡ 🤝</div>' +
              '<h1 class="deck-h1">并行的爽，与并行的代价</h1>' +
              '<div class="deck-grid c-worktree-sum">' +
                '<div class="deck-card">' +
                  '<div class="c-worktree-sum-h">🪟 worktree 让你并行</div>' +
                  '<p class="deck-p" style="margin:0">同一个仓库开几个视窗/副本，' +
                    '多人、多 agent 同时动手，互不覆盖。它只是投影，不是平行宇宙。</p>' +
                '</div>' +
                '<div class="deck-card">' +
                  '<div class="c-worktree-sum-h">⚡ conflict 是代价</div>' +
                  '<p class="deck-p" style="margin:0">一旦两边改了同一行，合并时就得有人拍板。' +
                    'AI 能给方案，懂业务的你来定。</p>' +
                '</div>' +
              '</div>' +
              '<div class="deck-callout">' +
                '一句话收尾：只要<b>分工清楚、撞车少</b>，多人 / 多 agent 协作就会很顺——' +
                '<b style="color:var(--course-accent)">worktree 放大产能，清晰的分工把冲突降到最低</b>。' +
              '</div>' +
              '<p class="deck-p" style="color:var(--c-fg-muted)">到这儿，git 的<b>用法</b>你已经全会了。' +
                '<b>最后一章</b>掀开盖子——看看这一切背后那套优雅到会让人"哇"的<b style="color:var(--course-accent)">数学骨架</b>。</p>' +
            '</div>' +
            '<style>' +
            '.c-worktree-sum-emoji{font-size:46px;letter-spacing:6px;margin:6px 0 12px;}' +
            '.c-worktree-sum{grid-template-columns:1fr 1fr;max-width:640px;margin:22px auto;gap:16px;}' +
            '.c-worktree-sum-h{font-weight:700;margin-bottom:6px;color:var(--c-fg);}' +
            '@media(max-width:640px){.c-worktree-sum{grid-template-columns:1fr;}}' +
            '</style>';
        }
      }

    ]
  });
})();
