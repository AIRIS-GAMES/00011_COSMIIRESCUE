# iOS録画向け音声変更

## POP連続再生とフィーバー中の音声

- POP（rescue）は最初の音を即時再生し、そこから150ms以内の追加POPは再生しない。フレームをまたぐ場合も音源の停止・巻き戻しを行わない。
- 通常／コラボのフィーバー中はBGMのみ。開始フレームの効果音処理より先に音声状態を切り替え、再生中の効果音も停止する。終了後は通常の効果音に戻る。
- `npm test` で時間差POP・フィーバー抑制を検証。ビルド後の `node scripts/verify-audio-burst.mjs` で同時POPとフィーバー開始／終了のブラウザ再生を検証する。

## 実機確認後の音源形式

iPhone Safariで、同じ救出音のWAV版は無音・MP3版は聞こえることをユーザーが確認。
全15効果音を `Asset/audio/sfx-mp3/*.mp3` に切り替えた。
WAVはオフライン生成用の原本として保持し、ゲームの再生・配布には使用しない。
再生成は `python scripts/generate-sfx.py` → `python scripts/prepare-sfx.py` → 通常のビルド・同期。
MP3変換後もデコードしたピークが0.10以下であることを検証する。
以下にあるWAV再生の記載は初回実装時点の記録。

### MP3再生開始の負荷軽減

同じイベント処理内で繰り返された効果音は種類ごとに1回へまとめる。
同一音声の再生準備中は重ねてpause/seek/playを要求しない。
救出HUDのアニメーション再計算も、同時救出の人数に関係なく1回にまとめる。
スコア・救出数・ゲームイベント自体はまとめず、個別に処理する。
`node scripts/verify-audio-burst.mjs` で、同時20救出が音声開始1回・HUDレイアウト読み取り1回になることを検証。

## 現在の切り分け用設定

ユーザーの依頼により、現在の「♪」ボタンは **BGMのみON/OFF**。
効果音はBGM OFFでも再生する。保存済みの `muted` も現在はBGMだけに適用する。
一時停止・画面遷移・バックグラウンド時は従来どおり両方を停止する。
以下の「共通ON/OFF」は変更前の仕様を記録したもの。

## 比較・呼び出し一覧

指定された `C:\MyWork\startup\00010\_CosmiiCannon` は存在しなかったため、実在する
`C:\MyWork\startup\00010_CosmiiCannon` の `www/index.html` を参照した。参照側は変更していない。
作業開始時、このリポジトリの `git status --short` は空だった。

| 対象 | 変更前 | 変更後 |
| --- | --- | --- |
| 参照実装 | BGM 2個、WAV効果音2個を `new Audio()` で再生。BGM 0.18/0.22。効果音は pause → seek(0) → play | 参照のみ |
| `src/audio.js` BGM | MP3 2曲を1要素で切替、音量0.45 | 同じ曲を減衰したMP3、1要素を維持、音量0.20 |
| `src/audio.js` 効果音 | `AudioContext` / `webkitAudioContext`、`tone()`、oscillatorとgainによる合成 | 15個のWAVとHTMLAudioElement。全16識別子を維持 |
| ネイティブ | 独自AVAudioSession、mixWithOthers、AVAudioPlayer、音声プラグインはいずれも存在せず | 追加なし。削除対象なし |

実行時の合成コンテキスト、resume/suspend、oscillator、gain、接続処理、波形生成を削除した。
BufferSource、Convolver、BiquadFilter、ノイズ生成は元から存在しない。

### 呼び出し元（すべて既存イベントのまま）

- `src/main.js` の `processEvents()` → `audio.effect(e.type)`。
- `src/engine.js` が発行: `turn`, `flap`, `rescue`, `return`, `bank`, `bump`, `lost`, `hit`, `break`, `near`, `rim`。
- `src/rainbow.js` が発行: `rainbowStart`, `rainbowEnd`。
- `src/main.js` の記録更新判定 → `audio.effect('best')`。
- `coin`, `pass` は旧音声クラスに定義のみ存在。呼び出し元なしだが互換用の音源を維持。
- BGM: `startNow()` → `restart()`、毎フレーム → `setRainbow()` / `music()`。
- シーン変更・タイトル復帰 → BGMと効果音停止。一時停止 → 両方停止、再開操作 → BGM継続。
- `blur`, `visibilitychange(hidden)`, `pagehide` とCapacitor標準のdocument `pause` → `background()` → 全音声停止。
- 復帰時は既存仕様どおり一時停止画面を保ち、RESUME操作で再開。古い短い効果音は再開しない。
- `#sound` → `audio.enabled`。OFFにした時点で再生中の全音声も停止。
- Safari対策: PLAYなどの実タップ／キー操作中に、全HTMLAudioElementで一度 `load()` を呼ぶ。
  変数の切り替えだけでは音声要素ごとの再生制限は解除できない。
  初期化時に効果音を一斉再生せず、初期化済み要素は読み直さない。
  再生拒否後は次の実操作で該当要素を再初期化する。エラーは `audio.lastError` に保持する。
  根拠: [WebKitによる要素ごとの初期化の説明](https://bugs.webkit.org/show_bug.cgi?id=134925#c2)。

このゲームの既存UIはBGM・効果音共通のON/OFFであり、個別設定はない。
`cosmii-settings-v1` の `muted`、旧normal/hard保存データからの移行、スコアは変更していない。

## 音量・ファイル

- BGM要素: 通常／レインボーとも **0.20**。
- 効果音: turn 0.30、coin 0.35、rainbowEnd/bump/rim/pass 0.40、bank 0.45、
  rainbowStart/return/lost/near/best 0.50、break 0.55、flap/rescue/hit 0.60。
- スマホで聞き取りやすいよう、flap/rescueの音源ピークを0.095に調整。
  元の音源に対してflapは約+6.7 dB、rescueは約+4.0 dB。周波数・長さは維持。
- 同一効果音は要素を再利用し `pause()` → `currentTime=0` → `play()`。
  最大4音。超過時は最古の音を停止する。BGMは常に1要素だけ。
- WAVは44.1 kHz / mono / 16-bit PCM、0.09〜0.76秒。元の周波数、指数的な音程変化、
  和音の時間差、音量エンベロープをオフラインで再現。高調波制限と末尾フェードを使用。
- WAVのピークは0.10以下。BGMは再圧縮後のデコードピークを0.40以下に検証。
  実測は通常0.3609、レインボー0.3308。同時最大4効果音との保守的なピーク合計も0.80以下。
- iOSではvolume設定に制約があるため、ファイル自体にもヘッドルームを確保した。
  [Appleの仕様](https://developer.apple.com/library/archive/documentation/AudioVideo/Conceptual/Using_HTML5_Audio_Video/Device-SpecificConsiderations/Device-SpecificConsiderations.html)。
  OS側の録画ミキサー・端末の出力処理を含む品質は実機で確認する。

### 正規の生成・同期

既存ビルドは `dist` 出力、Capacitorだけが存在しない `www` を参照していた。
`capacitor.config.json` の `webDir` を `dist` に合わせた。生成物への直接修正は行わない。

通常のビルド（音源はリポジトリに含む）:

```sh
npm ci
npm test
npm run build
npx cap sync ios
```

音源を作り直す場合のみ:

```sh
python scripts/generate-sfx.py
# ffmpegをPATHに配置するか、Pythonのimageio-ffmpegを用意する
python scripts/prepare-bgm.py
npm run build
npx cap sync ios
```

元のMP3 2個は再生成用に保存し、配布には `Asset/audio/bgm/` の減衰版だけを含める。
asset監査でも原本を削除候補から除外。Capacitor同期によりPackage.swiftがCLIの
標準形式（capacitor-swift-pm exact 8.5.2）に更新された。

## 検証

- `npm test`: 55件成功（既存51件＋音声4件）。
- `npm run build`: 49アセットを出力。
- `npx cap sync ios`: 成功、`ios/App/App/public` をビルド出力から同期。
- `node scripts/verify-bgm.mjs`: 通常BGM、pause/resume、ON/OFF、タイトル停止。
- `node scripts/verify-rainbow.mjs`: 曲切替、一時停止、通常曲復帰。
- `node scripts/verify-review-fixes.mjs`: 通常／レインボーのバックグラウンド停止、明示的復帰、OFF保存。
- `node scripts/verify-audio.mjs`: distの全15 WAVを実際のHTMLAudioElementでデコード・再生、
  Capacitorのpauseイベント、復帰、連打、ミュート、再読み込み。
- 上記ブラウザ検証は `npm start` を起動して実行する（Chromeが必要）。
- ゲームソースと配布・同期先に旧コンテキスト名・音声ノード・独自ネイティブ音声経路がないことを検索確認。

**未実施:** Windows環境にXcodeがないためiOSネイティブビルド、署名、iPhone録画。
Webビルド／Capacitor同期成功をiOSビルド成功とは扱わない。

## Mac / iPhoneでの受け入れ確認

Macで上記ビルド・同期後に以下を実行し、実機へインストールする。

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -configuration Debug -sdk iphonesimulator -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
npx cap open ios
```

実機の署名は既存のチーム設定を使用。ゲームの音をONにし、コントロールセンターの
画面録画を**マイクOFF**で開始する。戻った際に一時停止画面ならRESUMEを押す。

既存UIを変更せず3条件を分離するには、Mac SafariのWeb Inspectorで対象アプリを開き、
次を実行する。保存データは書き換えず、リロードで解除される。

```js
window.recordingAudio = (await import('./src/main.js')).audio;
// 1. BGMのみ
recordingAudio.bgm.muted = false;
Object.values(recordingAudio.sfx).forEach(a => a.muted = true);
// 2. 効果音のみ（別の録画で実行）
recordingAudio.bgm.muted = true;
Object.values(recordingAudio.sfx).forEach(a => a.muted = false);
// 3. 両方ON（別の録画で実行）
recordingAudio.bgm.muted = false;
Object.values(recordingAudio.sfx).forEach(a => a.muted = false);
```

各条件で30〜60秒録画し、録画ファイルを再生して確認する:

- 通常曲／レインボー曲、救出・HOME帰還・連打・衝突時の歪み、途切れ、音量。
- 曲の二重再生がないこと。レインボー終了後は通常曲の保存位置から継続すること。
- pause/resume、タイトル／リトライ、ホーム画面移動、画面ロック／復帰、録画開始／停止後の状態。
- バックグラウンド中は無音、復帰はRESUME後にBGMのみ継続し、過去の効果音が流れないこと。
- 共通音声OFF→再起動→OFF保持。ONへ戻した後は再生できること。
- マイクOFFの録画にゲーム音が含まれ、3条件すべてでガビガビした音がないこと。
- サイレントスイッチON/OFFの挙動も記録する。独自のネイティブ音声セッション設定は加えていない。

端末名・iOSバージョン・アプリビルド・録画条件と結果を記録して最終判定する。
