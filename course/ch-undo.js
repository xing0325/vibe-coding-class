(function () {
  // ===== 第4章 三种后悔药 =====================================
  // 主题色 #d29922（GitHub 金/琥珀）。样式前缀 c-undo-。
  // 框架提供翻页（底部按钮 + 键盘 ←→），本文件只负责每页内容 + 页内互动。

  function injectStyle() {
    if (document.getElementById('c-undo-style')) return;
    var s = document.createElement('style');
    s.id = 'c-undo-style';
    s.textContent = [
      '.c-undo-graph{display:block;margin:16px auto;}',
      '.c-undo-hashbox{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:12px;padding:18px;text-align:center;font-size:clamp(15px,2.4vw,22px);letter-spacing:1px;word-break:break-all;margin:14px 0;}',
      '.c-undo-hashbox .short{color:#0d1117;background:var(--course-accent);border-radius:6px;padding:2px 5px;font-weight:700;}',
      '.c-undo-hashbox .rest{color:var(--c-fg-muted);}',
      '.c-undo-3{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:16px 0;}',
      '@media(max-width:760px){.c-undo-3{grid-template-columns:1fr;}}',
      '.c-undo-pill{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:10px 0 4px;}',
      '.c-undo-card{background:var(--c-bg-card);border:1px solid var(--c-border);border-top:4px solid var(--course-accent);border-radius:14px;padding:16px;display:flex;flex-direction:column;gap:8px;}',
      '.c-undo-card h3{margin:0;font-size:17px;}',
      '.c-undo-card code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:var(--course-accent);}',
      '.c-undo-card .mini{font-size:12px;color:var(--c-fg-muted);}',
      '.c-undo-card .danger{color:#f85149;font-weight:600;}',
      '.c-undo-card .safe{color:#3fb950;font-weight:600;}',
      '.c-undo-cmpbtn{display:flex;gap:8px;justify-content:center;margin:6px 0 12px;}',
      '.c-undo-diff{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0;}',
      '@media(max-width:760px){.c-undo-diff{grid-template-columns:1fr;}}',
      '.c-undo-codepane{background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:12px;overflow:hidden;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;}',
      '.c-undo-codepane .head{background:var(--c-bg-card);padding:8px 12px;border-bottom:1px solid var(--c-border);color:var(--c-fg-muted);font-size:12px;}',
      '.c-undo-codepane .row{padding:3px 12px;white-space:pre;}',
      '.c-undo-codepane .add{background:rgba(63,185,80,.15);color:#56d364;}',
      '.c-undo-codepane .del{background:rgba(248,81,73,.15);color:#ff7b72;}',
      '.c-undo-codepane .add::before{content:"+ ";opacity:.6;}',
      '.c-undo-codepane .del::before{content:"- ";opacity:.6;}',
      '.c-undo-msg{display:flex;flex-direction:column;gap:10px;}',
      '.c-undo-msg .good,.c-undo-msg .bad{display:flex;gap:10px;align-items:flex-start;background:var(--c-bg-card);border:1px solid var(--c-border);border-radius:10px;padding:12px 14px;}',
      '.c-undo-msg .good{border-left:4px solid #3fb950;}',
      '.c-undo-msg .bad{border-left:4px solid #f85149;}',
      '.c-undo-msg code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}',
      '.c-undo-final{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:48vh;gap:18px;}',
      '.c-undo-final .big{font-size:clamp(26px,5.5vw,46px);font-weight:800;line-height:1.35;background:linear-gradient(120deg,var(--course-accent),#f0c674);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // ---- Git 图谱 SVG 原子件 -------------------------------------
  // commit 圆点：半径16，填充主题色，白描边；下方短 hash
  function commitNode(x, y, hash, opts) {
    opts = opts || {};
    var r = 16;
    var fill = opts.ghost ? 'rgba(125,133,144,.25)' : 'var(--course-accent)';
    var stroke = opts.ghost ? 'rgba(125,133,144,.6)' : '#fff';
    var dash = opts.ghost ? ' stroke-dasharray="3 3"' : '';
    var hashColor = opts.ghost ? 'rgba(125,133,144,.7)' : 'var(--c-fg-muted)';
    return '<g>' +
      '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + fill + '" stroke="' + stroke + '" stroke-width="2.5"' + dash + '/>' +
      (opts.label ? '<text x="' + x + '" y="' + (y + 5) + '" text-anchor="middle" font-size="13" fill="#0d1117" font-weight="700">' + opts.label + '</text>' : '') +
      '<text x="' + x + '" y="' + (y + 34) + '" text-anchor="middle" font-size="12" font-family="ui-monospace,Menlo,monospace" fill="' + hashColor + '">' + hash + '</text>' +
      '</g>';
  }
  function edge(x1, y1, x2, y2, ghost) {
    var st = ghost ? 'rgba(125,133,144,.5)' : 'var(--c-border)';
    var dash = ghost ? ' stroke-dasharray="3 4"' : '';
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + st + '" stroke-width="3"' + dash + '/>';
  }
  // 分支 pill：指向某 commit
  function branchPill(x, y, text) {
    var w = text.length * 8 + 18;
    return '<g>' +
      '<rect x="' + (x - w / 2) + '" y="' + y + '" width="' + w + '" height="22" rx="11" fill="var(--c-bg-soft)" stroke="var(--course-accent)" stroke-width="1.5"/>' +
      '<text x="' + x + '" y="' + (y + 15) + '" text-anchor="middle" font-size="12" font-family="ui-monospace,Menlo,monospace" fill="var(--course-accent)">' + text + '</text>' +
      '</g>';
  }
  // HEAD pill：金黄
  function headPill(x, y) {
    return '<g>' +
      '<rect x="' + (x - 26) + '" y="' + y + '" width="52" height="22" rx="11" fill="#e3b341"/>' +
      '<text x="' + x + '" y="' + (y + 15) + '" text-anchor="middle" font-size="12" font-weight="700" font-family="ui-monospace,Menlo,monospace" fill="#0d1117">HEAD</text>' +
      '</g>';
  }

  window.registerChapter({
    id: 'undo',
    index: 4,
    emoji: '💊',
    title: '三种后悔药',
    subtitle: 'discard · reset · revert',
    theme: '#d29922',
    slides: [
      // ---------- 1. commit message ----------
      {
        title: '提交摘要 commit message',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">每次提交，都写一句「我改了啥」</h1>' +
            '<p class="deck-lead">上一章结尾说要讲「后悔药」💊。但吃药前得先认门牌——先从你每次提交都会写的那句话说起：' +
            '<strong>commit message（提交摘要）</strong>，它是你给这次改动贴的标签。</p>' +
            '<p class="deck-p">未来的你、还有队友翻历史的时候，全靠这一句话秒懂"这个版本干了什么"。写得好不好，差别巨大：</p>' +
            '<div class="c-undo-msg">' +
              '<div class="good"><span>✅</span><div><code>修复登录页手机号校验，11 位才放行</code><div class="mini" style="color:var(--c-fg-muted);font-size:12px;margin-top:4px;">一看就懂改了哪、为啥改</div></div></div>' +
              '<div class="bad"><span>❌</span><div><code>update</code> / <code>改了一下</code> / <code>fix bug</code><div class="mini" style="color:var(--c-fg-muted);font-size:12px;margin-top:4px;">三个月后你自己都不知道改的是啥</div></div></div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '<strong>AI 时代小窍门：</strong>让 AI 帮你 commit 时，可以直接说「commit，message 写：xxx」，' +
              '或者干脆让它「根据这次改动自动写一句清楚的中文 message」。</div>';
        }
      },

      // ---------- 2. commit id / hash ----------
      {
        title: 'commit id / hash',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">每个 commit 都有个独一无二的「身份证号」</h1>' +
            '<p class="deck-lead">你每提交一次，git 就用哈希算法自动算出一串编号——这就是 <strong>commit id / commit hash</strong>。</p>' +
            '<div style="display:flex;justify-content:center;">' +
              '<svg class="c-undo-graph" width="430" height="120" viewBox="0 0 430 120">' +
                edge(70, 60, 215, 60) + edge(215, 60, 360, 60) +
                commitNode(70, 60, 'a1b2c3d') +
                commitNode(215, 60, '9f8e7d6') +
                commitNode(360, 60, '4c5d6e7') +
                branchPill(360, 12, 'main') +
              '</svg>' +
            '</div>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">它是唯一的</h2><p class="deck-p">在整个仓库里，没有两个 commit 会撞号。它就像这个 commit 的<strong>名字 / 代号</strong>，指名道姓不会认错。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">它是算出来的</h2><p class="deck-p">不是随便编的，而是用<strong>哈希算法</strong>从这次提交里算出来的。这背后藏着 git 最妙的数学——<strong>想知道为什么这么神奇？最后一章揭秘。</strong></p></div>' +
            '</div>' +
            '<div class="deck-callout">有了这个唯一代号，你就能精确地指着历史上的某一刻说：「就是它。」</div>';
        }
      },

      // ---------- 3. 长 id 与短 id ----------
      {
        title: '长 id 与短 id',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">长 id 太长？前 7 位就够用</h1>' +
            '<p class="deck-lead">完整 hash 有 40 位，没人愿意打那么长。<strong>取前 7 位</strong>就是「短 id」，俩功能完全一样。</p>' +
            '<div class="c-undo-hashbox">' +
              '<span class="short">8f3a1c9</span><span class="rest">d4e7b20a6f1c8e9d3b5a7c2f0e4d6b8a1c3e5f7</span>' +
            '</div>' +
            '<p class="deck-p" style="text-align:center;">' +
              '<span style="color:var(--course-accent);font-weight:700;">高亮的前 7 位 = 短 id</span>，后面那一长串灰色的是完整长 id 的剩余部分。' +
              '指同一个 commit，短的好打、好记、好念。</p>' +
            '<div class="deck-callout">' +
              '<strong>AI 时代的关键用法 🔑：</strong>把某个重要版本的 hash 记下来（短 id 就行），' +
              '回头跟 AI 说——<br>「帮我回退到 <code class="deck-kbd">8f3a1c9</code> 的状态」，' +
              'AI 立刻就懂你指的是哪个 commit，不用你描述半天。</div>';
        }
      },

      // ---------- 4. 三种后悔药总览 ----------
      {
        title: '三种后悔药总览',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">三种「后悔药」，吃法完全不同 💊</h1>' +
            '<p class="deck-lead">discard / reset / revert 都是"反悔"，但语义差很远。别吃错药——先看清各自治什么。</p>' +
            '<div class="c-undo-3">' +
              '<div class="c-undo-card">' +
                this._svgDiscard() +
                '<h3>discard changes</h3>' +
                '<p class="deck-p">丢弃<strong>还没 commit</strong> 的改动，回到上一次 commit 的干净状态。</p>' +
                '<div class="mini">像把草稿纸上的涂改 <span class="danger">擦掉</span>，回到誊抄前的样子。</div></div>' +
              '<div class="c-undo-card">' +
                this._svgReset() +
                '<h3>reset</h3>' +
                '<p class="deck-p">让分支指针 <strong>倒退</strong> 到某个旧 commit，后面的提交被丢弃。</p>' +
                '<div class="mini">像把书签 <span class="danger">往前翻回去</span>，后面的页当作没写过。</div></div>' +
              '<div class="c-undo-card">' +
                this._svgRevert() +
                '<h3>revert</h3>' +
                '<p class="deck-p">不删历史，<strong>新建一个反向提交</strong> 来抵消某次旧提交。</p>' +
                '<div class="mini">不撕纸，而是 <span class="safe">补一笔</span> 把那次改动反着写回来。</div></div>' +
            '</div>' +
            '<div class="deck-callout warn">' +
              '记忆口诀：<strong>discard</strong> 治"还没存的"，<strong>reset</strong> 治"想当没发生过"，' +
              '<strong>revert</strong> 治"已经发出去、只能光明正大撤销"。</div>';
        },
        // discard = 橡皮擦擦掉草稿
        _svgDiscard: function () {
          return '<svg width="100%" height="64" viewBox="0 0 200 64">' +
            '<path d="M30 44h60" stroke="var(--c-fg-muted)" stroke-width="2" stroke-dasharray="5 4"/>' +
            '<g transform="rotate(-18 120 30)">' +
              '<rect x="100" y="18" width="46" height="22" rx="4" fill="var(--course-accent)" stroke="#fff" stroke-width="2"/>' +
              '<rect x="100" y="18" width="14" height="22" rx="4" fill="#f0c674"/>' +
            '</g>' +
            '<path d="M60 40l-3 6 6-1z" fill="var(--c-fg-muted)"/>' +
            '<text x="158" y="56" font-size="11" fill="var(--c-fg-muted)">擦掉草稿</text>' +
            '</svg>';
        },
        // reset = 指针往回拉
        _svgReset: function () {
          return '<svg width="100%" height="64" viewBox="0 0 200 64">' +
            '<line x1="30" y1="32" x2="170" y2="32" stroke="var(--c-border)" stroke-width="3"/>' +
            '<circle cx="50" cy="32" r="9" fill="var(--course-accent)" stroke="#fff" stroke-width="2"/>' +
            '<circle cx="100" cy="32" r="9" fill="var(--course-accent)" stroke="#fff" stroke-width="2"/>' +
            '<circle cx="150" cy="32" r="9" fill="rgba(125,133,144,.25)" stroke="rgba(125,133,144,.6)" stroke-width="2" stroke-dasharray="3 3"/>' +
            '<path d="M120 18 L100 18" stroke="#e3b341" stroke-width="3"/>' +
            '<path d="M104 13l-6 5 6 5z" fill="#e3b341"/>' +
            '<rect x="86" y="2" width="40" height="16" rx="8" fill="#e3b341"/>' +
            '<text x="106" y="14" text-anchor="middle" font-size="10" font-weight="700" fill="#0d1117">HEAD</text>' +
            '</svg>';
        },
        // revert = 新增一个"反向"圆点
        _svgRevert: function () {
          return '<svg width="100%" height="64" viewBox="0 0 200 64">' +
            '<line x1="30" y1="36" x2="170" y2="36" stroke="var(--c-border)" stroke-width="3"/>' +
            '<circle cx="55" cy="36" r="9" fill="var(--course-accent)" stroke="#fff" stroke-width="2"/>' +
            '<circle cx="105" cy="36" r="9" fill="var(--course-accent)" stroke="#fff" stroke-width="2"/>' +
            '<circle cx="155" cy="36" r="11" fill="#3fb950" stroke="#fff" stroke-width="2"/>' +
            '<text x="155" y="40" text-anchor="middle" font-size="12" font-weight="700" fill="#0d1117">↩</text>' +
            '<text x="155" y="58" text-anchor="middle" font-size="10" fill="#3fb950">反向提交</text>' +
            '</svg>';
        }
      },

      // ---------- 5. 单独讲 revert ----------
      {
        title: 'revert：光明正大地撤销',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1"><code class="deck-kbd">revert</code>：不删历史，补一个「反向提交」</h1>' +
            '<p class="deck-lead">发现历史上某一次提交是错的？revert 会新建一个 commit，专门把那次的改动反着做一遍，刚好抵消。</p>' +
            '<div style="display:flex;justify-content:center;">' +
              '<svg class="c-undo-graph" width="520" height="130" viewBox="0 0 520 130">' +
                edge(60, 70, 175, 70) + edge(175, 70, 290, 70) + edge(290, 70, 405, 70) +
                commitNode(60, 70, 'a1b2c3d') +
                commitNode(175, 70, 'BAD 提交', { label: '✕' }) +
                commitNode(290, 70, '7f6e5d4') +
                commitNode(405, 70, '反向提交', { label: '↩' }) +
                branchPill(405, 22, 'main') +
                '<text x="175" y="118" text-anchor="middle" font-size="11" fill="#ff7b72">这次错了</text>' +
                '<text x="405" y="118" text-anchor="middle" font-size="11" fill="#3fb950">抵消它，但历史还在</text>' +
              '</svg>' +
            '</div>' +
            '<p class="deck-p">注意：那个出错的 BAD 提交<strong>没有被删</strong>，它还老老实实留在历史里。revert 只是又加了一笔把它的效果取消掉。其他正常的更新（比如 <code class="deck-kbd">7f6e5d4</code>）完全不受影响。</p>' +
            '<div class="deck-callout">' +
              '<strong>什么时候非它不可？</strong>当这段历史<strong>已经 push 到远程、别人也拉过了</strong>——这时候不能偷偷改历史（会把队友搞乱），' +
              '只能用 revert 这种"公开补一刀"的方式撤销。</div>';
        }
      },

      // ---------- 6. git diff ----------
      {
        title: 'git diff 比较两次提交',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1"><code class="deck-kbd">git diff</code>：这两版到底差在哪？</h1>' +
            '<p class="deck-lead">把两个 commit 的 hash 给 AI，让它告诉你这两次提交之间改了哪些内容——一目了然。</p>' +
            '<div class="c-undo-cmpbtn">' +
              '<button class="deck-btn" id="c-undo-diffbtn">⇄ 高亮两版的差异</button></div>' +
            '<div class="c-undo-diff">' +
              '<div class="c-undo-codepane"><div class="head">旧版本 <span style="font-family:ui-monospace">a1b2c3d</span></div>' +
                '<div class="row">function login(phone) {</div>' +
                '<div class="row" data-pair="1">  if (phone) {</div>' +
                '<div class="row">    submit();</div>' +
                '<div class="row">  }</div>' +
                '<div class="row">}</div></div>' +
              '<div class="c-undo-codepane"><div class="head">新版本 <span style="font-family:ui-monospace">8f3a1c9</span></div>' +
                '<div class="row">function login(phone) {</div>' +
                '<div class="row" data-pair="1">  if (phone.length === 11) {</div>' +
                '<div class="row">    submit();</div>' +
                '<div class="row">  }</div>' +
                '<div class="row">}</div></div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '<strong>AI 咒语：</strong>「帮我用 git diff 比较 <code class="deck-kbd">a1b2c3d</code> 和 ' +
              '<code class="deck-kbd">8f3a1c9</code> 这两次提交，改了哪些内容？」AI 就会把差异行给你列出来。</div>';

          var btn = stage.querySelector('#c-undo-diffbtn');
          var on = false;
          btn.addEventListener('click', function () {
            on = !on;
            var rows = stage.querySelectorAll('.c-undo-codepane');
            // 左 pane data-pair="1" 标红删除，右 pane 标绿新增
            var panes = stage.querySelectorAll('.c-undo-codepane');
            var leftPair = panes[0].querySelector('[data-pair="1"]');
            var rightPair = panes[1].querySelector('[data-pair="1"]');
            if (on) {
              leftPair.classList.add('del');
              rightPair.classList.add('add');
              btn.textContent = '↺ 取消高亮';
            } else {
              leftPair.classList.remove('del');
              rightPair.classList.remove('add');
              btn.textContent = '⇄ 高亮两版的差异';
            }
          });
        }
      },

      // ---------- 7. vibe coder 实话 ----------
      {
        title: 'vibe coder 实话',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">说点 vibe coder 的实话 🫢</h1>' +
            '<div class="deck-callout">' +
              '<p class="deck-p" style="margin-top:0;">老实讲：discard / revert 这些"后悔药"，<strong>vibe coder 很多时候用不太上</strong>。' +
              '看哪儿不顺眼，直接让 AI 在最新版上接着改就行了——根本不用回退。</p>' +
              '<p class="deck-p" style="margin-bottom:0;">但有<strong>两个真实场景</strong>，知道它们能救命：</p>' +
            '</div>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">① 用 discard 回退一次和 AI 的问答</h2>' +
                '<p class="deck-p">AI 改完一版你不满意？<code class="deck-kbd">discard</code> 掉这次还没 commit 的改动，' +
                '相当于把这一轮对话"作废"，<strong>省下宝贵的上下文空间</strong>，重新清爽地问一次。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">② 用 revert 撤销已 push 的提交</h2>' +
                '<p class="deck-p">代码<strong>已经 push 出去、被别人拉过</strong>了，这时候不能粗暴改历史。' +
                '用 <code class="deck-kbd">revert</code> 光明正大地补一个反向提交，安全撤销，不坑队友。</p></div>' +
            '</div>' +
            '<div class="deck-callout warn">' +
              '所以别死记命令——记住这两个<strong>场景</strong>就够了：' +
              '「重问一遍省 token」用 discard，「已发出去要撤回」用 revert。</div>';
        }
      },

      // ---------- 8. 收尾金句 ----------
      {
        title: '收尾金句',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<div class="c-undo-final">' +
              '<div class="deck-kbd" style="font-size:14px;">本章金句</div>' +
              '<div class="big">言之所以在意<br>得意而忘言</div>' +
              '<p class="deck-lead" style="max-width:640px;">' +
                'AI 时代，你不必背命令本身。你只需记住每个 git 命令的 <strong>效果</strong>——' +
                '把那个效果用人话描述出来，AI 就能帮你实现。</p>' +
              '<div class="deck-grid" style="max-width:720px;width:100%;">' +
                '<div class="deck-card"><p class="deck-p" style="margin:0;">想<strong>回到某个版本</strong> → 说「回退到 <code class="deck-kbd">8f3a1c9</code>」</p></div>' +
                '<div class="deck-card"><p class="deck-p" style="margin:0;">想<strong>撤销一次错误提交</strong> → 说「帮我 revert 掉那次提交」</p></div>' +
                '<div class="deck-card"><p class="deck-p" style="margin:0;">想<strong>比较两版差异</strong> → 说「diff 一下这两个 hash」</p></div>' +
                '<div class="deck-card"><p class="deck-p" style="margin:0;">想<strong>作废这轮改动</strong> → 说「丢弃还没提交的改动」</p></div>' +
              '</div>' +
              '<p class="deck-p" style="color:var(--c-fg-muted);">得意而忘言——抓住效果，忘掉命令。🪄</p>' +
              '<p class="deck-p" style="color:var(--c-fg-muted);">到这里，你已经能在一条时间线上自由穿梭了。' +
                '<b>下一章</b>登场的是 git 最核心、最强的武器——<b style="color:var(--course-accent)">分支</b>，' +
                '它让时间线本身长出好几条。</p>' +
            '</div>';
        }
      }
    ]
  });
})();
