# カニジャン：共通仕様後続と保全検証

2026-11-02 JST。既存 `common-spec-migration.md` は過去時点の記録として保持し、今回の差分を本書に記録します。

## 対象と固有契約

05:06 JSTの稼働登録でカニジャン/kanijan/active/shared/desc/scale1/小数0桁、正式URL https://chameleonjp.codeberg.page/kanijan/ を照合。05:07 JSTに同公開ホームを読取確認。全プレイ受入や今回PRの公開確認ではありません。詳細ランキングは https://chameleonjp-lab.github.io/chameleonjp_lab/ranking.html?game=kanijan 。新GitHub版の全機能確認前にURLを切り替えません。

元PR9 head `fcebdb63f49161722856f57dfebc0fde0c607b37` / base `444f08bfea5b8af46b409039041dc77fba189435`。同branch/Draft状態を維持します。

60秒、50段以降の🍥、物理・判断窓・バランス、PERFECT100/OK50/EARLY−30/HIT−50点、0下限、コンボmin(300,10×combo)、10/20/30段の300/700/1000点を維持。**0点かつ非リタイアは送信除外、明示リタイアは0点も従来どおり対象**です。ゲストはどの終了でも公開送信しません。採点/更新/描画ブロックは元版と全文同一、表示言語だけで進行・時間・点数・IDを変えません。追加の匿名集計は新設しません。

## 独自保存形式を維持した修正

このゲームの独自 `kanijan:last-result:v1` / `kanijan:pending-result:v1:<UUID>` と payload形式を保持し、他ゲームのqueueを無条件に置換しません。

- 確定payload/保存キー/名前/整数点/高さ/最大combo/終了理由を検査し、combo<=height、retiredと理由、guest/excluded等の公開条件を整合確認。保存/通信のためにルールを変更しません。
- 各pendingは全文set→get一致後に送信。保存不可/無言の書込失敗は同じUUID・結果を画面に保持し、15言語で未保存警告。回復時は同じpayloadを再保存してから送信します。ゲスト/既知受理の保存再試行は送信なしです。
- `sent` を削除せず既知受理の台帳として保持。過去版の「送信後削除」は現在の動作と区別します。壊れたraw、同ID異payload、表示snapshotとpendingの同ID衝突は上書きせず隔離。無関係な壊れた表示snapshotで、正常な別pendingの送信を止めません。
- 表示用の正常な旧結果を次プレイで外す前に、`kanijan:result-history:v1:<UUID>` へ全文読み戻し一致の控えを保存。容量不足なら旧原文を保持。壊れた表示結果は削除しません。保存容量不足では再読込後の最新結果保持を保証できないことを警告します。
- ACKは正常RPCの1行配列・9列・名前・signed整数記録・booleanを確認。不明応答は同UUIDのまま再試行、明示拒否は再送しない状態で保持。非冪等な旧RPCへfallbackしません。
- READY開始時にも世代を進め、旧送信/ランキング応答を新しいプレイへ反映しません。順位表示はサーバー順/同点順位/過去signed点を維持、unsafe整数/不正shapeを空の成功にしません。
- 音声の部分生成失敗/個別disconnect例外を後片付けし、native interruptionとresume前に古いvoiceを停止。closed contextは次操作で作り直し、新しい音声時計へthrottleをリセット。既存音源/音量/初回on0.5/保存offと0を維持します。pagehideも停止。

## 13項目対応表

|項目|現在の状態|残る条件|
|---|---|---|
|1 対象条件|現登録/公開ホーム確認|全プレイ受入とは別|
|2 ルール/記録|固有採点/識別/保存形式維持|本番データ無変更|
|3 GitHub正式化|未完了|同等性/Source/本人マージ/公開/別origin保存移行後に導線切替|
|4 15言語|既存本文を保持、未保存警告追加で15×85|母語評価/実機|
|5 任意名/自動送信|開始名固定/guest0/独自receipt保全を強化|正常RPC DB適用とidentity未解決|
|6 詳細/上位30|既存詳細URL/集計RPC/安全表示を維持|同名別人/改名を含む独立参加者30人の保証は未完了|
|7 X共有|両画面/15言語/コピー代替を維持|投稿確定は本人、現Codeberg URLを維持|
|8 SE|既存開始/成功/失敗/節目/終了を維持、cleanup修正|実際の聴取|
|9 音設定|off/0/復帰/closedの回帰検証|iPhone Safari実機|
|10 文言/画面|既存画面を保持、未保存警告追加|実機キーボード/狭幅/長時間|
|11 自動公開|PR検証のみ/main検証済artifact配信設定|Source設定/本人マージ/本番確認|
|12 検証|構文/unit/独立レビュー/両engineモック|最終head CI参照、実機未実施|
|13 PR/記録|同PR9を更新、旧資料/本文を保持|未完を完了扱いにしない|

## 検証・再開・戻し方

`python3 tools/check-site.py`、`python3 tools/build-locales.py --check`、`node --test tools/*.test.mjs`。CIでChromium/WebKitの `tools/browser-smoke.cjs` を実行します。localhostとモックSupabase以外を遮断し、Xは投稿画面の代替を検証するだけです。

ブラウザはテスト限定注入で実spawnPlatform/applySuccessを20回呼び5100点/20段/20comboを確認。これは60秒の実操作プレイ完了ではありません。guest/名前あり/開始後の名前編集/不明ACK→再読込→同UUID再送/受理台帳維持/名前あり・ゲストのquota保存回復/0点除外と明示リタイア0点/15言語の共有/縦横/音off0を検証します。テスト注入は公開HTMLへ追加していません。

公開前に実験場PR43のnormal receipt SQLレビュー・適用・読み戻し確認が必要（今回未適用）。既存name-key identityの同名別人/改名は本人判断待ち、勝手にparticipantを再作成しません。Pages Sourceと環境保護を確認し、本人マージ後に同commit artifactの配信/実URL受入を確認。その後にのみ承認されたURL切替・旧ページ案内を行います。今回DB/権限/本番配備/マージ操作はしていません。

iPhone17Pro Safariでは縦横/任意名/音0/共有から戻る/画面ロック後の古音なし、60秒本編から結果の状態保持を確認してください。実機・聴取・母語査読・長時間負荷をCI成功で代替しません。

戻す場合は安全な旧commitへ戻すPRを同検証経路で本人マージ。receiptのsent/history/pending・既存名/音/言語は消さず、既知受理を未送信へ変換しません。旧Codebergの導線・サーバー記録は今回無変更です。


## 09:50 JST normal acknowledgement validation
Baseline PR9 `7875594229026d00c9fa45687eaffe3637190400`: a public submission regression reproduced out-of-int4 / best-below-submitted receipts marking the durable result sent. Validation now checks PostgreSQL integer bounds and the current descending best contract. Signed first-score history remains valid; game score/retirement rules and stored identity remain unchanged. RED→GREEN, all 40 local tests, site staging and 15×85 catalog verification pass. Independent review and current-head Chromium/WebKit CI remain pending, separate from device/production acceptance. No DB or production writes.
