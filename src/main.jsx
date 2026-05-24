import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "../style.css";
import { games } from "./games/data.js";
import { PromptGame } from "./games/PromptGame.jsx";
import { ColorGuessGame } from "./games/ColorGuessGame.jsx";

const playerStorageKey = "nomi-party-players";
const setupCompleteKey = "nomi-party-setup-complete";
const minimumPlayers = 2;
const maximumPlayers = 12;
const genderOptions = ["male", "female"];
const genderLabels = {
  male: "♂",
  female: "♀",
};

const gameComponents = {
  "color-guess": ColorGuessGame,
  default: PromptGame,
};

function createPlayer(index) {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name: "",
    gender: genderOptions[index % genderOptions.length],
  };
}

function fallbackPlayers() {
  return Array.from({ length: minimumPlayers }, (_, index) => createPlayer(index));
}

function loadPlayers() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(playerStorageKey));
    if (!Array.isArray(saved) || saved.length < minimumPlayers) return fallbackPlayers();

    return saved.slice(0, maximumPlayers).map((player, index) => ({
      id: player.id || createPlayer(index).id,
      name: typeof player.name === "string" ? player.name : "",
      gender: genderOptions.includes(player.gender)
        ? player.gender
        : genderOptions[index % genderOptions.length],
    }));
  } catch {
    return fallbackPlayers();
  }
}

function getHashValue() {
  return window.location.hash.replace(/^#/, "");
}

function navigateTo(hash) {
  if (getHashValue() === hash) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
    return;
  }

  window.location.hash = hash;
}

function normalizePlayers(players) {
  return players.map((player, index) => ({
    ...player,
    name: player.name.trim() || `Player ${index + 1}`,
    gender: genderOptions.includes(player.gender) ? player.gender : "male",
  }));
}

function nextGender(currentGender) {
  const index = genderOptions.indexOf(currentGender);
  return genderOptions[(index + 1) % genderOptions.length] || genderOptions[0];
}

function hasReadyPlayers(players) {
  return sessionStorage.getItem(setupCompleteKey) === "true"
    && players.length >= minimumPlayers
    && players.length <= maximumPlayers;
}

function heatMarks(level) {
  return "●".repeat(level) + "○".repeat(3 - level);
}

function App() {
  const [route, setRoute] = useState(getHashValue());
  const [players, setPlayers] = useState(loadPlayers);
  const [pendingGameId, setPendingGameId] = useState(null);

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashValue());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(playerStorageKey, JSON.stringify(players));
  }, [players]);

  const currentGame = useMemo(
    () => games.find((game) => game.id === route) || null,
    [route],
  );
  const readyPlayers = useMemo(() => normalizePlayers(players), [players]);

  useEffect(() => {
    if (!route) {
      setPendingGameId(null);
      return;
    }

    if (route === "setup" || route === "menu") {
      setPendingGameId(null);
      return;
    }

    if (!currentGame) {
      setPendingGameId(null);
      navigateTo("setup");
      return;
    }

    if (!hasReadyPlayers(players)) {
      setPendingGameId(currentGame.id);
    }
  }, [currentGame, players, route]);

  let content = (
    <PlayerSetup
      pendingGameId={pendingGameId}
      players={players}
      setPlayers={setPlayers}
    />
  );

  if (route === "menu" && hasReadyPlayers(players)) {
    content = <GameMenu players={readyPlayers} />;
  }

  if (currentGame && hasReadyPlayers(players)) {
    const GameComponent = gameComponents[currentGame.id] || gameComponents.default;
    content = (
      <GameComponent
        game={currentGame}
        players={readyPlayers}
        backToMenu={() => navigateTo("menu")}
      />
    );
  }

  return (
    <main className="party-shell" aria-labelledby="party-title">
      <nav className="top-link" aria-label="戻る">
        <a href="https://yukinooooooosan.cc/">yukino's Folio</a>
      </nav>
      <section className="app-stage" aria-live="polite">
        {content}
      </section>
    </main>
  );
}

function PlayerSetup({ pendingGameId, players, setPlayers }) {
  const canAddPlayer = players.length < maximumPlayers;

  function updatePlayer(playerId, patch) {
    setPlayers((current) => current.map((player) => (
      player.id === playerId ? { ...player, ...patch } : player
    )));
  }

  function addPlayer() {
    if (!canAddPlayer) return;
    setPlayers((current) => [...current, createPlayer(current.length)]);
  }

  function removePlayer(playerId) {
    setPlayers((current) => (
      current.length <= minimumPlayers
        ? current
        : current.filter((player) => player.id !== playerId)
    ));
  }

  function startGame(event) {
    event.preventDefault();
    const normalizedPlayers = normalizePlayers(players);
    setPlayers(normalizedPlayers);
    sessionStorage.setItem(playerStorageKey, JSON.stringify(normalizedPlayers));
    sessionStorage.setItem(setupCompleteKey, "true");
    navigateTo(pendingGameId || "menu");
  }

  return (
    <section className="setup-screen" aria-labelledby="setup-title">
      <div className="setup-hero">
        <p className="label">Tonight&apos;s Players</p>
        <h1 id="setup-title">まずは参加者</h1>
        <p className="party-lead">
          名前はあとからでも大丈夫。一台を回す順番だけ、ここで軽く作ります。
        </p>
      </div>

      <form className="player-form" onSubmit={startGame}>
        <div className="player-list" aria-label="参加メンバー">
          {players.map((player, index) => (
            <div className="player-row" key={player.id}>
              <span className="player-number">{String(index + 1).padStart(2, "0")}</span>
              <label className="player-name">
                <span>Member</span>
                <input
                  type="text"
                  value={player.name}
                  placeholder="名前を入力"
                  autoComplete="off"
                  onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                />
              </label>
              <button
                className="gender-button"
                type="button"
                aria-label="性別を切り替え"
                onClick={() => updatePlayer(player.id, { gender: nextGender(player.gender) })}
              >
                {genderLabels[player.gender] || genderLabels.male}
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="メンバーを削除"
                disabled={players.length <= minimumPlayers}
                onClick={() => removePlayer(player.id)}
              >
                −
              </button>
            </div>
          ))}
        </div>

        <button
          className="add-player-button"
          type="button"
          disabled={!canAddPlayer}
          onClick={addPlayer}
        >
          <span>＋</span>
          {canAddPlayer ? "メンバーを追加" : "12人まで"}
        </button>

        <button className="primary-button full-button" type="submit">
          {pendingGameId ? "このメンバーでゲームへ" : "このメンバーで始める"}
        </button>
      </form>
    </section>
  );
}

function GameMenu({ players }) {
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
            <span key={player.id}>
              {genderLabels[player.gender] || genderLabels.male} {player.name}
            </span>
          ))}
        </div>
      </section>

      <section className="menu-board" aria-labelledby="game-list-title">
        <div className="section-heading">
          <p className="label">Tonight&apos;s Menu</p>
          <h2 id="game-list-title">今夜のゲームを選ぶ</h2>
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

createRoot(document.getElementById("root")).render(<App />);
