# 今日のタスクマン

想定工数を入れると励ましてくれる、ゆるいタスク管理アプリ（PWA）。

- 今日／今週／NEW／後々 の4タブ
- iPhoneはSafariで開いて「ホーム画面に追加」
- 更新時は sw.js の VERSION を上げる

## 同期（PCとiPhoneで同じタスク）

`gas/Code.gs` をGoogleスプレッドシートのApps Scriptに貼ってウェブアプリとして公開し、アプリ下部「同期の設定」にURLと合言葉を入れる。
