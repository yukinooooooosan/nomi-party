import { useMemo, useState } from "react";

const prompts = [
  "初恋を色で作るなら",
  "今日のこの場の空気を色で作るなら",
  "秘密っぽい色を作るなら",
  "一番モテそうな人のオーラを色で作るなら",
  "酔ったときの自分を色で作るなら",
];

function toHex(value) {
  return Number(value).toString(16).padStart(2, "0").toUpperCase();
}

function getHexColor(color) {
  return `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
}

export function ColorGuessGame({ game, backToMenu }) {
  const [promptIndex, setPromptIndex] = useState(0);
  const [color, setColor] = useState({ red: 224, green: 48, blue: 112 });
  const [lockedColor, setLockedColor] = useState(null);
  const selectedColor = useMemo(() => getHexColor(color), [color]);

  function updateColor(field, value) {
    setColor((current) => ({ ...current, [field]: Number(value) }));
    setLockedColor(null);
  }

  return (
    <section className="game-screen color-game-screen" aria-labelledby="active-game-title">
      <button className="ghost-button" type="button" onClick={backToMenu}>
        Menu
      </button>

      <div className="game-screen-head color-game-head">
        <p className="label">{game.number} / {game.mood}</p>
        <h1 id="active-game-title">{game.title}</h1>
        <p>{prompts[promptIndex % prompts.length]}</p>
      </div>

      <div className="color-picker rgb-picker" style={{ "--selected-color": selectedColor }}>
        <div
          className="color-preview color-preview-large"
          aria-label="選んだ色"
          style={{ background: selectedColor }}
        />

        <RgbSlider
          field="red"
          label="R"
          value={color.red}
          track={`linear-gradient(90deg, rgb(0 ${color.green} ${color.blue}), rgb(255 ${color.green} ${color.blue}))`}
          onChange={updateColor}
        />
        <RgbSlider
          field="green"
          label="G"
          value={color.green}
          track={`linear-gradient(90deg, rgb(${color.red} 0 ${color.blue}), rgb(${color.red} 255 ${color.blue}))`}
          onChange={updateColor}
        />
        <RgbSlider
          field="blue"
          label="B"
          value={color.blue}
          track={`linear-gradient(90deg, rgb(${color.red} ${color.green} 0), rgb(${color.red} ${color.green} 255))`}
          onChange={updateColor}
        />
      </div>

      <div className="game-controls">
        <button className="primary-button" type="button" onClick={() => setLockedColor(selectedColor)}>
          {lockedColor ? "決定済み" : "この色で決定"}
        </button>
        <button className="secondary-button" type="button" onClick={() => setPromptIndex(promptIndex + 1)}>
          次のお題
        </button>
      </div>

      <p className="safety-copy">色コードは表示せず、内部データとしてだけ使います。</p>
    </section>
  );
}

function RgbSlider({ field, label, onChange, track, value }) {
  return (
    <label className={`color-slider rgb-slider rgb-slider-${field}`}>
      <span>{label}</span>
      <input
        type="range"
        min="0"
        max="255"
        value={value}
        style={{ "--track": track }}
        onChange={(event) => onChange(field, event.target.value)}
      />
      <strong>{value}</strong>
    </label>
  );
}
