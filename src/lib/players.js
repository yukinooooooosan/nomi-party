export const playerStorageKey = "nomi-party-players";
export const setupCompleteKey = "nomi-party-setup-complete";
export const minimumPlayers = 2;
export const maximumPlayers = 12;
export const genderOptions = ["male", "female"];
export const genderLabels = {
  male: "♂",
  female: "♀",
};

export function createPlayer(index) {
  return {
    id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    name: defaultPlayerName(index),
    gender: genderOptions[index % genderOptions.length],
  };
}

export function defaultPlayerName(index) {
  return `Player ${index + 1}`;
}

export function fallbackPlayers() {
  return Array.from({ length: minimumPlayers }, (_, index) => createPlayer(index));
}

export function loadPlayers() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(playerStorageKey));
    if (!Array.isArray(saved) || saved.length < minimumPlayers) return fallbackPlayers();

    return saved.slice(0, maximumPlayers).map((player, index) => ({
      id: player.id || createPlayer(index).id,
      name: typeof player.name === "string" && player.name.trim()
        ? player.name
        : defaultPlayerName(index),
      gender: genderOptions.includes(player.gender)
        ? player.gender
        : genderOptions[index % genderOptions.length],
    }));
  } catch {
    return fallbackPlayers();
  }
}

export function normalizePlayers(players) {
  return players.map((player, index) => ({
    ...player,
    name: player.name.trim() || defaultPlayerName(index),
    gender: genderOptions.includes(player.gender) ? player.gender : "male",
  }));
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
