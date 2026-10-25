# COSMII RESCUE!

スマホ横画面の救出アクション。左手で左右、右タップで上昇。PCではA/Dまたは左右キー、Space・↑・Wで上昇します。

## 現在の構成

初回は約56秒のプロローグ動画を表示し、右下のSKIPまたは動画終了から実操作チュートリアルへ進みます。自動チュートリアルは初回の動画後のみ。途中で練習をやめても、以降の起動はタイトルへ進み、PLAYは直接本番を開始します。タイトルの「遊び方」からいつでも練習でき、動画の再視聴後はタイトルに戻ります。導入終了と練習完了は別々に保存します。音声つき自動再生がブラウザに制限された場合は、動画をタップしてください。

練習では左右移動 → 上昇 → 仲間の救出 → リングへの帰還を体験できます。障害物なし、練習位置への復帰あり。練習スコアは保存・ランキング送信しません。完了後は本番へ、途中終了ではタイトルへ戻れます。

通常ゲームはNORMAL/HARD。仲間をHOMEへ届けると得点が確定・保存され、20匹を一度に届けると12秒のレインボーモードが発動します。衝突時の損失や生成間隔はモード・経過時間・障害物の強さによって変化します。調整値は `src/difficulty.js`、`src/incoming.js`、`src/rainbow.js` を参照してください。

計測ビルドは1.3.2-collectionです。NORMALは初帰還までの同行者保護、水色の実損失を防ぐ1ラン1回のクッション防御、色別帰還記録を備えます。プロフィールは黄緑のみ最初から開放し、水色5・ピンク10・赤20・紫30体の累計帰還で開放します。PLAY直下と結果画面にNORMALの累計帰還数を表示します。スコア保存キーは旧NORMALと分離し、従来オンラインランキングには登録しません。HARDは従来ルールです。仕様・計測定義は [PSF-IMPLEMENTATION.md](PSF-IMPLEMENTATION.md) と [ANALYTICS.md](ANALYTICS.md) を参照してください。

終了時にSNS・LINEスタンプのポップアップを表示し、閉じると結果・図鑑・再挑戦へ進めます。SNSは公式リンクと提供ロゴ、LINEは提供されたスタンプ見本を表示し、リンク未設定のため準備中です。アイテムは3種類が取得可能で、追加6種類の影絵は図鑑だけの予告表示です。物語モードは撤去済み。コラボ機能は設定上OFFですが、コード・素材・テストは保持しています。

## 起動・配布

Node.js 20以降で `npm start`。PCでは http://localhost:5180 を開きます。スマホはPCと同じWi-Fiに接続し、PCのLANアドレスとポート5180を使用してください。接続が遮断される場合は `Enable-Mobile.cmd` を実行します。許可範囲はプライベートネットワーク内のTCP 5180です。

`npm run build` でdistへ静的配信データを出力。iOSへ反映する場合は続けて `npx cap sync ios` を実行します。Windowsでの同期は、iPhone実機での動作確認やXcodeビルドの代わりにはなりません。

プロローグの原本は `Asset/movie/Cosmii_Rescue_Opening.mp4`。素材は `Asset` で編集し、再生成される `dist` に直接追加しないでください。ゲーム本体は `src/engine.js`、練習は `src/training-game.js`、描画は `src/renderer.js` です。

## 検証・保守

`npm test` で物理・救出・帰還・保存・練習などを検証します（108件）。現在の主要ブラウザ検証は `verify-psf2.mjs`、`verify-result-social.mjs`、`verify-total-returned.mjs`、`verify-tutorial-entry.mjs`、`verify-joystick.mjs`（scripts内、ローカルサーバー起動後に実行）。旧仕様向けの検証スクリプトも残っているため、全スクリプトが現在の仕様に対応しているわけではありません。

通常ゲームだけを検証する場合は `?opening=off&analytics=off` を付けます。素材監査は `node scripts/audit-unused-assets.mjs`。これは削除を行わず、動画・音源の制作入力も考慮した一覧を `test-results/unused-assets.json` に出力します。LAN用サーバーは公開ゲームファイルだけを配信し、`.git`・ローカルデータ・ログは配信しません。

今回の整理記録は `REVIEW.md`、削除ファイルの一覧・ハッシュは `cleanup-review.json`。過去の実装経緯は `PHASE1-IMPLEMENTATION.md` に保持しています。
