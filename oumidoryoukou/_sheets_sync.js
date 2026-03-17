/* ── Wireframe Review: GAS経由 Google Sheets → DOM 自動反映 ──────── */
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
      /* 子要素（<a>・<span>等）を持つ構造要素はスキップ */
      if (el.children.length > 0) return;
      var newText = widMap[wid];
      /* 元テキストと同じならスキップ */
      if (el.textContent.trim() === newText.trim()) return;
      el.textContent = newText;
      el.dataset.widSynced = '1';
    });
  }

  function fetchAndApply() {
    var sheetName = getSheetName();
    var url = cfg.gasUrl + '?sheet=' + encodeURIComponent(sheetName);

    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && !data.error) applyToDOM(data);
      })
      .catch(function (e) { console.warn('[WF Sheets]', e); });
  }

  document.addEventListener('DOMContentLoaded', fetchAndApply);
})();
