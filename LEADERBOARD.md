# 救出数ランキング（Supabase）

## 現在の仕様：2026-11-03

初回に名前を公開して参加し、以降はNORMALの自己ベスト更新時に自動送信します。匿名認証のユーザーIDごとに1枠を保持し、同点・低いスコアでは上書きしません。

- 新テーブル：`cosmii_player_bests`。新RPC：`cosmii_player_top_scores` / `cosmii_player_submit_score`。
- イベントIDは `cosmii-rescue-v1` のまま。旧テーブルは保管し、新ランキングには混ぜません。
- 投稿者はJWTの `auth.uid()` で決定します。名前やクライアント指定のユーザーIDで所有者を決めません。
- 未送信の最高記録を端末に保持し、再起動・オンライン復帰・再表示・60秒間隔で再送します。
- データ消去や再インストール、別端末への引継ぎはアカウント連携未実装のため対象外。
- 手順：[SUPABASE-AUTO-RANKING-SETUP.txt](SUPABASE-AUTO-RANKING-SETUP.txt)。2026-11-03にユーザーがSQL適用成功を報告。読み取り確認で匿名サインイン有効・新ランキングRPC HTTP 200（0件）を確認済み。本番投稿は未検証。
- 検証：`tests/player-ranking.test.mjs` と `scripts/verify-auto-ranking.mjs`。

## 旧版の仕様・導入履歴

NORMALの1プレイでHOMEへ届けた数を、本人が結果画面から登録します。途中終了も対象です。
HARD・練習はオンライン登録しません。飛距離は参考表示、累計帰還はふれあいや解放に使います。

- 新イベントID：`cosmii-rescue-v1`。旧 `cosmii-event-01` は削除・変換しません。
- 同数は同順位（1・1・3位）。同順位内は登録日時順。表示は最大20件です。
- `score = rescued` の制約をDBにも適用。UUIDによって通信失敗後の重複登録を防ぎます。
- 公開項目は順位・名前・帰還数。テーブルの直接参照・書き込みは禁止し、専用RPCを利用します。
- クライアント申告の数値であり、不正スコアの完全な検証は行いません。

導入SQLと反映状況は [RANKING-DEPLOY.md](RANKING-DEPLOY.md) を参照してください。
公開キーを `src/leaderboard-config.js` に設定します。秘密鍵・service_roleキーは含めません。

受付終了後も閲覧を残す場合：

```sql
update public.cosmii_events set accepting_scores=false where id='cosmii-rescue-v1';
```

新しい開催回を設ける場合は、設定のIDだけでなく、専用RPCのイベント制限とDB制約も移行SQLで更新してください。

検証は `npm test` と `node scripts/verify-leaderboard.mjs`。
後者はブラウザとローカルPostgreSQL互換環境を接続し、本番には記録を送信しません。
# 自由入力名の安全対策（2026-11-03追加）

本番への反映は `SUPABASE-RANKING-SAFETY-SETUP.txt` を参照。
追加SQL `202611030003_ranking_safety.sql` と `delete-ranking-account` Edge Function の反映が必要です。

- 名前は自由入力のまま、サーバーで初回投稿・名前変更・旧版投稿を検証。
- 新しい一覧APIは `cosmii_player_top_scores_v2`。認証ユーザーIDを公開せず、公開専用IDで通報・非表示を処理。
- 非表示は端末内に保存し設定から解除。通報は認証必須、同じ相手24時間1件・全体1日5件。
- 設定の「ランキング・サポート」から問い合わせ・ポリシー・非表示解除・データ削除へ移動。
- 削除は匿名Authユーザーと関連するランキング・通報を対象にし、ローカルの部屋・図鑑・自己ベストは維持。
- 旧RPCを停止せず、NG語と非公開状態を旧一覧にも反映。旧認証なし記録は所有者を判定できないため削除依頼を運営対応。
- 通報は `cosmii_reports` に入り、運営担当者の確認が必要。操作例は `supabase/admin/ranking-moderation.sql`。
