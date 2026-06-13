import { passPhoneGames, personalPhoneGames } from "../games/registry.js";

export function HomeScreen() {
  function enterApp() {
    window.location.assign("/");
  }

  function scrollToBranch(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  return (
    <>
      <header className="party-hero home-hero">
        <div className="home-phone-visual" aria-hidden="true">
          <span className="home-phone-screen">
            <span />
            <span />
            <span />
          </span>
        </div>
        <p className="label">One Night Phone Party</p>
        <h1 id="party-title">深夜の廻しスマホ</h1>
        <p className="party-lead">
          一台を回すだけ。場の温度を少しだけ上げる、飲み会向けの小さなゲーム集です。
        </p>
      </header>

      <section className="home-gate" aria-labelledby="home-gate-title">
        <div>
          <p className="label">Entrance</p>
          <h2 id="home-gate-title">今夜の入口</h2>
          <p>
            メンバー登録、ゲーム選択、秘密回答は次の画面から始まります。
          </p>
        </div>
        <button className="primary-button full-button" type="button" onClick={enterApp}>
          ゲームを開く
        </button>
      </section>

      <section className="home-map" aria-labelledby="home-map-title">
        <div className="section-heading">
          <p className="label">Route Map</p>
          <h2 id="home-map-title">この先の画面</h2>
        </div>

        <div className="home-route">
          <div className="route-node route-node-current">
            <span className="route-kicker">Now</span>
            <strong>/home</strong>
            <span>本館からの入口</span>
          </div>
          <div className="route-arrow" aria-hidden="true">↓</div>
          <div className="route-node">
            <span className="route-kicker">App</span>
            <strong>/</strong>
            <span>遊び方を選ぶ</span>
          </div>
          <div className="route-split" aria-label="遊び方の分岐">
            <button type="button" onClick={() => scrollToBranch("pass-phone-games")}>
              1台で遊ぶ
            </button>
            <button type="button" onClick={() => scrollToBranch("personal-phone-games")}>
              それぞれのスマホで遊ぶ
            </button>
          </div>
        </div>

        <div className="home-branches">
          <GameBranch
            games={passPhoneGames}
            id="pass-phone-games"
            label="Pass Phone"
            title="1台で遊ぶ"
            route="メンバー設定 → ゲーム一覧"
          />
          <GameBranch
            games={personalPhoneGames}
            id="personal-phone-games"
            label="Personal Phone"
            title="それぞれのスマホで遊ぶ"
            route="ゲーム一覧"
          />
        </div>
      </section>

      <footer className="party-note" aria-label="遊ぶときの約束">
        <span>パスあり</span>
        <span>無理強いなし</span>
        <span>記録しない</span>
      </footer>
    </>
  );
}

function GameBranch({ games, id, label, route, title }) {
  return (
    <article className="home-branch" id={id}>
      <div className="home-branch-head">
        <span className="route-kicker">{label}</span>
        <h3>{title}</h3>
        <p>{route}</p>
      </div>
      <ul className="home-game-list">
        {games.map((game) => (
          <li key={game.id}>
            <span>{game.number}</span>
            <strong>{game.title}</strong>
            <small>{game.mood} / {game.minutes}</small>
          </li>
        ))}
      </ul>
    </article>
  );
}
