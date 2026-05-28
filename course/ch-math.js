(function () {
  'use strict';

  // ============================================================
  // 第7章 · Git 的数学之美
  // theme: #e3b341  emoji: ✨
  // 样式前缀: c-math-
  // 全程纯内联 SVG + vanilla JS，无外部资源、不做翻页 UI
  // ============================================================

  // ------------------------------------------------------------
  // 一个稳定的"伪哈希"函数（用于演示，不是真 SHA-1，但雪崩效应明显）。
  // 用 FNV-1a 思路滚动出一个 32-bit 数，再扩成定长十六进制串。
  // 同样输入 → 同样输出；改一个字 → 整串面目全非。
  // ------------------------------------------------------------
  function pseudoHash(input, len) {
    len = len || 16;
    input = String(input);
    var out = '';
    // 用不同盐 + 多轮混合，凑够 len 位十六进制，保证雪崩
    for (var seg = 0; seg < Math.ceil(len / 8); seg++) {
      var h = (0x811c9dc5 ^ (seg * 0x9e3779b1)) >>> 0;
      for (var i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
        h = (h ^ (h >>> 15)) >>> 0;
        h = (h + ((i + 1) * (seg + 7))) >>> 0;
      }
      // 再多搅几轮，让长输入也充分扩散
      h = Math.imul(h ^ (h >>> 13), 0x85ebca6b) >>> 0;
      h = Math.imul(h ^ (h >>> 16), 0xc2b2ae35) >>> 0;
      h = (h ^ (h >>> 16)) >>> 0;
      out += ('00000000' + h.toString(16)).slice(-8);
    }
    return out.slice(0, len);
  }

  // 把两个十六进制串逐字符比较，不同的字符包成红色 span（雪崩可视化）
  function diffHashHTML(prev, now) {
    var html = '';
    for (var i = 0; i < now.length; i++) {
      var ch = now.charAt(i);
      if (prev && prev.charAt(i) === ch) {
        html += '<span class="c-math-h-same">' + ch + '</span>';
      } else {
        html += '<span class="c-math-h-diff">' + ch + '</span>';
      }
    }
    return html;
  }

  // 复用：金黄色箭头 marker 定义（SVG defs）+ 节点发光滤镜 + 数据流光效
  // 同一个 id 既给 marker 用，也派生出 <id>-glow / <id>-grad / <id>-flow 供节点引用。
  function arrowDefs(id, color) {
    color = color || 'var(--course-accent)';
    return (
      '<defs>' +
        '<marker id="' + id + '" markerWidth="11" markerHeight="11" refX="8" refY="5" orient="auto">' +
          '<path d="M1,1 L9.5,5 L1,9 L3,5 Z" fill="' + color + '" stroke="' + color + '" stroke-width="0.6" stroke-linejoin="round"/>' +
        '</marker>' +
        // 节点柔和发光
        '<filter id="' + id + '-glow" x="-60%" y="-60%" width="220%" height="220%">' +
          '<feDropShadow dx="0" dy="0" stdDeviation="3.4" flood-color="' + color + '" flood-opacity="0.85"/>' +
        '</filter>' +
        // 数据块渐变填充（深空底 → 主题色微光）
        '<linearGradient id="' + id + '-grad" x1="0" y1="0" x2="0" y2="1">' +
          '<stop offset="0%" stop-color="' + color + '" stop-opacity="0.22"/>' +
          '<stop offset="100%" stop-color="' + color + '" stop-opacity="0.06"/>' +
        '</linearGradient>' +
        // 连线上流动的高光（数据流）
        '<linearGradient id="' + id + '-flow" x1="0" y1="0" x2="1" y2="0">' +
          '<stop offset="0%" stop-color="' + color + '" stop-opacity="0"/>' +
          '<stop offset="50%" stop-color="#fff" stop-opacity="0.9"/>' +
          '<stop offset="100%" stop-color="' + color + '" stop-opacity="0"/>' +
        '</linearGradient>' +
      '</defs>'
    );
  }

  window.registerChapter({
    id: 'math',
    index: 7,
    emoji: '✨',
    title: 'Git 的数学之美',
    subtitle: '哈希、默克尔树与不可篡改',
    theme: '#e3b341',
    slides: [

      // ========================================================
      // Slide 1 · 开场钩子：为什么历史改不动？
      // ========================================================
      {
        title: '一个细思极恐的问题',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center c-math-hook">' +
              '<div class="c-math-hook-orb"><div class="c-math-hook-ico">🏔️</div></div>' +
              '<h1 class="deck-h1">为什么 git 的历史<br><span style="color:var(--course-accent)">几乎没法偷偷篡改</span>？</h1>' +
              '<p class="deck-lead">你有没有想过这件怪事——</p>' +
              '<div class="deck-callout c-math-hook-call">' +
                '只要你<b>偷改了一个远古的 commit</b>，' +
                '它后面的<b>每一个 commit 都会跟着"塌方"</b>，' +
                '整条历史瞬间露馅。<br>' +
                '<span style="color:var(--c-fg-muted)">没有管理员、没有警察，纯靠……数学。</span>' +
              '</div>' +
              '<p class="deck-p c-math-hook-foot">' +
                '前面六章你学的是<b>怎么用</b> git。<br>' +
                '这一章我们掀开盖子，看看它的<b style="color:var(--course-accent)">骨架</b>——' +
                '一套优雅到会让人"哇"的数学设计。' +
              '</p>' +
            '</div>' +
            '<style>' +
            '.c-math-hook{position:relative;}' +
            '.c-math-hook-orb{position:relative;width:120px;height:120px;margin:6px auto 12px;display:flex;align-items:center;justify-content:center;}' +
            '.c-math-hook-orb::before{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--course-accent) 38%,transparent),transparent 70%);filter:blur(4px);animation:c-math-breathe 4s ease-in-out infinite;}' +
            '.c-math-hook-orb::after{content:"";position:absolute;inset:14px;border-radius:50%;border:1px solid color-mix(in srgb,var(--course-accent) 45%,transparent);box-shadow:0 0 24px color-mix(in srgb,var(--course-accent) 35%,transparent),inset 0 0 18px color-mix(in srgb,var(--course-accent) 18%,transparent);}' +
            '@keyframes c-math-breathe{0%,100%{opacity:.5;transform:scale(.92)}50%{opacity:.9;transform:scale(1.06)}}' +
            '.c-math-hook-ico{position:relative;z-index:1;font-size:56px;line-height:1;filter:drop-shadow(0 0 10px color-mix(in srgb,var(--course-accent) 60%,transparent));animation:c-math-float 3.4s ease-in-out infinite;}' +
            '@keyframes c-math-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}' +
            '.c-math-hook-call{max-width:600px;margin:22px auto;text-align:left;}' +
            '.c-math-hook-foot{margin-top:20px;color:var(--c-fg-muted);}' +
            '</style>';
        }
      },

      // ========================================================
      // Slide 2 · 哈希函数 + 雪崩效应互动演示
      // ========================================================
      {
        title: '第一块积木：哈希',
        render: function (stage, api) {
          stage.innerHTML =
            '<h2 class="deck-h2">第一块积木：<span style="color:var(--course-accent)">哈希 (hash)</span></h2>' +
            '<p class="deck-lead">想象一台机器：你往里塞<b>任意内容</b>（一个字、一篇小说、一整个文件夹），' +
            '它只吐出一串<b>固定长度的十六进制"指纹"</b>。</p>' +

            // 机器示意 SVG
            '<svg class="c-math-machine" viewBox="0 0 560 110" width="100%" aria-hidden="true">' +
              arrowDefs('c-math-mk1') +
              '<rect x="14" y="34" width="150" height="42" rx="9" fill="var(--c-bg-soft)" stroke="var(--c-border)" stroke-width="1.5"/>' +
              '<text x="89" y="60" text-anchor="middle" fill="var(--c-fg-muted)" font-size="13">任意内容</text>' +
              '<line x1="168" y1="55" x2="214" y2="55" stroke="var(--course-accent)" stroke-width="2.8" stroke-linecap="round" marker-end="url(#c-math-mk1)"/>' +
              '<rect x="220" y="20" width="120" height="70" rx="14" fill="url(#c-math-mk1-grad)" stroke="var(--course-accent)" stroke-width="2.2" filter="url(#c-math-mk1-glow)"/>' +
              '<text x="280" y="50" text-anchor="middle" font-size="26" class="c-math-gear">⚙️</text>' +
              '<text x="280" y="74" text-anchor="middle" fill="var(--course-accent)" font-size="12" font-weight="700">哈希函数</text>' +
              '<line x1="344" y1="55" x2="390" y2="55" stroke="var(--course-accent)" stroke-width="2.8" stroke-linecap="round" marker-end="url(#c-math-mk1)"/>' +
              '<rect x="396" y="34" width="150" height="42" rx="9" fill="url(#c-math-mk1-grad)" stroke="var(--course-accent)" stroke-width="1.8" filter="url(#c-math-mk1-glow)"/>' +
              '<text x="471" y="60" text-anchor="middle" fill="var(--course-accent)" font-size="13" font-family="ui-monospace,monospace">固定长度指纹</text>' +
            '</svg>' +

            '<div class="deck-grid c-math-3col">' +
              '<div class="deck-card"><div class="c-math-prop">🎯</div><div class="c-math-prop-t">输入相同<br>指纹永远相同</div></div>' +
              '<div class="deck-card"><div class="c-math-prop">💥</div><div class="c-math-prop-t">改一个字<br>整串面目全非</div></div>' +
              '<div class="deck-card"><div class="c-math-prop">🚫</div><div class="c-math-prop-t">几乎不可能<br>两个内容撞同一串</div></div>' +
            '</div>' +

            // 互动：实时伪哈希 + 雪崩高亮
            '<div class="c-math-demo">' +
              '<div class="c-math-demo-h">🧪 亲手试试"雪崩效应"——在下面打字，盯着指纹看：</div>' +
              '<input id="c-math-hashin" class="c-math-input" type="text" maxlength="48" ' +
                'value="hello git" placeholder="随便打点字…" autocomplete="off" spellcheck="false"/>' +
              '<div class="c-math-hashout-wrap">' +
                '<span class="c-math-hashlabel">指纹 →</span>' +
                '<code class="c-math-hashout" id="c-math-hashout"></code>' +
              '</div>' +
              '<div class="c-math-tip" id="c-math-hashtip">试试在末尾加一个字，或把一个字母改成大写——红色的就是刚刚变掉的位。</div>' +
            '</div>' +

            '<p class="deck-p c-math-real">真实的 git 用 <span class="deck-kbd">SHA-1</span>（新版仓库用 <span class="deck-kbd">SHA-256</span>）。' +
            '上面这个是给你看效果的简化版，但<b>雪崩</b>的脾气一模一样。</p>' +

            '<style>' +
            '.c-math-machine{display:block;margin:18px auto 6px;max-width:560px;}' +
            '.c-math-gear{transform-box:fill-box;transform-origin:center;animation:c-math-spin 8s linear infinite;}' +
            '@keyframes c-math-spin{to{transform:rotate(360deg)}}' +
            '.c-math-3col{grid-template-columns:repeat(3,1fr);max-width:620px;margin:16px auto;}' +
            '.c-math-3col .deck-card{text-align:center;padding:14px 10px;}' +
            '.c-math-prop{font-size:28px;line-height:1;margin-bottom:6px;filter:drop-shadow(0 0 6px color-mix(in srgb,var(--course-accent) 45%,transparent));}' +
            '.c-math-prop-t{font-size:12.5px;color:var(--c-fg-muted);line-height:1.4;}' +
            '.c-math-demo{position:relative;max-width:600px;margin:22px auto 6px;background:linear-gradient(160deg,var(--c-bg-card),color-mix(in srgb,var(--c-bg-card) 72%,#000));border:1px solid color-mix(in srgb,var(--course-accent) 28%,var(--c-border));border-radius:16px;padding:18px 20px;box-shadow:0 0 34px color-mix(in srgb,var(--course-accent) 10%,transparent),inset 0 0 40px rgba(0,0,0,.3);}' +
            '.c-math-demo-h{font-size:14px;color:var(--c-fg);margin-bottom:12px;}' +
            '.c-math-input{width:100%;box-sizing:border-box;font-size:16px;padding:11px 14px;border-radius:10px;background:#05070c;border:2px solid var(--c-border);color:var(--c-fg);outline:none;font-family:ui-monospace,monospace;transition:border-color .2s,box-shadow .2s;}' +
            '.c-math-input:focus{border-color:var(--course-accent);box-shadow:0 0 0 3px var(--course-accent-soft),0 0 18px color-mix(in srgb,var(--course-accent) 25%,transparent);}' +
            '.c-math-hashout-wrap{display:flex;align-items:center;gap:10px;margin-top:14px;flex-wrap:wrap;padding:12px 14px;background:#05070c;border:1px solid var(--c-border);border-radius:10px;}' +
            '.c-math-hashlabel{font-size:13px;color:var(--c-fg-muted);font-weight:700;white-space:nowrap;}' +
            '.c-math-hashout{font-family:ui-monospace,SFMono-Regular,monospace;font-size:21px;letter-spacing:2px;word-break:break-all;}' +
            '.c-math-h-same{color:color-mix(in srgb,var(--course-accent) 55%,var(--c-fg-muted));text-shadow:0 0 6px color-mix(in srgb,var(--course-accent) 22%,transparent);transition:color .3s;}' +
            '.c-math-h-diff{color:#0d1117;background:var(--course-accent);border-radius:3px;padding:0 2px;font-weight:700;box-shadow:0 0 10px var(--course-accent),0 0 20px color-mix(in srgb,var(--course-accent) 60%,transparent);animation:c-math-flash .55s ease;}' +
            '@keyframes c-math-flash{0%{transform:scale(1.6);box-shadow:0 0 18px var(--course-accent),0 0 32px var(--course-accent)}100%{transform:scale(1)}}' +
            '.c-math-tip{font-size:12px;color:var(--c-fg-muted);margin-top:12px;line-height:1.5;}' +
            '.c-math-real{max-width:600px;margin:14px auto 0;text-align:center;color:var(--c-fg-muted);}' +
            '</style>';

          var input = stage.querySelector('#c-math-hashin');
          var out = stage.querySelector('#c-math-hashout');
          var prev = '';
          function update() {
            var now = pseudoHash(input.value, 16);
            out.innerHTML = diffHashHTML(prev, now);
            prev = now;
          }
          input.addEventListener('input', update);
          // 首屏先无 diff 渲染一次
          out.innerHTML = diffHashHTML('', pseudoHash(input.value, 16));
          prev = pseudoHash(input.value, 16);
        }
      },

      // ========================================================
      // Slide 3 · 内容寻址 content-addressable
      // ========================================================
      {
        title: '用内容给内容起名字',
        render: function (stage, api) {
          stage.innerHTML =
            '<h2 class="deck-h2">第二块积木：<span style="color:var(--course-accent)">内容寻址</span></h2>' +
            '<p class="deck-lead">git 玩了个特别聪明的花招——' +
            '它<b>不让你给文件起名当地址</b>，而是<b>用"内容本身的哈希"当地址</b>。' +
            '你存什么内容，它的"门牌号"就是这内容的指纹。</p>' +

            '<svg class="c-math-addr" viewBox="0 0 560 150" width="100%" aria-hidden="true">' +
              arrowDefs('c-math-mk2') +
              '<rect x="20" y="20" width="170" height="46" rx="11" fill="var(--c-bg-soft)" stroke="var(--c-border)" stroke-width="1.5"/>' +
              '<text x="105" y="40" text-anchor="middle" fill="var(--c-fg)" font-size="13">内容："hi"</text>' +
              '<text x="105" y="57" text-anchor="middle" fill="var(--c-fg-muted)" font-size="11">放进仓库</text>' +
              '<line x1="194" y1="43" x2="248" y2="43" stroke="var(--course-accent)" stroke-width="2.8" stroke-linecap="round" marker-end="url(#c-math-mk2)"/>' +
              '<rect x="254" y="20" width="286" height="46" rx="11" fill="url(#c-math-mk2-grad)" stroke="var(--course-accent)" stroke-width="1.8" filter="url(#c-math-mk2-glow)"/>' +
              '<text x="397" y="48" text-anchor="middle" fill="var(--course-accent)" font-size="15" font-family="ui-monospace,monospace">门牌号 = ' + pseudoHash('hi', 10) + '</text>' +

              '<rect x="20" y="92" width="170" height="46" rx="11" fill="var(--c-bg-soft)" stroke="var(--c-border)" stroke-width="1.5"/>' +
              '<text x="105" y="112" text-anchor="middle" fill="var(--c-fg)" font-size="13">同样内容："hi"</text>' +
              '<text x="105" y="129" text-anchor="middle" fill="var(--c-fg-muted)" font-size="11">又放一次</text>' +
              '<line x1="194" y1="115" x2="248" y2="115" stroke="var(--course-accent)" stroke-width="2.8" stroke-linecap="round" marker-end="url(#c-math-mk2)"/>' +
              '<rect x="254" y="92" width="286" height="46" rx="11" fill="url(#c-math-mk2-grad)" stroke="var(--course-accent)" stroke-width="1.8" stroke-dasharray="7 4" filter="url(#c-math-mk2-glow)"/>' +
              '<text x="397" y="120" text-anchor="middle" fill="var(--course-accent)" font-size="15" font-family="ui-monospace,monospace">同一个门牌号！</text>' +
            '</svg>' +

            '<div class="deck-callout">' +
              '<b>推论（很爽的一条）：</b>相同的内容<b>只会被存一份</b>。' +
              '因为内容一样 → 哈希一样 → 地址一样 → git 一看"这门牌号已经有了"，直接复用，<b>自动去重</b>。' +
            '</div>' +
            '<p class="deck-p c-math-addr-foot">这也是为什么 git 仓库存了几千个版本，体积还小得惊人——重复的内容它一份都不多存。</p>' +

            '<style>' +
            '.c-math-addr{display:block;margin:18px auto;max-width:560px;}' +
            '.c-math-addr-foot{max-width:600px;margin:14px auto 0;text-align:center;color:var(--c-fg-muted);}' +
            '</style>';
        }
      },

      // ========================================================
      // Slide 4 · git 的三种对象（三卡片）
      // ========================================================
      {
        title: '一切皆对象',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<h2 class="deck-h2">git 眼里的世界：<span style="color:var(--course-accent)">一切皆对象</span></h2>' +
              '<p class="deck-lead">git 把所有东西归成三种"对象"，<b>每一种都用自己内容的哈希命名</b>。点卡片看细节 👇</p>' +
            '</div>' +

            '<div class="deck-grid c-math-objs">' +
              // blob
              '<div class="deck-card c-math-obj" data-obj="blob">' +
                '<div class="c-math-obj-ico">📄</div>' +
                '<div class="c-math-obj-name">blob</div>' +
                '<div class="c-math-obj-one">＝ 一个文件的内容</div>' +
                '<div class="c-math-obj-more">就是文件里那一坨字节本身，' +
                  '不含文件名、不含路径——纯内容。' +
                  '<br><span class="c-math-obj-hash">名字 = ' + pseudoHash('blob:README content', 8) + '…</span></div>' +
              '</div>' +
              // tree
              '<div class="deck-card c-math-obj" data-obj="tree">' +
                '<div class="c-math-obj-ico">🌳</div>' +
                '<div class="c-math-obj-name">tree</div>' +
                '<div class="c-math-obj-one">＝ 一个目录</div>' +
                '<div class="c-math-obj-more">记一张清单：里面有哪些<b>文件名</b>，' +
                  '各自指向哪个 <b>blob 的哈希</b>（子目录就指向另一个 tree）。' +
                  '<br><span class="c-math-obj-hash">名字 = ' + pseudoHash('tree:src/ index.js', 8) + '…</span></div>' +
              '</div>' +
              // commit
              '<div class="deck-card c-math-obj" data-obj="commit">' +
                '<div class="c-math-obj-ico">📸</div>' +
                '<div class="c-math-obj-name">commit</div>' +
                '<div class="c-math-obj-one">＝ 一次快照</div>' +
                '<div class="c-math-obj-more">指向<b>一个 tree 的哈希</b>（这一刻整个项目长啥样）' +
                  '＋ 作者 ＋ 时间 ＋ 提交信息 ＋ <b style="color:var(--course-accent)">父 commit 的哈希</b>。' +
                  '<br><span class="c-math-obj-hash">名字 = ' + pseudoHash('commit:tree+parent+msg', 8) + '…</span></div>' +
              '</div>' +
            '</div>' +

            '<div class="deck-callout c-math-obj-call">' +
              '套娃关系：<b>commit</b> 指着一个 <b>tree</b>，<b>tree</b> 指着一堆 <b>blob</b>。' +
              '而每一层的"名字"都是它内容的哈希。记住最后那行——' +
              '<b style="color:var(--course-accent)">commit 里存着父 commit 的哈希</b>，这是下一页的关键。' +
            '</div>' +

            '<style>' +
            '.c-math-objs{grid-template-columns:repeat(3,1fr);max-width:760px;margin:20px auto 0;gap:14px;}' +
            '.c-math-obj{position:relative;text-align:center;cursor:pointer;transition:border-color .25s,transform .2s,box-shadow .25s;}' +
            '.c-math-obj:hover{transform:translateY(-3px);border-color:var(--course-accent);box-shadow:0 0 26px color-mix(in srgb,var(--course-accent) 22%,transparent);}' +
            '.c-math-obj.open{border-color:color-mix(in srgb,var(--course-accent) 55%,var(--c-border));box-shadow:0 0 26px color-mix(in srgb,var(--course-accent) 18%,transparent);}' +
            '.c-math-obj-ico{font-size:38px;line-height:1;margin-bottom:6px;filter:drop-shadow(0 0 8px color-mix(in srgb,var(--course-accent) 50%,transparent));}' +
            '.c-math-obj-name{font-family:ui-monospace,monospace;font-weight:800;font-size:18px;color:var(--course-accent);text-shadow:0 0 12px color-mix(in srgb,var(--course-accent) 40%,transparent);}' +
            '.c-math-obj-one{font-size:13px;color:var(--c-fg);margin:6px 0;font-weight:600;}' +
            '.c-math-obj-more{font-size:12.5px;color:var(--c-fg-muted);line-height:1.55;max-height:0;overflow:hidden;opacity:0;transition:max-height .35s ease,opacity .3s ease,margin .3s;}' +
            '.c-math-obj.open .c-math-obj-more{max-height:200px;opacity:1;margin-top:8px;}' +
            '.c-math-obj-hash{display:inline-block;margin-top:8px;font-family:ui-monospace,monospace;font-size:11px;color:var(--course-accent);background:#05070c;border:1px solid color-mix(in srgb,var(--course-accent) 25%,var(--c-border));border-radius:6px;padding:3px 8px;}' +
            '.c-math-obj-call{max-width:700px;margin:22px auto 0;text-align:left;}' +
            '</style>';

          var cards = stage.querySelectorAll('.c-math-obj');
          cards.forEach(function (c) {
            c.addEventListener('click', function () {
              c.classList.toggle('open');
            });
          });
        }
      },

      // ========================================================
      // Slide 5 · 关键中的关键：commit 背着父亲的哈希 → 哈希链
      // ========================================================
      {
        title: '每个 commit 都背着父亲',
        render: function (stage, api) {
          // 三个 commit 方块，每个写 "我的内容 + 父亲哈希"，箭头指向父亲
          var ph = ['—', pseudoHash('C1', 6), pseudoHash('C2', 6)];
          var sh = [pseudoHash('C1', 6), pseudoHash('C2', 6), pseudoHash('C3', 6)];
          stage.innerHTML =
            '<h2 class="deck-h2">关键中的关键：<span style="color:var(--course-accent)">commit 背着父亲的哈希</span></h2>' +
            '<p class="deck-lead">每个 commit 里，除了"自己的内容"，还塞了一项——<b>它前一个 commit 的指纹</b>。' +
            '所以每个 commit 都"背"着它的父亲。</p>' +

            '<svg class="c-math-chain" viewBox="0 0 620 200" width="100%" aria-hidden="true">' +
              arrowDefs('c-math-mk3') +
              // 连父亲的指针（先画，垫在方块下面）：实线 + 流动高光叠在上面
              '<g class="c-math-chain-links">' +
                '<line x1="230" y1="125" x2="192" y2="125" stroke="var(--course-accent)" stroke-width="3" stroke-linecap="round" marker-end="url(#c-math-mk3)"/>' +
                '<line x1="430" y1="125" x2="392" y2="125" stroke="var(--course-accent)" stroke-width="3" stroke-linecap="round" marker-end="url(#c-math-mk3)"/>' +
                '<line x1="194" y1="125" x2="230" y2="125" stroke="url(#c-math-mk3-flow)" stroke-width="3" stroke-linecap="round" class="c-math-flow"/>' +
                '<line x1="394" y1="125" x2="430" y2="125" stroke="url(#c-math-mk3-flow)" stroke-width="3" stroke-linecap="round" class="c-math-flow" style="animation-delay:.6s"/>' +
              '</g>' +
              // 三个 commit 方块（C1 最老 → C3 最新），箭头从儿子指向父亲
              [0, 1, 2].map(function (i) {
                var x = 30 + i * 200;
                return (
                  '<g class="c-math-chain-node" style="animation-delay:' + (i * 180) + 'ms">' +
                    '<rect x="' + x + '" y="40" width="160" height="110" rx="13" ' +
                      'fill="url(#c-math-mk3-grad)" stroke="var(--course-accent)" stroke-width="2.2" filter="url(#c-math-mk3-glow)"/>' +
                    '<text x="' + (x + 80) + '" y="64" text-anchor="middle" fill="var(--course-accent)" font-size="14" font-weight="800">commit C' + (i + 1) + '</text>' +
                    '<line x1="' + (x + 14) + '" y1="74" x2="' + (x + 146) + '" y2="74" stroke="color-mix(in srgb,var(--course-accent) 30%,var(--c-border))"/>' +
                    '<text x="' + (x + 12) + '" y="94" fill="var(--c-fg-muted)" font-size="11">内容/tree:</text>' +
                    '<text x="' + (x + 12) + '" y="110" fill="var(--c-fg)" font-size="12" font-family="ui-monospace,monospace">' + sh[i] + '</text>' +
                    '<text x="' + (x + 12) + '" y="130" fill="var(--c-fg-muted)" font-size="11">父亲:</text>' +
                    '<text x="' + (x + 12) + '" y="146" fill="' + (i === 0 ? 'var(--c-fg-muted)' : '#f0b429') + '" font-size="12" font-weight="700" font-family="ui-monospace,monospace"' + (i === 0 ? '' : ' style="filter:drop-shadow(0 0 5px rgba(240,180,41,.7))"') + '>' + ph[i] + '</text>' +
                  '</g>'
                );
              }).join('') +
              '<text x="211" y="172" text-anchor="middle" fill="var(--c-fg-muted)" font-size="11">指向父亲</text>' +
              '<text x="411" y="172" text-anchor="middle" fill="var(--c-fg-muted)" font-size="11">指向父亲</text>' +
              '<text x="110" y="30" text-anchor="middle" fill="var(--c-fg-muted)" font-size="11">最老</text>' +
              '<text x="510" y="30" text-anchor="middle" fill="var(--course-accent)" font-size="11" font-weight="700">最新 (HEAD)</text>' +
            '</svg>' +

            '<div class="deck-callout">' +
              '把这些"背着父亲"的 commit 串起来，就是一条<b style="color:var(--course-accent)">哈希链</b>。' +
              '注意 C2 里那行"父亲"，写的正是 C1 的指纹 <span class="deck-kbd">' + sh[0] + '</span>；' +
              'C3 的"父亲"写的是 C2 的指纹 <span class="deck-kbd">' + sh[1] + '</span>。环环相扣。' +
            '</div>' +

            '<style>' +
            '.c-math-chain{display:block;margin:18px auto;max-width:620px;}' +
            '.c-math-chain-node{animation:c-math-node-in .55s both cubic-bezier(.34,1.56,.64,1);}' +
            '@keyframes c-math-node-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
            '.c-math-flow{stroke-dasharray:22 60;animation:c-math-stream 1.8s linear infinite;}' +
            '@keyframes c-math-stream{from{stroke-dashoffset:82}to{stroke-dashoffset:0}}' +
            '</style>';
        }
      },

      // ========================================================
      // Slide 6 · 默克尔结构 / 篡改塌方互动演示（高潮页）
      // ========================================================
      {
        title: '塌方：试着篡改一个历史',
        render: function (stage, api) {
          stage.innerHTML =
            '<h2 class="deck-h2">高潮：<span style="color:var(--course-accent)">篡改一个，整条塌方</span></h2>' +
            '<p class="deck-lead">既然每个 commit 的哈希 = 由「<b>它的内容</b> ＋ <b>父亲的哈希</b>」一起算出来——' +
            '那只要你动了某个老 commit，连锁反应就开始了。<b>亲手点一个试试 👇</b></p>' +

            '<div class="c-math-tamper" id="c-math-tamper"></div>' +

            '<div class="c-math-tamper-bar">' +
              '<button class="deck-btn" id="c-math-tbtn-reset">↩️ 复原历史</button>' +
              '<span class="c-math-tamper-status" id="c-math-tstatus">点上面任意一个 commit，"偷改"它的内容</span>' +
            '</div>' +

            '<div class="deck-callout warn" id="c-math-tamper-explain" style="display:none">' +
              '看到了吗？你只改了<b>一个</b> commit，但因为它的哈希变了 → 它儿子里存的"父亲哈希"对不上了 → ' +
              '儿子也得重算 → 一路<b>雪崩到最新</b>。<b style="color:var(--course-accent)">整条链全变红</b>。' +
              '想瞒过别人？除非你把后面<b>每一个</b> commit 全部重造一遍——而大家手里都留着原版哈希，一对就露馅。' +
            '</div>' +

            '<style>' +
            '.c-math-tamper{display:flex;flex-wrap:wrap;align-items:stretch;justify-content:center;gap:0;margin:20px auto 10px;max-width:720px;}' +
            '.c-math-cm{position:relative;width:118px;background:linear-gradient(160deg,var(--c-bg-card),color-mix(in srgb,var(--c-bg-card) 72%,#000));border:2px solid var(--c-border);border-radius:13px;padding:12px 10px;cursor:pointer;text-align:center;transition:border-color .25s,box-shadow .25s,background .25s,transform .25s;}' +
            '.c-math-cm:hover{border-color:var(--course-accent);box-shadow:0 0 20px color-mix(in srgb,var(--course-accent) 24%,transparent);transform:translateY(-2px);}' +
            '.c-math-cm + .c-math-cm{margin-left:34px;}' +
            '.c-math-cm + .c-math-cm::before{content:"";position:absolute;left:-32px;top:50%;width:30px;height:2.5px;border-radius:2px;background:color-mix(in srgb,var(--course-accent) 50%,var(--c-border));box-shadow:0 0 6px color-mix(in srgb,var(--course-accent) 30%,transparent);transition:background .25s,box-shadow .25s;}' +
            '.c-math-cm + .c-math-cm::after{content:"◀";position:absolute;left:-13px;top:50%;transform:translateY(-50%);font-size:11px;color:var(--course-accent);transition:color .25s;}' +
            '.c-math-cm-label{font-family:ui-monospace,monospace;font-weight:800;font-size:13px;color:var(--c-fg);margin-bottom:6px;}' +
            '.c-math-cm-row{font-size:10px;color:var(--c-fg-muted);text-align:left;line-height:1.5;}' +
            '.c-math-cm-row b{color:var(--c-fg);font-weight:600;}' +
            '.c-math-cm-hash{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--course-accent);word-break:break-all;text-shadow:0 0 8px color-mix(in srgb,var(--course-accent) 35%,transparent);transition:color .25s,text-shadow .25s;}' +
            '.c-math-cm-parent{font-family:ui-monospace,monospace;font-size:11.5px;color:var(--c-fg-muted);word-break:break-all;transition:color .25s;}' +
            // 被篡改/塌方态
            '.c-math-cm.broken{border-color:#f85149;background:linear-gradient(160deg,rgba(248,81,73,0.12),rgba(248,81,73,0.04));box-shadow:0 0 20px rgba(248,81,73,0.3);animation:c-math-quake .35s ease;}' +
            '.c-math-cm.broken .c-math-cm-hash{color:#f85149;text-shadow:0 0 9px rgba(248,81,73,.75);}' +
            '.c-math-cm.broken .c-math-cm-parent{color:#f85149;}' +
            '.c-math-cm.origin{box-shadow:0 0 0 3px rgba(248,81,73,0.4),0 0 26px rgba(248,81,73,0.45);}' +
            '.c-math-cm.broken + .c-math-cm.broken::before{background:#f85149;box-shadow:0 0 8px rgba(248,81,73,.6);}' +
            '.c-math-cm.broken + .c-math-cm.broken::after{color:#f85149;}' +
            '.c-math-cm-tag{position:absolute;top:-11px;left:50%;transform:translateX(-50%);font-size:9px;font-weight:800;padding:2px 8px;border-radius:999px;white-space:nowrap;opacity:0;transition:opacity .2s;}' +
            '.c-math-cm.origin .c-math-cm-tag{opacity:1;background:#f85149;color:#fff;box-shadow:0 0 12px rgba(248,81,73,.7);}' +
            '@keyframes c-math-quake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}' +
            '.c-math-tamper-bar{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap;margin:8px auto 0;}' +
            '.c-math-tamper-status{font-size:12.5px;color:var(--c-fg-muted);}' +
            '#c-math-tamper-explain{max-width:700px;margin:20px auto 0;text-align:left;}' +
            '</style>';

          // ---- 链的数据模型：5 个 commit，从老到新 ----
          var N = 5;
          // baseContent[i] = 第 i 个 commit 的原始内容种子
          var labels = ['C1', 'C2', 'C3', 'C4', 'C5'];
          var baseContent = ['init repo', 'add feature', 'fix bug', 'write docs', 'release'];
          var tampered = -1; // 哪个被篡改（-1 表示没有）

          var container = stage.querySelector('#c-math-tamper');
          var statusEl = stage.querySelector('#c-math-tstatus');
          var explainEl = stage.querySelector('#c-math-tamper-explain');
          var resetBtn = stage.querySelector('#c-math-tbtn-reset');

          // 根据当前 tampered 状态，重算每个 commit 的哈希（哈希 = f(内容 + 父亲哈希)）
          function computeHashes() {
            var hashes = [];
            var parentHash = '——————'; // C1 没有父亲
            for (var i = 0; i < N; i++) {
              var content = baseContent[i];
              if (i === tampered) content = content + ' [被偷改]';
              var h = pseudoHash(content + '|' + parentHash, 6);
              hashes.push({ hash: h, parent: parentHash });
              parentHash = h;
            }
            return hashes;
          }

          function render() {
            var hashes = computeHashes();
            var html = '';
            for (var i = 0; i < N; i++) {
              var broken = (tampered !== -1 && i >= tampered);
              var isOrigin = (i === tampered);
              var parentDisp = (i === 0) ? '（无）' : hashes[i].parent;
              html +=
                '<div class="c-math-cm' + (broken ? ' broken' : '') + (isOrigin ? ' origin' : '') + '" data-i="' + i + '">' +
                  '<div class="c-math-cm-tag">😈 你改了这里</div>' +
                  '<div class="c-math-cm-label">' + labels[i] + '</div>' +
                  '<div class="c-math-cm-row"><b>内容:</b> ' + baseContent[i] + (isOrigin ? ' <span style="color:#f85149">[改]</span>' : '') + '</div>' +
                  '<div class="c-math-cm-row"><b>父:</b> <span class="c-math-cm-parent">' + parentDisp + '</span></div>' +
                  '<div class="c-math-cm-row"><b>哈希:</b> <span class="c-math-cm-hash">' + hashes[i].hash + '</span></div>' +
                '</div>';
            }
            container.innerHTML = html;
            // 绑定点击
            container.querySelectorAll('.c-math-cm').forEach(function (el) {
              el.addEventListener('click', function () {
                tampered = parseInt(el.getAttribute('data-i'), 10);
                render();
                var n = N - tampered; // 受影响数量
                statusEl.innerHTML = '😱 你改了 <b style="color:#f85149">' + labels[tampered] + '</b>，' +
                  '它后面 <b style="color:#f85149">' + n + '</b> 个 commit 的哈希全被迫重算！';
                explainEl.style.display = 'block';
              });
            });
          }

          resetBtn.addEventListener('click', function () {
            tampered = -1;
            render();
            statusEl.textContent = '点上面任意一个 commit，"偷改"它的内容';
            explainEl.style.display = 'none';
          });

          render();
        }
      },

      // ========================================================
      // Slide 7 · 这就是区块链的同款灵魂
      // ========================================================
      {
        title: '原来 git 和区块链是亲戚',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center">' +
              '<div class="c-math-bc-emoji">🔗 ⛓️ ✨</div>' +
              '<h1 class="deck-h1">等等……这不就是<br><span style="color:var(--course-accent)">区块链</span>吗？</h1>' +
              '<p class="deck-lead">你刚刚理解的"哈希链 + 改一个就塌方"——' +
              '<b>正是比特币、区块链的同款灵魂</b>（默克尔树 Merkle tree ＋ 哈希链）。</p>' +
            '</div>' +

            '<div class="deck-grid c-math-bc-cmp">' +
              '<div class="deck-card">' +
                '<div class="c-math-bc-h">📦 git 的一个 commit</div>' +
                '<p class="deck-p" style="margin:0">内容快照 ＋ <b>父 commit 哈希</b><br>→ 串成不可篡改的版本历史</p>' +
              '</div>' +
              '<div class="c-math-bc-eq">≈</div>' +
              '<div class="deck-card">' +
                '<div class="c-math-bc-h">🪙 区块链的一个区块</div>' +
                '<p class="deck-p" style="margin:0">一批交易 ＋ <b>上一个区块哈希</b><br>→ 串成不可篡改的账本</p>' +
              '</div>' +
            '</div>' +

            '<div class="deck-callout c-math-bc-call">' +
              '而且——<b>git（2005）比比特币（2009）还早</b>。' +
              '本质上，你天天用的 git 版本历史，就是一条' +
              '<b style="color:var(--course-accent)">去中心化、可验证、改不动历史</b>的链。' +
              '<br>原来你早就在用"区块链思想"了，只是它叫 git。' +
            '</div>' +

            '<style>' +
            '@keyframes c-math-breathe{0%,100%{opacity:.6;transform:scale(.97)}50%{opacity:1;transform:scale(1.03)}}' +
            '.c-math-bc-emoji{font-size:42px;letter-spacing:6px;margin:4px 0 10px;filter:drop-shadow(0 0 12px color-mix(in srgb,var(--course-accent) 55%,transparent));animation:c-math-breathe 3.6s ease-in-out infinite;}' +
            '.c-math-bc-cmp{grid-template-columns:1fr auto 1fr;align-items:center;max-width:680px;margin:22px auto 0;gap:14px;}' +
            '.c-math-bc-h{font-weight:700;color:var(--c-fg);margin-bottom:6px;}' +
            '.c-math-bc-eq{font-size:34px;color:var(--course-accent);font-weight:800;text-align:center;text-shadow:0 0 16px color-mix(in srgb,var(--course-accent) 50%,transparent);}' +
            '.c-math-bc-call{max-width:680px;margin:22px auto 0;text-align:left;}' +
            '</style>';
        }
      },

      // ========================================================
      // Slide 8 · 分支与 HEAD 的轻量之美
      // ========================================================
      {
        title: '分支只是一张便利贴',
        render: function (stage, api) {
          stage.innerHTML =
            '<h2 class="deck-h2">那分支呢？<span style="color:var(--course-accent)">轻得不像话</span></h2>' +
            '<p class="deck-lead">历史（那一堆 commit）是一张<b>改不动的有向无环图 (DAG)</b>——只能往上长，旧的动不了。' +
            '那分支是什么？它<b>不复制任何代码</b>，只是一张贴在某个 commit 上的"便利贴"。</p>' +

            '<svg class="c-math-branch" viewBox="0 0 620 250" width="100%" aria-hidden="true">' +
              arrowDefs('c-math-mk4') +
              // 不可变的 commit DAG（主干 + 一个分叉）
              '<g>' +
                // 主干连线（先画，箭头指向父亲，即往左）
                [1,2,3,4].map(function(i){
                  var x2 = 60 + (i-1)*100 + 18, x1 = 60 + i*100 - 18;
                  return '<line x1="'+x1+'" y1="160" x2="'+x2+'" y2="160" stroke="var(--course-accent)" stroke-width="2.5" stroke-linecap="round" marker-end="url(#c-math-mk4)"/>';
                }).join('') +
                '<line x1="346" y1="98" x2="276" y2="150" stroke="var(--course-accent)" stroke-width="2.5" stroke-linecap="round" marker-end="url(#c-math-mk4)"/>' +
                '<line x1="446" y1="90" x2="378" y2="90" stroke="var(--course-accent)" stroke-width="2.5" stroke-linecap="round" marker-end="url(#c-math-mk4)"/>' +
                // 主干 5 个节点（发光）
                [0,1,2,3,4].map(function(i){
                  var cx = 60 + i*100;
                  return '<circle class="c-math-dagnode" style="animation-delay:'+(i*90)+'ms" cx="'+cx+'" cy="160" r="16" fill="url(#c-math-mk4-grad)" stroke="var(--course-accent)" stroke-width="2.5" filter="url(#c-math-mk4-glow)"/>';
                }).join('') +
                // 一个分叉：从第 3 个节点(index2,cx=260)往上分出两个
                '<circle class="c-math-dagnode" style="animation-delay:450ms" cx="360" cy="90" r="16" fill="url(#c-math-mk4-grad)" stroke="var(--course-accent)" stroke-width="2.5" filter="url(#c-math-mk4-glow)"/>' +
                '<circle class="c-math-dagnode" style="animation-delay:540ms" cx="460" cy="90" r="16" fill="url(#c-math-mk4-grad)" stroke="var(--course-accent)" stroke-width="2.5" filter="url(#c-math-mk4-glow)"/>' +
              '</g>' +
              // 分支 pill（像便利贴贴上去）
              '<g font-family="ui-monospace,monospace" font-size="12" font-weight="700">' +
                '<rect x="430" y="186" width="78" height="26" rx="13" fill="var(--course-accent)" filter="url(#c-math-mk4-glow)"/>' +
                '<text x="469" y="204" text-anchor="middle" fill="#0d1117">main</text>' +
                '<line x1="460" y1="186" x2="460" y2="178" stroke="var(--course-accent)" stroke-width="2.5" stroke-linecap="round"/>' +
                '<rect x="424" y="40" width="90" height="26" rx="13" fill="#a371f7" filter="url(#c-math-mk4-glow)"/>' +
                '<text x="469" y="58" text-anchor="middle" fill="#fff">feature</text>' +
                '<line x1="460" y1="66" x2="460" y2="74" stroke="#a371f7" stroke-width="2.5" stroke-linecap="round"/>' +
              '</g>' +
              // HEAD 指针指向 main
              '<g font-family="ui-monospace,monospace" font-size="12" font-weight="800">' +
                '<rect x="430" y="220" width="78" height="24" rx="7" fill="var(--c-bg-soft)" stroke="var(--course-accent)" stroke-width="1.5" stroke-dasharray="4 3"/>' +
                '<text x="469" y="237" text-anchor="middle" fill="var(--course-accent)">HEAD →</text>' +
                '<line x1="469" y1="220" x2="469" y2="214" stroke="var(--course-accent)" stroke-width="1.5" stroke-dasharray="3 2"/>' +
              '</g>' +
              '<text x="200" y="200" fill="var(--c-fg-muted)" font-size="12">↑ 庞大、不可变的 commit 历史 (DAG)</text>' +
            '</svg>' +

            '<div class="deck-grid c-math-2col">' +
              '<div class="deck-card">' +
                '<div class="c-math-bh">🏷️ 分支 = 一行字的小文件</div>' +
                '<p class="deck-p" style="margin:0">本质上就是个<b>几十字节</b>的文件，里面只写着<b>某个 commit 的哈希</b>。' +
                '所谓"切分支"，就是改了这一行字而已。</p>' +
              '</div>' +
              '<div class="deck-card">' +
                '<div class="c-math-bh">📍 HEAD = 指向分支的指针</div>' +
                '<p class="deck-p" style="margin:0">HEAD 记的是"你<b>现在在哪个分支上</b>"。' +
                '它指向 main，main 指向某个 commit——一层套一层的指针。</p>' +
              '</div>' +
            '</div>' +

            '<style>' +
            '.c-math-branch{display:block;margin:16px auto;max-width:620px;}' +
            '.c-math-dagnode{transform-box:fill-box;transform-origin:center;animation:c-math-dag-in .5s both cubic-bezier(.34,1.56,.64,1);}' +
            '@keyframes c-math-dag-in{from{opacity:0;transform:scale(.4)}to{opacity:1;transform:none}}' +
            '.c-math-2col{grid-template-columns:1fr 1fr;max-width:680px;margin:14px auto 0;}' +
            '.c-math-bh{font-weight:700;color:var(--c-fg);margin-bottom:6px;}' +
            '</style>';
        }
      },

      // ========================================================
      // Slide 9 · 回收前面所有"啊哈"（总结页）
      // ========================================================
      {
        title: '所有"啊哈"在这里收束',
        render: function (stage, api) {
          var rows = [
            ['⚡', '为什么"切分支""开 worktree"那么快又便宜？',
              '因为只是动了<b>几十字节的指针</b>，一行代码都没复制。'],
            ['🗑️', '为什么 git"不会真正删东西"？',
              '删分支只是<b>擦掉一张便利贴</b>，commit 对象还好端端躺在仓库里。'],
            ['🆔', '为什么 commit 的 hash 能当"代号"跟 AI 指代某个版本？',
              '因为它是<b>全局唯一、由内容决定</b>的指纹，指哪个版本绝不会认错。'],
            ['🧱', '为什么相同内容不重复占空间？',
              '内容寻址自动去重——<b>哈希一样就只存一份</b>。']
          ];
          stage.innerHTML =
            '<h2 class="deck-h2">现在，前面的"啊哈"全都<span style="color:var(--course-accent)">接上线了</span></h2>' +
            '<p class="deck-lead">用这一章的骨架，回头看那些你曾经觉得"很神奇"的事，全都顺理成章：</p>' +

            '<div class="c-math-recap">' +
              rows.map(function (r, i) {
                return (
                  '<div class="c-math-recap-row" style="animation-delay:' + (i * 110) + 'ms">' +
                    '<div class="c-math-recap-ico">' + r[0] + '</div>' +
                    '<div class="c-math-recap-body">' +
                      '<div class="c-math-recap-q">' + r[1] + '</div>' +
                      '<div class="c-math-recap-a">' + r[2] + '</div>' +
                    '</div>' +
                  '</div>'
                );
              }).join('') +
            '</div>' +

            '<div class="deck-callout c-math-recap-sum">' +
              '<div class="deck-h2" style="margin:0 0 6px;font-size:18px">一句话的美：</div>' +
              'git ＝ 一堆<b style="color:var(--course-accent)">不可变的、用内容哈希命名的对象</b>（历史）' +
              '　＋　一层<b style="color:var(--course-accent)">可以自由移动的轻量指针</b>（分支 / HEAD）。' +
              '<br><span style="color:var(--c-fg-muted)">不可变的<b>骨</b>，可动的<b>皮</b>。</span>' +
            '</div>' +

            '<style>' +
            '.c-math-recap{max-width:680px;margin:18px auto 0;display:flex;flex-direction:column;gap:10px;}' +
            '.c-math-recap-row{display:flex;gap:14px;align-items:flex-start;background:linear-gradient(160deg,var(--c-bg-card),color-mix(in srgb,var(--c-bg-card) 75%,#000));border:1px solid var(--c-border);border-left:3px solid var(--course-accent);border-radius:10px;padding:13px 16px;box-shadow:-4px 0 18px color-mix(in srgb,var(--course-accent) 8%,transparent);transition:border-color .25s,box-shadow .25s;animation:c-math-slidein .5s both cubic-bezier(.34,1.56,.64,1);}' +
            '.c-math-recap-row:hover{border-left-color:var(--course-accent);box-shadow:-4px 0 24px color-mix(in srgb,var(--course-accent) 18%,transparent);}' +
            '@keyframes c-math-slidein{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}' +
            '.c-math-recap-ico{font-size:24px;line-height:1.2;flex-shrink:0;filter:drop-shadow(0 0 6px color-mix(in srgb,var(--course-accent) 40%,transparent));}' +
            '.c-math-recap-q{font-size:14px;color:var(--c-fg);font-weight:600;margin-bottom:4px;}' +
            '.c-math-recap-a{font-size:13px;color:var(--c-fg-muted);line-height:1.5;}' +
            '.c-math-recap-sum{max-width:680px;margin:20px auto 0;text-align:left;}' +
            '</style>';
        }
      },

      // ========================================================
      // Slide 10 · 收尾金句（大字）
      // ========================================================
      {
        title: '一句话记住它',
        render: function (stage, api) {
          stage.innerHTML =
            '<div class="deck-center c-math-final">' +
              '<svg class="c-math-final-svg" viewBox="0 0 320 200" width="280" aria-hidden="true">' +
                arrowDefs('c-math-mk5') +
                // 星点（小星图）
                '<g fill="var(--course-accent)">' +
                  '<circle class="c-math-star" cx="44" cy="40" r="1.6" style="animation-delay:0s"/>' +
                  '<circle class="c-math-star" cx="86" cy="22" r="1.2" style="animation-delay:.5s"/>' +
                  '<circle class="c-math-star" cx="270" cy="44" r="1.5" style="animation-delay:1s"/>' +
                  '<circle class="c-math-star" cx="296" cy="86" r="1.2" style="animation-delay:1.4s"/>' +
                  '<circle class="c-math-star" cx="160" cy="30" r="1.3" style="animation-delay:.8s"/>' +
                '</g>' +
                // 一座改不动的山
                '<path d="M20,170 L110,60 L170,120 L220,50 L300,170 Z" fill="url(#c-math-mk5-grad)" stroke="var(--course-accent)" stroke-width="2.2" stroke-linejoin="round"/>' +
                '<path d="M110,60 L132,84 L150,70 L170,120 L110,60Z" fill="rgba(227,179,65,0.18)"/>' +
                // 山上一面旗（旗杆 + 飘动的旗）
                '<line x1="222" y1="50" x2="222" y2="14" stroke="var(--c-fg)" stroke-width="2.5" stroke-linecap="round"/>' +
                '<path id="c-math-flag" d="M222,18 Q244,12 266,18 Q244,30 222,30 Z" fill="var(--course-accent)" filter="url(#c-math-mk5-glow)"/>' +
                '<circle cx="222" cy="50" r="4.5" fill="var(--course-accent)" filter="url(#c-math-mk5-glow)"/>' +
              '</svg>' +

              '<h1 class="deck-h1 c-math-final-quote">' +
                '历史是一座<span style="color:var(--course-accent)">改不动的山</span>，<br>' +
                '分支只是山上<span style="color:var(--course-accent)">一面随风的旗</span>。' +
              '</h1>' +

              '<p class="deck-lead c-math-final-sub">' +
                '理解了这一层，你就懂了 git 为什么这么设计、为什么这么美——' +
                '<br>不可变的骨，给你<b>信任</b>；可动的皮，给你<b>自由</b>。' +
              '</p>' +

              '<div class="c-math-final-tags">' +
                '<span class="c-math-final-tag">#哈希</span>' +
                '<span class="c-math-final-tag">#内容寻址</span>' +
                '<span class="c-math-final-tag">#默克尔链</span>' +
                '<span class="c-math-final-tag">#不可篡改</span>' +
              '</div>' +
            '</div>' +

            '<style>' +
            '.c-math-final{padding-top:6px;}' +
            '.c-math-final-svg{display:block;margin:0 auto 14px;filter:drop-shadow(0 0 22px color-mix(in srgb,var(--course-accent) 28%,transparent));}' +
            '.c-math-star{animation:c-math-twinkle 2.6s ease-in-out infinite;}' +
            '@keyframes c-math-twinkle{0%,100%{opacity:.25}50%{opacity:1}}' +
            '#c-math-flag{transform-box:fill-box;transform-origin:left center;animation:c-math-wave 2.2s ease-in-out infinite;}' +
            '@keyframes c-math-wave{0%,100%{transform:skewY(0) scaleX(1)}50%{transform:skewY(-4deg) scaleX(.94)}}' +
            '.c-math-final-quote{font-size:34px;line-height:1.35;margin:6px auto 0;max-width:680px;}' +
            '.c-math-final-sub{margin-top:18px;color:var(--c-fg-muted);max-width:600px;}' +
            '.c-math-final-tags{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:24px;}' +
            '.c-math-final-tag{font-family:ui-monospace,monospace;font-size:13px;color:var(--course-accent);background:var(--c-bg-soft);border:1px solid color-mix(in srgb,var(--course-accent) 30%,var(--c-border));border-radius:999px;padding:5px 14px;box-shadow:0 0 14px color-mix(in srgb,var(--course-accent) 12%,transparent);transition:border-color .2s,box-shadow .2s;}' +
            '.c-math-final-tag:hover{border-color:var(--course-accent);box-shadow:0 0 18px color-mix(in srgb,var(--course-accent) 28%,transparent);}' +
            '</style>';
        }
      }

    ]
  });
})();
