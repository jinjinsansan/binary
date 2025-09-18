# BTC/USD バカラ風バイナリー（フロントのみ）

React + TypeScript + Vite で実装した、バカラ風UIのBTC/USDバイナリーオプションのモックです。バックエンドは不要、擬似データで自動進行します。

## 技術スタック
- React 18 + TypeScript + Vite
- Tailwind CSS（赤基調・光沢風テーマ）
- Zustand（状態管理）
- localStorage（残高・出目表の永続化）

## 環境変数（.env）
```
VITE_ROUND_SECONDS=12
VITE_INTERMISSION_SECONDS=3
VITE_PAYOUT=1.95
VITE_BOT_BIAS=0.2
```

## 起動手順
1. 依存インストール
   - `npm i`
2. 開発サーバ起動
   - `npm run dev`
3. ブラウザで表示
   - ターミナルに表示される `http://localhost:5173` などのURLへアクセス

## Vercel へのデプロイ
1. GitHub 連携
   - このリポジトリ（`jinjinsansan/binary`）を Vercel の Import Project から選択
2. Framework Preset: Vite（自動検出）
3. Build & Output
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. 環境変数（任意）
   - `VITE_ROUND_SECONDS=12`
   - `VITE_INTERMISSION_SECONDS=3`
   - `VITE_PAYOUT=1.95`
   - `VITE_BOT_BIAS=0.2`
   - 未設定でもデフォルト値で動作します（Vite がビルド時に埋め込みます）
5. ルーティング
   - `vercel.json` を同梱（`/(.*)` を `index.html` にリライトするSPA設定）

## 画面ゾーン
- Z1 ヘッダ：テーブル名、ゲーム番号、円形カウントダウン
- Z2 ディーラー領域：BTC/USD ラインチャート（擬似ランダムウォーク、終値で点をマーキング）
- Z3 ベッティングパネル：UP(青)/DOWN(赤) ボタン、チップ（1/5/10/50/100）、自己ベット表示
- Z3.1 CrowdMeter：卓のBET人数と比率（バー表示、終盤3秒でスパイク）
- Z4 出目表：大路（6行×30列、右スクロール可。青=UP、赤=DOWN、緑小点=TIE）
- Z5 フッタ：残高(USDT)、＋テーブル/ロビー（ダミー）

## ラウンド仕様（確定値）
- ROUND_SECONDS = 12 / INTERMISSION_SECONDS = 3
- PAYOUT = 1.95（UP/DOWN）
- TIE は返金扱い
- 通貨は USDT のみ（初期残高 1000 USDT）

## 受け入れ基準（MVP）
1. 起動後、ラウンドが自動進行（カウントダウン→判定→次ラウンド）
2. 自分がUP/DOWNにベットすると、判定で残高が増減（配当1.95、TIE返金）
3. CrowdMeter で人数と比率が動的に変化（残り3秒でスパイク）
4. 出目表（大路）に結果が正しく追加され、連続は縦に伸び、色変化で右に1列進む
5. ページ再読込後も残高と出目表が復元（localStorage）

## 備考
- 本実装はUIモックであり、価格や結果は擬似ランダムで生成しています。
- 自己ベットはラウンド中のみ可能で、残高を超えるチップは配置できません（ベットは判定時に精算）。

## v0.2 強化ポイント（開発者向け）
- テーマ強化
  - 赤基調の光沢カード（`card-glossy`）と金属風の押下ハイライト（`.btn-metallic:active`）
  - 判定時、勝側ボタンにカラーグロー（`.glow-win-blue`/`.glow-win-red`）、負側は減光（`.dim-lose`）
- PriceChartCanvas 演出
  - 終値マーカーにパルスリング（軽量なラジアルグラデ）と上部の反射（`chart-reflection`）
  - 10〜12FPS 程度の描画で負荷を抑制
- キーバインド
  - `↑` → UPベット、`↓` → DOWNベット（BETTING中のみ）
  - `1`/`5`/`10` → チップ選択（キーボード都合で `0` も 10 として扱う。`!` も10に割り当て）
- ロビー/＋テーブル（ダミー）
  - `src/components/Modal.tsx` を用いたモーダルUI追加。フッタのボタンで起動
- Bot の疑似マルチユーザー
  - ポアソン到着（`expSample(lambda)`）、残り3秒で λ 上昇によるスパイク
  - 直前の出目に対する順張り/逆張りの `BOT_BIAS` を `env` から反映
- 大路レンダラー
  - 6行×30列で右スクロール。連続は縦方向、色変化で新列開始、TIE は緑小点

### v0.2.1 追加（このPR）
- ドーナツ型 CrowdMeter（比率リング + 人数）
- 設定パネル（ボラティリティ、BOT_BIAS、音量、効果音ON/OFF）と localStorage 永続化
- 効果音（ベット、ロック、勝ち/負け/タイ）: WebAudio 生成で軽量
- ロック演出: BETTING終了後に短いLOCKフェーズ（1s）を追加、オーバーレイ表示 + 効果音

## 状態管理と遷移
- Zustand ストア: `src/state/store.ts`
  - `round`（phase, secondsRemaining, price, startPrice, result, series）
  - `bets`（up/down）、`balance`、`roads`（大路）、`crowd`（人数）
  - `settings`（vol, botBias, volume, sounds）
  - アクション: `tick`, `placeBet`, `startBetting`, `finalizePricing`, `settle`, `appendPrice`, `setSetting`, `getBotSide`
- 遷移: Intermission → Betting(12s) → Lock(1s) → Pricing(演出) → Settle → Intermission…
  - Betting 中のみベット可、SettleでPAYOUT=1.95精算、TIE返金、残高/大路を保存

## ファイル構成（主要）
- `src/App.tsx`: ラウンドループ、トースト、モーダル制御
- `src/components/*`: チャート、ベット、CrowdMeter、大路、フッタ、モーダル
- `src/state/store.ts`: Zustand ストアとロジック（大路配置、Bot バイアス）
- `src/utils/randomWalk.ts`: 価格擬似ランダムウォーク

## セルフチェック（v0.2 受け入れ基準）
1) カウントダウン/自動遷移: `tick()` で1秒ごとに減算。`intermission→betting(12s)→pricing→finalizePricing→settle→intermission` を確認（OK）
2) ベット精算: `computePnl()` で `win*payout-lose`、TIEは0。`settle()` で balance 更新と保存（OK）
3) CrowdMeter: Poisson到着 + 残り3秒の λ 変化（1.2→3.5）でスパイク表示、比率バー更新（OK）
4) 大路: `pushResultToRoads()` で同色は縦、変色で右列、TIEは緑点。6行×30表示・右スクロール（OK）
5) 復元: `balance_usdt` と `roads_big` を localStorage からロード/保存（OK）

追加セルフチェック（v0.2.1）
- ドーナツ表示が比率に応じて更新（OK）
- 設定変更が即時反映（volでチャート挙動、botBiasでBot比率、音量/ミュート）・localStorageに保存（OK）
- ロック演出がBET終了直後に1秒表示され、効果音が鳴る（OK）
