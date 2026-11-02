# カニジャン 固定SNS画像とX共有受入（2026-11-02）

- 基点 main e0f188190b166ae3ca3e88c45de9210d2fe24bfa。ゲーム規則・score/ID・DB/公開設定・効果音は変更なし。
- 素材capture head2cb6ac67b7c7c90384a4dd25f34ac4c40c0bd36a/run41426921860成功。通常匿名開始後、自然の初回エビ天が画面内へ入った時の実Canvas。score0/height0、強制spawn/jump/描足しなし、全外部通信0。
- 原PNG812×1244 SHA256 `9d6c0612d0647a25539ed7d5f750f39fca1b408eccd47a90d5dfd99954946be3`。上下の空を切り詰めた実画面領域を等比縮小し、既CSS系色と正式題字/60秒の説明を組版。カニと食材の位置・サイズ比・軌道を変更しない。実スクリーンショットそのものでも、個別結果カードでもない固定紹介画像。
- 完成PNG1200×630 102504B SHA256 `ab6e1f6f251fa85c716fe270ded0bd1d86ce0f9eb0d0087b6006c83281a3cd43`。実画像を見てカニ/エビ天/水色背景を確認済み。
- OG/Twitter画像と共有URLは現在の正式Codebergを維持。GitHub PRのmergeだけではCodebergへの画像到達・OG反映完了としない。別originの切替・DB登録変更は未実施。
- 全locale共通正式2タグ `#カニジャン #ゲーム制作` を翻訳済本文の末尾に追加。名前を自動露出しない、今回の確定値を保持。
- 独立copyボタンは元からなし。Xを開けない場合だけcopy fallbackを保持。

## 検証
- actual shareHome/shareResultの2tag不足、OG不足、画像stage不足で3tests RED→最小変更GREEN。
- local49unitPASS、15locale×85文生成一致、HTML4script構文確認。新test stagingは自作tmpを削除せず保全。
- share-visualはhome/正常結果/リタイア、15言語×縦横×Chromium/WebKit。44px/祖先透明・clip/fullviewport/centerhit/文言・黒白/実popup intent1回/fallback/状態不変/score送信0。
- 結果fixtureは既validReceipt→restoreReceipt経路、匿名/IDnull/score5100/height20/combo20/正常タイムアップ又はリタイア。製品testhookなし。
- 全HTTP直接fulfill/abort、SWblock/WSdeny、未知通信でfail。旧smokeも同安全境界を追加、既RPCmock・ゲーム契約検証を維持。
- 最終browser実行と画像実見はCI終端で確認するまで未確認。素材取得CI成功を共有検証の成功へ読み替えない。
- branch検証はmain公開条件から分離。mainpushのみPages artifact/deploy、runner/perms/timeout不変。merge/公開/iPhone実機/Xcache受入未実施。

## 復旧
元main/固定素材を保持し、必要時本人がPRだけをrevertする。元正常版・証拠・関連ファイルを削除しない。
