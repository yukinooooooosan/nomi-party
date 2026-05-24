export function renderPromptGame(root, { game, backToMenu, prompts, intro }) {
  let index = 0;

  function currentPrompt() {
    return prompts[index % prompts.length];
  }

  function draw() {
    root.className = "app-stage play-stage";
    root.innerHTML = `
      <section class="game-screen" aria-labelledby="active-game-title">
        <button class="ghost-button" type="button" data-action="back">Menu</button>

        <div class="game-screen-head">
          <p class="label">${game.number} / ${game.mood}</p>
          <h1 id="active-game-title">${game.title}</h1>
          <p>${intro}</p>
        </div>

        <div class="prompt-card">
          <p class="prompt-label">スマホを回して、次の人へ</p>
          <p class="prompt-text">${currentPrompt()}</p>
        </div>

        <div class="game-controls">
          <button class="primary-button" type="button" data-action="next">次のお題</button>
          <button class="secondary-button" type="button" data-action="pass">パス</button>
        </div>

        <p class="safety-copy">答えにくいときは、笑ってパスで大丈夫。</p>
      </section>
    `;
  }

  root.onclick = (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "back") {
      backToMenu();
      return;
    }

    index += 1;
    draw();
  };

  draw();
}
