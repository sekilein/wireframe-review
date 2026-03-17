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

  const PAGE_ID = location.pathname.split('/').pop().replace(/\.html?$/, '') || 'index';

  let db;
  function initFirebase() {
    if (typeof firebase === 'undefined') { console.warn('[WF] Firebase SDK なし'); return false; }
    if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
    db = firebase.database();
    return true;
  }

  function getUsername() {
    let name = localStorage.getItem('wf_name');
    if (!name) {
      name = prompt('レビュアー名を入力してください（以降は保存されます）:') || '匿名';
      localStorage.setItem('wf_name', name);
    }
    return name;
  }

  /* ── CSS ─────────────────────────────────────────────────────────── */
  function injectStyles() {
    const s = document.createElement('style');
    s.textContent = `
      /* body を基準にピンを絶対配置 */
      body { position: relative; }

      /* ピンレイヤー: ページ全体を覆う */
      #wf-pin-layer {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        z-index: 9000;
      }
      .wf-pin {
        position: absolute;
        pointer-events: all;
        /* クリック座標がピン先端になるよう調整 */
        transform: translate(-50%, -100%);
      }
      .wf-pin-head {
        width: 26px; height: 26px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        background: #2563eb; color: #fff;
        display: flex; align-items: center; justify-content: center;
        font-size: 11px; font-weight: 700; font-family: sans-serif;
        box-shadow: 0 2px 8px rgba(0,0,0,.35);
        cursor: pointer; transition: transform .15s;
      }
      .wf-pin:hover .wf-pin-head { transform: rotate(-45deg) scale(1.25); }
      .wf-pin-inner { transform: rotate(45deg); }

      /* ツールチップ */
      .wf-pin-tip {
        display: none;
        position: absolute;
        left: 32px; top: -8px;
        width: 240px;
        background: #fff; border: 1px solid #e5e7eb;
        border-radius: 8px; padding: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,.15);
        font-family: sans-serif; font-size: 13px;
        z-index: 9001;
      }
      .wf-pin-tip.open { display: block; }
      .wf-tip-meta { display: flex; align-items: center; gap: 6px; margin-bottom: 7px; padding-bottom: 7px; border-bottom: 1px solid #f0f0f0; }
      .wf-tip-author { font-weight: 700; color: #111; flex: 1; }
      .wf-tip-date { font-size: 10px; color: #aaa; }
      .wf-tip-del { background: none; border: none; color: #ccc; cursor: pointer; font-size: 15px; padding: 0; line-height: 1; }
      .wf-tip-del:hover { color: #dc2626; }
      .wf-tip-text { color: #333; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }

      /* FAB */
      #wf-fab {
        position: fixed; bottom: 24px; right: 24px; z-index: 9999;
        background: #2563eb; color: #fff; border: none; border-radius: 50px;
        padding: 11px 20px; font-size: 13px; font-weight: 700;
        cursor: pointer; box-shadow: 0 4px 16px rgba(0,0,0,.3);
        display: flex; align-items: center; gap: 8px;
        font-family: sans-serif; transition: background .2s;
      }
      #wf-fab.active { background: #dc2626; }

      /* モードバー */
      #wf-mode-bar {
        position: fixed; top: 30px; left: 50%; transform: translateX(-50%);
        background: rgba(37,99,235,.92); color: #fff;
        padding: 7px 22px; border-radius: 20px;
        font-size: 12px; font-weight: 700; z-index: 9998;
        display: none; pointer-events: none;
        font-family: sans-serif; white-space: nowrap;
      }

      /* サイドパネル */
      #wf-panel {
        position: fixed; top: 0; right: 0; bottom: 0; width: 300px;
        background: #fff; border-left: 1px solid #e5e7eb;
        box-shadow: -4px 0 20px rgba(0,0,0,.1);
        z-index: 9997; display: none; flex-direction: column;
        font-family: sans-serif;
      }
      #wf-panel.open { display: flex; }
      #wf-panel-hd {
        padding: 14px 16px; border-bottom: 1px solid #f0f0f0;
        display: flex; align-items: center; justify-content: space-between;
      }
      #wf-panel-hd span { font-size: 13px; font-weight: 700; }
      #wf-panel-close { background: none; border: none; font-size: 18px; cursor: pointer; color: #999; }
      #wf-panel-list { flex: 1; overflow-y: auto; padding: 12px; }
      .wf-li {
        background: #f9fafb; border-radius: 8px; padding: 11px;
        margin-bottom: 9px; position: relative;
      }
      .wf-li-meta { display: flex; align-items: center; gap: 7px; margin-bottom: 5px; }
      .wf-li-num {
        width: 20px; height: 20px; border-radius: 50%;
        background: #2563eb; color: #fff; font-size: 10px; font-weight: 700;
        display: flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .wf-li-author { font-size: 12px; font-weight: 700; flex: 1; }
      .wf-li-date { font-size: 10px; color: #aaa; }
      .wf-li-text { font-size: 12px; color: #444; line-height: 1.6; white-space: pre-wrap; word-break: break-word; }
      .wf-li-del { position: absolute; top: 9px; right: 9px; background: none; border: none; color: #ddd; cursor: pointer; font-size: 13px; }
      .wf-li-del:hover { color: #dc2626; }

      /* 入力ポップアップ */
      #wf-popup {
        position: fixed; z-index: 10000;
        background: #fff; border-radius: 10px; padding: 16px;
        box-shadow: 0 12px 40px rgba(0,0,0,.2); width: 270px;
        border: 1px solid #e5e7eb; font-family: sans-serif; display: none;
      }
      #wf-popup h4 { font-size: 13px; margin: 0 0 9px; color: #111; }
      #wf-popup textarea {
        width: 100%; box-sizing: border-box; border: 1px solid #e5e7eb;
        border-radius: 6px; padding: 8px; font-size: 13px;
        font-family: sans-serif; resize: vertical; min-height: 65px; outline: none;
      }
      #wf-popup textarea:focus { border-color: #2563eb; }
      #wf-popup .hint { font-size: 10px; color: #bbb; margin: 4px 0 9px; }
      #wf-popup .acts { display: flex; justify-content: flex-end; gap: 7px; }
      #wf-popup .acts button {
        padding: 7px 14px; border-radius: 6px; border: none;
        font-size: 12px; font-weight: 700; cursor: pointer; font-family: sans-serif;
      }
      #wf-btn-cancel { background: #f3f4f6; color: #555; }
      #wf-btn-send   { background: #2563eb; color: #fff; }

      body.wf-picking,
      body.wf-picking * { cursor: crosshair !important; }
    `;
    document.head.appendChild(s);
  }

  /* ── ピンレイヤー（ページ全体を覆う絶対配置コンテナ） ── */
  let pinLayer;
  function ensurePinLayer() {
    if (pinLayer) return;
    pinLayer = document.createElement('div');
    pinLayer.id = 'wf-pin-layer';
    document.body.appendChild(pinLayer);
  }

  /* ── ページ寸法（ピン位置計算用） ───────────────────── */
  function docW() { return Math.max(document.body.scrollWidth,  document.documentElement.scrollWidth);  }
  function docH() { return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight); }

  /* ── UI 構築 ─────────────────────────────────────────── */
  let commentMode = false;
  let pendingPos  = null;
  let pinEls      = {};
  let idxMap      = {};

  function buildUI() {
    ensurePinLayer();

    const fab = document.createElement('button');
    fab.id = 'wf-fab'; fab.innerHTML = '💬 コメント';
    document.body.appendChild(fab);

    const bar = document.createElement('div');
    bar.id = 'wf-mode-bar';
    bar.textContent = 'クリックした場所にコメントを追加　ESC で終了';
    document.body.appendChild(bar);

    const panel = document.createElement('div');
    panel.id = 'wf-panel';
    panel.innerHTML = `
      <div id="wf-panel-hd">
        <span>コメント一覧</span>
        <button id="wf-panel-close">×</button>
      </div>
      <div id="wf-panel-list"></div>`;
    document.body.appendChild(panel);

    const popup = document.createElement('div');
    popup.id = 'wf-popup';
    popup.innerHTML = `
      <h4>コメントを追加</h4>
      <textarea id="wf-ta" placeholder="コメントを入力…"></textarea>
      <p class="hint">Ctrl+Enter で送信　ESC でキャンセル</p>
      <div class="acts">
        <button id="wf-btn-cancel">キャンセル</button>
        <button id="wf-btn-send">送信</button>
      </div>`;
    document.body.appendChild(popup);

    /* FAB */
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

    /* クリックでピン配置 */
    document.addEventListener('click', function (e) {
      if (!commentMode) return;
      const skip = ['wf-fab','wf-popup','wf-panel','wf-pin-layer','wf-mode-bar'];
      if (skip.some(id => e.target.closest('#' + id))) return;
      if (e.target.closest('.wf-pin')) return;

      /* pageX/Y = スクロール込みのドキュメント座標 */
      const xPct = parseFloat((e.pageX / docW() * 100).toFixed(3));
      const yPct = parseFloat((e.pageY / docH() * 100).toFixed(3));
      pendingPos = { xPct, yPct };
      showPopup(e.clientX, e.clientY);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        if (popup.style.display === 'block') { hidePopup(); return; }
        commentMode = false;
        fab.classList.remove('active'); fab.innerHTML = '💬 コメント';
        bar.style.display = 'none';
        document.body.classList.remove('wf-picking');
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && popup.style.display === 'block') {
        submitComment();
      }
    });
  }

  function showPopup(cx, cy) {
    const popup = document.getElementById('wf-popup');
    const W = 278, H = 185;
    popup.style.left = Math.min(cx + 10, window.innerWidth  - W - 10) + 'px';
    popup.style.top  = Math.min(cy + 10, window.innerHeight - H - 10) + 'px';
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
    db.ref('comments/' + PAGE_ID).push({
      x: pendingPos.xPct,
      y: pendingPos.yPct,
      text: text,
      author: getUsername(),
      ts: Date.now(),
      page: PAGE_ID
    });
    hidePopup();
  }

  /* ── ピン描画（絶対座標） ─────────────────────────────── */
  function renderAll(data) {
    Object.values(pinEls).forEach(el => el.remove());
    pinEls = {}; idxMap = {};
    let counter = 0;
    const sorted = Object.entries(data || {}).sort((a, b) => a[1].ts - b[1].ts);
    sorted.forEach(([id, c]) => {
      counter++;
      idxMap[id] = counter;
      renderPin(id, c, counter);
    });
    renderPanel(sorted);
  }

  function renderPin(id, c, num) {
    ensurePinLayer();
    const pin = document.createElement('div');
    pin.className = 'wf-pin';
    /* ドキュメント全体に対するパーセンテージで配置 */
    pin.style.left = c.x + '%';
    pin.style.top  = c.y + '%';

    const date = new Date(c.ts).toLocaleString('ja-JP');
    pin.innerHTML = `
      <div class="wf-pin-head"><span class="wf-pin-inner">${num}</span></div>
      <div class="wf-pin-tip">
        <div class="wf-tip-meta">
          <span class="wf-tip-author">${esc(c.author)}</span>
          <span class="wf-tip-date">${date}</span>
          <button class="wf-tip-del" data-id="${id}">×</button>
        </div>
        <div class="wf-tip-text">${esc(c.text)}</div>
      </div>`;

    pin.querySelector('.wf-pin-head').addEventListener('click', function (e) {
      e.stopPropagation();
      document.querySelectorAll('.wf-pin-tip.open').forEach(t => {
        if (t !== pin.querySelector('.wf-pin-tip')) t.classList.remove('open');
      });
      pin.querySelector('.wf-pin-tip').classList.toggle('open');
    });

    pin.querySelector('.wf-tip-del').addEventListener('click', function (e) {
      e.stopPropagation();
      if (confirm('このコメントを削除しますか？')) {
        db.ref('comments/' + PAGE_ID + '/' + this.dataset.id).remove();
      }
    });

    pinLayer.appendChild(pin);
    pinEls[id] = pin;
  }

  function renderPanel(sorted) {
    const list = document.getElementById('wf-panel-list');
    if (!list) return;
    if (!sorted.length) {
      list.innerHTML = '<p style="color:#bbb;font-size:12px;text-align:center;padding:24px">コメントなし</p>';
      return;
    }
    list.innerHTML = sorted.map(([id, c]) => `
      <div class="wf-li" id="wf-li-${id}">
        <div class="wf-li-meta">
          <div class="wf-li-num">${idxMap[id]}</div>
          <div class="wf-li-author">${esc(c.author)}</div>
          <div class="wf-li-date">${new Date(c.ts).toLocaleString('ja-JP')}</div>
        </div>
        <div class="wf-li-text">${esc(c.text)}</div>
        <button class="wf-li-del" data-id="${id}">×</button>
      </div>`).join('');

    list.querySelectorAll('.wf-li-del').forEach(btn => {
      btn.addEventListener('click', function () {
        if (confirm('削除しますか？')) db.ref('comments/' + PAGE_ID + '/' + this.dataset.id).remove();
      });
    });
  }

  function esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ── Firebase 購読 ────────────────────────────────────── */
  function subscribe() {
    db.ref('comments/' + PAGE_ID).on('value', function (snap) {
      renderAll(snap.val());
    });
  }

  /* ── 起動 ─────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    if (!initFirebase()) return;
    injectStyles();
    buildUI();
    subscribe();
  });
})();
