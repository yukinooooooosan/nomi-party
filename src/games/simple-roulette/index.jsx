import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../../components/GameShell.jsx";
import { getPlayerColor, getPlayerTextColor } from "../../lib/playerColors.js";
import { genderLabels } from "../../lib/players.js";

const minimumSpinDurationMs = 4400;
const spinDurationRangeMs = 1800;
const lingeringSpinRate = 0.2;
const lingeringSpinDurationMs = 6800;
const lingeringSpinDurationRangeMs = 1700;
const normalSpinEasing = "cubic-bezier(0.16, 0.58, 0.28, 1)";
const lingeringSpinEasing = "cubic-bezier(0.22, 0.48, 0.34, 1)";
const dramaticLandingRate = 0.3;
const sortShuffleDurationMs = 1000;
const sortShuffleTickMs = 72;
const pairShuffleDurationMs = 1000;
const pairShuffleTickMs = 90;
const rouletteTargets = [
  { id: "all", label: "全員" },
  { id: "male", label: "♂のみ" },
  { id: "female", label: "♀のみ" },
];
const toolModes = [
  { id: "roulette", label: "ルーレット" },
  { id: "sort", label: "リストソート" },
  { id: "pairs", label: "強制ペア" },
];

export const simpleRouletteGame = {
  id: "simple-roulette",
  number: "04",
  title: "シンプルルーレット",
  summary: "参加者の名前だけで、押したら回って1人を選ぶ。",
  players: "2人-",
  minutes: "1分",
  heat: 1,
  mood: "抽選",
  component: SimpleRouletteGame,
};

function SimpleRouletteGame({ game, backToMenu, players }) {
  const [mode, setMode] = useState("roulette");
  const [target, setTarget] = useState("all");
  const [rotation, setRotation] = useState(0);
  const [spinDuration, setSpinDuration] = useState(minimumSpinDurationMs);
  const [spinEasing, setSpinEasing] = useState(normalSpinEasing);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [isPairing, setIsPairing] = useState(false);
  const [isRouletteFlashing, setIsRouletteFlashing] = useState(false);
  const [isSortFlashing, setIsSortFlashing] = useState(false);
  const [isPairFlashing, setIsPairFlashing] = useState(false);
  const [winner, setWinner] = useState(null);
  const [sortedPlayers, setSortedPlayers] = useState(() => shuffleItems(players));
  const [pairResult, setPairResult] = useState(() => createPairs(players));
  const timeoutRef = useRef(null);
  const sortIntervalRef = useRef(null);
  const sortTimeoutRef = useRef(null);
  const pairIntervalRef = useRef(null);
  const pairTimeoutRef = useRef(null);
  const flashTimeoutRef = useRef(null);

  const roulettePlayers = useMemo(
    () => filterPlayersByTarget(players, target),
    [players, target],
  );
  const sectorAngle = roulettePlayers.length > 0 ? 360 / roulettePlayers.length : 360;
  const wheelBackground = useMemo(
    () => createWheelBackground(roulettePlayers),
    [roulettePlayers],
  );

  useEffect(() => () => {
    window.clearTimeout(timeoutRef.current);
    window.clearInterval(sortIntervalRef.current);
    window.clearTimeout(sortTimeoutRef.current);
    window.clearInterval(pairIntervalRef.current);
    window.clearTimeout(pairTimeoutRef.current);
    window.clearTimeout(flashTimeoutRef.current);
  }, []);

  useEffect(() => {
    setWinner(null);
    setSpinDuration(0);
    setRotation(0);
    setIsSpinning(false);
    setIsSorting(false);
    setIsPairing(false);
    setIsRouletteFlashing(false);
    setIsSortFlashing(false);
    setIsPairFlashing(false);
    setSortedPlayers(shuffleItems(filterPlayersByTarget(players, target)));
    window.clearTimeout(timeoutRef.current);
    window.clearInterval(sortIntervalRef.current);
    window.clearTimeout(sortTimeoutRef.current);
    window.clearInterval(pairIntervalRef.current);
    window.clearTimeout(pairTimeoutRef.current);
    window.clearTimeout(flashTimeoutRef.current);
  }, [players, target]);

  useEffect(() => {
    setPairResult(createPairs(players));
  }, [players]);

  function spinRoulette() {
    if (isSpinning || roulettePlayers.length === 0) return;

    const winnerIndex = Math.floor(Math.random() * roulettePlayers.length);
    const landingAngle = getRandomLandingAngle(winnerIndex, sectorAngle);
    const targetMod = normalizeAngle(360 - landingAngle);
    const currentMod = normalizeAngle(rotation);
    const delta = normalizeAngle(targetMod - currentMod);
    const isLingeringSpin = Math.random() < lingeringSpinRate;
    const fullSpins = isLingeringSpin
      ? 8 + Math.floor(Math.random() * 4)
      : 5 + Math.floor(Math.random() * 3);
    const nextRotation = rotation + fullSpins * 360 + delta;
    const nextDuration = isLingeringSpin
      ? lingeringSpinDurationMs + Math.floor(Math.random() * lingeringSpinDurationRangeMs)
      : minimumSpinDurationMs + Math.floor(Math.random() * spinDurationRangeMs);

    setWinner(null);
    setSpinDuration(nextDuration);
    setSpinEasing(isLingeringSpin ? lingeringSpinEasing : normalSpinEasing);
    setIsSpinning(true);
    setRotation(nextRotation);

    window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => {
      setWinner(roulettePlayers[winnerIndex]);
      setIsSpinning(false);
      flashPanel(setIsRouletteFlashing);
    }, nextDuration);
  }

  function selectMode(nextMode) {
    setMode(nextMode);
    setWinner(null);
    setIsSpinning(false);
    setIsSorting(false);
    setIsPairing(false);
    setIsRouletteFlashing(false);
    setIsSortFlashing(false);
    setIsPairFlashing(false);
    window.clearTimeout(timeoutRef.current);
    window.clearInterval(sortIntervalRef.current);
    window.clearTimeout(sortTimeoutRef.current);
    window.clearInterval(pairIntervalRef.current);
    window.clearTimeout(pairTimeoutRef.current);
    window.clearTimeout(flashTimeoutRef.current);
  }

  function shuffleSortList() {
    const sortPlayers = filterPlayersByTarget(players, target);
    if (isSorting || sortPlayers.length === 0) return;

    setIsSorting(true);
    window.clearInterval(sortIntervalRef.current);
    window.clearTimeout(sortTimeoutRef.current);

    sortIntervalRef.current = window.setInterval(() => {
      setSortedPlayers(shuffleItems(sortPlayers));
    }, sortShuffleTickMs);

    sortTimeoutRef.current = window.setTimeout(() => {
      window.clearInterval(sortIntervalRef.current);
      setSortedPlayers(shuffleItems(sortPlayers));
      setIsSorting(false);
      flashPanel(setIsSortFlashing);
    }, sortShuffleDurationMs);
  }

  function shufflePairs() {
    if (isPairing || players.length === 0) return;

    setIsPairing(true);
    window.clearInterval(pairIntervalRef.current);
    window.clearTimeout(pairTimeoutRef.current);

    pairIntervalRef.current = window.setInterval(() => {
      setPairResult(createPairs(players));
    }, pairShuffleTickMs);

    pairTimeoutRef.current = window.setTimeout(() => {
      window.clearInterval(pairIntervalRef.current);
      setPairResult(createPairs(players));
      setIsPairing(false);
      flashPanel(setIsPairFlashing);
    }, pairShuffleDurationMs);
  }

  function flashPanel(setFlashing) {
    window.clearTimeout(flashTimeoutRef.current);
    setFlashing(true);
    flashTimeoutRef.current = window.setTimeout(() => {
      setFlashing(false);
    }, 560);
  }

  return (
    <GameShell
      game={game}
      headingClassName="roulette-game-head"
      lead="ボタンを押すだけ。止まった名前の人が当たりです。"
      onBack={backToMenu}
      screenClassName="roulette-game-screen"
    >
      <div className="roulette-segment" aria-label="機能を選択">
        {toolModes.map((item) => (
          <button
            className={mode === item.id ? "is-active" : ""}
            key={item.id}
            type="button"
            onClick={() => selectMode(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {mode === "roulette" && (
        <div className={`roulette-tool-panel ${isRouletteFlashing ? "result-flash" : ""}`}>
          <div>
            <p className="label">Roulette</p>
            <h2>ランダム抽選</h2>
          </div>
          <div className="roulette-segment roulette-targets" aria-label="ルーレット対象">
            {rouletteTargets.map((item) => (
              <button
                className={target === item.id ? "is-active" : ""}
                key={item.id}
                type="button"
                onClick={() => setTarget(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="roulette-panel">
            <div className="roulette-pointer" aria-hidden="true" />
            <div
              className="roulette-wheel"
              style={{
                "--roulette-bg": wheelBackground,
                "--spin-duration": `${spinDuration}ms`,
                "--spin-easing": spinEasing,
                transform: `rotate(${rotation}deg)`,
              }}
            >
              {roulettePlayers.map((player, index) => {
                const angle = index * sectorAngle + sectorAngle / 2;

                return (
                  <span
                    className="roulette-name"
                    key={player.id}
                    style={{
                      "--name-angle": `${angle}deg`,
                      "--name-angle-inverse": `${-angle}deg`,
                      "--name-color": getPlayerColor(player),
                      "--name-text-color": getPlayerTextColor(player),
                    }}
                  >
                    {player.name}
                  </span>
                );
              })}
              <span className="roulette-center">NOMI</span>
            </div>
          </div>

          <div className="roulette-result" aria-live="polite">
            <p className="label">{isSpinning ? "Spinning" : "Result"}</p>
            <strong>
              {winner
                ? winner.name
                : isSpinning
                  ? "抽選中..."
                  : roulettePlayers.length > 0
                    ? "まだ未抽選"
                    : "対象者なし"}
            </strong>
          </div>

          <div className="game-controls single-control">
            <button
              className="primary-button"
              type="button"
              disabled={isSpinning || roulettePlayers.length === 0}
              onClick={spinRoulette}
            >
              {isSpinning ? "回転中" : winner ? "もう一回まわす" : "ルーレットをまわす"}
            </button>
          </div>
        </div>
      )}

      {mode === "sort" && (
        <div className={`roulette-tool-panel ${isSortFlashing ? "result-flash" : ""}`}>
          <div>
            <p className="label">List Sort</p>
            <h2>ランダム順</h2>
          </div>
          <div className="roulette-segment roulette-targets" aria-label="リストソート対象">
            {rouletteTargets.map((item) => (
              <button
                className={target === item.id ? "is-active" : ""}
                key={item.id}
                type="button"
                onClick={() => setTarget(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <ol className={`roulette-list ${isSorting ? "is-shuffling" : ""}`}>
            {sortedPlayers.length > 0
              ? sortedPlayers.map((player, index) => (
                <li
                  key={player.id}
                  style={{
                    "--player-color": getPlayerColor(player),
                    "--player-text-color": getPlayerTextColor(player),
                  }}
                >
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{player.name}</strong>
                  <small>{genderLabels[player.gender] || genderLabels.male}</small>
                </li>
              ))
              : (
                <li>
                  <span>--</span>
                  <strong>対象者なし</strong>
                  <small>{rouletteTargets.find((item) => item.id === target)?.label}</small>
                </li>
              )}
          </ol>
          <button
            className="primary-button"
            type="button"
            disabled={isSorting || sortedPlayers.length === 0}
            onClick={shuffleSortList}
          >
            {isSorting ? "シャッフル中" : "並び替える"}
          </button>
        </div>
      )}

      {mode === "pairs" && (
        <div className={`roulette-tool-panel ${isPairFlashing ? "result-flash" : ""}`}>
          <div>
            <p className="label">Forced Pair</p>
            <h2>ランダムペア</h2>
          </div>
          <div className={`pair-list ${isPairing ? "is-shuffling" : ""}`}>
            {pairResult.pairs.map((pair, index) => (
              <div
                className={`pair-card pair-card-${pair.type}`}
                key={pair.id}
                style={{
                  "--pair-left": getPlayerColor(pair.players[0]),
                  "--pair-right": getPlayerColor(pair.players[1]),
                }}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>
                  {pair.players.map((player) => player.name).join(" × ")}
                </strong>
                <small>{pair.type === "mixed" ? "男女ペア" : "同性ペア"}</small>
              </div>
            ))}
            {pairResult.leftover && (
              <div
                className="pair-card pair-card-leftover"
                style={{
                  "--pair-left": getPlayerColor(pairResult.leftover),
                  "--pair-right": getPlayerColor(pairResult.leftover),
                }}
              >
                <span>--</span>
                <strong>{pairResult.leftover.name}</strong>
                <small>あきらめ</small>
              </div>
            )}
          </div>
          <button
            className="primary-button"
            type="button"
            disabled={isPairing}
            onClick={shufflePairs}
          >
            {isPairing ? "シャッフル中" : "組み直す"}
          </button>
        </div>
      )}
    </GameShell>
  );
}

function createWheelBackground(players) {
  if (players.length <= 0) {
    return "conic-gradient(from -90deg, rgba(247, 239, 226, 0.12), rgba(247, 239, 226, 0.12))";
  }

  const step = 100 / players.length;
  const stops = players.map((player, index) => {
    const color = getPlayerColor(player);
    const start = (index * step).toFixed(4);
    const end = ((index + 1) * step).toFixed(4);

    return `${color} ${start}% ${end}%`;
  });

  return `conic-gradient(${stops.join(", ")})`;
}

function normalizeAngle(angle) {
  return ((angle % 360) + 360) % 360;
}

function getRandomLandingAngle(winnerIndex, sectorAngle) {
  const sectorStart = winnerIndex * sectorAngle;
  const sectorEnd = sectorStart + sectorAngle;

  if (Math.random() < dramaticLandingRate) {
    const dramaticMargin = Math.min(1.4, Math.max(0.35, sectorAngle * 0.035));
    return Math.random() < 0.5
      ? sectorStart + dramaticMargin
      : sectorEnd - dramaticMargin;
  }

  const edgeMargin = Math.min(5, sectorAngle * 0.12);
  const usableAngle = Math.max(0, sectorAngle - edgeMargin * 2);
  return sectorStart + edgeMargin + Math.random() * usableAngle;
}

function filterPlayersByTarget(players, target) {
  return players.filter((player) => target === "all" || player.gender === target);
}

function shuffleItems(items) {
  return [...items]
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

function createPairs(players) {
  const males = shuffleItems(players.filter((player) => player.gender === "male"));
  const females = shuffleItems(players.filter((player) => player.gender === "female"));
  const mixedCount = Math.min(males.length, females.length);
  const pairs = [];

  for (let index = 0; index < mixedCount; index += 1) {
    pairs.push({
      id: `mixed-${males[index].id}-${females[index].id}`,
      players: [males[index], females[index]],
      type: "mixed",
    });
  }

  const leftovers = shuffleItems([
    ...males.slice(mixedCount),
    ...females.slice(mixedCount),
  ]);
  const sameSexPairs = [];

  for (let index = 0; index + 1 < leftovers.length; index += 2) {
    sameSexPairs.push({
      id: `same-${leftovers[index].id}-${leftovers[index + 1].id}`,
      players: [leftovers[index], leftovers[index + 1]],
      type: "same",
    });
  }

  return {
    pairs: [...pairs, ...sameSexPairs],
    leftover: leftovers.length % 2 === 1 ? leftovers[leftovers.length - 1] : null,
  };
}
