# 救出数ランキングの反映

仕様：NORMALの1プレイでHOMEへ届けた数。累計帰還や飛距離は順位に使わない。
同数は同順位（1位・1位・3位）。TOP 20は最大20件で、同順位内の表示順は登録日時順。
HARD・練習からオンライン登録しない。飛距離の結果表示・累計帰還による解放は維持する。

## 本番への反映

対象プロジェクト：`dtokebihzpnkkrzrttus`。
SupabaseのSQL Editorで、次のファイルの内容を実行する。

`supabase/migrations/202611020001_rescue_leaderboard.sql`

既存の `202609300001_event_leaderboard.sql` が反映済みであることが前提。
今回の追加SQLだけを適用し、旧イベント・旧記録は削除・変換しない。

追加内容：

- イベント `cosmii-rescue-v1`（旧イベント `cosmii-event-01` と分離）
- 新ランキング取得RPC `cosmii_rescue_top_scores`
- 新ランキング登録RPC `cosmii_rescue_submit_score`
- 新イベントの `score = rescued` を保証する制約

既存RPCの入力検証・イベント受付制御・二重登録防止を引き継ぐ。
新RPCの公開項目は旧ランキングと同じで、テーブルの直接アクセスは禁止したまま。

## 適用後の確認

1. SQL Editorで `select * from public.cosmii_rescue_top_scores('cosmii-rescue-v1');` が成功することを確認。
2. ゲームを再読み込みし、RANKINGの「救出 TOP 20」を開く。
3. NORMALの結果画面に「救出数ランキングに登録」が表示されることを確認。
4. 通常の実プレイで登録する。本番ランキングにテスト記録を投入する必要はない。

## 現在の状況（2026-11-02）

ゲーム側実装、PGliteによるSQLテスト、ブラウザからPGliteへ接続する登録・再送テストを実施済み。
追加SQLの案内後、本番の新RPCを読み取り専用で再確認し、HTTP 200と登録済みレコードの取得に成功した。
本番へのテスト記録の追加・更新・削除は行っていない。新規環境では上記SQLの適用が必要。
