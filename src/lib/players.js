import { assignPlayerColors } from "./playerColors.js";

export { assignPlayerColors, getPlayerTextColor } from "./playerColors.js";

export const playerStorageKey = "nomi-party-players";
export const savedRosterStorageKey = "nomi-party-saved-roster";
export const setupCompleteKey = "nomi-party-setup-complete";
export const minimumPlayers = 2;
export const maximumPlayers = 12;
export const genderOptions = ["male", "female"];
export const genderLabels = {
  male: "♂",
  female: "♀",
};

export function createPlayer(index) {
  return assignPlayerColors([{
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name: defaultPlayerName(index),
    gender: genderOptions[index % genderOptions.length],
  }])[0];
}

export function defaultPlayerName(index) {
  return `Player ${index + 1}`;
}

export function fallbackPlayers() {
  return assignPlayerColors(
    Array.from({ length: minimumPlayers }, (_, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      name: defaultPlayerName(index),
      gender: genderOptions[index % genderOptions.length],
    })),
  );
}

export function loadPlayers() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(playerStorageKey));
    if (!Array.isArray(saved) || saved.length < minimumPlayers) return fallbackPlayers();

    return assignPlayerColors(saved.slice(0, maximumPlayers).map((player, index) => ({
      id: player.id || createPlayer(index).id,
      name: typeof player.name === "string" && player.name.trim()
        ? player.name
        : defaultPlayerName(index),
      gender: genderOptions.includes(player.gender)
        ? player.gender
        : genderOptions[index % genderOptions.length],
      color: typeof player.color === "string" ? player.color : null,
    })));
  } catch {
    return fallbackPlayers();
  }
}

export function saveRoster(players) {
  const roster = normalizePlayers(players).map((player) => ({
    name: player.name,
    gender: player.gender,
  }));

  localStorage.setItem(savedRosterStorageKey, JSON.stringify(roster));
}

export function hasSavedRoster() {
  return localStorage.getItem(savedRosterStorageKey) !== null;
}

export function loadSavedRoster() {
  try {
    const saved = JSON.parse(localStorage.getItem(savedRosterStorageKey));
    if (!Array.isArray(saved) || saved.length < minimumPlayers) return null;

    return assignPlayerColors(saved.slice(0, maximumPlayers).map((player, index) => ({
      id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
      name: typeof player.name === "string" && player.name.trim()
        ? player.name
        : defaultPlayerName(index),
      gender: genderOptions.includes(player.gender)
        ? player.gender
        : genderOptions[index % genderOptions.length],
    })));
  } catch {
    return null;
  }
}

export function normalizePlayers(players) {
  return assignPlayerColors(players.map((player, index) => ({
    ...player,
    name: player.name.trim() || defaultPlayerName(index),
    gender: genderOptions.includes(player.gender) ? player.gender : "male",
  })));
}

export function nextGender(currentGender) {
  const index = genderOptions.indexOf(currentGender);
  return genderOptions[(index + 1) % genderOptions.length] || genderOptions[0];
}

export function hasReadyPlayers(players) {
  return sessionStorage.getItem(setupCompleteKey) === "true"
    && players.length >= minimumPlayers
    && players.length <= maximumPlayers;
}
