# カニジャン 実装計画書

## 作業順序
1. 既存ファイル確認: リポジトリ内の既存ファイルと AGENTS.md の有無を確認する。
2. サブエージェント役割分担の作成: 仕様検査、スマホ操作、ゲーム処理、Canvas描画、ランキング、QAの6担当を定義する。
3. 固定仕様の確認: SPEC.md に game_slug、公開URL、スコア、ランキング、状態管理、禁止事項を整理する。
4. 性能予算の確認: 60fps目標、上限数、通信回数、DOM更新範囲を明記する。
5. 実装計画書の作成: 本ファイルを作成してから index.html 実装に入る。
6. 実装開始: index.html 1ファイル完結でHTML/CSS/JSを実装する。
7. 自己レビュー: REVIEW_CHECKLIST.md に沿って確認する。
8. READMEと仕様書の更新: 実装内容、公開手順、Supabase注意点を反映する。
9. 最終確認結果の出力: テスト結果、懸念、公開時確認を報告する。

## サブエージェント役割分担
- 仕様検査担当: 依頼内容との差分、旧案絵文字不使用、🍣🍤使用、game_slug `kanijan` を確認する。
- スマホ操作担当: iPhone SE幅、タップ範囲、横スクロール、長押し、ズーム、下部ボタンを確認する。
- ゲーム処理担当: ループ、判定、スコア、コンボ、終了条件、リタイアを確認する。
- Canvas描画担当: 🦀、🍣、🍤、足場、揺れ、パーティクルがCanvasで軽量描画されるか確認する。
- ランキング担当: Supabase、submit_score、ランキング取得、二重送信防止、public.scores不使用、secret key不使用を確認する。
- QA担当: 仕様、性能、スマホ操作、ゲーム進行、当たり判定、ランキング、文言を総合確認する。

## 影響範囲
- 新規または置換する静的ファイルのみ。外部ビルド環境やパッケージ管理は導入しない。
- 実験場本体、他リポジトリ、Supabase本番データは編集しない。

## 実装するファイル
- `index.html`: ゲーム本体。HTML/CSS/JavaScriptをすべて内包する。
- `README.md`: ゲーム概要、操作、スコア、ランキング、Supabase、公開確認。
- `docs/SPEC.md`: 固定仕様、性能予算、禁止事項、画面、ランキング等。
- `docs/IMPLEMENTATION_PLAN.md`: 実装前計画。
- `docs/REVIEW_CHECKLIST.md`: 自己レビュー結果。
- 必要に応じて `docs/SUPABASE_SETUP.md`: コピペ用SQLと公開作業。

## 変更しない箇所
- 実験場トップや詳細ランキングページの固定 GAMES 配列はこのリポジトリでは編集しない。
- secret key / service_role key は追加しない。
- npm、Vite、Node.js設定は追加しない。

## 主要関数の設計
- `setState(nextState)`: 画面表示と状態を切り替える。
- `startReady()`: 名前確認後、READYカウントダウンを開始する。
- `startGame()`: スコア、時間、足場、パーティクル、フラグを初期化しPLAYINGへ移行する。
- `gameLoop(now)`: requestAnimationFrameで描画を継続し、PLAYING時のみ更新する。
- `updateGame(dt)`: 入力、経過時間、足場移動、ジャンプ要求、終了条件を処理する。
- `handleJump()`: タップ要求を消費し判定を行う。
- `judgeLanding(offset, type)`: PERFECT / GOOD / OK / MISS を返す。
- `applySuccess(judge, platformType)`: スコア、コンボ、高さ、バランス、到達ボーナスを更新する。
- `finishGame(reason)`: 結果を固定しRESULTへ移行する。
- `submitRankingOnce()`: 通常0点以外、またはリタイア時は0点でも submit_score RPC で1回だけ送信する。
- `fetchRanking()`: get_best_score_ranking を取得し結果画面に表示する。
- `shareHome()` / `shareResult()`: Web Share APIまたはクリップボードコピーを行う。

## 状態管理の設計
- 状態定数は `STATES = { HOME, RULE, NAME, READY, PLAYING, RESULT, ERROR }` とする。
- `state.current` で現在状態を保持する。
- `game` オブジェクトにスコア、高さ、コンボ、最大コンボ、残り時間、バランス、足場、パーティクル、結果固定値、送信状態を保持する。
- PLAYING以外では `updateGame` が早期 return し、当たり判定・スコア加算をしない。

## ゲームループの設計
- requestAnimationFrameを1本だけ起動する。
- 処理順は、入力を読む、PLAYING確認、経過時間計算、飛来足場更新、タップ処理、判定、スコア等更新、終了条件確認、Canvas描画、終了時RESULT移行、RESULTでランキング送信1回。
- 厳密には描画はHOME/RULE/RESULTでも軽量な静止画を描くが、ゲーム判定はPLAYINGのみ行う。

## ランキング送信の設計
- Supabase REST RPCを `fetch` で呼び、外部SDKを読み込まない。
- 送信先: `/rest/v1/rpc/submit_score`。
- headerには publishable key / apikey / Authorization Bearer publishable key を使う。
- bodyは `p_display_name`, `p_game_slug`, `p_score`, `p_client_version`。
- `game.rankingSubmitted` と `game.rankingSubmitStarted` で二重送信を防ぐ。
- 通常0点の場合は送信せず、結果画面に未送信理由を出す。リタイア時は0点でもプレイ回数計測のため送信する。
- 送信失敗時は結果を壊さず「ランキング送信に失敗しました」と表示する。
- ランキング取得は `get_best_score_ranking` を結果画面で1回だけ呼ぶ。

## スマホ操作対策
- viewportで `user-scalable=no`、CSSで `touch-action: manipulation` とゲーム領域 `touch-action: none` を設定する。
- body/htmlに `overflow-x: hidden`、`width: 100%` を設定する。
- `100dvh`、safe-area inset、固定下部操作エリアを使用する。
- ボタンは44px以上、ジャンプボタンは大きく配置する。
- game画面中の touchmove はゲーム領域で preventDefault する。

## 性能対策
- Canvas描画の足場は最大40段、内部保持は最大100段。
- 飛来足場は常に最大1個。
- エフェクト最大20、パーティクル最大80で超過分を破棄する。
- DOM更新はスコア・高さ・時間・状態・バランスに限定し、値が変わった時だけ行う。
- innerHTMLはランキング等の画面更新時のみ使用し、ループ内では使わない。
- setIntervalは使わず、READYカウントダウンは少数のsetTimeoutまたはrAF経過時間で管理する。

## テスト方法
- `python3 -m http.server` でローカル配信し、ブラウザで確認する。
- `rg` で 旧案絵文字、public.scores、service_role、secret、nanijan URL/slug 誤用を確認する。
- `node --check` 相当は単一HTMLのため、JavaScript部分を一時抽出して構文確認する。
- 目視でホーム、ルール、名前、READY、ゲーム、結果、ランキング失敗表示を確認する。

## 公開前再修正メモ
- READYカウントダウンは、`Math.ceil((state.readyDuration - elapsed) / 1000)` のような残り時間丸め依存ではなく、`elapsed` の範囲で `3`、`2`、`1`、`GO!` を明示的に表示する設計として再確認した。
- READY完了時は `readyCompleted` フラグを立ててから `startGame()` を呼び、READY終了判定が複数フレームで成立しても `startGame()` が二重実行されない設計として再確認した。
- PLAYING以外ではゲーム更新を行わないため、READY中に足場移動、当たり判定、スコア加算が進まない設計として再確認した。
- 描画座標は `landingY` を基準にし、飛来足場の🍣🍤と基本状態の🦀が画面内に残りやすい設計として再確認した。
- 高さが増えても🦀が上方向へ逃げ続ける旧構造ではなく、積み上がった足場のみを `landingY` から相対描画する設計として再確認した。
- スコア処理、ランキング処理、シェア文、Supabase設定は今回の変更対象外とし、仕様変更を行わない。
- 今回のdocs追記では、実装済み内容の確認記録を整えるだけとし、`index.html` は変更しない。

## 2026-06-19 ゲーム性改善計画
- 単調さの原因: 食材が左右水平かつ🦀の下付近を通り、横位置ズレ中心の判定で待って押すだけになっていた。
- 修正するゲーム性: 🍣🍤が🦀本体中心へ飛来し、衝突直前にジャンプして乗る反射型ゲームにする。
- 飛来方向: 左右水平、左上/右上から斜め下、左下/右下から斜め上の6方向。
- 速度: 🍣は150→225、🍤は185→370。高さ補正は残すが上限を設ける。
- 判定方式: 横位置ではなく `timeToHit = 残り距離 / speed` で PERFECT / OK / 早すぎ / HIT を判定する。
- スコア: PERFECT +100、OK +50、早すぎ -30、ぶつかり -50、成功時コンボボーナス最大300、到達ボーナス維持。
- ゲージ: PERFECT -20、OK -10、早すぎ +15、ぶつかり +25。0〜100にクランプし100で終了。
- ランキング: `GAME_SLUG`、`GAME_URL`、Supabase URL、Publishable key、`submit_score`、`get_best_score_ranking` は変更しない。
- 影響関数: `spawnPlatform`、`updateGame`、`handleJump`、`applySuccess`、描画/演出、README/SPEC/チェックリスト。
- テスト方法: HTML内JavaScript構文確認、固定文字列の `rg` 確認、ランキング/Supabase非変更確認、ローカルHTTP配信で手動確認。


## 2026-06-19 判定修正・🍥追加計画
- 原因整理: 到達済み/通過済みの食材にも距離ベースの `timeToHit` を使うと、ぶつかった状態と早すぎ状態が混ざる。
- 判定順: 処理済み確認、位置更新、到達判定、ジャンプ判定、未ジャンプ到達時のぶつかり判定の順にする。
- 到達判定: start/target/totalDistance から `progress` を持ち、`progress >= 1` または衝突半径内なら到達済みとする。
- 二重判定防止: 食材ごとに `resolved` を持ち、成功/失敗が決まった時点で true にする。
- ルール説明: 短いプレイヤー向け文にし、ゲージが増える時と減る時を分ける。
- シェア文: Web Share API もクリップボードもURLだけにせず、`text` に全文を入れる。
- 🍥追加: 高さ50段以上で約20%出現。基本速度は旧🍣基準150×2.3=345。
- ランキング: GAME_SLUG、GAME_URL、Supabase URL、Publishable key、RPC名、結果画面の自動送信1回は変更しない。
- 影響関数: `spawnPlatform`、`updateGame`、`handleJump`、`timeToHit`、`applyFailure`、`shareHome`、`shareResult`。
- テスト方法: JavaScript構文確認、固定文字列確認、ランキング/Supabase非変更確認、手動プレイ確認。


## 2026-06-19 追加修正の実装前整理
1. 連続被弾の原因: 失敗直後に現在食材を解決済みにしただけで次食材を即生成していたため、復帰前に次判定が始まっていた。
2. `applyFailure` 後の即spawn: 旧実装は `applyFailure` 末尾で `spawnPlatform()` を呼んでいたため削除対象。
3. HIT後の復帰時間: 🍤/🍥を区別せずHIT共通で0.55秒待ち、現在食材は破棄する。
4. EARLY後の復帰時間: 0.32秒待ち、次食材は復帰完了後に生成する。
5. 復帰中のタップ反応: 判定せず、🦀を小さく跳ねさせて「次に備えて！」を表示する。
6. `pendingJump` 持ち越し防止: 復帰開始時・復帰中・終了開始時に `pendingJump=false` にする。
7. ENDING状態: 終了条件で結果値を固定し、2秒タイマー後にRESULTへ移行する。ENDING中は更新判定を行わない。
8. リタイア計測: `wasRetired` を固定し、0点でも `submit_score` の未送信分岐を通さない。
9. 50段以降ガイド非表示: 描画時に `game.height < 50` の場合だけガイドラインを描く。
10. 長押し対策: ゲーム操作領域にCSSとイベント抑制を追加し、ホーム/結果リンクには適用しない。
11. ランキング影響: RPC名、game_slug、URL、Supabase設定、ランキング取得は変更しない。
12. 数値非変更: スコア・ゲージ・速度・判定閾値の定数は変更しない。
13. 影響関数: `queueJump`、`updateGame`、`applyFailure`、`draw`、`finishGame`、`submitRankingOnce`、入力イベント。
14. テスト方法: HTML内JS構文確認、固定文字列確認、禁止文字列確認、手動プレイ観点確認。
