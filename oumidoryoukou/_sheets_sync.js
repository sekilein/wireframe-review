/* ── Wireframe Review: GAS JSONP経由 Google Sheets → DOM 自動反映 ── */
(function () {
  var cfg = (typeof WF_CONFIG !== 'undefined') ? WF_CONFIG : null;
  if (!cfg || !cfg.gasUrl) return;

  var PAGE_ID = location.pathname.split('/').pop().replace(/\.html?$/, '') || 'index';

  function getSheetName() {
    if (!cfg.pages) return PAGE_ID;
    var entry = cfg.pages.find(function (p) { return p.id === PAGE_ID; });
    return entry ? entry.sheet : PAGE_ID;
  }

  function applyToDOM(widMap) {
    Object.keys(widMap).forEach(function (wid) {
      var el = document.querySelector('[data-wid="' + wid + '"]');
      if (!el) return;
      if (el.children.length > 0) return;
      var newText = widMap[wid];
      if (el.textContent.trim() === newText.trim()) return;
      el.textContent = newText;
      el.dataset.widSynced = '1';
    });
  }

  /* JSONP: fetch の代わりに <script> タグで読み込む（CORS回避） */
  function fetchJsonp(url, sheetName) {
    var cbName = 'wfSheetsCallback_' + Date.now();
    var script  = document.createElement('script');

    window[cbName] = function (data) {
      delete window[cbName];
      script.parentNode && script.parentNode.removeChild(script);
      if (data && !data.error) applyToDOM(data);
    };

    script.src = url
      + '?sheet='    + encodeURIComponent(sheetName)
      + '&callback=' + cbName;
    script.onerror = function () {
      delete window[cbName];
      console.warn('[WF Sheets] JSONP読み込み失敗');
    };
    document.head.appendChild(script);
  }

  document.addEventListener('DOMContentLoaded', function () {
    fetchJsonp(cfg.gasUrl, getSheetName());
  });
})();
