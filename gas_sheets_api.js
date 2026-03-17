/**
 * ワイヤーフレーム原稿 GAS Web API
 * スプレッドシート: 近江度量衡 Webリニューアル｜ワイヤーフレーム原稿
 *
 * デプロイ手順:
 *   1. このコードをApps Scriptエディタに貼り付け
 *   2. 「デプロイ」→「新しいデプロイ」→ 種類: ウェブアプリ
 *   3. 次のユーザーとして実行: 自分
 *   4. アクセスできるユーザー: 全員
 *   5. デプロイ → URLをコピー
 */

var SPREADSHEET_ID = '1oJuLXlho8rlvQz2fqcV8f5IXoH22-HORdAEv94nHX58';

function doGet(e) {
  var output;
  try {
    var sheetName = e && e.parameter && e.parameter.sheet ? e.parameter.sheet : null;
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (!sheetName) {
      // シート一覧を返す
      var names = ss.getSheets().map(function(s) { return s.getName(); });
      output = JSON.stringify({ sheets: names });
    } else {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) {
        output = JSON.stringify({ error: 'Sheet not found: ' + sheetName });
      } else {
        var rows = sheet.getDataRange().getValues();
        // ヘッダー行スキップ（行0）
        // 列: 0=要素ID, 1=種別, 2=原稿テキスト, 3=備考
        var result = {};
        for (var i = 1; i < rows.length; i++) {
          var wid  = String(rows[i][0]).trim();
          var text = String(rows[i][2]).trim();
          if (wid && text) {
            result[wid] = text;
          }
        }
        output = JSON.stringify(result);
      }
    }
  } catch (err) {
    output = JSON.stringify({ error: err.message });
  }

  return ContentService
    .createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}
