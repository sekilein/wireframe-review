/* ── Wireframe Review: Firebase リアルタイムコメント ─────────────── */
(function () {
  const FIREBASE_CONFIG = {
    apiKey:            "AIzaSyDT5NNnLnpwfizgWkqMrVJepCZPYD1etRE",
    authDomain:        "wireframe-review.firebaseapp.com",
    databaseURL:       "https://wireframe-review-default-rtdb.firebaseio.com",
    projectId:         "wireframe-review",
    storageBucket:     "wireframe-review.firebasestorage.app",
    messagingSenderId: "951747223323",
    appId:             "1:951747223323:web:016d34e497d0e97a1f3dbe"
  };

  /* ── ページID ─────────────────────── */
  const PAGE_ID = location.pathname.split('/').pop().replace(/\.html?$/, '') || 'index';

  /* ── Firebase 初期化 ──────────────── */
  let db;
  function initFirebase() {
    if (typeof firebase === 'undefined') {
      console.warn('[WF] Firebase SDK が読み込まれていません');
      return false;
    }
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    return true;
  }

  /* ── ユーザー名 ───────────────────── */
  function getUsername() {
    let name = localStorage.getItem('wf_name');
    if (!name) {
      name = prompt('レビュアー名を入力してください（以降は保存されます）:') || '匿名';
      localStorage.setItem('wf_name', name);
    }
    return name;
  }

  /* ── CSS 注入 ─────────────────────── */
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      #wf-fab {
        position:fixed; bottom:24px; right:24px; z-index:99998;
        background:#2563eb; color:#fff; border:none; border-radius:50px;
        padding:11px 20px; font-size:13px; font-weight:700; cursor:pointer;
        box-shadow:0 4px 16px rgba(0,0,0,.35); display:flex; align-items:center;
        gap:8px; font-family:sans-serif; transition:background .2s;
      }
      #wf-fab.active { background:#dc2626; }
      #wf-fab:hover { opacity:.9; }

      #wf-mode-bar {
        position:fixed; top:30px; left:50%; transform:translateX(-50%);
        background:rgba(37,99,235,.92); color:#fff; padding:7px 22px;
        border-radius:20px; font-size:12px; font-weight:700; z-index:99997;
        display:none; pointer-events:none; font-family:sans-serif;
        backdrop-filter:blur(4px); white-space:nowrap;
      }

      #wf-panel {
        position:fixed; top:50px; right:0; bottom:0; width:320px;
        background:#fff; border-left:1px solid #e5e7eb;
        box-shadow:-4px 0 20px rgba(0,0,0,.1); z-index:99999;
        display:none; flex-direction:column; font-family:sans-serif;
      }
      #wf-panel.open { display:flex; }
      #wf-panel-header {
        padding:16px; border-bottom:1px solid #f0f0f0;
        display:flex; align-items:center; justify-content:space-between;
      }
      #wf-panel-title { font-size:13px; font-weight:700; color:#111; }
      #wf-panel-close {
        background:none; border:none; font-size:18px; cursor:pointer; color:#999;
        line-height:1; padding:0;
      }
      #wf-panel-list { flex:1; overflow-y:auto; padding:12px; }
      .wf-list-item {
        background:#f9fafb; border-radius:8px; padding:12px; margin-bottom:10px;
        position:relative;
      }
      .wf-list-meta { display:flex; align-items:center; gap:8px; margin-bottom:6px; }
      .wf-list-num {
        width:22px; height:22px; border-radius:50%; background:#2563eb;
        color:#fff; font-size:11px; font-weight:700;
        display:flex; align-items:center; justify-content:center; flex-shrink:0;
      }
      .wf-list-author { font-size:12px; font-weight:700; color:#111; flex:1; }
      .wf-list-date { font-size:10px; color:#aaa; }
      .wf-list-text { font-size:13px; color:#444; line-height:1.6; white-space:pre-wrap; word-break:break-word; }
      .wf-list-del {
        position:absolute; top:10px; right:10px;
        background:none; border:none; color:#ddd; cursor:pointer; font-size:14px;
      }
      .wf-list-del:hover { color:#dc2626; }

      .wf-pin {
        position:fixed; z-index:99996; cursor:pointer;
        transform:translate(-50%, -100%);
      }
      .wf-pin-head {
        width:26px; height:26px; border-radius:50% 50% 50% 0;
        transform:rotate(-45deg); background:#2563eb; color:#fff;
        display:flex; align-items:center; justify-content:center;
        font-size:11px; font-weight:700; font-family:sans-serif;
        box-shadow:0 2px 8px rgba(0,0,0,.3); transition:transform .15s;
      }
      .wf-pin:hover .wf-pin-head { transform:rotate(-45deg) scale(1.25); }
      .wf-pin-inner { transform:rotate(45deg); }

      #wf-popup {
        position:fixed; z-index:100000;
        background:#fff; border-radius:10px; padding:16px;
        box-shadow:0 12px 40px rgba(0,0,0,.2); width:280px;
        border:1px solid #e5e7eb; font-family:sans-serif;
        display:none;
      }
      #wf-popup h4 { font-size:13px; color:#111; margin:0 0 10px; }
      #wf-popup textarea {
        width:100%; box-sizing:border-box; border:1px solid #e5e7eb;
        border-radius:6px; padding:8px 10px; font-size:13px;
        font-family:sans-serif; resize:vertical; min-height:70px; outline:none;
      }
      #wf-popup textarea:focus { border-color:#2563eb; }
      #wf-popup .wf-popup-hint {
        font-size:10px; color:#bbb; margin:4px 0 10px;
      }
      #wf-popup .wf-popup-actions {
        display:flex; justify-content:flex-end; gap:8px;
      }
      #wf-popup .wf-popup-actions button {
        padding:7px 16px; border-radius:6px; border:none;
        font-size:12px; font-weight:700; cursor:pointer; font-family:sans-serif;
      }
      #wf-btn-cancel { background:#f3f4f6; color:#555; }
      #wf-btn-send   { background:#2563eb; color:#fff; }
      #wf-btn-send:hover { background:#1d4ed8; }

      body.wf-picking { cursor:crosshair !important; }
      body.wf-picking * { cursor:crosshair !important; }
    `;
    document.head.appendChild(s);
  }

  /* ── UI 構築 ──────────────────────── */
  let commentMode = false;
  let pendingPos  = null;
  let allComments = {};
  let pinEls      = {};

  function buildUI() {
    /* FAB */
    const fab = document.createElement('button');
    fab.id        = 'wf-fab';
    fab.innerHTML = '💬 コメント';
    document.body.appendChild(fab);

    /* モードバー */
    const bar = document.createElement('div');
    bar.id        = 'wf-mode-bar';
    bar.textContent = 'クリックした場所にコメントを追加できます　ESC で終了';
    document.body.appendChild(bar);

    /* サイドパネル */
    const panel = document.createElement('div');
    panel.id        = 'wf-panel';
    panel.innerHTML = `
      <div id="wf-panel-header">
        <span id="wf-panel-title">コメント一覧</span>
        <button id="wf-panel-close">×</button>
      </div>
      <div id="wf-panel-list"></div>`;
    document.body.appendChild(panel);

    /* 入力ポップアップ */
    const popup = document.createElement('div');
    popup.id        = 'wf-popup';
    popup.innerHTML = `
      <h4>コメントを追加</h4>
      <textarea id="wf-ta" placeholder="コメントを入力…"></textarea>
      <p class="wf-popup-hint">Ctrl+Enter で送信　/　ESC でキャンセル</p>
      <div class="wf-popup-actions">
        <button id="wf-btn-cancel">キャンセル</button>
        <button id="wf-btn-send">送信</button>
      </div>`;
    document.body.appendChild(popup);

    /* ── イベント ── */
    fab.addEventListener('click', function (e) {
      e.stopPropagation();
      commentMode = !commentMode;
      fab.classList.toggle('active', commentMode);
      fab.innerHTML = commentMode ? '✕ 終了' : '💬 コメント';
      bar.style.display = commentMode ? 'block' : 'none';
      document.body.classList.toggle('wf-picking', commentMode);
      if (!commentMode) hidePopup();
    });

    document.getElementById('wf-panel-close').addEventListener('click', function () {
      panel.classList.remove('open');
    });
    document.getElementById('wf-btn-cancel').addEventListener('click', hidePopup);
    document.getElementById('wf-btn-send').addEventListener('click', submitComment);

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (popup.style.display === 'block') { hidePopup(); return; }
        if (commentMode) {
          commentMode = false;
          fab.classList.remove('active');
          fab.innerHTML = '💬 コメント';
          bar.style.display = 'none';
          document.body.classList.remove('wf-picking');
        }
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && popup.style.display === 'block') {
        submitComment();
      }
    });

    document.addEventListener('click', function (e) {
      if (!commentMode) return;
      const skip = ['wf-fab','wf-popup','wf-panel','wf-pin','wf-mode-bar'];
      if (skip.some(cls => e.target.closest('#' + cls) || e.target.closest('.' + cls))) return;

      const xPct = parseFloat((e.clientX / window.innerWidth  * 100).toFixed(2));
      const yPct = parseFloat((e.clientY / window.innerHeight * 100).toFixed(2));
      pendingPos = { xPct, yPct };
      showPopup(e.clientX, e.clientY);
    });
  }

  function showPopup(cx, cy) {
    const popup = document.getElementById('wf-popup');
    const W = 288, H = 200;
    popup.style.left = (Math.min(cx + 10, window.innerWidth  - W - 10)) + 'px';
    popup.style.top  = (Math.min(cy + 10, window.innerHeight - H - 10)) + 'px';
    popup.style.display = 'block';
    document.getElementById('wf-ta').value = '';
    document.getElementById('wf-ta').focus();
  }

  function hidePopup() {
    document.getElementById('wf-popup').style.display = 'none';
    pendingPos = null;
  }

  function submitComment() {
    if (!pendingPos) return;
    const text = document.getElementById('wf-ta').value.trim();
    if (!text) return;
    const author = getUsername();
    db.ref('comments/' + PAGE_ID).push({
      x: pendingPos.xPct,
      y: pendingPos.yPct,
      text: text,
      author: author,
      ts: Date.now(),
      page: PAGE_ID
    });
    hidePopup();
  }

  /* ── コメント描画 ─────────────────── */
  let counter = 0;
  const idxMap = {};

  function renderAll(data) {
    /* ピンをクリア */
    Object.values(pinEls).forEach(el => el.remove());
    pinEls = {};
    counter = 0;

    allComments = data || {};
    const sorted = Object.entries(allComments).sort((a, b) => a[1].ts - b[1].ts);
    sorted.forEach(([id, c]) => {
      counter++;
      idxMap[id] = counter;
      renderPin(id, c, counter);
    });
    renderPanel(sorted);
  }

  function renderPin(id, c, num) {
    const pin = document.createElement('div');
    pin.className = 'wf-pin';
    pin.style.left = c.x + '%';
    pin.style.top  = c.y + '%';
    pin.innerHTML  = `<div class="wf-pin-head"><span class="wf-pin-inner">${num}</span></div>`;
    pin.addEventListener('click', function (e) {
      e.stopPropagation();
      document.getElementById('wf-panel').classList.add('open');
      const item = document.getElementById('wf-item-' + id);
      if (item) item.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    document.body.appendChild(pin);
    pinEls[id] = pin;
  }

  function renderPanel(sorted) {
    const list = document.getElementById('wf-panel-list');
    if (!list) return;
    if (!sorted.length) {
      list.innerHTML = '<p style="color:#bbb;font-size:12px;text-align:center;padding:24px;">コメントはまだありません</p>';
      return;
    }
    list.innerHTML = sorted.map(([id, c]) => {
      const date = new Date(c.ts).toLocaleString('ja-JP');
      const num  = idxMap[id];
      return `
        <div class="wf-list-item" id="wf-item-${id}">
          <div class="wf-list-meta">
            <div class="wf-list-num">${num}</div>
            <div class="wf-list-author">${esc(c.author)}</div>
            <div class="wf-list-date">${date}</div>
          </div>
          <div class="wf-list-text">${esc(c.text)}</div>
          <button class="wf-list-del" data-id="${id}" title="削除">×</button>
        </div>`;
    }).join('');

    list.querySelectorAll('.wf-list-del').forEach(btn => {
      btn.addEventListener('click', function () {
        if (confirm('このコメントを削除しますか？')) {
          db.ref('comments/' + PAGE_ID + '/' + this.dataset.id).remove();
        }
      });
    });
  }

  function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Firebase 購読 ────────────────── */
  function subscribe() {
    db.ref('comments/' + PAGE_ID).on('value', function (snap) {
      renderAll(snap.val());
    });
  }

  /* ── 起動 ─────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    if (!initFirebase()) return;
    injectStyles();
    buildUI();
    subscribe();
  });
})();
