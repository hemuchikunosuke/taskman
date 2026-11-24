// 雲メモ同期用 Google Apps Script（「雲メモ データ」スプレッドシートに入れる）
// SECRET をアプリ側の合言葉と同じにする
const SECRET = 'ここを合言葉に変える';

function sheet_() {
  const ss = SpreadsheetApp.getActive();
  return ss.getSheetByName('app') || ss.insertSheet('app');
}
function load_() {
  const v = sheet_().getRange('A1').getValue();
  try { return v ? JSON.parse(v) : { notes: [], dead: {} }; } catch (e) { return { notes: [], dead: {} }; }
}
function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

// 端末ごとの変更を合体（新しい方が勝つ・消した雲は30日覚えておく）
function merge_(a, b) {
  const d = Object.assign({}, a.dead || {});
  Object.keys(b.dead || {}).forEach(k => { if (!(d[k] >= b.dead[k])) d[k] = b.dead[k]; });
  const map = {};
  (a.notes || []).concat(b.notes || []).forEach(t => { const c = map[t.id]; if (!c || (t.u || 0) > (c.u || 0)) map[t.id] = t; });
  const cut = Date.now() - 30 * 864e5;
  Object.keys(d).forEach(k => { if (d[k] < cut) delete d[k]; });
  return { notes: Object.keys(map).map(k => map[k]).filter(t => !(d[t.id] >= (t.u || 0))), dead: d };
}

// 人が読める一覧（A1のデータとは別に、3行目から下に書き出す）
function list_(m) {
  const sh = sheet_();
  sh.getRange('A3:D1000').clearContent();
  sh.getRange('A3:D3').setValues([['メモ', '大きさ', '色', '更新']]);
  const rows = m.notes.map(n => [n.text || '', n.size || '', n.color || '', n.u ? new Date(n.u) : '']);
  if (rows.length) sh.getRange(4, 1, rows.length, 4).setValues(rows);
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
    sheet_().getRange('B1').setValue('↑雲メモのデータ（触らないでね） 更新: ' + new Date());
    list_(merged);
    return out_(merged);
  } finally { lock.releaseLock(); }
}
