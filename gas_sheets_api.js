/**
 * ワイヤーフレーム原稿 GAS Web API（JSONP対応）
 * スプレッドシート: 近江度量衡 Webリニューアル｜ワイヤーフレーム原稿
 */

var SPREADSHEET_ID = '1oJuLXlho8rlvQz2fqcV8f5IXoH22-HORdAEv94nHX58';

function doGet(e) {
  var output;
  try {
    var sheetName = e && e.parameter && e.parameter.sheet ? e.parameter.sheet : null;
    var callback  = e && e.parameter && e.parameter.callback ? e.parameter.callback : null;
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (!sheetName) {
      var names = ss.getSheets().map(function(s) { return s.getName(); });
      output = JSON.stringify({ sheets: names });
    } else {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        output = JSON.stringify({ error: 'Sheet not found: ' + sheetName });
      } else {
        var rows = sheet.getDataRange().getValues();
        var result = {};
        for (var i = 1; i < rows.length; i++) {
          var wid  = String(rows[i][0]).trim();
          var text = String(rows[i][2]).trim();
          if (wid && text) result[wid] = text;
        }
        output = JSON.stringify(result);
      }
    }
  } catch (err) {
    output = JSON.stringify({ error: err.message });
  }

  /* JSONP対応: callback パラメータがあれば callback(json) 形式で返す */
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + output + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}
