import { useState } from "react";

export function PromptGame({ game, backToMenu }) {
  const [index, setIndex] = useState(0);
  const prompt = game.prompts[index % game.prompts.length];

  return (
    <section className="game-screen" aria-labelledby="active-game-title">
      <button className="ghost-button" type="button" onClick={backToMenu}>
        Menu
      </button>

      <div className="game-screen-head">
        <p className="label">{game.number} / {game.mood}</p>
        <h1 id="active-game-title">{game.title}</h1>
        <p>{game.intro}</p>
      </div>

      <div className="prompt-card">
        <p className="prompt-label">スマホを回して、次の人へ</p>
        <p className="prompt-text">{prompt}</p>
      </div>

      <div className="game-controls">
        <button className="primary-button" type="button" onClick={() => setIndex(index + 1)}>
          次のお題
        </button>
        <button className="secondary-button" type="button" onClick={() => setIndex(index + 1)}>
          パス
        </button>
      </div>

      <p className="safety-copy">答えにくいときは、笑ってパスで大丈夫。</p>
    </section>
  );
}
