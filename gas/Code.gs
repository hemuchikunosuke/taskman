// タスクマン同期用 Google Apps Script
// 1. 下の SECRET を自分だけの合言葉に変える（アプリ側にも同じものを入れる）
const SECRET = 'ここを合言葉に変える';

function sheet_() { return SpreadsheetApp.getActive().getSheets()[0]; }
function load_() {
  const v = sheet_().getRange('A1').getValue();
  try { return v ? JSON.parse(v) : { tasks: [], dead: {} }; } catch (e) { return { tasks: [], dead: {} }; }
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// 端末ごとの変更を合体（新しい方が勝つ・消したものは30日覚えておく）
function merge_(a, b) {
  const d = Object.assign({}, a.dead || {});
  Object.keys(b.dead || {}).forEach(k => { if (!(d[k] >= b.dead[k])) d[k] = b.dead[k]; });
  const map = {};
  (a.tasks || []).concat(b.tasks || []).forEach(t => { const c = map[t.id]; if (!c || (t.u || 0) > (c.u || 0)) map[t.id] = t; });
  const cut = Date.now() - 30 * 864e5;
  Object.keys(d).forEach(k => { if (d[k] < cut) delete d[k]; });
  return { tasks: Object.keys(map).map(k => map[k]).filter(t => !(d[t.id] >= (t.u || 0))), dead: d };
}

function doGet(e) {
  if ((e.parameter || {}).key !== SECRET) return out_({ error: 'key' });
  return out_(load_());
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return out_({ error: 'bad' }); }
  if (body.key !== SECRET) return out_({ error: 'key' });
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const merged = merge_(load_(), body);
    sheet_().getRange('A1').setValue(JSON.stringify(merged));
    sheet_().getRange('B1').setValue('↑タスクマンのデータ（触らないでね） 更新: ' + new Date());
    return out_(merged);
  } finally { lock.releaseLock(); }
}
