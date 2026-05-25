import { useEffect, useMemo, useState } from "react";
import { GameMenu } from "./components/GameMenu.jsx";
import { PlayerSetup } from "./components/PlayerSetup.jsx";
import { games } from "./games/registry.js";
import {
  hasReadyPlayers,
  loadPlayers,
  normalizePlayers,
  playerStorageKey,
  saveRoster,
  setupCompleteKey,
} from "./lib/players.js";
import { getHashValue, navigateTo } from "./lib/routing.js";

export function App() {
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
    if (!route || route === "setup" || route === "menu") {
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

  function completeSetup(nextPlayers) {
    setPlayers(nextPlayers);
    sessionStorage.setItem(playerStorageKey, JSON.stringify(nextPlayers));
    sessionStorage.setItem(setupCompleteKey, "true");
    saveRoster(nextPlayers);
    navigateTo(pendingGameId || "menu");
  }

  let content = (
    <PlayerSetup
      onComplete={completeSetup}
      pendingGameId={pendingGameId}
      players={players}
      setPlayers={setPlayers}
    />
  );

  if (route === "menu" && hasReadyPlayers(players)) {
    content = <GameMenu games={games} players={readyPlayers} />;
  }

  if (currentGame && hasReadyPlayers(players)) {
    const GameComponent = currentGame.component;
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
