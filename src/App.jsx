import { useEffect, useMemo, useState } from "react";
import { GameMenu } from "./components/GameMenu.jsx";
import { HomeScreen } from "./components/HomeScreen.jsx";
import { PlayerSetup } from "./components/PlayerSetup.jsx";
import { PlayStyleMenu } from "./components/PlayStyleMenu.jsx";
import { games, passPhoneGames, personalPhoneGames, playStyles } from "./games/registry.js";
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
  const isHomePath = normalizePath(window.location.pathname) === "/home";

  useEffect(() => {
    const handleHashChange = () => setRoute(getHashValue());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    sessionStorage.setItem(playerStorageKey, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    if (route === "menu") {
      navigateTo("pass-phone-menu");
    }
  }, [route]);

  const currentGame = useMemo(
    () => games.find((game) => game.id === route) || null,
    [route],
  );
  const readyPlayers = useMemo(() => normalizePlayers(players), [players]);
  const currentGameNeedsPlayers = currentGame?.playStyle === playStyles.passPhone;

  useEffect(() => {
    if (route === "setup") {
      return;
    }

    if (
      !route
      || route === "menu"
      || route === "pass-phone-menu"
      || route === "personal-phone-menu"
    ) {
      setPendingGameId(null);
      return;
    }

    if (!currentGame) {
      setPendingGameId(null);
      navigateTo("");
      return;
    }

    if (currentGameNeedsPlayers && !hasReadyPlayers(players)) {
      setPendingGameId(currentGame.id);
      navigateTo("setup");
    }
  }, [currentGame, currentGameNeedsPlayers, players, route]);

  function completeSetup(nextPlayers) {
    setPlayers(nextPlayers);
    sessionStorage.setItem(playerStorageKey, JSON.stringify(nextPlayers));
    sessionStorage.setItem(setupCompleteKey, "true");
    saveRoster(nextPlayers);
    navigateTo(pendingGameId || "pass-phone-menu");
  }

  let content = isHomePath ? <HomeScreen /> : <PlayStyleMenu />;

  if (!isHomePath && route === "setup") {
    content = (
      <PlayerSetup
        onComplete={completeSetup}
        pendingGameId={pendingGameId}
        players={players}
        setPlayers={setPlayers}
      />
    );
  }

  if (!isHomePath && route === "pass-phone-menu" && hasReadyPlayers(players)) {
    content = (
      <GameMenu
        games={passPhoneGames}
        playStyle={playStyles.passPhone}
        players={readyPlayers}
      />
    );
  }

  if (!isHomePath && route === "pass-phone-menu" && !hasReadyPlayers(players)) {
    content = (
      <PlayerSetup
        onComplete={completeSetup}
        pendingGameId={pendingGameId}
        players={players}
        setPlayers={setPlayers}
      />
    );
  }

  if (!isHomePath && route === "personal-phone-menu") {
    content = (
      <GameMenu
        games={personalPhoneGames}
        playStyle={playStyles.personalPhone}
      />
    );
  }

  if (!isHomePath && currentGame && (!currentGameNeedsPlayers || hasReadyPlayers(players))) {
    const GameComponent = currentGame.component;
    content = (
      <GameComponent
        game={currentGame}
        players={readyPlayers}
        backToMenu={() => navigateTo(
          currentGame.playStyle === playStyles.personalPhone
            ? "personal-phone-menu"
            : "pass-phone-menu",
        )}
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

function normalizePath(pathname) {
  return pathname.replace(/\/+$/, "") || "/";
}
