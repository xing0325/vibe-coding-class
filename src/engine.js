/* =============================================================================
 * engine.js — GitHub 新手教程引擎
 * Zero-dependency vanilla JS。负责：
 *   1) TutorialEngine — 主线 17 步引导（spotlight + 气泡 + 卡点）
 *   2) initGlossaryTooltips — 术语 hover 卡片 & 黑话速记模态
 *   3) startWorktreeBonus — 主线通关后的加餐关
 *
 * 不包含具体 STEPS / PITFALLS / GLOSSARY 数据，由调用方传入。
 * UI 页面由 ui.html 提供，本引擎只通过 [data-tut="xxx"] 与 location.hash 交互。
 * ============================================================================= */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 小工具
  // ---------------------------------------------------------------------------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function el(tag, attrs, children) {
    const node = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        if (k === 'style' && typeof attrs[k] === 'object') {
          Object.assign(node.style, attrs[k]);
        } else if (k === 'class' || k === 'className') {
          node.className = attrs[k];
        } else if (k === 'dataset') {
          Object.assign(node.dataset, attrs[k]);
        } else if (k.startsWith('on') && typeof attrs[k] === 'function') {
          node.addEventListener(k.slice(2).toLowerCase(), attrs[k]);
        } else if (k === 'html') {
          node.innerHTML = attrs[k];
        } else {
          node.setAttribute(k, attrs[k]);
        }
      }
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach((c) => {
        if (c == null) return;
        node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
      });
    }
    return node;
  }

  function escapeHTML(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  // 把 body 文字里出现的术语关键词包成 <span data-term="key">key</span>
  function textPreprocess(text, glossary) {
    if (!text) return '';
    // 注意：body 内容是受信任的内联 JS 常量（content.js 里手写），允许 <span data-term> 等富文本。
    // 不再 escape。术语自动包装：仅对 data-term 之外的裸关键词补 span。
    if (!glossary) return text;
    let out = text;
    const keys = Object.keys(glossary).sort((a, b) => b.length - a.length); // 长的优先
    keys.forEach((k) => {
      const safe = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      try {
        // lookbehind：跳过已经在 data-term 标签里的命中
        const re = new RegExp('(?<!data-term="[^"]{0,40})(?<![\\w-])' + safe + '(?![\\w-])', 'gi');
        out = out.replace(re, (m, offset, full) => {
          // 额外保护：当前位置如果已经在 <span ...>...</span> 内部，跳过
          const before = full.slice(0, offset);
          const lastOpen = before.lastIndexOf('<span');
          const lastClose = before.lastIndexOf('</span>');
          if (lastOpen > lastClose) return m; // 在某个 span 内部
          return `<span data-term="${k}" class="tut-term">${m}</span>`;
        });
      } catch (e) {
        // 老浏览器无 lookbehind：直接放弃自动包装，依赖 content.js 手写
      }
    });
    return out;
  }

  // ---------------------------------------------------------------------------
  // 一次性注入样式
  // ---------------------------------------------------------------------------
  const STYLE_ID = 'tutorial-engine-style';
  function injectStyle() {
    if (document.getElementById(STYLE_ID)) return;
    const css = `
      .tut-overlay {
        position: fixed; inset: 0;
        background: transparent;
        z-index: 9000;
        pointer-events: auto;
      }
      .tut-spotlight {
        position: fixed;
        border-radius: 8px;
        outline: 3px solid #58a6ff;
        outline-offset: 3px;
        z-index: 9080;
        pointer-events: none;
        transition: all 0.25s ease;
        animation: tut-pulse 1.8s ease-in-out infinite;
        /* 三层 shadow：内圈柔光 + 外光晕 + 极淡全局暗化（0.18） */
        box-shadow:
          0 0 0 6px rgba(88, 166, 255, 0.18),
          0 0 28px 6px rgba(47, 129, 247, 0.5),
          0 0 0 9999px rgba(0, 0, 0, 0.18);
      }
      @keyframes tut-pulse {
        0%, 100% {
          outline-color: #58a6ff;
          box-shadow:
            0 0 0 6px rgba(88, 166, 255, 0.18),
            0 0 22px 4px rgba(47, 129, 247, 0.40),
            0 0 0 9999px rgba(0, 0, 0, 0.18);
        }
        50% {
          outline-color: #79c0ff;
          box-shadow:
            0 0 0 10px rgba(88, 166, 255, 0.30),
            0 0 44px 10px rgba(47, 129, 247, 0.65),
            0 0 0 9999px rgba(0, 0, 0, 0.18);
        }
      }
      .tut-target-lift {
        position: relative;
        z-index: 9085 !important;
      }
      /* 左侧教学侧边栏（v6 重构：永不挡按钮） */
      .tut-sidebar {
        position: fixed;
        top: 0; left: 0; bottom: 0;
        width: 380px;
        background: var(--bg-canvas, #0d1117);
        color: var(--fg-default, #e6edf3);
        border-right: 1px solid var(--border-default, #30363d);
        z-index: 9100;
        display: flex; flex-direction: column;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
        box-shadow: 4px 0 24px rgba(0,0,0,0.4);
      }
      .tut-sidebar .tut-sb-head {
        padding: 14px 20px 10px;
        border-bottom: 1px solid var(--border-muted, #21262d);
        display: flex; align-items: center; justify-content: space-between;
      }
      .tut-sidebar .tut-sb-head .tut-sb-title {
        font-size: 13px; font-weight: 600;
        color: var(--fg-muted, #7d8590);
        letter-spacing: 0.04em;
      }
      .tut-sidebar .tut-sb-body {
        flex: 1; overflow-y: auto;
        padding: 18px 22px 22px;
      }
      .tut-sidebar .tut-sb-foot {
        padding: 12px 20px;
        border-top: 1px solid var(--border-muted, #21262d);
        display: flex; align-items: center; justify-content: space-between;
        gap: 10px;
        font-size: 12px;
        color: var(--fg-muted, #7d8590);
      }
      .tut-sidebar .tut-sb-kbd {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 10px;
        padding: 1px 5px;
        border: 1px solid var(--border-default, #30363d);
        border-radius: 3px;
        color: var(--fg-default, #e6edf3);
      }
      body.tut-active {
        padding-left: 380px !important;
        box-sizing: border-box;
      }

      /* bubble 改为 sidebar 内的 block 元素 */
      .tut-bubble {
        position: static;
        background: transparent;
        color: var(--fg-default, #e6edf3);
        border: 0;
        padding: 0;
        box-shadow: none;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.65;
      }
      .tut-bubble .tut-role {
        display: inline-block;
        font-size: 11px;
        padding: 2px 8px;
        border-radius: 999px;
        margin-bottom: 6px;
        font-weight: 600;
      }
      .tut-bubble .tut-role.role-teacher { background: rgba(63, 185, 80, 0.15); color: var(--success-emphasis, #3fb950); }
      .tut-bubble .tut-role.role-student { background: rgba(47, 129, 247, 0.15); color: var(--accent-emphasis, #2f81f7); }
      .tut-bubble .tut-role.role-system  { background: rgba(187, 128, 9, 0.15); color: #d29922; }
      .tut-bubble h3 {
        margin: 4px 0 8px;
        font-size: 16px;
        font-weight: 600;
      }
      .tut-bubble .tut-body { margin-bottom: 12px; word-break: break-word; }
      .tut-bubble .tut-row {
        display: flex; align-items: center; justify-content: space-between;
        gap: 8px;
      }
      .tut-bubble .tut-progress-txt {
        font-size: 12px; color: var(--fg-muted, #7d8590);
      }
      .tut-btn {
        background: var(--accent-emphasis, #2f81f7);
        color: #fff;
        border: 0;
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        font-family: inherit;
      }
      .tut-btn:hover { filter: brightness(1.08); }
      .tut-btn:disabled { opacity: 0.45; cursor: not-allowed; }
      .tut-btn.secondary {
        background: transparent;
        color: var(--fg-default, #e6edf3);
        border: 1px solid var(--border-default, #30363d);
      }
      .tut-btn.ghost {
        background: transparent;
        color: var(--fg-muted, #7d8590);
        border: 0;
      }

      /* 顶部进度条 */
      .tut-topbar {
        position: fixed; top: 0; left: 0; right: 0;
        height: 4px;
        background: rgba(255,255,255,0.06);
        z-index: 9101;
      }
      body.tut-active .tut-topbar { left: 380px; }
      body.tut-active .tut-toast-host { left: calc(50% + 190px); }
      .tut-topbar > .tut-topbar-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--accent-emphasis,#2f81f7), var(--success-emphasis,#3fb950));
        width: 0;
        transition: width 0.3s ease;
      }
      .tut-reset-btn {
        position: fixed; top: 12px; right: 16px;
        z-index: 9004;
        padding: 6px 12px;
        background: rgba(22, 27, 34, 0.85);
        color: var(--fg-default, #e6edf3);
        border: 1px solid var(--border-default, #30363d);
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        backdrop-filter: blur(8px);
      }
      .tut-reset-btn:hover { background: rgba(33, 38, 45, 0.95); border-color: var(--accent-emphasis, #2f81f7); }
      .tut-enter-hint {
        margin-top: 12px;
        padding: 7px 12px;
        font-size: 13px;
        font-weight: 600;
        color: #79c0ff;
        background: rgba(56, 139, 253, 0.12);
        border: 1px solid rgba(56, 139, 253, 0.35);
        border-radius: 6px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        animation: tut-hint-pulse 1.6s ease-in-out infinite;
      }
      @keyframes tut-hint-pulse {
        0%, 100% { opacity: 0.7; }
        50%      { opacity: 1; }
      }

      /* AI 卡片改为 sidebar 内 block 元素 */
      .tut-ai-card {
        position: static;
        background: transparent;
        padding: 0;
        display: block;
      }
      .tut-ai-card .tut-ai-inner {
        background: transparent;
        color: var(--fg-default, #e6edf3);
        border: 0;
        border-radius: 0;
        max-width: none; width: auto;
        padding: 0;
        font-family: inherit;
        box-shadow: none;
      }
      .tut-ai-card h2 {
        margin: 0 0 4px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        color: var(--fg-muted, #7d8590);
      }
      .tut-ai-card .tut-ai-prompt {
        font-size: 14px;
        line-height: 1.5;
        margin: 8px 0 14px;
        padding: 12px 14px;
        background: rgba(110, 118, 129, 0.1);
        border-left: 3px solid var(--accent-emphasis, #2f81f7);
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        white-space: pre-wrap; word-break: break-word;
      }
      .tut-ai-card .tut-ai-actions { display: flex; gap: 8px; justify-content: flex-end; flex-wrap: wrap; }

      /* Toast */
      .tut-toast-host {
        position: fixed;
        bottom: 24px; left: 50%; transform: translateX(-50%);
        z-index: 9500;
        display: flex; flex-direction: column; gap: 8px;
        pointer-events: none;
      }
      .tut-toast {
        background: rgba(22, 27, 34, 0.98);
        color: var(--fg-default,#e6edf3);
        border: 2px solid var(--border-default,#30363d);
        padding: 16px 28px;
        border-radius: 12px;
        font-size: 17px;
        font-weight: 600;
        letter-spacing: 0.01em;
        max-width: 540px;
        box-shadow: 0 12px 40px rgba(0,0,0,0.55);
        animation: tut-toast-in 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.4);
        pointer-events: auto;
      }
      .tut-toast.warn  { border-color: #d29922; box-shadow: 0 12px 40px rgba(210,153,34,0.35); }
      .tut-toast.error { border-color: #f85149; box-shadow: 0 12px 40px rgba(248,81,73,0.35); }
      .tut-toast.ok    { border-color: var(--success-emphasis,#3fb950); box-shadow: 0 12px 40px rgba(63,185,80,0.4); }
      @keyframes tut-toast-in {
        from { opacity: 0; transform: translateY(16px) scale(0.92); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }

      /* 暂停 → 继续按钮 */
      .tut-resume-btn {
        position: fixed; right: 20px; bottom: 20px; z-index: 9600;
        background: var(--accent-emphasis,#2f81f7); color: #fff;
        padding: 10px 16px; border-radius: 999px;
        border: 0; cursor: pointer;
        font-size: 13px; font-weight: 600;
        box-shadow: 0 8px 20px rgba(0,0,0,0.4);
      }

      /* 术语下划线 + tooltip */
      [data-term], .tut-term {
        border-bottom: 1px dashed var(--accent-emphasis,#2f81f7);
        cursor: help;
      }
      .tut-glossary-tooltip {
        position: fixed;
        z-index: 9400;
        max-width: 320px;
        background: var(--bg-overlay, #161b22);
        color: var(--fg-default,#e6edf3);
        border: 1px solid var(--border-default,#30363d);
        border-radius: 8px;
        padding: 12px 14px;
        font-size: 13px;
        line-height: 1.55;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
        pointer-events: none;
      }
      .tut-glossary-tooltip h4 {
        margin: 0 0 6px; font-size: 14px; color: var(--accent-emphasis,#2f81f7);
      }
      .tut-glossary-tooltip .row { margin-top: 6px; }
      .tut-glossary-tooltip .row b { color: var(--fg-muted,#7d8590); font-weight: 500; margin-right: 4px; }

      /* 黑话速记模态 */
      .tut-modal-mask {
        position: fixed; inset: 0;
        background: rgba(0,0,0,0.7);
        z-index: 9700;
        display: flex; align-items: center; justify-content: center;
        padding: 20px;
      }
      .tut-modal {
        background: var(--bg-canvas,#0d1117);
        color: var(--fg-default,#e6edf3);
        border: 1px solid var(--border-default,#30363d);
        border-radius: 12px;
        max-width: 880px; width: 100%;
        max-height: 86vh; overflow: auto;
        padding: 24px 28px 22px;
      }
      .tut-modal h2 {
        margin: 0 0 8px; font-size: 22px;
      }
      .tut-modal p.sub { color: var(--fg-muted,#7d8590); margin: 0 0 18px; font-size: 13px; }
      .tut-modal .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        gap: 12px;
      }
      .tut-modal .card {
        border: 1px solid var(--border-default,#30363d);
        border-radius: 8px;
        padding: 12px 14px;
        background: rgba(110,118,129,0.06);
      }
      .tut-modal .card h4 { margin: 0 0 6px; font-size: 14px; color: var(--accent-emphasis,#2f81f7); }
      .tut-modal .card .line { font-size: 12px; line-height: 1.5; color: var(--fg-muted,#7d8590); }
      .tut-modal .card .line b { color: var(--fg-default,#e6edf3); font-weight: 500; }
      .tut-modal .foot { margin-top: 18px; text-align: right; }

      /* worktree 加餐 */
      #worktree-bonus {
        position: fixed; inset: 0;
        background: var(--bg-canvas,#0d1117);
        color: var(--fg-default,#e6edf3);
        z-index: 9800;
        overflow: auto;
        padding: 40px 20px;
        font-family: inherit;
      }
      #worktree-bonus .wb-wrap { max-width: 920px; margin: 0 auto; }
      #worktree-bonus h1 { font-size: 26px; margin: 0 0 6px; }
      #worktree-bonus p.lead { color: var(--fg-muted,#7d8590); margin: 0 0 22px; }
      #worktree-bonus .wb-stage {
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        gap: 24px;
        align-items: center;
        margin-top: 22px;
      }
      #worktree-bonus .wb-folder {
        text-align: center;
        padding: 22px 18px;
        border: 1px solid var(--border-default,#30363d);
        border-radius: 12px;
        background: rgba(110,118,129,0.06);
        transition: transform 0.4s cubic-bezier(.4,1.4,.5,1), box-shadow 0.4s, border-color 0.4s;
      }
      #worktree-bonus .wb-folder svg { width: 64px; height: 64px; }
      #worktree-bonus .wb-folder.active {
        transform: scale(1.08);
        border-color: var(--accent-emphasis,#2f81f7);
        box-shadow: 0 0 0 4px rgba(47,129,247,0.18), 0 20px 40px rgba(0,0,0,0.4);
      }
      #worktree-bonus .wb-folder.dim {
        transform: scale(0.92);
        opacity: 0.5;
      }
      #worktree-bonus .wb-folder .branch { font-family: ui-monospace, monospace; font-weight: 600; margin-top: 6px; font-size: 14px; }
      #worktree-bonus .wb-folder .tag {
        display: inline-block; margin-top: 8px; font-size: 11px;
        padding: 3px 8px; border-radius: 999px;
        background: rgba(110,118,129,0.18); color: var(--fg-muted,#7d8590);
      }
      #worktree-bonus .wb-folder.A .tag { background: rgba(210,153,34,0.15); color: #d29922; }
      #worktree-bonus .wb-folder.B .tag { background: rgba(63,185,80,0.15); color: var(--success-emphasis,#3fb950); }

      #worktree-bonus .wb-editor {
        margin-top: 28px;
        background: #010409;
        border: 1px solid var(--border-default,#30363d);
        border-radius: 8px;
        padding: 16px 18px;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 13px;
        line-height: 1.6;
        min-height: 100px;
        transition: opacity 0.2s;
      }
      #worktree-bonus .wb-editor .header {
        font-size: 11px; color: var(--fg-muted,#7d8590); margin-bottom: 8px;
        text-transform: uppercase; letter-spacing: 0.08em;
      }

      #worktree-bonus .wb-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 18px; align-items: center; }
      #worktree-bonus .wb-final {
        margin-top: 40px;
        text-align: center;
        padding: 40px 20px;
        border: 1px solid var(--success-emphasis,#3fb950);
        border-radius: 12px;
        background: rgba(63,185,80,0.05);
      }
      #worktree-bonus .wb-final h2 { font-size: 26px; margin: 0 0 8px; }
      #worktree-bonus .wb-counter { font-size: 12px; color: var(--fg-muted,#7d8590); }

      /* ===== 选修菜单 + 选修关（elective- / re- 前缀） ===== */
      #elective-menu, #readme-elective {
        position: fixed; inset: 0;
        background: var(--bg-canvas,#0d1117);
        color: var(--fg-default,#e6edf3);
        z-index: 9800;
        overflow: auto;
        padding: 48px 20px;
        font-family: inherit;
      }
      .elective-wrap { max-width: 920px; margin: 0 auto; }
      .elective-head { text-align: center; margin-bottom: 32px; }
      .elective-head h1 { font-size: 28px; margin: 0 0 10px; }
      .elective-head p { color: var(--fg-muted,#7d8590); margin: 0; font-size: 15px; }

      .elective-cards {
        display: grid;
        grid-template-columns: 1fr;
        gap: 16px;
        margin-top: 8px;
      }
      .elective-card {
        position: relative;
        display: flex; align-items: flex-start; gap: 18px;
        text-align: left;
        width: 100%;
        padding: 22px 24px;
        border: 1px solid var(--border-default,#30363d);
        border-radius: 14px;
        background: rgba(110,118,129,0.06);
        color: inherit;
        font-family: inherit;
        cursor: pointer;
        transition: transform 0.2s cubic-bezier(.4,1.4,.5,1), border-color 0.2s, box-shadow 0.2s, background 0.2s;
      }
      .elective-card:hover {
        transform: translateY(-3px);
        border-color: var(--accent-emphasis,#2f81f7);
        box-shadow: 0 14px 32px rgba(0,0,0,0.4);
        background: rgba(47,129,247,0.06);
      }
      .elective-card .elective-emoji { font-size: 38px; line-height: 1; flex: none; }
      .elective-card .elective-text h3 { margin: 0 0 6px; font-size: 18px; }
      .elective-card .elective-text p { margin: 0; font-size: 14px; color: var(--fg-muted,#7d8590); line-height: 1.55; }
      .elective-card.done { border-color: var(--success-emphasis,#3fb950); background: rgba(63,185,80,0.06); }
      .elective-card .elective-check {
        position: absolute; top: 14px; right: 16px;
        font-size: 13px; font-weight: 600;
        color: var(--success-emphasis,#3fb950);
        display: none;
      }
      .elective-card.done .elective-check { display: inline-flex; align-items: center; gap: 4px; }
      .elective-card.elective-finish { background: transparent; }

      /* readme 关 */
      #readme-elective h1 { font-size: 26px; margin: 0 0 6px; }
      #readme-elective p.re-lead { color: var(--fg-muted,#7d8590); margin: 0 0 8px; }
      .re-screen { display: none; }
      .re-screen.active { display: block; animation: re-fade 0.3s ease; }
      @keyframes re-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
      .re-steps {
        display: flex; gap: 8px; justify-content: center;
        margin: 18px 0 26px;
      }
      .re-dot {
        width: 9px; height: 9px; border-radius: 999px;
        background: rgba(110,118,129,0.4);
        transition: background 0.2s, width 0.2s;
      }
      .re-dot.active { background: var(--accent-emphasis,#2f81f7); width: 24px; }

      .re-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 14px;
        margin-top: 18px;
      }
      .re-tip {
        border: 1px solid var(--border-default,#30363d);
        border-radius: 12px;
        padding: 16px 18px;
        background: rgba(110,118,129,0.06);
      }
      .re-tip .re-tip-head { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
      .re-tip .re-tip-emoji { font-size: 22px; }
      .re-tip h4 { margin: 0; font-size: 15px; }
      .re-tip p { margin: 0; font-size: 13px; color: var(--fg-muted,#7d8590); line-height: 1.6; }
      .re-tip code {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 12px;
        background: rgba(110,118,129,0.18);
        padding: 1px 5px; border-radius: 4px;
        color: var(--fg-default,#e6edf3);
      }

      /* Markdown 渲染演示：左源码 右渲染 */
      .re-demo {
        margin-top: 26px;
        border: 1px solid var(--border-default,#30363d);
        border-radius: 12px;
        overflow: hidden;
      }
      .re-demo-bar {
        font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em;
        color: var(--fg-muted,#7d8590);
        padding: 10px 16px;
        border-bottom: 1px solid var(--border-default,#30363d);
        background: rgba(110,118,129,0.06);
      }
      .re-demo-cols { display: grid; grid-template-columns: 1fr 1fr; }
      @media (max-width: 640px) { .re-demo-cols { grid-template-columns: 1fr; } }
      .re-demo-col { padding: 16px 18px; min-height: 220px; }
      .re-demo-col + .re-demo-col { border-left: 1px solid var(--border-default,#30363d); }
      .re-demo-col .re-col-label {
        font-size: 11px; color: var(--fg-muted,#7d8590);
        margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em;
      }
      .re-src {
        margin: 0;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 13px; line-height: 1.7;
        white-space: pre-wrap; word-break: break-word;
        background: #010409;
        padding: 14px 16px; border-radius: 8px;
        color: #c9d1d9;
      }
      .re-rendered { font-size: 14px; line-height: 1.7; }
      .re-rendered h1 { font-size: 22px; margin: 0 0 4px; padding-bottom: 6px; border-bottom: 1px solid var(--border-default,#30363d); }
      .re-rendered h2 { font-size: 17px; margin: 16px 0 6px; }
      .re-rendered p { margin: 8px 0; }
      .re-rendered ul { margin: 8px 0; padding-left: 22px; }
      .re-rendered li { margin: 3px 0; }
      .re-rendered code {
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 12.5px;
        background: rgba(110,118,129,0.2);
        padding: 1px 5px; border-radius: 4px;
      }

      /* readme checklist */
      .re-checklist { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
      .re-check-item {
        display: flex; align-items: flex-start; gap: 12px;
        border: 1px solid var(--border-default,#30363d);
        border-radius: 10px;
        padding: 14px 16px;
        background: rgba(110,118,129,0.06);
      }
      .re-check-item .re-check-num {
        flex: none;
        width: 26px; height: 26px; border-radius: 999px;
        display: flex; align-items: center; justify-content: center;
        font-size: 13px; font-weight: 700;
        background: rgba(47,129,247,0.15); color: var(--accent-emphasis,#2f81f7);
      }
      .re-check-item h4 { margin: 0 0 3px; font-size: 14.5px; }
      .re-check-item p { margin: 0; font-size: 13px; color: var(--fg-muted,#7d8590); line-height: 1.5; }
      .re-check-item .opt { font-size: 11px; color: var(--fg-muted,#7d8590); font-weight: 400; }

      /* readme 关里的 AI 咒语卡（复用 worktree 关样式风格） */
      .re-ai {
        margin-top: 26px;
        background: rgba(110,118,129,0.06);
        border: 1px solid var(--border-default,#30363d);
        border-radius: 12px;
        padding: 20px 22px;
      }
      .re-ai .re-ai-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: var(--fg-muted,#7d8590); }
      .re-ai .re-ai-prompt {
        margin-top: 10px;
        padding: 14px 16px;
        background: rgba(47,129,247,0.08);
        border-left: 3px solid var(--accent-emphasis,#2f81f7);
        border-radius: 6px;
        font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
        font-size: 15px; line-height: 1.5;
        white-space: pre-wrap; word-break: break-word;
      }

      .re-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 28px; align-items: center; }
      .re-actions .spacer { flex: 1; }

      .elective-final {
        margin-top: 24px;
        text-align: center;
        padding: 44px 20px;
        border: 1px solid var(--success-emphasis,#3fb950);
        border-radius: 14px;
        background: rgba(63,185,80,0.05);
      }
      .elective-final h2 { font-size: 26px; margin: 0 0 10px; }
      .elective-final p { color: var(--fg-muted,#7d8590); margin: 0 0 6px; line-height: 1.7; }
    `;
    const style = el('style', { id: STYLE_ID, type: 'text/css' });
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }

  // ---------------------------------------------------------------------------
  // Toast
  // ---------------------------------------------------------------------------
  function getToastHost() {
    let host = $('.tut-toast-host');
    if (!host) {
      host = el('div', { class: 'tut-toast-host' });
      document.body.appendChild(host);
    }
    return host;
  }
  function toast(msg, opts) {
    opts = opts || {};
    const host = getToastHost();
    const t = el('div', { class: 'tut-toast ' + (opts.kind || '') }, msg);
    host.appendChild(t);
    const ttl = opts.duration || 3000;
    setTimeout(() => {
      t.style.transition = 'opacity 0.3s';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 320);
    }, ttl);
    return t;
  }

  // ---------------------------------------------------------------------------
  // TutorialEngine
  // ---------------------------------------------------------------------------
  class TutorialEngine {
    constructor(steps, pitfalls, glossary) {
      this.steps = Array.isArray(steps) ? steps : [];
      this.pitfalls = Array.isArray(pitfalls) ? pitfalls : [];
      this.glossary = glossary || {};
      this.current = 0;
      this.paused = false;
      this.storageKey = 'tutorialStep';
      this.versionKey = 'tutorialVersion';
      this.version = (window.TUTORIAL_VERSION || 'v0') + ':' + (Array.isArray(steps) ? steps.length : 0);
      // 版本变了 → 自动清进度
      if (localStorage.getItem(this.versionKey) !== this.version) {
        localStorage.removeItem(this.storageKey);
        localStorage.setItem(this.versionKey, this.version);
      }

      // DOM 引用
      this.overlay = null;       // 黑色蒙层 (transparent，用 spotlight 的 box-shadow 模拟蒙层)
      this.spotlight = null;     // 挖洞高亮框
      this.bubble = null;
      this.topbar = null;
      this.topbarFill = null;
      this.aiCard = null;
      this.resumeBtn = null;

      // 当前 target 节点（用于撤销 lift）
      this._liftedTarget = null;
      this._targetClickHandler = null;
      this._inputHandler = null;
      this._resizeHandler = null;
      this._keyHandler = null;
      this._hashHandler = null;
    }

    // -------------------------------------------------------------------------
    // 生命周期
    // -------------------------------------------------------------------------
    async start(fromStorage) {
      injectStyle();
      this._mountChrome();

      let startIdx = 0;
      if (fromStorage !== false) {
        const saved = parseInt(localStorage.getItem(this.storageKey) || '0', 10);
        if (!isNaN(saved) && saved >= 0 && saved < this.steps.length) startIdx = saved;
      }
      this.current = startIdx;

      this._bindGlobalEvents();
      await this.gotoStep(this.current, { skipPitfall: true });
    }

    stop() {
      this._cleanupStep();
      if (this.overlay) this.overlay.remove();
      if (this.spotlight) this.spotlight.remove();
      if (this.bubble) this.bubble.remove();
      if (this.topbar) this.topbar.remove();
      if (this.sidebar) this.sidebar.remove();
      if (this.aiCard) this.aiCard.remove();
      if (this.resumeBtn) this.resumeBtn.remove();
      document.body.classList.remove('tut-active');
      this.overlay = this.spotlight = this.bubble = this.topbar = this.sidebar = this.sidebarBody = this.resetBtn = this.aiCard = this.resumeBtn = null;

      if (this._keyHandler) window.removeEventListener('keydown', this._keyHandler);
      if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler);
      if (this._hashHandler) window.removeEventListener('hashchange', this._hashHandler);
      if (this._scrollHandler) window.removeEventListener('scroll', this._scrollHandler, true);
    }

    pause() {
      if (this.paused) return;
      this.paused = true;
      if (this.overlay) this.overlay.style.display = 'none';
      if (this.spotlight) this.spotlight.style.display = 'none';
      if (this.bubble) this.bubble.style.display = 'none';
      if (this.topbar) this.topbar.style.opacity = '0.2';
      this._showResumeButton();
    }

    resume() {
      if (!this.paused) return;
      this.paused = false;
      if (this.overlay) this.overlay.style.display = '';
      if (this.spotlight) this.spotlight.style.display = '';
      if (this.bubble) this.bubble.style.display = '';
      if (this.topbar) this.topbar.style.opacity = '1';
      if (this.resumeBtn) { this.resumeBtn.remove(); this.resumeBtn = null; }
      // 重新定位（resize 期间可能错位）
      this._reposition();
    }

    // -------------------------------------------------------------------------
    // 步进
    // -------------------------------------------------------------------------
    next() {
      const nextIdx = this.current + 1;
      if (nextIdx >= this.steps.length) {
        // 主线通关 → worktree bonus
        this._finishMainLine();
        return;
      }
      return this.gotoStep(nextIdx);
    }

    prev() {
      if (this.current <= 0) return;
      return this.gotoStep(this.current - 1, { skipPitfall: true });
    }

    async gotoStep(n, opts) {
      opts = opts || {};
      if (n < 0 || n >= this.steps.length) return;
      const step = this.steps[n];

      // —— PITFALL 检查（进入 step.id 之前）——
      if (!opts.skipPitfall) {
        const blocking = this._runPitfalls(step.id);
        if (blocking) return; // 拦下，不前进
      }

      this._cleanupStep();
      this.current = n;
      localStorage.setItem(this.storageKey, String(n));
      this._updateTopbar();

      // 路由切换
      if (step.page && step.page !== 'ai') {
        if (location.hash !== '#' + step.page) {
          location.hash = '#' + step.page;
        }
        await sleep(110); // 等页面切换
      }

      // AI 咒语卡片是独立分支
      if (step.page === 'ai' || step.nextOn === 'aiPrompt') {
        return this._renderAICard(step);
      }

      // target spotlight
      if (step.target) {
        const targetEl = $(`[data-tut="${step.target}"]`);
        if (targetEl) {
          this._spotlight(targetEl);
          this._liftedTarget = targetEl;
          targetEl.classList.add('tut-target-lift');
        } else {
          // 目标缺失 → toast 警告，但仍渲染气泡（垂直居中）
          toast(`找不到目标元素 [data-tut="${step.target}"]，请检查 UI`, { kind: 'warn' });
        }
      } else {
        this._hideSpotlight();
      }

      // 气泡
      this._renderBubble(step);

      // nextOn 绑定
      this._bindAdvance(step);
    }

    // -------------------------------------------------------------------------
    // PITFALL
    // -------------------------------------------------------------------------
    _runPitfalls(upcomingStepId) {
      let blocked = false;
      // 从真实 DOM 读取字段，供 PITFALL check 使用
      const readVal = (sel) => {
        const e = document.querySelector(`[data-tut="${sel}"]`);
        return e && 'value' in e ? (e.value || '') : '';
      };
      let mergeMethod = 'merge';
      const mm = document.querySelector('input[name="merge-method"]:checked, input[name="merge_method"]:checked, input[name="mergeStrategy"]:checked');
      if (mm) mergeMethod = mm.value;
      const ctx = {
        engine: this,
        stepId: upcomingStepId,
        prDescription: readVal('pr-description-input'),
        prTitle: readVal('pr-title-input'),
        branchName: readVal('branch-name-input'),
        mergeMethod: mergeMethod,
      };
      this.pitfalls.forEach((p) => {
        if (p.beforeStep !== upcomingStepId) return;
        let hit = false;
        try { hit = !!p.check(ctx); } catch (e) { hit = false; }
        if (hit) {
          toast(p.message || '⚠️ 有点小问题', { kind: p.block ? 'error' : 'warn', duration: 4200 });
          if (p.block) blocked = true;
        }
      });
      return blocked;
    }

    // -------------------------------------------------------------------------
    // Chrome（顶部进度条 + overlay 容器）
    // -------------------------------------------------------------------------
    _mountChrome() {
      // 顶部进度条
      this.topbar = el('div', { class: 'tut-topbar' });
      this.topbarFill = el('div', { class: 'tut-topbar-fill' });
      this.topbar.appendChild(this.topbarFill);
      document.body.appendChild(this.topbar);

      // 左侧固定侧边栏（容纳 bubble / AI 卡片，永不挡按钮）
      document.body.classList.add('tut-active');
      this.sidebar = el('div', { class: 'tut-sidebar' });
      const sbHead = el('div', { class: 'tut-sb-head' });
      sbHead.appendChild(el('div', { class: 'tut-sb-title' }, '📘 GitHub 协作教程'));
      this.sidebarBody = el('div', { class: 'tut-sb-body' });
      const sbFoot = el('div', { class: 'tut-sb-foot' });

      // footer 左：键盘提示
      const kbdHint = el('div', null);
      kbdHint.innerHTML = '<span class="tut-sb-kbd">←</span> <span class="tut-sb-kbd">→</span> 翻页 · <span class="tut-sb-kbd">Esc</span> 暂停';
      sbFoot.appendChild(kbdHint);

      // footer 右：从头开始
      this.resetBtn = el('button', {
        class: 'tut-btn ghost',
        style: { fontSize: '12px', padding: '4px 8px' },
        title: '清空进度，从第 1 步重新开始',
        onclick: () => {
          if (typeof window.confirm === 'function' && !window.confirm('确认从头重新开始？当前进度会被清空。')) return;
          localStorage.removeItem(this.storageKey);
          location.reload();
        },
      }, '↻ 从头开始');
      sbFoot.appendChild(this.resetBtn);

      this.sidebar.appendChild(sbHead);
      this.sidebar.appendChild(this.sidebarBody);
      this.sidebar.appendChild(sbFoot);
      document.body.appendChild(this.sidebar);

      // overlay 一直挂着（pointer-events 默认放行点击）
      // 注意：spotlight 元素本身的 box-shadow 9999px 已经构成"蒙层"
      // 这里 overlay 是个透明拦截层，只在没有 target 的时候才接收点击
      // 大多数步骤希望目标可点击 → overlay pointer-events:none
      this.overlay = el('div', { class: 'tut-overlay' });
      this.overlay.style.pointerEvents = 'none';
      document.body.appendChild(this.overlay);

      // spotlight
      this.spotlight = el('div', { class: 'tut-spotlight' });
      this.spotlight.style.display = 'none';
      document.body.appendChild(this.spotlight);

      // 气泡（放在 sidebar 内）
      this.bubble = el('div', { class: 'tut-bubble' });
      this.bubble.style.display = 'none';
      this.sidebarBody.appendChild(this.bubble);
    }

    _updateTopbar() {
      if (!this.topbarFill) return;
      const total = this.steps.length || 1;
      const pct = ((this.current + 1) / total) * 100;
      this.topbarFill.style.width = pct + '%';
    }

    // -------------------------------------------------------------------------
    // Spotlight 视觉
    // -------------------------------------------------------------------------
    _spotlight(target) {
      if (!this.spotlight) return;
      this.spotlight.style.display = 'block';
      // 把目标滚到可见区
      try {
        const r = target.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.top < 80 || r.bottom > vh - 60) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } catch (e) {}
      this._placeSpotlight(target);
    }

    _placeSpotlight(target) {
      const r = target.getBoundingClientRect();
      const pad = 6;
      this.spotlight.style.top = (r.top - pad) + 'px';
      this.spotlight.style.left = (r.left - pad) + 'px';
      this.spotlight.style.width = (r.width + pad * 2) + 'px';
      this.spotlight.style.height = (r.height + pad * 2) + 'px';
    }

    _hideSpotlight() {
      if (!this.spotlight) return;
      // 没 target 也要保留全屏暗化 → 用一个伪 spotlight 放在屏外
      this.spotlight.style.display = 'block';
      this.spotlight.style.top = '-9999px';
      this.spotlight.style.left = '-9999px';
      this.spotlight.style.width = '0px';
      this.spotlight.style.height = '0px';
    }

    // -------------------------------------------------------------------------
    // 气泡
    // -------------------------------------------------------------------------
    _renderBubble(step) {
      if (!this.bubble) return;
      this.bubble.style.display = 'block';
      this.bubble.innerHTML = '';

      const role = step.role || 'student';
      const roleLabel = role === 'teacher' ? '仓库主人' : role === 'system' ? '系统' : '同学';

      const roleEl = el('span', { class: 'tut-role role-' + role }, roleLabel);
      const titleEl = el('h3', null, step.title || '');

      const bodyEl = el('div', { class: 'tut-body' });
      bodyEl.innerHTML = textPreprocess(step.body || '', this.glossary);

      const progressEl = el('span', { class: 'tut-progress-txt' }, `${this.current + 1} / ${this.steps.length}`);

      const prevBtn = el('button', {
        class: 'tut-btn secondary',
        onclick: () => this.prev(),
      }, '上一步');
      if (this.current === 0) prevBtn.disabled = true;

      const nextBtn = el('button', {
        class: 'tut-btn',
        onclick: () => this.next(),
      }, this.current === this.steps.length - 1 ? '完成' : '下一步');
      nextBtn.dataset.role = 'tut-next';

      // 不同 nextOn 决定 nextBtn 行为
      if (step.nextOn === 'click') {
        // 隐藏下一步按钮：靠点击目标推进
        nextBtn.style.display = 'none';
      } else if (step.nextOn === 'input') {
        nextBtn.disabled = true; // 等待 input 验证
      }

      const skipBtn = el('button', {
        class: 'tut-btn ghost',
        onclick: () => {
          if (confirmSkip()) this._skipCurrent();
        },
      }, '跳过');
      function confirmSkip() {
        // 不用 confirm()，用 toast 形式提示，但用户偏好点跳过即跳过
        return true;
      }

      const actionsRow = el('div', { class: 'tut-row' }, [
        progressEl,
        el('div', null, [prevBtn, document.createTextNode(' '), nextBtn]),
      ]);

      this.bubble.appendChild(roleEl);
      this.bubble.appendChild(titleEl);
      this.bubble.appendChild(bodyEl);
      this.bubble.appendChild(actionsRow);
      const ghostRow = el('div', { style: { marginTop: '6px', textAlign: 'left' } }, [skipBtn]);
      this.bubble.appendChild(ghostRow);

      // 给气泡内的 data-term 绑 tooltip
      this._bindBubbleTerms();

      this._positionBubble(step);
    }

    _bindBubbleTerms() {
      // 这里依赖 initGlossaryTooltips 的全局监听（已绑在 document）。
      // 但有些教程可能没调用它 → fallback：单独绑一下
      if (!document.body.__tutGlossaryBound) {
        bindGlossaryDelegation(this.glossary);
        document.body.__tutGlossaryBound = true;
      }
    }

    _positionBubble(step) {
      // v6: bubble 现在挂在 sidebar 内（static），无需浮动定位
      if (this.sidebarBody && this.bubble && this.bubble.parentElement === this.sidebarBody) {
        this.bubble.style.top = '';
        this.bubble.style.left = '';
        // 滚 sidebar 到顶让用户看到新内容
        this.sidebarBody.scrollTop = 0;
        return;
      }
      const target = step.target ? $(`[data-tut="${step.target}"]`) : null;
      const bubble = this.bubble;
      // 先放出再量尺寸
      bubble.style.top = '-9999px';
      bubble.style.left = '-9999px';
      const bw = bubble.offsetWidth || 320;
      const bh = bubble.offsetHeight || 180;
      const margin = 14;
      const vw = window.innerWidth, vh = window.innerHeight;

      let top, left;
      if (!target) {
        // 居中略偏下
        top = Math.max(40, (vh - bh) / 2);
        left = Math.max(20, (vw - bw) / 2);
      } else {
        const r = target.getBoundingClientRect();
        // 优先放到下方
        if (r.bottom + bh + margin < vh) {
          top = r.bottom + margin;
          left = r.left;
        } else if (r.top - bh - margin > 0) {
          top = r.top - bh - margin;
          left = r.left;
        } else if (r.right + bw + margin < vw) {
          top = r.top;
          left = r.right + margin;
        } else if (r.left - bw - margin > 0) {
          top = r.top;
          left = r.left - bw - margin;
        } else {
          // fallback：屏幕中央
          top = (vh - bh) / 2;
          left = (vw - bw) / 2;
        }
        // 横向避免出屏
        left = Math.max(12, Math.min(left, vw - bw - 12));
        top = Math.max(12, Math.min(top, vh - bh - 12));
      }
      bubble.style.top = top + 'px';
      bubble.style.left = left + 'px';
    }

    _reposition() {
      const step = this.steps[this.current];
      if (!step) return;
      if (step.target) {
        const t = $(`[data-tut="${step.target}"]`);
        if (t) this._placeSpotlight(t);
      }
      this._positionBubble(step);
    }

    // -------------------------------------------------------------------------
    // nextOn 推进逻辑
    // -------------------------------------------------------------------------
    _bindAdvance(step) {
      const target = step.target ? $(`[data-tut="${step.target}"]`) : null;
      const mode = step.nextOn || 'auto';

      if (mode === 'click' && target) {
        this._targetClickHandler = (e) => {
          // 给 UI 自己也执行一下默认动作再前进
          setTimeout(() => this.next(), 80);
        };
        target.addEventListener('click', this._targetClickHandler, { once: true });
      } else if (mode === 'input' && target) {
        // 解析 validator：支持 function、字符串 "contains:xxx"，否则默认非空
        let validator;
        const iv = step.inputValidator;
        if (typeof iv === 'function') {
          validator = iv;
        } else if (typeof iv === 'string' && /^contains:/i.test(iv)) {
          const needle = iv.slice(iv.indexOf(':') + 1);
          validator = (v) => !!v && String(v).indexOf(needle) !== -1;
        } else {
          validator = (v) => !!v && String(v).length > 0;
        }

        const nextBtn = this.bubble.querySelector('[data-role="tut-next"]');
        const update = () => { nextBtn.disabled = !validator(target.value); };
        this._inputHandler = update;
        target.addEventListener('input', update);
        target.addEventListener('change', update);
        update();

        // 输入框内按 Enter 直接确认（验证通过时）。教学场景不需要多行，牺牲换行换取顺手。
        this._inputKeyHandler = (e) => {
          if (e.key !== 'Enter') return;
          if (validator(target.value)) {
            e.preventDefault();
            this.next();
          }
        };
        target.addEventListener('keydown', this._inputKeyHandler);

        // 气泡里加亮色快捷键提示
        const hint = el('div', { class: 'tut-enter-hint' }, '⏎ 输入完按 Enter 确认');
        this.bubble.appendChild(hint);
      } else if (mode === 'auto' && target) {
        // auto + 输入框：焦点在框里时全局 Enter 会因"正在打字"被放行 → 补绑框内 Enter 前进
        const tag = (target.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') {
          this._inputKeyHandler = (e) => {
            if (e.key !== 'Enter') return;
            const allow = tag === 'textarea' ? (e.ctrlKey || e.metaKey) : true;
            if (allow) { e.preventDefault(); this.next(); }
          };
          target.addEventListener('keydown', this._inputKeyHandler);
          const hint = el('div', { class: 'tut-enter-hint' },
            tag === 'textarea' ? '⏎ 打完按 Ctrl+Enter 继续' : '⏎ 打完按 Enter 继续');
          this.bubble.appendChild(hint);
        }
      }
      // auto（无输入框）: 靠"下一步"按钮/方向键
      // aiPrompt: 已走 _renderAICard
    }

    _cleanupStep() {
      // 解绑前一步的 listener
      if (this._liftedTarget) {
        this._liftedTarget.classList.remove('tut-target-lift');
        if (this._targetClickHandler) {
          this._liftedTarget.removeEventListener('click', this._targetClickHandler);
        }
        if (this._inputHandler) {
          this._liftedTarget.removeEventListener('input', this._inputHandler);
          this._liftedTarget.removeEventListener('change', this._inputHandler);
        }
        if (this._inputKeyHandler) {
          this._liftedTarget.removeEventListener('keydown', this._inputKeyHandler);
        }
        this._liftedTarget = null;
      }
      this._targetClickHandler = null;
      this._inputHandler = null;
      this._inputKeyHandler = null;

      // 关 AI 卡片
      if (this.aiCard) {
        this.aiCard.remove();
        this.aiCard = null;
      }
    }

    // -------------------------------------------------------------------------
    // AI 咒语全屏卡片
    // -------------------------------------------------------------------------
    _renderAICard(step) {
      // 隐藏 spotlight / 气泡
      if (this.spotlight) this.spotlight.style.display = 'none';
      if (this.bubble) this.bubble.style.display = 'none';

      const hasAiPrompt = !!step.aiPrompt; // 有咒语 = 真"对 AI 说"卡片；无 = 旁白介绍卡片
      const card = el('div', { class: 'tut-ai-card' });
      const inner = el('div', { class: 'tut-ai-inner' });

      const role = step.role || 'student';
      const roleLabel = role === 'teacher' ? '仓库主人' : role === 'system' ? '系统' : '同学';

      inner.appendChild(el('span', { class: 'tut-role role-' + role, style: { display: 'inline-block', marginBottom: '8px' } }, roleLabel));

      if (hasAiPrompt) {
        // —— 真"对 AI 说"卡片：上方咒语框（纯文本，可复制），下方说明
        inner.appendChild(el('h2', null, '对 AI 说'));
        if (step.title) inner.appendChild(el('div', { style: { fontSize: '15px', marginTop: '6px', color: 'var(--fg-muted,#7d8590)' } }, step.title));

        const promptBox = el('div', { class: 'tut-ai-prompt' }, step.aiPrompt);
        inner.appendChild(promptBox);

        if (step.body) {
          const sub = el('div', { style: { fontSize: '13px', color: 'var(--fg-muted,#7d8590)', marginBottom: '14px', lineHeight: '1.7' } });
          sub.innerHTML = textPreprocess(step.body, this.glossary);
          inner.appendChild(sub);
        }
      } else {
        // —— 旁白/介绍卡片（chapter 0 / 系统讲解）：title + 富文本 body
        if (step.title) inner.appendChild(el('h2', null, step.title));

        if (step.body) {
          const bodyEl = el('div', { class: 'tut-ai-prompt', style: { whiteSpace: 'normal', fontFamily: 'inherit', fontSize: '15px', lineHeight: '1.85' } });
          bodyEl.innerHTML = textPreprocess(step.body, this.glossary);
          inner.appendChild(bodyEl);
        }
      }

      const actionBtns = [];
      actionBtns.push(el('button', { class: 'tut-btn ghost', onclick: () => this.prev() }, '上一步'));

      if (hasAiPrompt) {
        const copyBtn = el('button', {
          class: 'tut-btn secondary',
          onclick: async () => {
            try {
              await navigator.clipboard.writeText(step.aiPrompt);
              toast('已复制到剪贴板', { kind: 'ok', duration: 1500 });
            } catch (e) {
              const ta = el('textarea', null, step.aiPrompt);
              document.body.appendChild(ta); ta.select();
              try { document.execCommand('copy'); toast('已复制', { kind: 'ok', duration: 1500 }); } catch (_) { toast('复制失败，请手动选中', { kind: 'warn' }); }
              ta.remove();
            }
          },
        }, '复制');
        actionBtns.push(copyBtn);
      }

      const doneBtn = el('button', { class: 'tut-btn', onclick: () => this.next() }, hasAiPrompt ? '我说完了' : '下一步');
      actionBtns.push(doneBtn);

      const actions = el('div', { class: 'tut-ai-actions' }, actionBtns);
      inner.appendChild(actions);

      const progress = el('div', { style: { textAlign: 'center', fontSize: '12px', color: 'var(--fg-muted,#7d8590)', marginTop: '14px' } },
        `${this.current + 1} / ${this.steps.length}`);
      inner.appendChild(progress);

      card.appendChild(inner);
      // 放到 sidebar 内（不再全屏覆盖）
      if (this.sidebarBody) {
        this.sidebarBody.appendChild(card);
      } else {
        document.body.appendChild(card);
      }
      this.aiCard = card;
    }

    // -------------------------------------------------------------------------
    // 全局事件
    // -------------------------------------------------------------------------
    _bindGlobalEvents() {
      this._keyHandler = (e) => {
        // Escape 始终可用（暂停/继续）
        if (e.key === 'Escape') {
          e.preventDefault();
          if (this.paused) this.resume(); else this.pause();
          return;
        }
        if (this.paused) return;

        // 在输入框/文本域里时，放行所有按键（让用户正常打字、移动光标），
        // 不抢方向键/Enter —— 否则会误触翻页
        const tag = (e.target && e.target.tagName || '').toLowerCase();
        const typing = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
        if (typing) return;

        if (e.key === 'ArrowRight') {
          e.preventDefault();
          this.next();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          this.prev();
        } else if (e.key === 'Enter' || e.key === ' ') {
          // Enter / 空格 = 下一步，仅对"不需要点真实目标"的步骤生效
          const step = this.steps[this.current];
          const mode = (step && step.nextOn) || 'auto';
          if (mode === 'auto' || mode === 'aiPrompt') {
            e.preventDefault();
            this.next();
          } else if (mode === 'input') {
            // 仅当输入验证通过（下一步按钮可用）才前进
            const nb = this.bubble && this.bubble.querySelector('[data-role="tut-next"]');
            if (nb && !nb.disabled) { e.preventDefault(); this.next(); }
          }
          // click 模式：Enter 不前进，必须点真实目标（保留教学练习）
        }
      };
      window.addEventListener('keydown', this._keyHandler);

      this._resizeHandler = () => this._reposition();
      window.addEventListener('resize', this._resizeHandler);

      this._hashHandler = () => {
        // 用户手动改 hash 时不强制
        this._reposition();
      };
      window.addEventListener('hashchange', this._hashHandler);

      // 滚动时 spotlight 跟随目标重新定位（RAF throttle）
      this._scrollScheduled = false;
      this._scrollHandler = () => {
        if (this._scrollScheduled) return;
        this._scrollScheduled = true;
        requestAnimationFrame(() => {
          this._scrollScheduled = false;
          // 只重定位 spotlight，不滚 scrollIntoView（防止死循环）
          const step = this.steps[this.current];
          if (step && step.target) {
            const t = document.querySelector(`[data-tut="${step.target}"]`);
            if (t) this._placeSpotlight(t);
          }
        });
      };
      window.addEventListener('scroll', this._scrollHandler, true); // capture，抓所有滚动容器
    }

    _showResumeButton() {
      if (this.resumeBtn) return;
      this.resumeBtn = el('button', {
        class: 'tut-resume-btn',
        onclick: () => this.resume(),
      }, '继续教程');
      document.body.appendChild(this.resumeBtn);
    }

    _skipCurrent() {
      // 跳过当前步：直接到下一步，不跑 pitfall（用户明确要跳）
      const nextIdx = this.current + 1;
      if (nextIdx >= this.steps.length) {
        this._finishMainLine();
      } else {
        this.gotoStep(nextIdx, { skipPitfall: true });
      }
    }

    _finishMainLine() {
      localStorage.removeItem(this.storageKey);
      this.stop();
      if (typeof window.showElectiveMenu === 'function') {
        window.showElectiveMenu();
      } else if (typeof window.startWorktreeBonus === 'function') {
        window.startWorktreeBonus();
      } else {
        toast('🎉 主线通关！', { kind: 'ok', duration: 4000 });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 术语 Tooltip 系统
  // ---------------------------------------------------------------------------
  let _glossaryTooltipEl = null;
  let _glossaryRef = null;

  function ensureGlossaryTooltipEl() {
    if (_glossaryTooltipEl) return _glossaryTooltipEl;
    _glossaryTooltipEl = el('div', { class: 'tut-glossary-tooltip' });
    _glossaryTooltipEl.style.display = 'none';
    document.body.appendChild(_glossaryTooltipEl);
    return _glossaryTooltipEl;
  }

  function showGlossaryTooltip(termKey, anchor) {
    if (!_glossaryRef) return;
    const entry = _glossaryRef[termKey] || _glossaryRef[termKey.toLowerCase()];
    if (!entry) return;
    const tip = ensureGlossaryTooltipEl();
    tip.innerHTML = '';
    tip.appendChild(el('h4', null, entry.name || termKey));
    if (entry.human) {
      const r = el('div', { class: 'row' });
      r.innerHTML = `<b>人话：</b>${escapeHTML(entry.human)}`;
      tip.appendChild(r);
    }
    if (entry.vibeCoder) {
      const r = el('div', { class: 'row' });
      r.innerHTML = `<b>对 AI 怎么说：</b>${escapeHTML(entry.vibeCoder)}`;
      tip.appendChild(r);
    }
    tip.style.display = 'block';
    // 定位
    const r = anchor.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let top = r.bottom + 8;
    let left = r.left;
    if (top + th > window.innerHeight - 8) top = r.top - th - 8;
    if (left + tw > window.innerWidth - 8) left = window.innerWidth - tw - 8;
    if (left < 8) left = 8;
    tip.style.top = top + 'px';
    tip.style.left = left + 'px';
  }
  function hideGlossaryTooltip() {
    if (_glossaryTooltipEl) _glossaryTooltipEl.style.display = 'none';
  }

  function bindGlossaryDelegation(glossary) {
    _glossaryRef = glossary || _glossaryRef || {};
    if (document.body.__tutGlossaryDelegated) return;
    document.body.__tutGlossaryDelegated = true;
    document.addEventListener('mouseover', (e) => {
      const t = e.target.closest && e.target.closest('[data-term]');
      if (!t) return;
      const key = t.getAttribute('data-term');
      if (!key) return;
      showGlossaryTooltip(key, t);
    });
    document.addEventListener('mouseout', (e) => {
      const t = e.target.closest && e.target.closest('[data-term]');
      if (!t) return;
      hideGlossaryTooltip();
    });
    document.addEventListener('focusin', (e) => {
      const t = e.target.closest && e.target.closest('[data-term]');
      if (t) showGlossaryTooltip(t.getAttribute('data-term'), t);
    });
    document.addEventListener('focusout', hideGlossaryTooltip);
    window.addEventListener('scroll', hideGlossaryTooltip, true);
  }

  function initGlossaryTooltips(glossary) {
    injectStyle();
    _glossaryRef = glossary || {};
    bindGlossaryDelegation(_glossaryRef);
    // 静态页面里已有的 [data-term] 节点已经有虚线下划线（CSS 选择器命中）
  }

  // ---------------------------------------------------------------------------
  // 黑话速记开局模态
  // ---------------------------------------------------------------------------
  function showGlossaryModal(glossary, onClose) {
    injectStyle();
    let modal = $('#glossary-modal');
    if (modal) modal.remove();

    const mask = el('div', { class: 'tut-modal-mask', id: 'glossary-modal' });
    const inner = el('div', { class: 'tut-modal' });

    inner.appendChild(el('h2', null, 'GitHub 黑话速记'));
    inner.appendChild(el('p', { class: 'sub' }, '先把这 10 个词混个脸熟。鼠标悬停页面里带虚线的词，可以随时回看。'));

    const grid = el('div', { class: 'grid' });
    const keys = Object.keys(glossary || {}).slice(0, 10);
    if (keys.length === 0) {
      grid.appendChild(el('div', { class: 'card' }, '（暂无术语数据）'));
    }
    keys.forEach((k) => {
      const entry = glossary[k];
      const card = el('div', { class: 'card' });
      card.appendChild(el('h4', null, entry.name || k));
      if (entry.human) {
        const r = el('div', { class: 'line' });
        r.innerHTML = `<b>人话：</b>${escapeHTML(entry.human)}`;
        card.appendChild(r);
      }
      if (entry.vibeCoder) {
        const r = el('div', { class: 'line' });
        r.innerHTML = `<b>对 AI：</b>${escapeHTML(entry.vibeCoder)}`;
        card.appendChild(r);
      }
      grid.appendChild(card);
    });
    inner.appendChild(grid);

    const foot = el('div', { class: 'foot' });
    const okBtn = el('button', {
      class: 'tut-btn',
      onclick: () => {
        mask.remove();
        if (typeof onClose === 'function') onClose();
      },
    }, '我看完了，开始教程');
    foot.appendChild(okBtn);
    inner.appendChild(foot);

    mask.appendChild(inner);
    document.body.appendChild(mask);
  }

  // ---------------------------------------------------------------------------
  // Worktree 加餐关
  // ---------------------------------------------------------------------------
  function startWorktreeBonus() {
    injectStyle();
    // 隐藏所有 page div（约定：直接子节点带 data-page）以及教程 overlay 残留
    $$('.tut-overlay, .tut-spotlight, .tut-bubble, .tut-topbar, .tut-reset-btn, .tut-ai-card, #glossary-modal').forEach((n) => n.remove());

    // 主 UI 通常用 hash 路由控制；我们额外把所有 [data-page] 隐藏（如果 ui.html 用这种约定）
    $$('[data-page]').forEach((n) => { n.style.display = 'none'; });

    let bonus = $('#worktree-bonus');
    if (bonus) bonus.remove();

    bonus = el('div', { id: 'worktree-bonus' });
    const wrap = el('div', { class: 'wb-wrap' });

    wrap.appendChild(el('h1', null, '🎉 主线通关！要解锁隐藏关卡吗？'));
    wrap.appendChild(el('p', { class: 'lead' }, '加餐：worktree —— 让你在同一份代码上"开多个分身"，互不干扰。'));

    // 开始按钮
    const startBtn = el('button', { class: 'tut-btn' }, '开始加餐');
    const intro = el('div', { style: { marginTop: '12px' } }, [startBtn]);
    wrap.appendChild(intro);

    // 加餐内容容器
    const stageHost = el('div', { style: { display: 'none', marginTop: '20px' } });

    // 文件夹 SVG
    const folderSVG = '<svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M.513 1.513A1.75 1.75 0 0 1 1.75 1h3.5c.55 0 1.07.26 1.4.7l.9 1.2a.25.25 0 0 0 .2.1H13a1.75 1.75 0 0 1 1.75 1.75v8.5A1.75 1.75 0 0 1 13 15H3a1.75 1.75 0 0 1-1.75-1.75V2.75c0-.464.184-.909.513-1.237Z"/></svg>';

    const folderA = el('div', { class: 'wb-folder A', dataset: { side: 'A' } });
    folderA.innerHTML =
      `<div style="color: var(--accent-emphasis,#2f81f7)">${folderSVG}</div>` +
      `<div class="branch">feature/A</div>` +
      `<div class="tag">AI 改了 5 个文件，未提交</div>`;

    const folderB = el('div', { class: 'wb-folder B', dataset: { side: 'B' } });
    folderB.innerHTML =
      `<div style="color: var(--success-emphasis,#3fb950)">${folderSVG}</div>` +
      `<div class="branch">feature/B</div>` +
      `<div class="tag">main 的稳定版</div>`;

    const toggleBtn = el('button', { class: 'tut-btn' }, '切换 worktree');
    const middle = el('div', { style: { textAlign: 'center' } }, [
      toggleBtn,
      el('div', { class: 'wb-counter', style: { marginTop: '8px' } }, '已切换 0 次'),
    ]);

    const stage = el('div', { class: 'wb-stage' }, [folderA, middle, folderB]);
    stageHost.appendChild(stage);

    // 编辑器
    const editor = el('div', { class: 'wb-editor' });
    const editorHeader = el('div', { class: 'header' }, 'feature/A · src/index.js');
    const editorBody = el('pre', { style: { margin: 0 } }, 'console.log("WIP - hello half done");');
    editor.appendChild(editorHeader);
    editor.appendChild(editorBody);
    stageHost.appendChild(editor);

    // 动作行
    const actions = el('div', { class: 'wb-actions' });
    const passBtn = el('button', { class: 'tut-btn', onclick: () => showFinal() }, '通关');
    passBtn.style.display = 'none';
    actions.appendChild(passBtn);
    stageHost.appendChild(actions);

    // AI 咒语卡片占位
    const aiCardHost = el('div', { style: { display: 'none', marginTop: '24px' } });
    const aiInner = el('div', {
      style: {
        background: 'rgba(110,118,129,0.06)',
        border: '1px solid var(--border-default,#30363d)',
        borderRadius: '10px',
        padding: '20px 22px',
      },
    });
    aiInner.appendChild(el('div', { style: { fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--fg-muted,#7d8590)' } }, '对 AI 说'));
    const aiPromptText = '帮我开一个 worktree 用来 review feature/B 分支';
    const aiPromptBox = el('div', {
      style: {
        marginTop: '10px',
        padding: '14px 16px',
        background: 'rgba(47,129,247,0.08)',
        borderLeft: '3px solid var(--accent-emphasis,#2f81f7)',
        borderRadius: '6px',
        fontFamily: 'ui-monospace, monospace',
        fontSize: '15px',
      },
    }, aiPromptText);
    aiInner.appendChild(aiPromptBox);
    const aiCopyBtn = el('button', {
      class: 'tut-btn secondary',
      style: { marginTop: '12px', marginRight: '8px' },
      onclick: async () => {
        try { await navigator.clipboard.writeText(aiPromptText); toast('已复制', { kind: 'ok', duration: 1500 }); } catch (e) { toast('复制失败', { kind: 'warn' }); }
      },
    }, '复制');
    aiInner.appendChild(aiCopyBtn);
    aiCardHost.appendChild(aiInner);
    stageHost.appendChild(aiCardHost);

    wrap.appendChild(stageHost);
    bonus.appendChild(wrap);
    document.body.appendChild(bonus);

    // 交互
    startBtn.addEventListener('click', () => {
      intro.style.display = 'none';
      stageHost.style.display = 'block';
      // 默认 A 在前
      folderA.classList.add('active');
      folderB.classList.add('dim');
    });

    let switchCount = 0;
    let activeSide = 'A';
    const counterEl = middle.querySelector('.wb-counter');

    toggleBtn.addEventListener('click', () => {
      activeSide = activeSide === 'A' ? 'B' : 'A';
      switchCount += 1;
      counterEl.textContent = `已切换 ${switchCount} 次`;

      // 交换 active/dim class
      folderA.classList.toggle('active');
      folderA.classList.toggle('dim');
      folderB.classList.toggle('active');
      folderB.classList.toggle('dim');

      // 编辑器内容切换
      editor.style.opacity = '0';
      setTimeout(() => {
        if (activeSide === 'A') {
          editorHeader.textContent = 'feature/A · src/index.js';
          editorBody.textContent = 'console.log("WIP - hello half done");';
        } else {
          editorHeader.textContent = 'feature/B · src/index.js';
          editorBody.textContent = 'console.log("stable");';
        }
        editor.style.opacity = '1';
      }, 180);

      if (switchCount === 3) {
        toast('看！进度互不影响 —— 两个 worktree 各做各的事 👀', { kind: 'ok', duration: 4500 });
        // 显示 AI 咒语 + 通关按钮
        aiCardHost.style.display = 'block';
        passBtn.style.display = '';
      }
    });

    function showFinal() {
      stageHost.style.display = 'none';
      intro.style.display = 'none';
      const final = el('div', { class: 'wb-final' });
      final.appendChild(el('h2', null, '🌿 你学会 worktree 了！'));
      final.appendChild(el('p', { class: 'lead' }, '同一份代码开多个分身，AI 在各自的 worktree 里干活，互不打架。'));
      const backBtn = el('button', {
        class: 'tut-btn',
        style: { marginTop: '14px' },
        onclick: () => {
          bonus.remove();
          markElectiveDone('worktree');
          if (typeof window.showElectiveMenu === 'function') {
            window.showElectiveMenu();
          } else {
            // 兜底：恢复 UI 页面显示
            $$('[data-page]').forEach((n) => { n.style.display = ''; });
            location.hash = '#repo';
          }
        },
      }, '← 回到选修菜单');
      final.appendChild(backBtn);
      wrap.appendChild(final);
    }
  }

  // ---------------------------------------------------------------------------
  // 选修关：状态 + 菜单
  // ---------------------------------------------------------------------------
  // 已完成的选修项（运行期内存即可，无需持久化）
  const _electiveDone = { readme: false, worktree: false };
  function markElectiveDone(key) {
    if (key in _electiveDone) _electiveDone[key] = true;
  }

  // 隐藏主 UI + 移除残留教程节点（选修各屏复用）
  function _clearStageForElective() {
    injectStyle();
    $$('.tut-overlay, .tut-spotlight, .tut-bubble, .tut-topbar, .tut-reset-btn, .tut-ai-card, #glossary-modal, .tut-sidebar')
      .forEach((n) => n.remove());
    document.body.classList.remove('tut-active');
    $$('[data-page]').forEach((n) => { n.style.display = 'none'; });
  }

  function showElectiveMenu() {
    _clearStageForElective();
    // 关掉其它选修全屏容器
    $$('#worktree-bonus, #readme-elective, #elective-menu').forEach((n) => n.remove());

    const root = el('div', { id: 'elective-menu' });
    const wrap = el('div', { class: 'elective-wrap' });

    const head = el('div', { class: 'elective-head' });
    head.appendChild(el('h1', null, '🎓 主线通关！来点选修？'));
    head.appendChild(el('p', null, '这些不是必须的，但会让你更像个老手。挨个看看，看完一关回到这里继续。'));
    wrap.appendChild(head);

    const cards = el('div', { class: 'elective-cards' });

    function makeCard(key, emoji, title, desc, onClick, opts) {
      opts = opts || {};
      const card = el('button', {
        class: 'elective-card' + (opts.finish ? ' elective-finish' : '') + (key && _electiveDone[key] ? ' done' : ''),
        type: 'button',
        onclick: onClick,
      });
      card.appendChild(el('div', { class: 'elective-emoji' }, emoji));
      const text = el('div', { class: 'elective-text' });
      text.appendChild(el('h3', null, title));
      text.appendChild(el('p', null, desc));
      card.appendChild(text);
      card.appendChild(el('span', { class: 'elective-check' }, '✓ 已看完'));
      cards.appendChild(card);
      return card;
    }

    makeCard(
      'readme', '📖', '读懂 & 写好 README',
      '30 秒看懂一个陌生项目，也让别人 30 秒看懂你的项目。',
      () => { root.remove(); if (typeof window.startReadmeElective === 'function') window.startReadmeElective(); }
    );
    makeCard(
      'worktree', '🌿', 'Worktree：AI 时代的多开神器',
      '同一份代码开多个"分身"，让 AI 各干各的，互不干扰。',
      () => { root.remove(); if (typeof window.startWorktreeBonus === 'function') window.startWorktreeBonus(); }
    );
    makeCard(
      null, '🏁', '我学够了，结束',
      '看看结业屏，回到 GitHub。',
      () => { root.remove(); showElectiveGraduation(); },
      { finish: true }
    );

    wrap.appendChild(cards);
    root.appendChild(wrap);
    document.body.appendChild(root);
  }

  // 终极结业屏（复用 worktree 关末尾的通关屏风格）
  function showElectiveGraduation() {
    _clearStageForElective();
    $$('#worktree-bonus, #readme-elective, #elective-menu').forEach((n) => n.remove());

    const root = el('div', { id: 'elective-menu' });
    const wrap = el('div', { class: 'elective-wrap' });

    const final = el('div', { class: 'elective-final' });
    final.appendChild(el('h2', null, '🏆 恭喜结业！'));
    final.appendChild(el('p', null, '你已掌握 vibe coder 的 GitHub 协作基本功：'));
    final.appendChild(el('p', null, 'issue → 分支 → commit → PR → review → merge，外加 README 与 worktree。'));
    final.appendChild(el('p', { style: { marginTop: '10px' } }, '可以开始真刀真枪地写项目了。'));

    const actions = el('div', { style: { marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' } });
    actions.appendChild(el('button', {
      class: 'tut-btn secondary',
      onclick: () => showElectiveMenu(),
    }, '← 再看看选修'));
    actions.appendChild(el('button', {
      class: 'tut-btn',
      onclick: () => {
        root.remove();
        $$('[data-page]').forEach((n) => { n.style.display = ''; });
        location.hash = '#repo';
      },
    }, '回到 GitHub'));
    final.appendChild(actions);

    wrap.appendChild(final);
    root.appendChild(wrap);
    document.body.appendChild(root);
  }

  // ---------------------------------------------------------------------------
  // 选修关：读懂 & 写好 README
  // ---------------------------------------------------------------------------
  function startReadmeElective() {
    _clearStageForElective();
    $$('#worktree-bonus, #readme-elective, #elective-menu').forEach((n) => n.remove());

    const root = el('div', { id: 'readme-elective' });
    const wrap = el('div', { class: 'elective-wrap' });

    wrap.appendChild(el('h1', null, '📖 读懂 & 写好 README'));
    wrap.appendChild(el('p', { class: 're-lead' }, 'README 是一个项目的"门面"——读项目先读它，写项目也要先写它。'));

    // 步骤指示点
    const dots = el('div', { class: 're-steps' }, [
      el('div', { class: 're-dot active', dataset: { i: '0' } }),
      el('div', { class: 're-dot', dataset: { i: '1' } }),
    ]);
    wrap.appendChild(dots);

    // ---------- 第一屏：如何快速读懂一个陌生项目 ----------
    const screen1 = el('div', { class: 're-screen active' });
    screen1.appendChild(el('h2', { style: { fontSize: '20px', margin: '0 0 4px' } }, '第一关 · 30 秒看懂一个陌生项目'));
    screen1.appendChild(el('p', { class: 're-lead' }, '拿到一个没见过的 GitHub 仓库，按这个顺序扫一眼，心里就有数了。'));

    const tip = (emoji, title, descHTML) => {
      const t = el('div', { class: 're-tip' });
      const head = el('div', { class: 're-tip-head' }, [
        el('span', { class: 're-tip-emoji' }, emoji),
        el('h4', null, title),
      ]);
      const p = el('p', null);
      p.innerHTML = descHTML;
      t.appendChild(head);
      t.appendChild(p);
      return t;
    };

    const grid1 = el('div', { class: 're-grid' }, [
      tip('📄', '先看 README', '项目是干啥的、怎么装、怎么用，基本都写在这里。划到仓库首页下方就能看到。'),
      tip('ℹ️', '看右上角 About', '一句话简介 + 几个标签（tag）+ 网站链接，最快了解"这是什么"。'),
      tip('🐛', '看 Issues', '有哪些已知问题、正在做的事、别人踩过的坑。'),
      tip('📁', '看文件结构', '<code>src/</code> 放源码，<code>package.json</code> 看依赖和命令，<code>docs/</code> 看文档。'),
      tip('⭐', '看 Star / Fork 数', '大概判断项目靠不靠谱、有多少人在用、值不值得依赖。'),
    ]);
    screen1.appendChild(grid1);

    // Markdown 渲染演示
    const mdSource =
      '# 打字爽\n' +
      '\n' +
      '一个让你**打字上瘾**的中文练习网站。\n' +
      '\n' +
      '## 安装\n' +
      '\n' +
      '`npm install`\n' +
      '\n' +
      '## 功能\n' +
      '\n' +
      '- 实时反馈\n' +
      '- 自定义文章\n' +
      '- 成绩统计\n';

    const demo = el('div', { class: 're-demo' });
    demo.appendChild(el('div', { class: 're-demo-bar' }, '同一段文字 · 左边你写的 Markdown 源码，右边 GitHub 自动渲染的样子'));
    const cols = el('div', { class: 're-demo-cols' });

    const colSrc = el('div', { class: 're-demo-col' });
    colSrc.appendChild(el('div', { class: 're-col-label' }, 'README.md 源码'));
    colSrc.appendChild(el('pre', { class: 're-src' }, mdSource));

    const colOut = el('div', { class: 're-demo-col' });
    colOut.appendChild(el('div', { class: 're-col-label' }, 'GitHub 上看到的'));
    const rendered = el('div', { class: 're-rendered' });
    rendered.innerHTML = renderMiniMarkdown(mdSource);
    colOut.appendChild(rendered);

    cols.appendChild(colSrc);
    cols.appendChild(colOut);
    demo.appendChild(cols);
    screen1.appendChild(demo);

    screen1.appendChild(el('p', {
      class: 're-lead',
      style: { marginTop: '16px', fontSize: '13px' },
    }, '看到没？# 变大标题、## 变小标题、`反引号`变代码、- 变列表。这就是为什么 README 用 Markdown 写。'));

    // 第一屏动作
    const actions1 = el('div', { class: 're-actions' });
    actions1.appendChild(el('button', {
      class: 'tut-btn secondary',
      onclick: () => { if (typeof window.showElectiveMenu === 'function') window.showElectiveMenu(); },
    }, '← 回菜单'));
    actions1.appendChild(el('div', { class: 'spacer' }));
    actions1.appendChild(el('button', {
      class: 'tut-btn',
      onclick: () => goScreen(1),
    }, '下一页：怎么写好它 →'));
    screen1.appendChild(actions1);

    // ---------- 第二屏：如何让别人读懂你的项目 ----------
    const screen2 = el('div', { class: 're-screen' });
    screen2.appendChild(el('h2', { style: { fontSize: '20px', margin: '0 0 4px' } }, '第二关 · 让别人读懂你的项目'));
    screen2.appendChild(el('p', { class: 're-lead' }, '一个好 README 大概包含这些，照着填就不会太差。'));

    const checklist = el('div', { class: 're-checklist' });
    const checkItem = (n, title, descHTML, optional) => {
      const item = el('div', { class: 're-check-item' });
      item.appendChild(el('div', { class: 're-check-num' }, String(n)));
      const body = el('div', null);
      const h = el('h4', null, [title]);
      if (optional) h.appendChild(el('span', { class: 'opt' }, '（可选）'));
      body.appendChild(h);
      const p = el('p', null);
      p.innerHTML = descHTML;
      body.appendChild(p);
      item.appendChild(body);
      return item;
    };
    checklist.appendChild(checkItem(1, '一句话简介 ', '这是什么、解决什么问题。读者第一眼就要懂。'));
    checklist.appendChild(checkItem(2, '截图 / GIF ', '一图胜千言，尤其是有界面的项目，贴张图立刻加分。'));
    checklist.appendChild(checkItem(3, '如何安装 / 运行 ', 'clone 之后几条命令能跑起来，比如 <code>npm install</code> + <code>npm run dev</code>。'));
    checklist.appendChild(checkItem(4, '如何使用 ', '给一个最简单的用法示例，让人照着就能上手。'));
    checklist.appendChild(checkItem(5, '技术栈 / 目录结构 ', '用了什么、文件放在哪，方便别人改。', true));
    checklist.appendChild(checkItem(6, 'License ', '别人能不能用、怎么用。常见的有 MIT。'));
    screen2.appendChild(checklist);

    // AI 咒语卡
    const ai = el('div', { class: 're-ai' });
    ai.appendChild(el('div', { class: 're-ai-label' }, '对 AI 说'));
    const aiPrompt = '帮我给这个项目写一个 README，包含简介、安装步骤、使用示例';
    ai.appendChild(el('div', { class: 're-ai-prompt' }, aiPrompt));
    const aiCopy = el('button', {
      class: 'tut-btn secondary',
      style: { marginTop: '12px' },
      onclick: async () => {
        try { await navigator.clipboard.writeText(aiPrompt); toast('已复制', { kind: 'ok', duration: 1500 }); }
        catch (e) {
          const ta = el('textarea', null, aiPrompt);
          document.body.appendChild(ta); ta.select();
          try { document.execCommand('copy'); toast('已复制', { kind: 'ok', duration: 1500 }); } catch (_) { toast('复制失败，请手动选中', { kind: 'warn' }); }
          ta.remove();
        }
      },
    }, '复制');
    ai.appendChild(aiCopy);
    screen2.appendChild(ai);

    // 第二屏动作
    const actions2 = el('div', { class: 're-actions' });
    actions2.appendChild(el('button', {
      class: 'tut-btn secondary',
      onclick: () => goScreen(0),
    }, '← 上一页'));
    actions2.appendChild(el('div', { class: 'spacer' }));
    actions2.appendChild(el('button', {
      class: 'tut-btn',
      onclick: () => {
        markElectiveDone('readme');
        if (typeof window.showElectiveMenu === 'function') window.showElectiveMenu();
      },
    }, '这一关学完 ✓'));
    screen2.appendChild(actions2);

    wrap.appendChild(screen1);
    wrap.appendChild(screen2);
    root.appendChild(wrap);
    document.body.appendChild(root);

    function goScreen(i) {
      screen1.classList.toggle('active', i === 0);
      screen2.classList.toggle('active', i === 1);
      $$('.re-dot', dots).forEach((d) => d.classList.toggle('active', Number(d.dataset.i) <= i));
      root.scrollTop = 0;
    }
  }

  // 极简 Markdown 渲染器（只够演示：# / ## / `code` / **bold** / - 列表）
  function renderMiniMarkdown(src) {
    const lines = String(src).split('\n');
    let html = '';
    let inList = false;
    const inline = (s) => escapeHTML(s)
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    lines.forEach((raw) => {
      const line = raw.replace(/\s+$/, '');
      if (/^# /.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<h1>' + inline(line.slice(2)) + '</h1>';
      } else if (/^## /.test(line)) {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<h2>' + inline(line.slice(3)) + '</h2>';
      } else if (/^- /.test(line)) {
        if (!inList) { html += '<ul>'; inList = true; }
        html += '<li>' + inline(line.slice(2)) + '</li>';
      } else if (line.trim() === '') {
        if (inList) { html += '</ul>'; inList = false; }
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        html += '<p>' + inline(line) + '</p>';
      }
    });
    if (inList) html += '</ul>';
    return html;
  }

  // ---------------------------------------------------------------------------
  // 暴露
  // ---------------------------------------------------------------------------
  window.TutorialEngine = TutorialEngine;

  window.startTutorial = function (steps, pitfalls, glossary) {
    injectStyle();
    // 先绑术语 hover（让 [data-term] 在静态 HTML 里也立刻生效）
    initGlossaryTooltips(glossary || {});
    // 弹黑话速记模态，关闭后开始教程
    const launch = () => {
      const engine = new TutorialEngine(steps || [], pitfalls || [], glossary || {});
      window.__tutorialEngine = engine;
      engine.start();
      return engine;
    };
    if (glossary && Object.keys(glossary).length > 0) {
      showGlossaryModal(glossary, launch);
    } else {
      launch();
    }
    // 返回的 engine 异步可能没准备好，但用户也很少直接拿
    return window.__tutorialEngine || null;
  };

  window.startWorktreeBonus = startWorktreeBonus;
  window.showElectiveMenu = showElectiveMenu;
  window.startReadmeElective = startReadmeElective;
  window.initGlossaryTooltips = initGlossaryTooltips;
  window.tutorialToast = toast;

})();
