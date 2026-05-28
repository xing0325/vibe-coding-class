(function () {
  // ===== 第3章 本地 vs 远端仓库 =====================================
  // 主题色 #2f81f7（GitHub 蓝）。样式前缀 c-repo-。
  // 框架提供翻页（底部按钮 + 键盘 ←→），本文件只负责每页内容 + 页内互动。

  // 一次性注入本章用到的样式（用 id 去重，避免多次 render 重复插入）
  function injectStyle() {
    if (document.getElementById('c-repo-style')) return;
    var s = document.createElement('style');
    s.id = 'c-repo-style';
    s.textContent = [
      '.c-repo-flow{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap;margin:18px 0;}',
      '.c-repo-node{background:var(--c-bg-soft);border:1px solid var(--c-border);border-radius:14px;padding:16px 18px;text-align:center;min-width:120px;}',
      '.c-repo-node .lbl{font-size:13px;color:var(--c-fg-muted);margin-top:6px;}',
      '.c-repo-node .tag{font-size:11px;color:var(--course-accent);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;}',
      '.c-repo-arrow{display:flex;flex-direction:column;align-items:center;color:var(--course-accent);font-size:12px;font-weight:600;min-width:74px;}',
      '.c-repo-arrow .line{font-size:22px;line-height:1;}',
      '.c-repo-brands{display:flex;gap:14px;flex-wrap:wrap;justify-content:center;margin:20px 0;}',
      '.c-repo-brand{background:var(--c-bg-card);border:1px solid var(--c-border);border-radius:16px;padding:18px 20px;display:flex;flex-direction:column;align-items:center;gap:10px;width:160px;transition:border-color .15s,transform .15s;}',
      '.c-repo-brand.is-hub{border-color:var(--course-accent);box-shadow:0 0 0 1px var(--course-accent);}',
      '.c-repo-brand .name{font-weight:700;font-size:15px;}',
      '.c-repo-brand .note{font-size:12px;color:var(--c-fg-muted);text-align:center;}',
      '.c-repo-hub-btn{margin-top:14px;}',
      '.c-repo-ignore-toggle{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0;}',
      '.c-repo-chip{cursor:pointer;border:1px solid var(--c-border);background:var(--c-bg-soft);color:var(--c-fg);border-radius:999px;padding:7px 13px;font-size:13px;user-select:none;transition:.15s;}',
      '.c-repo-chip.on{background:var(--course-accent-soft);border-color:var(--course-accent);color:var(--c-fg);}',
      '.c-repo-chip .x{color:#f85149;font-weight:700;}',
      '.c-repo-chip.on .x{color:var(--course-accent);}',
      '.c-repo-summary{display:flex;flex-direction:column;gap:10px;margin-top:8px;}',
      '.c-repo-step{display:flex;align-items:center;gap:14px;background:var(--c-bg-card);border:1px solid var(--c-border);border-left:4px solid var(--course-accent);border-radius:12px;padding:14px 16px;}',
      '.c-repo-step .num{flex:none;width:30px;height:30px;border-radius:50%;background:var(--course-accent-soft);color:var(--course-accent);display:flex;align-items:center;justify-content:center;font-weight:700;}',
      '.c-repo-step .txt strong{color:var(--course-accent);}'
    ].join('\n');
    document.head.appendChild(s);
  }

  // 小工具：一台电脑的 SVG
  function svgComputer(size) {
    size = size || 88;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 100 100" fill="none">' +
      '<rect x="12" y="18" width="76" height="50" rx="6" fill="var(--c-bg-card)" stroke="var(--course-accent)" stroke-width="2.5"/>' +
      '<rect x="20" y="26" width="60" height="34" rx="2" fill="var(--course-accent-soft)"/>' +
      '<path d="M34 30h32M34 38h24M34 46h28" stroke="var(--course-accent)" stroke-width="2" stroke-linecap="round" opacity="0.8"/>' +
      '<rect x="38" y="68" width="24" height="8" fill="var(--c-fg-muted)"/>' +
      '<rect x="28" y="76" width="44" height="6" rx="3" fill="var(--c-border)"/>' +
      '</svg>';
  }

  // 小工具：一朵云 SVG
  function svgCloud(size) {
    size = size || 88;
    return '<svg width="' + size + '" height="' + (size * 0.7) + '" viewBox="0 0 120 84" fill="none">' +
      '<path d="M32 70a22 22 0 0 1 2-43.8A26 26 0 0 1 84 30a18 18 0 0 1 4 40z" ' +
      'fill="var(--course-accent-soft)" stroke="var(--course-accent)" stroke-width="2.5"/>' +
      '<path d="M52 44l-8 14h10l-2 12 14-18H56l4-8z" fill="var(--course-accent)"/>' +
      '</svg>';
  }

  // 小工具：GitHub 章鱼猫剪影徽标
  function svgGitHubMark(size, color) {
    size = size || 44;
    color = color || 'var(--c-fg)';
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 16 16" fill="' + color + '">' +
      '<path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 ' +
      '0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 ' +
      '1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 ' +
      '0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 ' +
      '2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 ' +
      '2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 ' +
      '8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>';
  }

  // 小工具：GitLab 狐狸徽标（简化）
  function svgGitLabMark(size) {
    size = size || 44;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" fill="none">' +
      '<path d="M32 58 12 30l5-17 5 17h20l5-17 5 17z" fill="#e2432a"/>' +
      '<path d="M32 58 12 30H2l10 5z" fill="#fc6d26"/>' +
      '<path d="M32 58 52 30h10l-10 5z" fill="#fc6d26"/>' +
      '<path d="M22 30 32 58 12 30z" fill="#fca326" opacity="0.9"/>' +
      '<path d="M42 30 32 58 52 30z" fill="#fca326" opacity="0.9"/>' +
      '</svg>';
  }

  // 小工具：Bitbucket 徽标（简化）
  function svgBitbucketMark(size) {
    size = size || 44;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 64 64" fill="none">' +
      '<path d="M8 12a2 2 0 0 0-2 2.3l7 43a3 3 0 0 0 3 2.7h28a2 2 0 0 0 2-1.7l8-44A2 2 0 0 0 60 12z" fill="#2684ff"/>' +
      '<path d="M38 26H26l2 12h8z" fill="#fff"/>' +
      '</svg>';
  }

  // 小仓库图标（彩色，用于 hub 汇聚视觉）
  function svgMiniRepoColor(color) {
    color = color || 'var(--c-fg-muted)';
    return '<svg width="26" height="26" viewBox="0 0 16 16" fill="' + color + '">' +
      '<path d="M2 2.5A2.5 2.5 0 0 1 4.5 0h8.75a.75.75 0 0 1 .75.75v12.5a.75.75 0 0 1-.75.75H4.5A1 1 0 0 0 4 15h9.25a.75.75 0 0 1 0 1.5H4.5A2.5 2.5 0 0 1 2 14zm10.5-1H4.5a1 1 0 0 0-1 1v9.05A2.5 2.5 0 0 1 4.5 11.5h8z"/>' +
      '</svg>';
  }

  window.registerChapter({
    id: 'repo',
    index: 3,
    emoji: '☁️',
    title: '本地 vs 远端仓库',
    subtitle: 'local → remote → hub',
    theme: '#2f81f7',
    slides: [
      // ---------- 1. 两个名词：local vs remote ----------
      {
        title: '两个仓库，一台在手边，一台在云上',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">先认识两个名词 ☁️</h1>' +
            '<p class="deck-lead">上一章你学会了在本地 commit 存版本。但这些 commit 现在只躺在你电脑里——' +
            'git 世界里，同一个项目其实存在两份：一份在你电脑里，一份在云端。</p>' +
            '<div class="c-repo-flow">' +
              '<div class="c-repo-node">' + svgComputer(86) +
                '<div class="lbl">你的电脑</div>' +
                '<div class="tag">local repository</div>' +
              '</div>' +
              '<div class="c-repo-arrow">' +
                '<span class="line">⟶</span><span>上传 / push</span>' +
              '</div>' +
              '<div class="c-repo-node">' + svgCloud(96) +
                '<div class="lbl">云端服务器</div>' +
                '<div class="tag">remote repository</div>' +
              '</div>' +
            '</div>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">本地仓库 local</h2>' +
                '<p class="deck-p">就在你电脑的项目文件夹里。你写代码、提交版本（commit），全在这儿发生，断网也能干活。</p></div>' +
              '<div class="deck-card"><h2 class="deck-h2">远端仓库 remote</h2>' +
                '<p class="deck-p">放在云端的同一个仓库的"分身"。你把本地的提交 <code class="deck-kbd">push</code> 上去，别人就能看到、能协作。</p></div>' +
            '</div>' +
            '<div class="deck-callout">一句话：<strong>本地是你的工作台，远端是大家共享的存档点。</strong></div>';
        }
      },

      // ---------- 2. GitHub 就是一个远端仓库服务 ----------
      {
        title: 'GitHub 是干啥的',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">GitHub 就是一个「远端仓库」服务</h1>' +
            '<p class="deck-lead">前面说的"云端"听起来很抽象，落到现实里，最常见的那朵云就叫 <strong>GitHub</strong>。</p>' +
            '<p class="deck-p">它帮你托管远端仓库：你只管 push，备份、网页浏览、多人协作它全包了。同类的服务还有 GitLab、Bitbucket——它们干的是同一件事。</p>' +
            '<div class="c-repo-brands">' +
              '<div class="c-repo-brand is-hub">' + svgGitHubMark(46) +
                '<div class="name">GitHub</div>' +
                '<div class="note">最大最热门，本课程主角</div></div>' +
              '<div class="c-repo-brand">' + svgGitLabMark(46) +
                '<div class="name">GitLab</div>' +
                '<div class="note">企业自建的常用选择</div></div>' +
              '<div class="c-repo-brand">' + svgBitbucketMark(46) +
                '<div class="name">Bitbucket</div>' +
                '<div class="note">和 Jira 一家，团队爱用</div></div>' +
            '</div>' +
            '<div class="deck-callout">它们都是"远端仓库托管站"，换一家也照样是 push / pull 那一套。本课程用 GitHub 当例子。</div>';
        }
      },

      // ---------- 3. hub 的含义 + 汇聚动画 ----------
      {
        title: 'Hub 是什么意思',
        render: function (stage, api) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">名字里的 <span style="color:var(--course-accent)">Hub</span>，就是「集散地」</h1>' +
            '<p class="deck-lead">全世界的开发者，把自己电脑里的 git 仓库都上传到这个网站——于是它变成了 git 仓库的【大集合】。</p>' +
            '<p class="deck-p">Git + Hub = GitHub。<strong>hub</strong> 是中枢、集散地的意思（就像机场枢纽 hub）。无数小仓库汇聚到一处，成了全球开发者的中转站。</p>' +
            '<div style="display:flex;justify-content:center;margin:10px 0;">' +
              this._svg() +
            '</div>' +
            '<button class="deck-btn c-repo-hub-btn" id="c-repo-converge">▶ 看仓库们汇聚过来</button>' +
            '<div class="deck-callout">所以 GitHub ≈ "全世界 git 仓库的集合地"。你的项目一旦 push 上去，就成了这个 hub 里的一员。</div>';

          var self = this;
          var btn = stage.querySelector('#c-repo-converge');
          btn.addEventListener('click', function () {
            var dots = stage.querySelectorAll('.c-repo-fly');
            dots.forEach(function (d, i) {
              // 先复位再触发，保证可重复播放
              d.style.transition = 'none';
              d.setAttribute('transform', d.getAttribute('data-from'));
              // 强制 reflow
              void d.getBoundingClientRect();
              setTimeout(function () {
                d.style.transition = 'transform .7s cubic-bezier(.5,0,.2,1),opacity .7s';
                d.setAttribute('transform', 'translate(0,0)');
                d.style.opacity = '0.35';
              }, 60 + i * 70);
            });
            btn.textContent = '↻ 再播一次';
          });
        },
        _svg: function () {
          // 中心 GitHub，周围 8 个小仓库飞向中心
          var W = 460, H = 280, cx = 230, cy = 140;
          var ring = [];
          var positions = [
            [40, 40], [230, 20], [420, 40],
            [20, 140], [440, 140],
            [40, 240], [230, 260], [420, 240]
          ];
          var colors = ['#a371f7', '#3fb950', '#f0883e', '#db61a2', '#56d4dd', '#e3b341', '#ff7b72', '#2f81f7'];
          positions.forEach(function (p, i) {
            var dx = cx - p[0], dy = cy - p[1];
            ring.push(
              '<g class="c-repo-fly" data-from="translate(' + dx + ',' + dy + ')" ' +
              'transform="translate(' + dx + ',' + dy + ')" opacity="0.35" ' +
              'style="--ox:' + p[0] + ';--oy:' + p[1] + '">' +
              '<g transform="translate(' + (p[0] - 13) + ',' + (p[1] - 13) + ')">' + svgMiniRepoColor(colors[i]) + '</g>' +
              '</g>'
            );
          });
          // 连线（从中心到各点）
          var lines = positions.map(function (p) {
            return '<line x1="' + cx + '" y1="' + cy + '" x2="' + p[0] + '" y2="' + p[1] + '" ' +
              'stroke="var(--c-border)" stroke-width="1.5" stroke-dasharray="3 4"/>';
          }).join('');
          return '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' +
            lines + ring.join('') +
            '<circle cx="' + cx + '" cy="' + cy + '" r="36" fill="var(--c-bg-card)" stroke="var(--course-accent)" stroke-width="2.5"/>' +
            '<g transform="translate(' + (cx - 22) + ',' + (cy - 22) + ')">' + svgGitHubMark(44) + '</g>' +
            '</svg>';
        }
      },

      // ---------- 4. git init + 绑定 GitHub ----------
      {
        title: '怎么把文件夹变成 git 仓库',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">把一个普通文件夹「变成」git 仓库</h1>' +
            '<p class="deck-lead">你的项目文件夹，一开始 git 是不认识它的。需要一道初始化手续。</p>' +
            '<div class="deck-grid">' +
              '<div class="deck-card"><h2 class="deck-h2">① 初始化 <code class="deck-kbd">git init</code></h2>' +
                '<p class="deck-p">在项目文件夹里运行这条命令，git 就会偷偷建一个 <code class="deck-kbd">.git</code> 隐藏文件夹——从此这个文件夹就是一个<strong>本地仓库</strong>，开始记录每一次改动。</p>' +
                '<div class="deck-code">cd my-project<br>git init</div></div>' +
              '<div class="deck-card"><h2 class="deck-h2">② 连到 GitHub（远端）</h2>' +
                '<p class="deck-p">再到 GitHub 建一个空仓库，把本地仓库的"远端地址"指过去，之后就能 push 了。</p>' +
                '<div class="deck-code">git remote add origin &lt;你的GitHub仓库地址&gt;</div></div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '<strong>说人话就行：</strong>对 AI（比如 Claude Code）说一句' +
              '「帮我把这个项目初始化成 git 仓库，并连到我的 GitHub」，命令它替你敲——' +
              '你只需要知道这一步在干啥。</div>';
        }
      },

      // ---------- 5. .gitignore ----------
      {
        title: '.gitignore 忽略清单',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1"><code class="deck-kbd">.gitignore</code>：给 git 的「请忽略」小纸条</h1>' +
            '<p class="deck-lead">不是所有东西都该被 git 管理、上传。有些文件你压根不想让它跟着走。</p>' +
            '<p class="deck-p">' +
              '<code class="deck-kbd">.gitignore</code> 就是项目根目录里的一张清单，逐行写下"<strong>不想让 git 管的东西</strong>"。' +
              'git 看到这张纸条，就会自动跳过这些文件——既不追踪，也不上传。</p>' +
            '<h2 class="deck-h2">点一点：哪些东西该被忽略？</h2>' +
            '<div class="c-repo-ignore-toggle" id="c-repo-ig"></div>' +
            '<div class="deck-code" id="c-repo-igfile"># .gitignore</div>' +
            '<div class="deck-callout warn">' +
              '<strong>密钥、密码千万别上传！</strong>把 <code class="deck-kbd">.env</code>、各种 key 写进 .gitignore，' +
              '否则一 push 就公开给全世界看了，这是新手最常见的事故。</div>';

          var items = [
            { name: '.env', why: '存密钥/密码，绝不能公开', danger: true, on: true },
            { name: 'node_modules/', why: '依赖包，几百兆，能重新装回来', on: true },
            { name: '*.log', why: '运行产生的临时日志', on: true },
            { name: 'dist/  build/', why: '编译产物，能从源码再生成', on: true },
            { name: '.DS_Store', why: 'macOS 自动生成的垃圾文件', on: true },
            { name: 'README.md', why: '这个要上传！别忽略它', danger: false, keep: true, on: false }
          ];
          var box = stage.querySelector('#c-repo-ig');
          var file = stage.querySelector('#c-repo-igfile');

          function render() {
            box.innerHTML = items.map(function (it, i) {
              return '<span class="c-repo-chip' + (it.on ? ' on' : '') + '" data-i="' + i + '" title="' + it.why + '">' +
                (it.on ? '✓ ' : '<span class="x">✕</span> ') + it.name + '</span>';
            }).join('');
            var lines = ['# .gitignore'];
            items.forEach(function (it) { if (it.on) lines.push(it.name); });
            if (lines.length === 1) lines.push('(空：什么都没忽略)');
            file.innerHTML = lines.join('<br>');
            box.querySelectorAll('.c-repo-chip').forEach(function (chip) {
              chip.addEventListener('click', function () {
                var i = +chip.getAttribute('data-i');
                items[i].on = !items[i].on;
                render();
              });
            });
          }
          render();
        }
      },

      // ---------- 6. 小结 ----------
      {
        title: '本章小结',
        render: function (stage) {
          injectStyle();
          stage.innerHTML =
            '<h1 class="deck-h1">一条线串起来 🧵</h1>' +
            '<p class="deck-lead">本地写、commit 存、push 上云，别人就看得到——这就是 git + GitHub 的日常循环。</p>' +
            '<div class="c-repo-summary">' +
              '<div class="c-repo-step"><div class="num">1</div><div class="txt">在 <strong>local</strong>（你的电脑）里写代码、改文件。</div></div>' +
              '<div class="c-repo-step"><div class="num">2</div><div class="txt"><strong>commit</strong> 把当前进度存成一个版本快照。</div></div>' +
              '<div class="c-repo-step"><div class="num">3</div><div class="txt"><strong>push</strong> 把这些 commit 上传到 <strong>remote</strong>（GitHub）。</div></div>' +
              '<div class="c-repo-step"><div class="num">4</div><div class="txt">队友能看到、能 <strong>pull</strong> 下来一起协作。</div></div>' +
            '</div>' +
            '<div class="deck-callout">' +
              '<strong>记住这条链：</strong> 写代码 → <code class="deck-kbd">commit</code> 存版本 → ' +
              '<code class="deck-kbd">push</code> 上传到远端(GitHub) → 全世界都能看到 / 一起改。' +
              '下一章我们讲：万一改错了，怎么吃「后悔药」。💊</div>';
        }
      }
    ]
  });
})();
