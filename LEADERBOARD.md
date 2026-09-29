# イベントランキング（Supabase）

NORMAL専用、イベント別の上位20件です。リザルトでニックネームを入力し、本人が「登録」を押したスコアだけを公開します。途中終了も対象です。未送還の仲間は加点しません。個人のMY TOP 5は従来どおり端末内に保存されます。

## 初回セットアップ

1. Supabaseでプロジェクトを作成します。
2. SQL Editorで `supabase/migrations/202609300001_event_leaderboard.sql` を実行します。
3. プロジェクトのConnect画面／API KeysからProject URLと **Publishable key (`sb_publishable_...`)** を取得します。
4. `src/leaderboard-config.js` の `url` と `publishableKey` に設定します。URL末尾の `/` は不要です。`eventId` はSQLに登録した `cosmii-event-01` と一致させます。
5. ローカルサーバーはページを再読み込みすれば反映します。配信版は `npm run build` で更新してください。

設定前でもゲームは動きます。登録フォームは非表示で、ランキングのEVENT TOP 20には「準備中」と表示します。接続後、NORMALのリザルトに登録フォームが出ます。HARDは端末内の記録だけです。

公開キーはブラウザから利用するためのものです。Secret key、service_role、データベースのパスワードは、この設定ファイルに入れないでください。テーブルはRLSと権限で直接アクセスを禁止し、公開する2つのRPCだけを呼び出します。

## イベント運用

- スコア降順。同点の場合は先に登録されたプレイが上位です。
- 通信失敗時は「再試行」を押してください。同じプレイIDでは重複登録・上書きしません。送信結果が不明な場合も、同じ名前で再試行します。
- 登録前／通信失敗中にリザルトを閉じると、そのプレイをオンライン登録する操作はできなくなります。端末のMY TOP 5には通常どおり記録されます。
- 「1人1回」と15分の時間管理はスタッフ運用です。本人確認・端末制限・自動終了は実装していません。共有端末でも次の人がプレイできます。
- この版はクライアントが計算した得点を登録します。スコアの改ざん防止／サーバーでのプレイ検証はありません。プレゼント判定にはスタッフが実プレイとリザルトを確認してください。
- ニックネームは全員に公開されます。投稿の削除はSupabase管理画面から行えます。

受付終了（表示は継続）:

```sql
update public.cosmii_events set accepting_scores=false where id='cosmii-event-01';
```

別イベントを開始するときは、過去の記録を削除せず新しいIDを作り、設定ファイルの `eventId` を変更します。

```sql
insert into public.cosmii_events(id) values ('cosmii-event-02');
```

## 検証

`npm test` は接続処理と、PGlite（PostgreSQL）上でのSQL実行・権限制御・二重送信・順位計算を検証します。実際のSupabaseプロジェクトへの接続は設定後に確認が必要です。

ローカルサーバー起動中に `node scripts/verify-leaderboard.mjs` を実行すると、ブラウザとローカルPostgreSQLを使い、登録・読み込み・通信失敗後の再送信・スマホの縦横表示を確認します。Supabase本番にはデータを送信しません。

公式資料: [API keys](https://supabase.com/docs/guides/getting-started/api-keys)、[Database functions](https://supabase.com/docs/guides/database/functions)、[Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)。
