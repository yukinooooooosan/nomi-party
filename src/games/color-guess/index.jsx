import { useMemo, useRef, useState } from "react";
import { ColorSlider } from "../../components/ColorSlider.jsx";
import { GameShell } from "../../components/GameShell.jsx";
import { getPlayerColor, getPlayerTextColor } from "../../lib/playerColors.js";
import {
  colorDistanceMethods,
  getColorDistance,
  getColorDistanceMethod,
  getColorScore,
  getComplementColor,
  getHexColor,
  getRgbColor,
  mixRgbColor,
} from "./color.js";
import { PantyPreview, PantyResultImage } from "./PantyPreview.jsx";

const defaultColor = { red: 255, green: 255, blue: 255 };
const fixedPrompt = "彼女の色を当ててね";
const resultCopyTemplates = [
  ({ parentName, winnerName }) => (
    `1位の${winnerName}は本当に${parentName}の色がわかっているのか、確認させてもらってね🩷`
  ),
  ({ parentName, score, winnerName }) => (
    `${winnerName}が${score}点で最接近。${parentName}への解像度、ちょっと高すぎるかも。`
  ),
  ({ parentName, score, winnerName }) => (
    `${parentName}の色に一番近かったのは${winnerName}。これは${score}点分の直感です。`
  ),
  ({ parentName, winnerName }) => (
    `${winnerName}、${parentName}のオーラをかなり読めていました。あとで理由を聞きましょう。`
  ),
];

export const colorGuessGame = {
  id: "color-guess",
  number: "01",
  title: "色あて",
  summary: "お題に合う色を直感で作って、近さやズレを楽しむ。",
  players: "2人-",
  minutes: "5分",
  heat: 1,
  mood: "直感",
  component: ColorGuessGame,
};

function ColorGuessGame({ game, backToMenu, players }) {
  const [round, setRound] = useState(() => createRound(players));
  const [phase, setPhase] = useState("parent-handoff");
  const [color, setColor] = useState(defaultColor);
  const [hearts, setHearts] = useState([]);
  const [previewVariant, setPreviewVariant] = useState("shadow");
  const [parentColor, setParentColor] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [childIndex, setChildIndex] = useState(0);
  const [distanceMethodId, setDistanceMethodId] = useState("oklab");
  const lastHeartAtRef = useRef(0);

  const currentChild = round.children[childIndex];
  const selectedColor = useMemo(() => getHexColor(color), [color]);
  const previewBackground = usePreviewBackground(color);
  const distanceMethod = getColorDistanceMethod(distanceMethodId);
  const ranking = useMemo(() => {
    if (!parentColor) return [];

    return answers
      .map((answer) => {
        const distance = getColorDistance(parentColor, answer.color, distanceMethodId);

        return {
          ...answer,
          distance,
          score: getColorScore(distance, distanceMethodId),
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [answers, distanceMethodId, parentColor]);
  const isResult = phase === "result";

  function resetInputColor() {
    setColor(defaultColor);
    setHearts([]);
  }

  function updateColor(field, value) {
    setColor((current) => ({ ...current, [field]: Number(value) }));
    spawnHeart();
  }

  function spawnHeart() {
    const now = Date.now();
    if (now - lastHeartAtRef.current < 150) return;
    lastHeartAtRef.current = now;

    const heart = createFloatingHeart(now);

    setHearts((current) => [...current.slice(-5), heart]);
    window.setTimeout(() => {
      setHearts((current) => current.filter((item) => item.id !== heart.id));
    }, 1200);
  }

  function submitParentColor() {
    setParentColor(color);
    resetInputColor();
    setChildIndex(0);
    setPhase("child-handoff");
  }

  function submitChildColor() {
    const nextAnswers = [
      ...answers,
      {
        color,
        player: currentChild,
      },
    ];

    setAnswers(nextAnswers);
    resetInputColor();

    if (childIndex + 1 >= round.children.length) {
      setPhase("result-ready");
      return;
    }

    setChildIndex((current) => current + 1);
    setPhase("child-handoff");
  }

  function startNextRound() {
    setRound(createRound(players));
    setPhase("parent-handoff");
    setParentColor(null);
    setAnswers([]);
    setChildIndex(0);
    resetInputColor();
  }

  function switchDistanceMethod() {
    setDistanceMethodId((current) => {
      const currentIndex = colorDistanceMethods.findIndex(
        (method) => method.id === current,
      );
      const nextIndex = (currentIndex + 1) % colorDistanceMethods.length;

      return colorDistanceMethods[nextIndex].id;
    });
  }

  return (
    <GameShell
      game={game}
      headingClassName={`color-game-head ${isResult ? "result-game-head" : ""}`}
      headingLabel={isResult ? null : undefined}
      headingMeta={isResult ? null : (
        <button
          className="heading-meta-button"
          type="button"
          onClick={switchDistanceMethod}
        >
          判定: {distanceMethod.label}
        </button>
      )}
      headingTitle={isResult ? "結果発表" : undefined}
      lead={phase.includes("input") || isResult ? null : round.prompt}
      onBack={backToMenu}
      screenClassName="color-game-screen"
      showHeading={!phase.includes("input")}
    >
      {phase === "parent-handoff" && (
        <HandoffScreen
          eyebrow="今回の親"
          primary={`親（${getPlayerCallName(round.parent)}）`}
          secondary="スマホを親に渡してください。親だけが色を作ります。"
          actionLabel="親が色を作る"
          player={round.parent}
          onAction={() => setPhase("parent-input")}
        />
      )}

      {phase === "parent-input" && (
        <ColorInput
          actionLabel="親の色を決定"
          color={color}
          hearts={hearts}
          note="この画面は親だけが見てください。決定したら色は隠れます。"
          onChange={updateColor}
          onSubmit={submitParentColor}
          previewBackground={previewBackground}
          previewVariant={previewVariant}
          player={round.parent}
          selectedColor={selectedColor}
          setPreviewVariant={setPreviewVariant}
          title={`親（${getPlayerCallName(round.parent)}）の色`}
        />
      )}

      {phase === "child-handoff" && currentChild && (
        <HandoffScreen
          eyebrow="次の回答者"
          primary={getPlayerCallName(currentChild)}
          secondary="画面を伏せて渡してください。親が選びそうな色を当てます。"
          actionLabel="回答する"
          player={currentChild}
          onAction={() => setPhase("child-input")}
        />
      )}

      {phase === "child-input" && currentChild && (
        <ColorInput
          actionLabel={`${getPlayerCallName(currentChild)}の色を決定`}
          color={color}
          hearts={hearts}
          note={`親（${getPlayerCallName(round.parent)}）の色を想像して作ってください。前の人の回答は見えません。`}
          onChange={updateColor}
          onSubmit={submitChildColor}
          previewBackground={previewBackground}
          previewVariant={previewVariant}
          player={currentChild}
          selectedColor={selectedColor}
          setPreviewVariant={setPreviewVariant}
          title={`${getPlayerCallName(currentChild)}の回答`}
        />
      )}

      {phase === "result-ready" && (
        <HandoffScreen
          eyebrow="全員入力完了"
          primary="ここからは全員で見てOK"
          secondary="親の色に一番近い人を発表します。"
          actionLabel="結果を見る"
          onAction={() => setPhase("result")}
        />
      )}

      {phase === "result" && (
        <ResultScreen
          onNextRound={startNextRound}
          parent={round.parent}
          parentColor={parentColor}
          ranking={ranking}
        />
      )}
    </GameShell>
  );
}

function ColorInput({
  actionLabel,
  color,
  hearts,
  note,
  onChange,
  onSubmit,
  previewBackground,
  previewVariant,
  player,
  selectedColor,
  setPreviewVariant,
  title,
}) {
  const playerStyle = player ? {
    "--private-color": getPlayerColor(player),
    "--private-text-color": getPlayerTextColor(player),
  } : undefined;

  return (
    <>
      <div
        className="private-turn-card"
        style={playerStyle}
      >
        <p className="label">Private Turn</p>
        <h2>{title}</h2>
        <p>{note}</p>
      </div>

      <div className="color-picker rgb-picker" style={{ "--selected-color": selectedColor }}>
        <PantyPreview
          background={previewBackground}
          color={selectedColor}
          hearts={hearts}
          onToggleVariant={() => setPreviewVariant((current) => (
            current === "skin" ? "shadow" : "skin"
          ))}
          variant={previewVariant}
        />

        <ColorSlider
          className="rgb-slider-red"
          label="R"
          thumbColor={`rgb(${color.red} 0 0)`}
          value={color.red}
          track="linear-gradient(90deg, #000000, #ff0000)"
          onChange={(value) => onChange("red", value)}
        />
        <ColorSlider
          className="rgb-slider-green"
          label="G"
          thumbColor={`rgb(0 ${color.green} 0)`}
          value={color.green}
          track="linear-gradient(90deg, #000000, #00ff00)"
          onChange={(value) => onChange("green", value)}
        />
        <ColorSlider
          className="rgb-slider-blue"
          label="B"
          thumbColor={`rgb(0 0 ${color.blue})`}
          value={color.blue}
          track="linear-gradient(90deg, #000000, #0000ff)"
          onChange={(value) => onChange("blue", value)}
        />
      </div>

      <div className="game-controls single-control" style={playerStyle}>
        <button className="primary-button player-action-button" type="button" onClick={onSubmit}>
          {actionLabel}
        </button>
      </div>
    </>
  );
}

function HandoffScreen({ actionLabel, eyebrow, onAction, player, primary, secondary }) {
  return (
    <section
      className={`handoff-card ${player ? "player-handoff-card" : ""}`}
      style={player ? {
        "--handoff-color": getPlayerColor(player),
        "--handoff-text-color": getPlayerTextColor(player),
      } : undefined}
    >
      <p className="label">{eyebrow}</p>
      <p className="handoff-name">{primary}</p>
      <p className="handoff-copy">{secondary}</p>
      <button className="primary-button full-button" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </section>
  );
}

function ResultScreen({ onNextRound, parent, parentColor, ranking }) {
  const winner = ranking[0];
  const [parentHearts, setParentHearts] = useState([]);
  const [parentPreviewVariant, setParentPreviewVariant] = useState("shadow");
  const parentPreviewBackground = usePreviewBackground(parentColor);
  const resultCopy = useMemo(() => createResultCopy(parent, winner), [parent, winner]);

  function spawnParentHeart() {
    const heart = createFloatingHeart(Date.now());

    setParentHearts((current) => [...current.slice(-5), heart]);
    window.setTimeout(() => {
      setParentHearts((current) => current.filter((item) => item.id !== heart.id));
    }, 1200);
  }

  return (
    <section
      className="result-screen"
      style={winner ? {
        "--result-winner-color": getPlayerColor(winner.player),
        "--result-winner-text-color": getPlayerTextColor(winner.player),
      } : undefined}
    >
      <div className="result-hero">
        <p className="label">Winner</p>
        <h2>{winner ? winner.player.name : "結果なし"}</h2>
        <p>{resultCopy}</p>
      </div>

      <div
        className="result-parent-card"
        style={{
          "--answer-color": getHexColor(parentColor),
          "--panty-bg-base": parentPreviewBackground.base,
          "--panty-bg-deep": parentPreviewBackground.deep,
          "--panty-bg-glow": parentPreviewBackground.glow,
        }}
      >
        <div className="result-parent-meta">
          <span className="result-rank">親</span>
          <button
            className="result-player-name result-parent-name-button"
            type="button"
            onClick={() => setParentPreviewVariant((current) => (
              current === "skin" ? "shadow" : "skin"
            ))}
          >
            {parent.name}
          </button>
          <span className="result-hex result-answer-hex">{getHexColor(parentColor)}</span>
        </div>
        <PantyResultImage
          background={parentPreviewBackground}
          color={getHexColor(parentColor)}
          hearts={parentHearts}
          onClick={spawnParentHeart}
          variant={parentPreviewVariant}
        />
      </div>

      <div className="result-list">
        {ranking.map((answer, index) => (
          <div
            className="result-row result-answer-row"
            key={answer.player.id}
            style={{
              "--answer-color": getHexColor(answer.color),
              "--result-player-color": getPlayerColor(answer.player),
              "--result-row-text": getPlayerTextColor(answer.player),
            }}
          >
            <span className="result-rank">{index + 1}</span>
            <span className="result-player-name">{answer.player.name}</span>
            <span className="result-hex result-answer-hex">{getHexColor(answer.color)}</span>
            <span className="result-score">{answer.score}点</span>
          </div>
        ))}
      </div>

      <div className="game-controls">
        <button className="secondary-button" type="button" onClick={onNextRound}>
          もう一回
        </button>
        <button className="secondary-button" type="button" onClick={() => window.location.hash = "menu"}>
          Menu
        </button>
      </div>
    </section>
  );
}

function createFloatingHeart(now) {
  return {
    id: `${now}-${Math.random().toString(16).slice(2)}`,
    drift: `${Math.round(Math.random() * 44 - 22)}px`,
    left: `${Math.round(Math.random() * 34 + 33)}%`,
    rotate: `${Math.round(Math.random() * 24 - 12)}deg`,
    scale: (Math.random() * 0.28 + 0.92).toFixed(2),
  };
}

function createResultCopy(parent, winner) {
  if (!winner) {
    return "今回は結果がありません。";
  }

  const template = resultCopyTemplates[
    Math.floor(Math.random() * resultCopyTemplates.length)
  ];

  return template({
    parentName: getPlayerCallName(parent),
    score: winner.score,
    winnerName: getPlayerCallName(winner.player),
  });
}

function createRound(players) {
  const parentCandidates = players.filter((player) => player.gender === "female");
  const candidates = parentCandidates.length > 0 ? parentCandidates : players;
  const parent = candidates[Math.floor(Math.random() * candidates.length)] || players[0];

  return {
    children: players.filter((player) => player.id !== parent.id),
    parent,
    prompt: fixedPrompt,
  };
}

function getPlayerCallName(player) {
  const suffix = player.gender === "female" ? "ちゃん" : "くん";
  return `${player.name}${suffix}`;
}

function usePreviewBackground(color) {
  const complementColor = useMemo(() => getComplementColor(color), [color]);

  return useMemo(() => ({
    glow: getRgbColor(mixRgbColor(complementColor, { red: 255, green: 248, blue: 239 }, 0.18)),
    deep: getRgbColor(mixRgbColor(complementColor, { red: 12, green: 8, blue: 8 }, 0.72)),
    base: getRgbColor(mixRgbColor(complementColor, { red: 12, green: 8, blue: 8 }, 0.86)),
  }), [complementColor]);
}
