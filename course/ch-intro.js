(function () {
  'use strict';

  // ============================================================
  // 第1章 · 什么是 Git / GitHub
  // theme: #a371f7  emoji: 🌱
  // 样式前缀: c-intro-
  // ============================================================

  // 复用：一个简洁的内联 git logo（三节点 + 分支连线）
  function gitLogoSVG(size) {
    var s = size || 120;
    return (
      '<svg class="c-intro-gitlogo" viewBox="0 0 120 120" width="' + s + '" height="' + s + '" aria-hidden="true">' +
        '<defs>' +
          '<filter id="c-intro-glow" x="-60%" y="-60%" width="220%" height="220%">' +
            '<feGaussianBlur stdDeviation="3.2" result="b"/>' +
            '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
          '</filter>' +
        '</defs>' +
        '<g filter="url(#c-intro-glow)">' +
          // 主干（略亮）+ 分支线（端点圆润）
          '<line x1="60" y1="92" x2="60" y2="60" stroke="var(--course-accent)" stroke-width="6" stroke-linecap="round"/>' +
          '<line x1="60" y1="60" x2="92" y2="34" stroke="var(--course-accent)" stroke-width="6" stroke-linecap="round" opacity="0.82"/>' +
          // 主干上的点
          '<circle cx="60" cy="92" r="12" fill="var(--course-accent)" stroke="#fff" stroke-width="2.5"/>' +
          '<circle cx="60" cy="60" r="12" fill="var(--course-accent)" stroke="#fff" stroke-width="2.5"/>' +
          // 分支出去的点
          '<circle cx="92" cy="34" r="12" fill="var(--course-accent)" stroke="#fff" stroke-width="2.5"/>' +
        '</g>' +
      '</svg>'
    );
  }

  window.registerChapter({
    id: 'intro',
    index: 1,
    emoji: '🌱',
    title: '什么是 Git',
    subtitle: 'GitHub = Git + Hub',
    theme: '#a371f7',
    slides: [

      // ---------- Slide 1：开场，拆字 GitHub = Git + Hub ----------
      {
        title: '先拆个字',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<p class="deck-lead">你天天听人说 <b>GitHub</b>，但它其实是俩词拼起来的 👇</p>' +
              '<div class="c-intro-merge" id="c-intro-merge">' +
                '<span class="c-intro-word" id="c-intro-git">Git</span>' +
                '<span class="c-intro-plus" id="c-intro-plus">+</span>' +
                '<span class="c-intro-word" id="c-intro-hub">Hub</span>' +
              '</div>' +
              '<button class="deck-btn" id="c-intro-mergebtn">👆 点一下，把它们拼起来</button>' +
              '<p class="deck-p c-intro-hint" id="c-intro-hint" style="visibility:hidden">' +
                '<b>Hub</b> 是"中心 / 集散地"——一个把大家的代码放在一起、能互相分享的网站。<br>' +
                '所以这一章我们先搞懂前半截：<b style="color:var(--course-accent)">Git</b> 到底是啥。' +
              '</p>' +
            '</div>' +
            '<style>' +
            '.c-intro-merge{display:flex;align-items:center;justify-content:center;gap:18px;margin:34px 0;font-size:64px;font-weight:800;letter-spacing:1px;}' +
            '.c-intro-word{padding:14px 26px;border-radius:18px;background:var(--c-bg-soft);border:2px solid var(--c-border);transition:all .55s cubic-bezier(.34,1.56,.64,1);}' +
            '#c-intro-git{color:var(--course-accent);}' +
            '#c-intro-hub{color:var(--c-fg);}' +
            '.c-intro-plus{font-size:42px;color:var(--c-fg-muted);transition:all .4s ease;}' +
            '.c-intro-merge.merged{gap:0;}' +
            '.c-intro-merge.merged .c-intro-plus{opacity:0;transform:scale(0);width:0;}' +
            '.c-intro-merge.merged #c-intro-git{border-top-right-radius:0;border-bottom-right-radius:0;border-right:none;transform:translateX(8px);}' +
            '.c-intro-merge.merged #c-intro-hub{border-top-left-radius:0;border-bottom-left-radius:0;border-left:none;transform:translateX(-8px);}' +
            '.c-intro-merge.merged .c-intro-word{box-shadow:0 0 26px var(--course-accent-soft);}' +
            '.c-intro-hint{transition:opacity .4s ease;}' +
            '</style>';

          var box = stage.querySelector('#c-intro-merge');
          var hint = stage.querySelector('#c-intro-hint');
          var btn = stage.querySelector('#c-intro-mergebtn');
          var merged = false;
          function toggle() {
            merged = !merged;
            box.classList.toggle('merged', merged);
            hint.style.visibility = merged ? 'visible' : 'hidden';
            btn.textContent = merged ? '🔁 再拆开看看' : '👆 点一下，把它们拼起来';
          }
          btn.addEventListener('click', toggle);
          box.addEventListener('click', toggle);
        }
      },

      // ---------- Slide 2：那 Git 是什么？亮出 git logo + 揭晓定义 ----------
      {
        title: '那 Git 是什么？',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<p class="deck-lead">把 GitHub 拆出来的前半截——<b style="color:var(--course-accent)">Git</b>，它本身是一个<b>软件</b> 👇</p>' +
              '<div class="c-intro-reveal" id="c-intro-reveal">' +
                gitLogoSVG(150) +
              '</div>' +
              '<button class="deck-btn" id="c-intro-revealbtn">✨ 揭晓答案</button>' +
              '<div class="deck-callout c-intro-def" id="c-intro-def" style="display:none">' +
                '<div class="deck-h2" style="margin:0 0 6px">Git = 版本控制软件</div>' +
                '<p class="deck-p" style="margin:0">一个帮你<b>记录和管理"一份东西的不同版本"</b>的工具。' +
                '下一页我们用你最熟的场景来解释什么叫"版本控制"。</p>' +
              '</div>' +
            '</div>' +
            '<style>' +
            '.c-intro-reveal{margin:28px auto 8px;display:flex;justify-content:center;}' +
            '.c-intro-gitlogo{filter:drop-shadow(0 0 20px var(--course-accent-soft));animation:c-intro-float 3s ease-in-out infinite;}' +
            '@keyframes c-intro-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}' +
            '.c-intro-def{max-width:560px;margin:22px auto 0;text-align:left;animation:c-intro-pop .45s cubic-bezier(.34,1.56,.64,1);}' +
            '@keyframes c-intro-pop{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}' +
            '</style>';

          var btn = stage.querySelector('#c-intro-revealbtn');
          var def = stage.querySelector('#c-intro-def');
          btn.addEventListener('click', function () {
            def.style.display = 'block';
            btn.style.display = 'none';
          });
        }
      },

      // ---------- Slide 3：什么是"版本控制"？写推文类比 ----------
      {
        title: '什么是"版本控制"？',
        render: function (stage, api) {
          var versions = [
            { name: '第一版', emoji: '📄' },
            { name: '第二版', emoji: '📄' },
            { name: '第三版', emoji: '📄' },
            { name: '定稿版', emoji: '📝' },
            { name: '最终版', emoji: '✅' },
            { name: '打死不改最终版', emoji: '🔒' }
          ];
          var cards = versions.map(function (v, i) {
            return (
              '<div class="c-intro-file" style="animation-delay:' + (i * 90) + 'ms">' +
                '<div class="c-intro-file-ico">' + v.emoji + '</div>' +
                '<div class="c-intro-file-name">' + v.name + '</div>' +
                '<div class="c-intro-file-num">v' + (i + 1) + '</div>' +
              '</div>'
            );
          }).join('<span class="c-intro-arrow">→</span>');

          stage.innerHTML =
            '<h2 class="deck-h2">想象你在给线下活动写推文 📣</h2>' +
            '<p class="deck-lead">同一篇推文，你会存好多个版本，越改越多：</p>' +
            '<div class="c-intro-files">' + cards + '</div>' +
            '<div class="deck-callout warn" style="margin-top:26px">' +
              '<b>为什么要小心保存每一个历史版本？</b><br>' +
              '因为有时候你会想<b>反悔</b>——"最终版"删掉的那段文案，其实"第三版"里写得更好。' +
              '只要历史版本都还在，你随时能<b>翻回去</b>，找回被删掉的段落。' +
            '</div>' +
            '<style>' +
            '.c-intro-files{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;margin:26px 0;}' +
            '.c-intro-file{display:flex;flex-direction:column;align-items:center;gap:4px;background:rgba(255,255,255,0.04);border:1px solid var(--c-border);border-radius:12px;padding:12px 14px;min-width:78px;transition:border-color .2s,box-shadow .2s,transform .2s;animation:c-intro-rise .5s both cubic-bezier(.34,1.56,.64,1);}' +
            '.c-intro-file:hover{border-color:color-mix(in srgb,var(--course-accent) 55%,var(--c-border));box-shadow:0 0 18px var(--course-accent-soft);transform:translateY(-2px);}' +
            '.c-intro-file-ico{font-size:30px;line-height:1;}' +
            '.c-intro-file-name{font-size:12px;color:var(--c-fg);white-space:nowrap;}' +
            '.c-intro-file-num{font-size:11px;color:var(--course-accent);font-weight:700;font-family:var(--font-mono,ui-monospace,monospace);letter-spacing:0.04em;}' +
            '.c-intro-arrow{color:color-mix(in srgb,var(--course-accent) 70%,var(--c-fg-muted));font-size:20px;}' +
            '@keyframes c-intro-rise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}' +
            '</style>';
        }
      },

      // ---------- Slide 4：这就是最原始的版本控制（一个人 + 纯人工） ----------
      {
        title: '其实你早就在做版本控制了',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<div class="c-intro-bigemoji">🙋‍♂️📄📄📄</div>' +
              '<h2 class="deck-h2">恭喜，这就是<span style="color:var(--course-accent)">最原始的版本控制</span></h2>' +
              '<p class="deck-lead">"留着每个历史版本、需要时翻回去"——你存推文的方式，本质上就是在做版本控制。</p>' +
              '<div class="deck-grid c-intro-2col">' +
                '<div class="deck-card">' +
                  '<div class="c-intro-card-h">👤 但它只有一个人</div>' +
                  '<p class="deck-p" style="margin:0">从头到尾都是你自己在改、自己在记。</p>' +
                '</div>' +
                '<div class="deck-card">' +
                  '<div class="c-intro-card-h">✋ 而且全靠纯人工</div>' +
                  '<p class="deck-p" style="margin:0">手动另存为、手动起名字、手动记得哪个是哪个。</p>' +
                '</div>' +
              '</div>' +
              '<p class="deck-p c-intro-foreshadow">一个人 + 手动，还撑得住。<br>但下一页，场面要失控了 👀</p>' +
            '</div>' +
            '<style>' +
            '.c-intro-bigemoji{font-size:54px;margin:6px 0 14px;letter-spacing:2px;}' +
            '.c-intro-2col{grid-template-columns:1fr 1fr;max-width:620px;margin:24px auto 0;}' +
            '.c-intro-card-h{font-weight:700;color:var(--c-fg);margin-bottom:6px;}' +
            '.c-intro-foreshadow{margin-top:22px;color:var(--c-fg-muted);}' +
            '</style>';
        }
      },

      // ---------- Slide 5：十个人同时编辑 → 混乱 ----------
      {
        title: '换个场景：十个人一起改',
        render: function (stage, api) {
          // 一团乱麻的 SVG：中间一个文件夹，四周一堆乱飞、互相打架的版本箭头
          var mess =
            '<svg class="c-intro-chaos" viewBox="0 0 520 300" width="100%" aria-hidden="true">' +
              '<defs>' +
                '<marker id="c-intro-ah" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">' +
                  '<path d="M0,0 L8,4 L0,8 Z" fill="#f85149"/>' +
                '</marker>' +
                '<filter id="c-intro-folderglow" x="-80%" y="-80%" width="260%" height="260%">' +
                  '<feGaussianBlur stdDeviation="4" result="b"/>' +
                  '<feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>' +
                '</filter>' +
              '</defs>' +
              // 中间被抢的文件夹（发光中枢）
              '<g filter="url(#c-intro-folderglow)">' +
                '<rect x="216" y="120" width="88" height="62" rx="12" fill="rgba(255,255,255,0.04)" stroke="var(--course-accent)" stroke-width="2.5"/>' +
                '<text x="260" y="156" text-anchor="middle" font-size="30">📁</text>' +
              '</g>' +
              // 十团乱飞的小版本块 + 互相冲突的红箭头
              '<g class="c-intro-chaos-tags" font-size="11" fill="#d6e0f0">' +
                '<g><rect x="20"  y="20"  width="64" height="26" rx="8" fill="rgba(255,255,255,0.04)" stroke="var(--c-border)"/><text x="52"  y="37" text-anchor="middle">小A_v3</text></g>' +
                '<g><rect x="430" y="18"  width="70" height="26" rx="8" fill="rgba(255,255,255,0.04)" stroke="var(--c-border)"/><text x="465" y="35" text-anchor="middle">小B_最终</text></g>' +
                '<g><rect x="8"   y="150" width="78" height="26" rx="8" fill="rgba(255,255,255,0.04)" stroke="var(--c-border)"/><text x="47"  y="167" text-anchor="middle">小C_改改改</text></g>' +
                '<g><rect x="430" y="150" width="78" height="26" rx="8" fill="rgba(255,255,255,0.04)" stroke="var(--c-border)"/><text x="469" y="167" text-anchor="middle">小D_新版本</text></g>' +
                '<g><rect x="30"  y="262" width="72" height="26" rx="8" fill="rgba(255,255,255,0.04)" stroke="var(--c-border)"/><text x="66"  y="279" text-anchor="middle">小E_别动</text></g>' +
                '<g><rect x="420" y="262" width="90" height="26" rx="8" fill="rgba(255,255,255,0.04)" stroke="var(--c-border)"/><text x="465" y="279" text-anchor="middle">小F_这才是对的</text></g>' +
              '</g>' +
              // 乱成一团、互相打架的箭头（端点圆润）
              '<g stroke="#f85149" stroke-width="2.5" fill="none" opacity="0.9" stroke-linecap="round" marker-end="url(#c-intro-ah)">' +
                '<path d="M84,40 C150,70 180,110 214,128"/>' +
                '<path d="M455,44 C400,80 340,110 306,130"/>' +
                '<path d="M86,160 C140,150 180,150 214,151"/>' +
                '<path d="M430,162 C370,158 330,154 306,152"/>' +
                '<path d="M70,262 C120,230 180,200 220,180"/>' +
                '<path d="M450,262 C400,230 340,200 302,180"/>' +
                // 互相打架（块和块之间）
                '<path d="M88,33 C220,10 360,10 432,28" stroke-dasharray="5 4"/>' +
                '<path d="M86,150 C200,250 320,250 420,168" stroke-dasharray="5 4"/>' +
              '</g>' +
            '</svg>';

          stage.innerHTML =
            '<h2 class="deck-h2">现在：<span style="color:#f85149">十个人</span>同时改同一个文件夹 😱</h2>' +
            '<p class="deck-lead">这个文件夹里有好多篇文章，十个人各改各的，还都想存成"最终版"——</p>' +
            mess +
            '<div class="deck-callout warn">' +
              '版本控制<b>瞬间变得极其困难</b>：人脑根本记不住哪个版本是哪个、' +
              '谁动了哪一篇、谁的改动覆盖了谁。文件名后面挂一串 <span class="deck-kbd">_最终_真的最终_这次真的</span> 也救不了你。' +
            '</div>' +
            '<style>' +
            '.c-intro-chaos{display:block;margin:14px auto;max-width:560px;}' +
            '.c-intro-chaos .c-intro-chaos-tags text{font-family:var(--font-mono);}' +
            '.c-intro-chaos path[stroke="#f85149"]{animation:c-intro-shake 1.6s ease-in-out infinite;}' +
            '@keyframes c-intro-shake{0%,100%{opacity:.55}50%{opacity:1}}' +
            '</style>';
        }
      },

      // ---------- Slide 6：Git 应运而生 ----------
      {
        title: 'Git 登场',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<div class="c-intro-hero">' + gitLogoSVG(130) + '</div>' +
              '<h1 class="deck-h1">于是 <span style="color:var(--course-accent)">Git</span> 应运而生</h1>' +
              '<p class="deck-lead">它就是为了解决"多人 + 大量版本"这种乱局而诞生的。</p>' +
              '<div class="deck-callout">' +
                '<p class="deck-p" style="margin:0">Git 是<b>世界上最多人使用的版本控制系统</b>。' +
                '它会自动帮你记住：每个版本是什么、谁改的、什么时候改的、和上一版差在哪——' +
                '再也不用靠人脑硬记，也不用靠文件名瞎猜。</p>' +
              '</div>' +
              '<div class="deck-grid c-intro-3col">' +
                '<div class="deck-card"><div class="c-intro-stat">🗂️</div><div class="c-intro-statlabel">自动记录每个版本</div></div>' +
                '<div class="deck-card"><div class="c-intro-stat">👥</div><div class="c-intro-statlabel">多人一起改不打架</div></div>' +
                '<div class="deck-card"><div class="c-intro-stat">⏪</div><div class="c-intro-statlabel">随时回到任意历史</div></div>' +
              '</div>' +
            '</div>' +
            '<style>' +
            '.c-intro-hero{display:flex;justify-content:center;margin:4px 0 10px;}' +
            '.c-intro-3col{grid-template-columns:repeat(3,1fr);max-width:620px;margin:22px auto 0;}' +
            '.c-intro-3col .deck-card{text-align:center;}' +
            '.c-intro-stat{font-size:32px;line-height:1;margin-bottom:6px;}' +
            '.c-intro-statlabel{font-size:13px;color:var(--c-fg-muted);}' +
            '</style>';
        }
      },

      // ---------- Slide 7：文件夹 → git 仓库（repository）变身 ----------
      {
        title: '收尾：什么是仓库',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h2 class="deck-h2">最后记住一个词：<span style="color:var(--course-accent)">仓库 (repository)</span></h2>' +
              '<p class="deck-lead">当一个普通文件夹被 Git "接管"，它就升级成了一个 <b>git 仓库</b>。点一下看变身 👇</p>' +
              '<div class="c-intro-transform" id="c-intro-transform">' +
                '<div class="c-intro-folder" id="c-intro-folder">' +
                  '<div class="c-intro-folder-ico" id="c-intro-folder-ico">📁</div>' +
                  '<div class="c-intro-folder-label" id="c-intro-folder-label">普通文件夹</div>' +
                  '<div class="c-intro-badge" id="c-intro-badge">.git ✓</div>' +
                '</div>' +
              '</div>' +
              '<button class="deck-btn" id="c-intro-transbtn">⚡ 用 Git 接管它</button>' +
              '<div class="deck-callout c-intro-repo-note" id="c-intro-repo-note" style="display:none">' +
                '从此这个文件夹里的每一次改动，Git 都会默默记账。<br>' +
                '你在 <b>GitHub</b>（还记得吗？Git + <b>Hub</b>）上看到的每一个项目，就是一个个这样的<b>仓库</b>。' +
                '<br><span style="color:var(--c-fg-muted)">下一章我们就来看：Git 记账的最小单位——<b style="color:var(--course-accent)">commit</b>。</span>' +
              '</div>' +
            '</div>' +
            '<style>' +
            '.c-intro-transform{margin:30px auto 16px;display:flex;justify-content:center;}' +
            '.c-intro-folder{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding:26px 38px;border-radius:18px;background:rgba(255,255,255,0.04);border:2px solid var(--c-border);transition:all .5s cubic-bezier(.34,1.56,.64,1);}' +
            '.c-intro-folder-ico{font-size:60px;line-height:1;transition:transform .5s ease;}' +
            '.c-intro-folder-label{font-size:14px;color:var(--c-fg-muted);font-weight:600;}' +
            '.c-intro-badge{position:absolute;top:-12px;right:-12px;background:var(--course-accent-soft);color:var(--course-accent);border:1px solid var(--course-accent);font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;font-family:var(--font-mono,ui-monospace,monospace);box-shadow:0 0 14px var(--course-accent-soft);opacity:0;transform:scale(0);transition:all .45s cubic-bezier(.34,1.56,.64,1);}' +
            '.c-intro-transform.on .c-intro-folder{border-color:var(--course-accent);box-shadow:0 0 28px var(--course-accent-soft);}' +
            '.c-intro-transform.on .c-intro-folder-ico{transform:scale(1.08) rotate(-4deg);}' +
            '.c-intro-transform.on .c-intro-badge{opacity:1;transform:scale(1);}' +
            '.c-intro-repo-note{max-width:560px;margin:20px auto 0;text-align:left;}' +
            '</style>';

          var wrap = stage.querySelector('#c-intro-transform');
          var label = stage.querySelector('#c-intro-folder-label');
          var ico = stage.querySelector('#c-intro-folder-ico');
          var note = stage.querySelector('#c-intro-repo-note');
          var btn = stage.querySelector('#c-intro-transbtn');
          var done = false;
          btn.addEventListener('click', function () {
            done = !done;
            wrap.classList.toggle('on', done);
            if (done) {
              label.textContent = 'git 仓库 (repo)';
              ico.textContent = '🗃️';
              note.style.display = 'block';
              btn.textContent = '↩️ 还原成普通文件夹';
            } else {
              label.textContent = '普通文件夹';
              ico.textContent = '📁';
              note.style.display = 'none';
              btn.textContent = '⚡ 用 Git 接管它';
            }
          });
        }
      }

    ]
  });
})();
