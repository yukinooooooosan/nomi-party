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

function getHexColor(state) {
  return `#${toHex(state.red)}${toHex(state.green)}${toHex(state.blue)}`;
}

function getRgbText(state) {
  return `rgb(${state.red}, ${state.green}, ${state.blue})`;
}

export function renderGame(root, { game, backToMenu }) {
  let promptIndex = 0;
  const state = {
    red: 224,
    green: 48,
    blue: 112,
  };

  function draw() {
    const selectedColor = getHexColor(state);

    root.className = "app-stage play-stage";
    root.innerHTML = `
      <section class="game-screen color-game-screen" aria-labelledby="active-game-title">
        <button class="ghost-button" type="button" data-action="back">Menu</button>

        <div class="game-screen-head color-game-head">
          <p class="label">${game.number} / ${game.mood}</p>
          <h1 id="active-game-title">${game.title}</h1>
          <p>${prompts[promptIndex % prompts.length]}</p>
        </div>

        <div class="color-picker rgb-picker" style="--selected-color: ${selectedColor};">
          <div class="color-preview color-preview-large" aria-label="選んだ色"></div>

          <label class="color-slider rgb-slider rgb-slider-red">
            <span>R</span>
            <input
              type="range"
              min="0"
              max="255"
              value="${state.red}"
              data-color-field="red"
              style="--track: linear-gradient(90deg, rgb(0 ${state.green} ${state.blue}), rgb(255 ${state.green} ${state.blue}));"
            >
            <strong>${state.red}</strong>
          </label>

          <label class="color-slider rgb-slider rgb-slider-green">
            <span>G</span>
            <input
              type="range"
              min="0"
              max="255"
              value="${state.green}"
              data-color-field="green"
              style="--track: linear-gradient(90deg, rgb(${state.red} 0 ${state.blue}), rgb(${state.red} 255 ${state.blue}));"
            >
            <strong>${state.green}</strong>
          </label>

          <label class="color-slider rgb-slider rgb-slider-blue">
            <span>B</span>
            <input
              type="range"
              min="0"
              max="255"
              value="${state.blue}"
              data-color-field="blue"
              style="--track: linear-gradient(90deg, rgb(${state.red} ${state.green} 0), rgb(${state.red} ${state.green} 255));"
            >
            <strong>${state.blue}</strong>
          </label>
        </div>

        <div class="game-controls">
          <button class="primary-button" type="button" data-action="lock">この色で決定</button>
          <button class="secondary-button" type="button" data-action="next">次のお題</button>
        </div>

        <p class="safety-copy">色コードは表示せず、内部データとしてだけ使います。</p>
      </section>
    `;
  }

  function updateColorUi() {
    const selectedColor = getHexColor(state);
    const picker = root.querySelector(".color-picker");
    const preview = root.querySelector(".color-preview");
    const redSlider = root.querySelector("[data-color-field='red']");
    const greenSlider = root.querySelector("[data-color-field='green']");
    const blueSlider = root.querySelector("[data-color-field='blue']");

    picker?.style.setProperty("--selected-color", selectedColor);
    preview?.style.setProperty("background", selectedColor);
    preview?.setAttribute("data-rgb", getRgbText(state));
    redSlider?.style.setProperty(
      "--track",
      `linear-gradient(90deg, rgb(0 ${state.green} ${state.blue}), rgb(255 ${state.green} ${state.blue}))`,
    );
    greenSlider?.style.setProperty(
      "--track",
      `linear-gradient(90deg, rgb(${state.red} 0 ${state.blue}), rgb(${state.red} 255 ${state.blue}))`,
    );
    blueSlider?.style.setProperty(
      "--track",
      `linear-gradient(90deg, rgb(${state.red} ${state.green} 0), rgb(${state.red} ${state.green} 255))`,
    );

    root.querySelectorAll("[data-color-field]").forEach((input) => {
      input.closest(".rgb-slider")?.querySelector("strong").replaceChildren(input.value);
    });
  }

  root.oninput = (event) => {
    const input = event.target.closest("[data-color-field]");
    if (!input) return;

    state[input.dataset.colorField] = Number(input.value);
    updateColorUi();
  };

  root.onclick = (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "back") {
      backToMenu();
      return;
    }

    if (action === "next") {
      promptIndex += 1;
      draw();
      return;
    }

    if (action === "lock") {
      button.textContent = "決定済み";
      button.dataset.hex = getHexColor(state);
    }
  };

  draw();
}
