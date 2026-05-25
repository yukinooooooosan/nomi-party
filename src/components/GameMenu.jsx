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
        <p className="label">One Phone Party</p>
        <h1 id="party-title">夜のまわしスマホ</h1>
        <p className="party-lead">
          一台を回すだけ。少し踏み込む、飲み会用パーティゲーム集。
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
