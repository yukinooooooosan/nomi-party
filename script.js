import { games } from "./games/index.js";

const app = document.querySelector("#app");
const playerStorageKey = "nomi-party-players";
const setupCompleteKey = "nomi-party-setup-complete";
const minimumPlayers = 2;
const maximumPlayers = 12;
const genderOptions = ["male", "female"];
const genderLabels = {
  male: "♂",
  female: "♀",
};

let pendingGameId = null;
let players = loadPlayers();

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

function savePlayers() {
  sessionStorage.setItem(playerStorageKey, JSON.stringify(players));
}

function hasReadyPlayers() {
  return sessionStorage.getItem(setupCompleteKey) === "true"
    && players.length >= minimumPlayers
    && players.length <= maximumPlayers;
}

function normalizedPlayers() {
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function heatMarks(level) {
  return "●".repeat(level) + "○".repeat(3 - level);
}

function getHashValue() {
  return window.location.hash.replace(/^#/, "");
}

function getGameFromHash() {
  const id = getHashValue();
  return games.find((game) => game.id === id) || null;
}

function navigateTo(hash) {
  if (getHashValue() === hash) {
    route();
    return;
  }

  window.location.hash = hash;
}

function renderPlayerSetup() {
  const canAddPlayer = players.length < maximumPlayers;

  app.className = "app-stage setup-stage";
  app.innerHTML = `
    <section class="setup-screen" aria-labelledby="setup-title">
      <div class="setup-hero">
        <p class="label">Tonight's Players</p>
        <h1 id="setup-title">まずは参加者</h1>
        <p class="party-lead">
          名前はあとからでも大丈夫。一台を回す順番だけ、ここで軽く作ります。
        </p>
      </div>

      <form class="player-form" data-player-form>
        <div class="player-list" aria-label="参加メンバー">
          ${players.map((player, index) => `
            <div class="player-row" data-player-id="${player.id}">
              <span class="player-number">${String(index + 1).padStart(2, "0")}</span>
              <label class="player-name">
                <span>Member</span>
                <input
                  type="text"
                  name="player-${player.id}"
                  value="${escapeHtml(player.name)}"
                  placeholder="名前を入力"
                  autocomplete="off"
                  data-player-name
                >
              </label>
              <button
                class="gender-button"
                type="button"
                data-action="toggle-gender"
                aria-label="性別を切り替え"
              >${genderLabels[player.gender] || genderLabels.male}</button>
              <button class="icon-button" type="button" data-action="remove" aria-label="メンバーを削除">−</button>
            </div>
          `).join("")}
        </div>

        <button class="add-player-button" type="button" data-action="add" ${canAddPlayer ? "" : "disabled"}>
          <span>＋</span>
          ${canAddPlayer ? "メンバーを追加" : "12人まで"}
        </button>

        <button class="primary-button full-button" type="submit">
          ${pendingGameId ? "このメンバーでゲームへ" : "このメンバーで始める"}
        </button>
      </form>
    </section>
  `;

  app.querySelectorAll("[data-action='remove']").forEach((button) => {
    button.disabled = players.length <= minimumPlayers;
  });

  const form = app.querySelector("[data-player-form]");
  form.addEventListener("input", (event) => {
    const input = event.target.closest("[data-player-name]");
    if (!input) return;

    const row = input.closest("[data-player-id]");
    const player = players.find((item) => item.id === row.dataset.playerId);
    if (player) {
      player.name = input.value;
      savePlayers();
    }
  });

  form.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    if (action === "add" && players.length < maximumPlayers) {
      players.push(createPlayer(players.length));
      savePlayers();
      renderPlayerSetup();
      return;
    }

    if (action === "toggle-gender") {
      const row = button.closest("[data-player-id]");
      const player = players.find((item) => item.id === row.dataset.playerId);
      if (player) {
        player.gender = nextGender(player.gender);
        savePlayers();
        renderPlayerSetup();
      }
      return;
    }

    if (action === "remove" && players.length > minimumPlayers) {
      const row = button.closest("[data-player-id]");
      players = players.filter((player) => player.id !== row.dataset.playerId);
      savePlayers();
      renderPlayerSetup();
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    players = normalizedPlayers();
    savePlayers();
    sessionStorage.setItem(setupCompleteKey, "true");
    navigateTo(pendingGameId || "menu");
  });
}

function renderMenu() {
  const readyPlayers = normalizedPlayers();

  app.className = "app-stage menu-stage";
  app.innerHTML = `
    <header class="party-hero">
      <p class="label">One Phone Party</p>
      <h1 id="party-title">夜のまわしスマホ</h1>
      <p class="party-lead">
        一台を回すだけ。少し踏み込む、飲み会用パーティゲーム集。
      </p>
    </header>

    <section class="player-summary" aria-label="参加メンバー">
      <div>
        <p class="label">Players</p>
        <p>${readyPlayers.length}人でプレイ</p>
      </div>
      <button class="ghost-button" type="button" data-action="edit-players">Edit</button>
      <div class="player-chips">
        ${readyPlayers.map((player) => `
          <span>${genderLabels[player.gender] || genderLabels.male} ${escapeHtml(player.name)}</span>
        `).join("")}
      </div>
    </section>

    <section class="menu-board" aria-labelledby="game-list-title">
      <div class="section-heading">
        <p class="label">Tonight's Menu</p>
        <h2 id="game-list-title">今夜のゲームを選ぶ</h2>
      </div>

      <div class="game-menu">
        ${games.map((game) => `
          <a class="game-row" href="#${game.id}" data-game-id="${game.id}">
            <span class="game-number">${game.number}</span>
            <span class="game-main">
              <span class="game-title">${game.title}</span>
              <span class="game-copy">${game.summary}</span>
              <span class="game-tags">
                <span>${game.players}</span>
                <span>${game.minutes}</span>
                <span>攻め度 ${heatMarks(game.heat)}</span>
                <span>${game.mood}</span>
              </span>
            </span>
            <span class="game-action">Start</span>
          </a>
        `).join("")}
      </div>
    </section>

    <footer class="party-note" aria-label="遊ぶときの約束">
      <span>パスあり</span>
      <span>無理強いなし</span>
      <span>記録しない</span>
    </footer>
  `;

  app.querySelector("[data-action='edit-players']").addEventListener("click", () => {
    pendingGameId = null;
    navigateTo("setup");
  });
}

async function renderGame(game) {
  app.className = "app-stage play-stage";
  app.innerHTML = `
    <section class="game-screen is-loading" aria-label="${game.title}">
      <p class="label">Loading</p>
      <h1>${game.title}</h1>
    </section>
  `;

  const module = await game.module();
  module.renderGame(app, {
    game,
    players: normalizedPlayers(),
    backToMenu: () => {
      history.pushState(null, "", `${window.location.pathname}#menu`);
      renderMenu();
    },
  });
}

function route() {
  const hash = getHashValue();
  const game = getGameFromHash();

  if (!hash || hash === "setup") {
    pendingGameId = null;
    renderPlayerSetup();
    return;
  }

  if (hash === "menu") {
    pendingGameId = null;
    if (!hasReadyPlayers()) {
      renderPlayerSetup();
      return;
    }

    renderMenu();
    return;
  }

  if (!game) {
    pendingGameId = null;
    navigateTo("setup");
    return;
  }

  if (!hasReadyPlayers()) {
    pendingGameId = game.id;
    renderPlayerSetup();
    return;
  }

  pendingGameId = null;
  renderGame(game);
}

window.addEventListener("hashchange", route);
route();
