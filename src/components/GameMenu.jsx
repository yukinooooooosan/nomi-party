import { genderLabels } from "../lib/players.js";
import { getPlayerColor, getPlayerTextColor } from "../lib/playerColors.js";
import { navigateTo } from "../lib/routing.js";

function heatMarks(level) {
  return "●".repeat(level) + "○".repeat(3 - level);
}

export function GameMenu({ games, players }) {
  return (
    <>
      <header className="party-hero">
        <svg
          className="hero-nightscape"
          viewBox="0 0 260 180"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className="hero-moon-glow"
            d="M220 4a48 48 0 1 0 0 96 23 48 0 1 1 0-96Z"
          />
          <path
            className="hero-moon"
            d="M220 4a48 48 0 1 0 0 96 23 48 0 1 1 0-96Z"
          />
          <g className="hero-buildings">
            <rect x="12" y="96" width="38" height="84" />
            <rect x="58" y="70" width="48" height="110" />
            <rect x="118" y="100" width="42" height="80" />
            <rect x="172" y="82" width="54" height="98" />
          </g>
          <g className="hero-windows">
            <rect x="24" y="111" width="5" height="6" />
            <rect x="72" y="88" width="5" height="6" />
            <rect x="91" y="112" width="5" height="6" />
            <rect x="131" y="119" width="5" height="6" />
            <rect x="188" y="101" width="5" height="6" />
            <rect x="210" y="128" width="5" height="6" />
          </g>
        </svg>
        <p className="label">One Night Phone Party</p>
        <h1 id="party-title">深夜の廻しスマホ</h1>
        <p className="party-lead">
          一台を回すだけ。少し距離を縮めるオトナのパーティゲーム
        </p>
      </header>

      <section className="player-summary" aria-label="参加メンバー">
        <div>
          <p className="label">Players</p>
          <p>{players.length}人でプレイ</p>
        </div>
        <button className="ghost-button" type="button" onClick={() => navigateTo("setup")}>
          Edit
        </button>
        <div className="player-chips">
          {players.map((player) => (
            <span
              key={player.id}
              style={{
                "--player-color": getPlayerColor(player),
                "--player-text-color": getPlayerTextColor(player),
              }}
            >
              {genderLabels[player.gender] || genderLabels.male} {player.name}
            </span>
          ))}
        </div>
      </section>

      <section className="menu-board" aria-labelledby="game-list-title">
        <div className="section-heading">
          <p className="label">Tonight&apos;s Menu</p>
          <h2 id="game-list-title">今宵のゲームを選んでください</h2>
        </div>

        <div className="game-menu">
          {games.map((game) => (
            <a className="game-row" href={`#${game.id}`} key={game.id}>
              <span className="game-number">{game.number}</span>
              <span className="game-main">
                <span className="game-title">{game.title}</span>
                <span className="game-copy">{game.summary}</span>
                <span className="game-tags">
                  <span>{game.players}</span>
                  <span>{game.minutes}</span>
                  <span>攻め度 {heatMarks(game.heat)}</span>
                  <span>{game.mood}</span>
                </span>
              </span>
              <span className="game-action">Start</span>
            </a>
          ))}
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
