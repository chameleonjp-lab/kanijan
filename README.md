# カニジャン

公開予定URL: https://chameleonjp.codeberg.page/kanijan/

## ゲーム概要
カニジャンは、横・斜め上・斜め下から🦀本体へ飛んでくる🍣🍤を、ぶつかる直前のジャンプで乗りこなすスマホ向けタップゲームです。60秒以内にどこまで高く積めるか、どれだけ高い「ジャン点」を取れるかを競います。

> 現在の対象リポジトリは `chameleonjp-lab/kanijan` です。ゲーム名・game_slug・公開URLは `kanijan` で統一します。

## 操作方法
- 下部の大きな「🦀ジャンプ」ボタンをタップします。
- Canvas盤面をタップしてもジャンプできます。
- 当たる直前に押すほど高評価で、早すぎる入力やジャンプしない衝突は減点です。
- リタイアボタンでその時点のスコアを確定します。
- 名前はランキング送信用に必須で、最大10文字程度です。

## スコア仕様
- スコア名: ジャン点
- 単位: 点
- 表示: 整数 + 点
- Supabase送信値: 整数
- 🍣基本速度: 225（旧150の1.5倍、上限320）
- 🍤基本速度: 370（旧185の2倍、上限480）
- 🍥基本速度: 345（旧🍣基準150の2.3倍、上限560）。50段以上で約20%の確率で出現
- 判定方式: 食材の進行率と🦀中心までの距離で到達済みかを先に分け、未到達時だけ `timeToHit` を使う
- PERFECT: `timeToHit` 0.00〜0.12秒、+100点、ゲージ -20、高さ +1、コンボ継続
- OK: `timeToHit` 0.12〜0.28秒、+50点、ゲージ -10、高さ +1、コンボ継続
- 早すぎて乗れない: `timeToHit` 0.28秒超、-30点、ゲージ +15、高さ増加なし、コンボリセット
- ぶつかった: ジャンプせず🦀中心へ到達、当たり判定範囲に入る、または🦀中心を通過、-50点、ゲージ +25、高さ増加なし、コンボリセット
- コンボボーナス: PERFECTまたはOK成功時に `+10 × 現在コンボ数`、1回最大300点
- 到達ボーナス: 10段 +300点、20段 +700点、30段 +1000点。各初回のみ
- 0点の結果はランキング送信しません。

## ランキング仕様
- ランキング型: ベストスコア型
- game_slug: `kanijan`
- title: `カニジャン`
- game_url: `https://chameleonjp.codeberg.page/kanijan/`
- score_order: `desc`
- score_unit: `点`
- score_scale: `1`
- score_decimals: `0`
- score_label: `ジャン点`
- first_score_label: `初回ジャン点`
- best_score_label: `最高ジャン点`
- top_ranking_type: `best`
- 詳細ランキングURLは `ranking.html?game=kanijan` を想定します。

## Supabase連携内容
- Supabase URL: `https://mlpnjgezrnhdxsxolyzj.supabase.co`
- Publishable keyのみ使用します。
- スコア送信は `submit_score` RPC を使用します。
- 送信パラメータは `p_display_name`, `p_game_slug`, `p_score`, `p_client_version` です。
- ベストランキング取得は `get_best_score_ranking` RPC を使用します。
- `public.games` と `public.game_scores` を前提にし、`public.scores` は使いません。
- secret key、service_role key、管理者用キーは絶対に使いません。

## ローカルでの確認方法
このゲーム本体は `index.html` 1ファイルで動きます。ビルドは不要です。

```bash
python3 -m http.server 8000
```

その後、ブラウザで `http://localhost:8000/` を開いてください。

## 公開時の確認項目
- Supabase `public.games` へ `kanijan` を登録する。
- カメレオンJP実験場トップの固定 `GAMES` 配列へ `kanijan` を追加する必要がある場合があります。
- 詳細ランキングページの固定 `GAMES` 配列へ `kanijan` を追加する必要がある場合があります。
- 詳細ランキングURLは `ranking.html?game=kanijan` を想定します。
- 実験場側の並び順に合わせて `display_order` を調整してください。不明なら仮で99です。

## iPhone向け注意点
- iPhone SE幅でも横スクロールが出ないようにしています。
- 下部に大きなジャンプボタンを配置し、盤面中央を指で隠しにくくしています。
- safe-area、100dvh、ダブルタップ拡大抑制、ゲーム中のスクロール抑制、長押しコピー抑制を入れています。
- 通常リンクはHTMLリンクとして残しています。

## Supabase games 登録用SQL（コピペ用）

```sql
insert into public.games (
  game_slug,
  title,
  game_url,
  description,
  share_text,
  score_order,
  score_unit,
  score_scale,
  score_decimals,
  score_label,
  first_score_label,
  best_score_label,
  top_ranking_type,
  is_active,
  release_date,
  display_order
) values (
  'kanijan',
  'カニジャン',
  'https://chameleonjp.codeberg.page/kanijan/',
  '横・斜めから🦀本体へ飛んでくる🍣🍤を、直前ジャンプで乗りこなすタップゲームです。50段から🍥も登場します。',
  'カニジャン
飛んでくる🍣🍤を、🦀に当たる直前でジャンプ！
https://chameleonjp.codeberg.page/kanijan/',
  'desc',
  '点',
  1,
  0,
  'ジャン点',
  '初回ジャン点',
  '最高ジャン点',
  'best',
  true,
  date '2026-06-14',
  99
)
on conflict (game_slug) do update set
  title = excluded.title,
  game_url = excluded.game_url,
  description = excluded.description,
  share_text = excluded.share_text,
  score_order = excluded.score_order,
  score_unit = excluded.score_unit,
  score_scale = excluded.score_scale,
  score_decimals = excluded.score_decimals,
  score_label = excluded.score_label,
  first_score_label = excluded.first_score_label,
  best_score_label = excluded.best_score_label,
  top_ranking_type = excluded.top_ranking_type,
  is_active = excluded.is_active,
  release_date = excluded.release_date,
  display_order = excluded.display_order;
```
