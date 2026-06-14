# カニジャン 仕様書

## 固定仕様
- ゲーム名は「カニジャン」。対象リポジトリは `chameleonjp-lab/kanijan`。game_slug は `kanijan`、公開予定 URL は `https://chameleonjp.codeberg.page/kanijan/` とする。
- 中央の 🦀 を、左右から飛んでくる 🍣 または 🍤 に合わせてタップでジャンプさせ、高く積む。
- 旧足場案の絵文字は使用しない。
- 1プレイ最大60秒。60秒経過、🦀落下、バランスゲージ最大、リタイアで終了する。
- 操作はタップのみ。主操作は下部の大きな「🦀ジャンプ」ボタン。Canvas盤面タップでもジャンプできる。
- 状態は HOME / RULE / NAME / READY / PLAYING / RESULT / ERROR に分ける。
- PLAYING 以外では当たり判定、スコア加算、残り時間減少を行わない。
- RESULT 以降はゲーム判定を止め、ランキング送信を1回だけ行う。

## 性能予算
- 目標フレームレート: 60fps。
- 最低ライン: 30fpsで安定。
- 敵の最大数: 0。
- 弾の最大数: 0。
- 飛んでくる足場の最大数: 1。
- 積まれた足場の内部保持数: 最大100段。
- Canvasに描く足場数: 画面内の最大40段まで。
- アイテム最大数: 1。
- エフェクト最大数: 20。
- パーティクル最大数: 80。
- ゲーム中に更新してよいDOM: スコア、高さ、残り時間、状態表示、バランスゲージ程度。
- ランキング通信: ゲーム終了時の送信1回、結果画面のランキング取得1回、必要なら統計取得1回。
- 禁止: ゲームループ中のランキング通信、大量 innerHTML、大量一時オブジェクト、大量 timer、結果画面後の判定継続。

## 変更してはいけないこと
- game_slug を `nanijan` にしない。
- 公開URLを nanijan にしない。
- `public.scores` を使わない。
- secret key / service_role key / 管理者用キーを書かない。
- index.html 以外がないとゲームが動かない構成にしない。
- npm / Vite / Node.js / ビルド環境前提にしない。

## 不明点と仮決め
- Supabase RPC の戻り値形状は既存共通仕様に幅を持たせ、配列・単一オブジェクトの両方を安全に表示する。
- ランキング取得件数は表示軽量化のため上位10件とする。
- 判定幅はスマホ向けに甘めとし、🍤は🍣より少し狭くする。

## 画面構成
- ホーム画面: ゲーム名、一言説明、ゲーム開始、ルール説明、ゲームをシェア、他のゲームで遊ぶ。
- ルール説明: 操作、判定、スコア、終了条件を説明。
- 名前入力: 最大10文字程度。空欄では開始不可。localStorage 保存可。
- READY: READY / 3,2,1 カウントダウン。
- ゲーム画面: 上部にスコア・高さ・残り時間・リタイア、中央にCanvas、下部に「🦀ジャンプ」ボタンと状態表示。
- 結果画面: 結果文、スコア、高さ、最大コンボ、ランキング送信状態、ランキング欄、もう一度、結果をシェア、他のゲームで遊ぶ。
- 通信失敗表示: 結果画面内に「ランキング送信に失敗しました」と短く表示する。

## 操作方法
- 下部の「🦀ジャンプ」ボタンをタップする。
- Canvasゲーム盤面のタップでもジャンプできる。
- リタイアボタンでその時点の結果を確定する。

## スコア仕様
- スコア名: ジャン点。
- 単位: 点。
- 小数なし。Supabaseへ送る値は整数。画面表示は整数 + 点。
- 🍣成功: +100点。
- 🍤成功: +150点。
- PERFECT: +100点、コンボ継続。
- GOOD: +50点、コンボ継続。
- OK: +0点、コンボリセット、バランス悪化。
- MISS: 落下終了。
- コンボボーナス: 成功時に +10 × 現在コンボ数、1回最大300点。
- 到達ボーナス: 10段 +300点、20段 +700点、30段 +1000点。各初回のみ。
- 0点は送信しない。

## ランキング仕様
- Supabase連携必須。
- game_slug: `kanijan`。
- title: `カニジャン`。
- game_url: `https://chameleonjp.codeberg.page/kanijan/`。
- score_order: `desc`。
- score_unit: `点`。
- score_scale: `1`。
- score_decimals: `0`。
- score_label: `ジャン点`。
- first_score_label: `初回ジャン点`。
- best_score_label: `最高ジャン点`。
- top_ranking_type: `best`。
- ゲーム情報は `public.games`、スコアは `public.game_scores`。
- 初回ランキングは `get_first_try_ranking`、ベストランキングは `get_best_score_ranking`。
- プレイ回数や参加人数は `get_game_play_stats`。
- `submit_score` RPC で自動送信する。結果画面に登録ボタンは置かない。

## Supabase送信値
- Supabase URL: `https://mlpnjgezrnhdxsxolyzj.supabase.co`。
- Publishable key: `sb_publishable_drzcy0v97knU6FgjqSgBHw_0A9XPdFM`。
- 送信RPC: `submit_score`。
- パラメータ: `p_display_name`, `p_game_slug`, `p_score`, `p_client_version`。

## シェア文
ホーム:

```text
カニジャン
左右から飛んでくる🍣🍤に合わせて、🦀を高くジャンプさせよう。
https://chameleonjp.codeberg.page/kanijan/
```

結果:

```text
カニジャン
ジャン点：{score}点
高さ：{height}段
🦀が🍣🍤を飛び渡った！
https://chameleonjp.codeberg.page/kanijan/
```

## スマホ対応
- iPhone SE幅を必須対象にする。
- 横スクロール禁止、ピンチズーム抑制、ダブルタップ拡大抑制、長押しコピー抑制、ゲーム中スクロール抑制、safe-area、100dvh、下部ボタンが隠れない配置、十分なタップ範囲、重要情報が指で隠れにくい配置を行う。

## CanvasとHTMLの使い分け
- Canvas: 背景、🦀、飛んでくる🍣🍤、積まれた足場、成功演出、落下演出、パーティクル、揺れ演出。
- HTML: ホーム、ルール、名前入力、ボタン、スコア表示、結果、ランキング欄、シェア、エラー表示。
