# Nomi Party Notes

## 概要

- タイトル: `夜のまわしスマホ`
- リポジトリ: `nomi-party`
- 公開URL: `https://nomi-party.yukinooooooosan.cc/`
- 公開基盤: Cloudflare Pages
- ビルド: Vite + React
- UI基盤: React Aria Components
- Cloudflare Pages build command: `npm run build`
- Cloudflare Pages output directory: `dist`
- 位置づけ: 飲み会向けの独立パーティゲーム集

このアプリは、Folio本館とは別リポジトリで管理する。
Folio本館は入口だけを持ち、ゲーム本体はこのリポジトリで育てる。

## コンセプト

一台のスマホを順番に回して遊ぶ。
参加者全員が自分の端末を出さなくてもよく、ルール説明が短く、飲み会の途中でも始めやすいゲーム集にする。

雰囲気は、少し攻める・少し大人向け。
ただし、直接的すぎる表現や人間関係を壊しやすいお題には寄せすぎない。
笑える、少し照れる、会話が増える、くらいの温度を狙う。

## 管理方針

`nomi-party` は独立アプリとして管理する。
React/Viteを前提にし、ゲーム数、共通プレイヤー状態、ゲームごとの状態管理、専用UIが増えても耐えられる構成にする。

この判断にする理由:

- ゲーム集として画面遷移と共通状態が育ちやすい。
- 色あて、投票、秘密配布、順番制など、ゲームごとにUIや状態が大きく変わる。
- Cloudflare Pagesの設定をFolio本館と分離できる。
- 将来、DB、API、管理画面、お題管理などが必要になっても移行事故を起こしにくい。

## 現在の構成

```text
nomi-party/
  index.html
  style.css
  package.json
  package-lock.json
  vite.config.js
  nomi-party-notes.md
  src/
    main.jsx
    App.jsx
    components/
      PlayerSetup.jsx
      GameMenu.jsx
      GameShell.jsx
      ColorSlider.jsx
    lib/
      players.js
      routing.js
    games/
      registry.js
      color-guess/
        index.jsx
        prompts.js
        color.js
```

`src/main.jsx` はReactの起動だけを担当する。
`src/App.jsx` はルーティング、プレイヤー状態、ゲーム起動を担当する。
共通UIは `src/components/` に置く。
共通ロジックは `src/lib/` に置く。
ゲーム本体は `src/games/<game-id>/` に置く。

`ColorSlider.jsx` はReact Aria ComponentsのSliderを薄く包んだ共通部品。
色あてゲームではRGBの各チャンネル操作に使う。
ゲーム側にReact Ariaの細かい構造を直接広げず、必要になったらこの共通部品を育てる。

## ゲーム追加の方針

ゲームは、それぞれ独立したフォルダとして追加する。
共通化しすぎず、ゲームごとの画面、ルール、状態、演出は各ゲームフォルダに閉じ込める。

新しいゲームを追加するときの基本形:

```text
src/games/new-game/
  index.jsx
  prompts.js
  logic.js
```

`index.jsx` では、そのゲームのメタデータとReactコンポーネントをexportする。

```jsx
export const newGame = {
  id: "new-game",
  number: "02",
  title: "新しいゲーム",
  summary: "ゲーム一覧に表示する説明。",
  players: "2人-",
  minutes: "5分",
  heat: 2,
  mood: "にぎやか",
  component: NewGame,
};
```

追加したゲームは `src/games/registry.js` に登録する。

```js
import { colorGuessGame } from "./color-guess/index.jsx";
import { newGame } from "./new-game/index.jsx";

export const games = [
  colorGuessGame,
  newGame,
];
```

現在登録されているゲームは `color-guess` のみ。
仮ゲームを大量に並べるより、実装済みのゲームだけを登録していく。

## 共通化する範囲

共通化するもの:

- プレイヤー設定
- プレイヤー情報の `sessionStorage` 保存
- ゲーム一覧
- ハッシュルーティング
- ゲーム開始前にプレイヤー設定へ誘導する処理
- ゲーム画面の外枠
- Menuへ戻るボタン
- タイトル、説明、人数、目安時間、攻め度の表示
- 安全ルールの表示

共通化しすぎないもの:

- ゲームごとのルール
- ゲームごとの画面構成
- 入力UI
- 得点や判定
- ラウンド進行
- 演出
- お題データ

考え方:

```text
App側: 飲み会アプリとしての共通体験を管理する
各Game側: そのゲームだけのルールと画面を自由に持つ
```

## URLと画面遷移の方針

複数ページには分けず、1つの `index.html` の中でゲームを切り替える。
URLはハッシュで画面やゲームを表す。

現在のURL:

```text
https://nomi-party.yukinooooooosan.cc/
https://nomi-party.yukinooooooosan.cc/#setup
https://nomi-party.yukinooooooosan.cc/#menu
https://nomi-party.yukinooooooosan.cc/#color-guess
```

`/` と `#setup` はメンバー設定画面。
`#menu` はゲーム一覧。
`#color-guess` は色あてゲーム。
ゲーム途中の状態まではURLに持たせない。
途中でリロードした場合は、そのゲームの初期状態に戻る方針にする。

基本の流れ:

```text
メンバー設定
  ↓
ゲーム一覧
  ↓
各ゲーム
  ↓
ゲーム一覧
```

ゲーム直リンクにアクセスした場合も、メンバー設定がまだ終わっていなければ先にメンバー設定を表示する。
設定後は、そのまま指定されたゲームへ進む。

この方針にする理由:

- 飲み会中にスマホを回す体験を、ページ遷移で分断しない。
- ゲームごとの直接リンクは作れる。
- Cloudflare Pages側のルーティング設定を増やさなくてよい。
- 参加者という共通状態を先に作ることで、指名・順番・秘密確認が必要なゲームを後から足しやすい。

注意点:

- ハッシュはサーバーに送られないので、Cloudflare Pagesから見ると常に `/` へのアクセスになる。
- ゲームごとのSEOやSNSプレビューを個別に作る用途には弱い。
- 将来、ゲームごとの説明ページやOGPが必要になったら `/games/color-guess/` のような個別ページ化を検討する。

## プレイヤー設定

TOPでは、まず参加メンバーを作る。

- `+` ボタンでメンバーを追加できる。
- 参加人数は `2-12人` で固定する。
- 12人に達したら追加ボタンは無効化する。
- メンバー名は初期状態から `Player 1` のような仮名を表示する。
- 入力が空になった場合も、開始時または読み込み時に `Player 1` のような仮名で補完する。
- 名前入力は必須にしない。
- 各メンバーは性別情報を持つ。
- 画面上では `♂` / `♀` のトグルとして表示し、タップするたびに切り替える。

メンバー情報は同じタブ内の `sessionStorage` に保存する。
これは、その場で遊ぶための一時的な状態であり、サーバーやDBには保存しない。
ブラウザを閉じたり別タブで開いた場合は、再設定する前提にする。

性別情報は後続のゲームで、お題の出し分け、指名候補、秘密情報の割り当てなどに使える共通データとして扱う。

## 現在のゲーム

### 色あて

お題に合う色を直感で作るゲーム。
現在はRGBスライダーで色を作る。
HEX値は内部計算には使うが、画面には表示しない。
RGBスライダーはReact Aria ComponentsのSliderを使う。
見た目はこのアプリ側のCSSで整え、各バーの背景は現在のRGB値に応じたグラデーションにする。

ファイル:

```text
src/games/color-guess/
  index.jsx
  prompts.js
  color.js
```

役割:

- `index.jsx`: 色あてゲーム本体、メタデータ、UI、状態管理
- `prompts.js`: 色のお題
- `color.js`: RGBからHEXへの変換

今後の拡張候補:

- プレイヤーごとの回答履歴
- 正解色または親の色との距離判定
- RGB距離や色相差によるスコア
- 参加者ごとの投票
- お題カテゴリ

## Folioとの関係

Folio本館には、作品カードとして `夜のまわしスマホ` を置く。
カードのリンク先は `https://nomi-party.yukinooooooosan.cc/`。

本館側にはゲーム本体を置かない。
本館は入口、ゲーム集本体は別リポジトリ `nomi-party` が持つ。
