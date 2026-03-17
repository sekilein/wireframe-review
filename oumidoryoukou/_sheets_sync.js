/* ── Wireframe Review: Google Sheets → DOM 自動反映 ──────────────── */
(function () {
  /* _config.js が設定するグローバル変数 */
  var cfg = (typeof WF_CONFIG !== 'undefined') ? WF_CONFIG : null;
  if (!cfg || !cfg.spreadsheetId) return;

  var PAGE_ID = location.pathname.split('/').pop().replace(/\.html?$/, '') || 'index';

  /* gviz/tq エンドポイント（公開スプレッドシートのみ） */
  function sheetUrl(sheetName) {
    return 'https://docs.google.com/spreadsheets/d/' + cfg.spreadsheetId
      + '/gviz/tq?tqx=out:json&sheet=' + encodeURIComponent(sheetName);
  }

  /* gviz JSON パース（先頭のゴミを除去） */
  function parseGviz(text) {
    var m = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/);
    if (!m) return null;
    try { return JSON.parse(m[1]); } catch (e) { return null; }
  }

  /* スプレッドシートのシート名マップ（ページID → シート名） */
  function guessSheetName() {
    if (!cfg.pages) return PAGE_ID;
    var entry = cfg.pages.find(function(p){ return p.id === PAGE_ID; });
    return entry ? entry.sheet : PAGE_ID;
  }

  /* DOM反映: data-wid="xxx" の要素にテキストをセット */
  function applyToDOM(rows) {
    rows.forEach(function (row) {
      var wid  = row[0]; /* 要素ID */
      var text = row[2]; /* 原稿テキスト */
      if (!wid || !text) return;
      var el = document.querySelector('[data-wid="' + wid + '"]');
      if (!el) return;
      /* 子要素（<a>・<span>等）を持つ構造的な要素は上書きしない */
      if (el.children.length > 0) return;
      /* スプレッドシートの値が元テキストと同じなら上書きしない */
      if (el.textContent.trim() === text.trim()) return;
      el.textContent = text;
      el.dataset.widSynced = '1';
    });
  }

  function fetchAndApply() {
    var sheetName = guessSheetName();
    var url = sheetUrl(sheetName);
    fetch(url, { cache: 'no-store' })
      .then(function(r){ return r.text(); })
      .then(function(text){
        var parsed = parseGviz(text);
        if (!parsed || !parsed.table || !parsed.table.rows) return;
        var rows = parsed.table.rows.map(function(row){
          return row.c.map(function(cell){ return cell ? (cell.v || '') : ''; });
        });
        /* 1行目はヘッダーなのでスキップ */
        applyToDOM(rows.slice(1));
      })
      .catch(function(e){ console.warn('[WF Sheets]', e); });
  }

  document.addEventListener('DOMContentLoaded', fetchAndApply);
})();
