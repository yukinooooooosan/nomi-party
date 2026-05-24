# Nomi Party Notes

## 概要

- 仮タイトル: `夜のまわしスマホ`
- 管理方針: 別リポジトリで管理する
- 現在の仮置きディレクトリ: `apps/nomi-party/`
- 移行後の想定リポジトリ名: `nomi-party`
- 想定URL: `https://nomi-party.yukinooooooosan.cc/`
- 位置づけ: 飲み会向けの独立パーティゲーム集
- 公開方針: 専用リポジトリをCloudflare Pagesへ接続し、`nomi-party.yukinooooooosan.cc` で公開する

## コンセプト

一台のスマホを順番に回して遊ぶ。
参加者全員が自分の端末を出さなくてもよく、ルール説明が短く、飲み会の途中でも始めやすいゲーム集にする。

雰囲気は、少し攻める・少し大人向け。
ただし、直接的すぎる表現や人間関係を壊しやすいお題には寄せすぎない。
笑える、少し照れる、会話が増える、くらいの温度を狙う。

## 管理方針

`nomi-party` は、別リポジトリで管理する。
最初は素のHTML/CSS/JavaScriptで作れるが、今後ゲーム数、共通プレイヤー状態、ゲームごとの状態管理、専用UIが増える見込みがある。
そのため、`portfolio` リポジトリ内の軽量アプリではなく、独立アプリとして扱う。

この判断にする理由:

- ゲーム集として画面遷移と共通状態が育ちやすい。
- React/Viteなどの導入を後から選びやすくする。
- Cloudflare Pagesの設定を本館や軽量アプリと分離する。
- 本館 `Yukino's Folio` は入口だけを持ち、ゲーム本体の変更履歴を分ける。
- 将来、DB、API、管理画面、お題管理などが必要になっても移行事故を起こしにくい。

このリポジトリ内の `apps/nomi-party/` は、別リポジトリへ移すための仮置き・移行元として扱う。
移行後は、このリポジトリからゲーム本体を削除し、本館の作品カードだけを残す。

## フォルダ構成

現在:

```text
nomi-party/
  index.html
  style.css
  script.js
  games/
    index.js
    minority.js
    nominate.js
    question-pass.js
    color-guess.js
    midnight-choice.js
    shared.js
```

ゲームは少しずつ増やす前提なので、トップのゲーム一覧と各ゲームの実装を分ける。
新しいゲームを増やすときは、基本的に `games/new-game.js` を追加し、`games/index.js` に一覧情報を1件追加する。

## URLと画面遷移の方針

初期段階では、複数ページに分けず、1つの `index.html` の中でゲームを切り替える。
URLはハッシュでゲームを表す。

想定URL:

```text
https://nomi-party.yukinooooooosan.cc/
https://nomi-party.yukinooooooosan.cc/#setup
https://nomi-party.yukinooooooosan.cc/#menu
https://nomi-party.yukinooooooosan.cc/#minority
https://nomi-party.yukinooooooosan.cc/#nominate
https://nomi-party.yukinooooooosan.cc/#question-pass
https://nomi-party.yukinooooooosan.cc/#midnight-choice
```

`/` と `#setup` はメンバー設定画面。
`#menu` はゲーム集トップ。
`#minority` などは各ゲームの開始画面。
ゲーム途中の状態まではURLに持たせない。
途中でリロードした場合は、そのゲームの初期画面に戻る方針にする。

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

TOPでは、まず参加メンバーを作る。
メンバーは `+` ボタンで追加できる。
参加人数は `2-12人` で固定する。
12人に達したら追加ボタンは無効化する。
入力が空のメンバーは、開始時に `Player 1` のような仮名で補完する。
飲み会中に入力で詰まらないように、名前入力は必須にしない。
各メンバーは性別情報を持つ。
画面上では `♂` / `♀` のトグルとして表示し、タップするたびに切り替える。
この値は後続のゲームで、お題の出し分け、指名候補、秘密情報の割り当てなどに使える共通データとして扱う。

メンバー情報は同じタブ内の `sessionStorage` に保存する。
これは、その場で遊ぶための一時的な状態であり、サーバーやDBには保存しない。
ブラウザを閉じたり別タブで開いた場合は、再設定する前提にする。

ゲーム直リンクにアクセスした場合も、メンバー設定がまだ終わっていなければ先にメンバー設定を表示する。
設定後は、そのまま指定されたゲームへ進む。

この方針にする理由:

- 飲み会中にスマホを回す体験を、ページ遷移で分断しない。
- ゲームごとの直接リンクは作れる。
- Cloudflare Pages側のルーティング設定を増やさなくてよい。
- まだ軽量な静的アプリとして管理しやすい。
- 参加者という共通状態を先に作ることで、指名・順番・秘密確認が必要なゲームを後から足しやすい。

注意点:

- ハッシュはサーバーに送られないので、Cloudflare Pagesから見ると常に `/` へのアクセスになる。
- ゲームごとのSEOやSNSプレビューを個別に作る用途には弱い。
- もし将来、ゲームごとの説明ページやOGPが必要になったら `/games/minority/` のような個別ページ化を検討する。

## JavaScript構成の方針

画面は1ページにまとめるが、JavaScriptはゲームごとに分ける。
`script.js` はメイン処理、ルーティング、共通UIを担当する。
各ゲームのロジックは `games/` 配下に分ける。

想定:

```text
nomi-party/
  index.html
  style.css
  script.js
  games/
    index.js
    minority.js
    nominate.js
    question-pass.js
    color-guess.js
    midnight-choice.js
    shared.js
```

`script.js` の役割:

- `location.hash` を見て、表示するゲームを決める。
- ハッシュが空ならメンバー設定を表示する。
- メンバー設定後は `#menu` でゲーム集トップを表示する。
- 存在しないハッシュならトップに戻す。
- 各ゲームの `mount()` を呼び出す。
- トップへ戻る、スマホを次の人へ渡す、共通ボタンなどの共通UIを扱う。
- 参加メンバーを `sessionStorage` に保持し、各ゲームへ渡す。

各ゲームファイルの役割:

- 自分のゲームID、タイトル、説明を持つ。
- `mount(root)` のような入口関数を持つ。
- そのゲーム固有の状態と画面だけを管理する。
- 他のゲームのDOMや状態には触らない。

実装イメージ:

```js
// script.js
import { minorityGame } from "./games/minority.js";
import { nominateGame } from "./games/nominate.js";

const games = {
  minority: minorityGame,
  nominate: nominateGame,
};

function route() {
  const gameId = location.hash.replace("#", "");
  const game = games[gameId];

  if (!game) {
    renderHome();
    return;
  }

  game.mount(document.querySelector("#app"));
}

window.addEventListener("hashchange", route);
route();
```

ES Modulesを使うため、HTML側は以下のように読み込む。

```html
<script type="module" src="script.js"></script>
```

注意:

- `file://` 直開きではES Modulesが動かない場合がある。
- ローカル確認は `python3 -m http.server` などの静的サーバーを使う。

## Folioとの関係

Folio本館 `public/index.html` には、作品カードとして `夜のまわしスマホ` を置く。
カードのリンク先は `https://nomi-party.yukinooooooosan.cc/`。

本館側にはゲーム本体を置かない。
本館は入口、ゲーム集本体は別リポジトリ `nomi-party` が持つ。

## ゲーム候補

### 少数派を探せ

一人だけ違うお題を持つ。
全員で会話しながら、誰が少数派かを探す。

想定:

- 人数: 3-8人
- 時間: 5分
- 雰囲気: じわじわ
- 最初に実装する候補

### 指名のグラス

表示されたお題に対して、全員で「この中で一番それっぽい人」を指名する。
攻めすぎない範囲で、少し照れる投票ゲームにする。

想定:

- 人数: 3人以上
- 時間: 3分
- 雰囲気: にぎやか

### 質問パス

表示された質問に答えるか、次の人に渡す。
答えにくさもゲームの一部にするが、パスできる逃げ道を残す。

想定:

- 人数: 2人以上
- 時間: 10分
- 雰囲気: しっとり

### 深夜の二択

二択に答えるだけの軽いゲーム。
恋愛、秘密、欲望、見栄などを直接的にしすぎず、夜っぽく扱う。

想定:

- 人数: 2人以上
- 時間: 5分
- 雰囲気: 大人寄り

### 色あて

お題に対して、参加者が直感で色を作るゲーム。
色の正解そのものより、選んだ色の近さやズレを会話のきっかけにする。

UIは以下を基本にする。

```text
大きな色プレビュー
Rスライダー
Gスライダー
Bスライダー
```

HEX値は画面には表示しない。
ただしゲーム内の判定や比較に使えるよう、内部的には `#RRGGBB` 形式へ変換して保持する。
ホイールUIは直感的だが、スマホで細かく狙った色へ合わせる操作が重くなりやすい。
当面はRGBの3本バーを基本UIにする。

想定:

- 人数: 2人以上
- 時間: 5分
- 雰囲気: 直感

## UI方針

- スマホ縦画面を第一に考える。
- Bentoレイアウトではなく、縦長のメニュー表として設計する。
- PCでもスマホ幅に近い細いカラムで見せ、飲み会中の一台運用に最適化する。
- トップはゲームカードを縦に並べ、タップしたらそのゲームが起動する。
- 片手で操作できる大きめのボタンにする。
- 文字は短く、酔っていても読める量にする。
- ゲーム中は説明文を減らし、次に何をすればいいかだけを見せる。
- 画面を人に見せる場面と、自分だけが見る場面を明確に分ける。
- `スマホを次の人へ` のような受け渡し画面を用意する。

## 表現の安全ライン

少し攻めるが、強制的な暴露や特定の人を傷つけるお題にはしない。

避けるもの:

- 個人の身体的特徴をいじるお題
- 実在の恋人、配偶者、職場関係を壊しやすいお題
- 飲酒の強要
- 性的に直接的すぎる表現
- 断りにくい命令

入れてよい方向:

- 秘密がありそう
- 恋愛観
- 見栄
- 意外な一面
- ちょっとした嫉妬
- もしもの話

## 実装メモ

- まずは `index.html` と `style.css` だけでリンク集を作る。
- 次に `script.js` を追加して、最初のゲームを実装する。
- 最初の実装候補は `少数派を探せ`。
- お題データは最初はJavaScript内の配列で持つ。
- DBや外部APIは使わない。
- 移行前のローカル確認は `apps/nomi-party/` をルートとして静的サーバーを立てる。
- 移行後のローカル確認は、別リポジトリ `nomi-party/` のルートで静的サーバーまたは開発サーバーを立てる。

例:

```bash
cd apps/nomi-party
python3 -m http.server 8090
```

確認URL:

```text
http://localhost:8090/
```

## 今後やること

- `apps/nomi-party/` の内容を別リポジトリへ移す。
- 別リポジトリのCloudflare Pagesプロジェクトを作る。
- `nomi-party.yukinooooooosan.cc` を別リポジトリ側のCloudflare Pagesへ向ける。
- 移行後、このリポジトリから `apps/nomi-party/` を削除する。
- `少数派を探せ` のルールを確定する。
- 人数設定画面を作る。
- お題確認画面を作る。
- スマホ受け渡し画面を作る。
- 投票、答え合わせ、もう一回遊ぶ導線を作る。
- お題の温度を `safe`、`spicy` などで分けるか検討する。
