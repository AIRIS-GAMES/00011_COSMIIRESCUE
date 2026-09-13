# COSMII RESCUE!

スマホ横画面の救出アクション。左手で左右、右タップで上昇。無操作では落下し、下限なくステージが続きます。PCではA/Dまたは左右キー、Spaceで上昇します。

仲間は主役の周囲に密集して追従。HOMEへ届けると得点になり、大人数の帰還にはボーナスがつきます。衝突すると仲間を1匹失い、1.8秒の被弾猶予が入ります。仲間がいない場合はライフ減少。最初の30秒はライフだけ保護されます。

背景はSKY、BONUS、DANGER、SPACEの4種類。BONUSにはレア仲間、暗いDANGERには追加障害物があります。区間移動に合わせて背景がフェードし、周囲の仲間やオブジェクトも漂います。

障害物は初期配置せず、進行方向の画面外から飛来します。横移動では左右、上昇・落下が強い場合は上下から入ります。通常は1.45秒間隔、DANGERでは0.85秒間隔。飛来後は追尾せず直進し、10秒で破棄します。最大14個。生成と移動はsrc/incoming.jsで管理します。

コラボ要素はゲーム本体・UI・配信用ビルドから削除済み。Assetには現在使用する34素材だけを保存しています。未使用の提供原本・元音源・生成中間素材は削除済みです。確変BGMは24秒の軽量版をループします。

Active objects: 18 transparent sprites in Asset/objects. Removed claw, pigeon and barrier are excluded. Unused source sheets and prompts have been deleted. Random size: 150-270 regular, 190-310 strong. Knife, fork and rocket point along their incoming trajectory. Checkpoints use a 3-column / 2-row grid; nearby ring-arrow hint within 900 world units. Persistent object labels removed.

## 起動

スマホはPCと同じ家庭内ネットワークのWi-Fiに接続し、`http://192.168.10.14:5180`をSafariまたはChromeで開きます（PCのIPアドレスが変わった場合は読み替え）。PCとサーバーは起動したままにしてください。接続が遮断される場合は`Enable-Mobile.cmd`を実行し、Windowsの管理者確認を許可します。許可範囲はプライベートネットワーク内のTCP 5180のみです。

Node.js 20以降。`npm start`で起動します。プレビューは http://localhost:5180 。同じポートで再起動するにはPowerShellで以下を実行します。

```powershell
$env:PORT='5180'
npm start
```

`npm run build`でdistへ静的配信データを出力。`npm test`で物理・救出・帰還・連続進行・背景区間を検証します。ブラウザ検証はscripts/verify-browser.mjs、verify-pop.mjs、verify-biomes.mjs、verify-bgm.mjs。

ゲーム本体はsrc/engine.js、区間生成はsrc/endless.js、背景はsrc/biomes.js、描画はsrc/renderer.jsです。BGMはAsset/Hypnoticcuping in the Wind.mp3。ポーズ・ミュートに連動します。実機スマホでの最終確認と公開配信は未実施です。
