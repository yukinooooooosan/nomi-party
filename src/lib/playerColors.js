export const genderColorPalettes = {
  male: [
    "#171b24",
    "#2368d9",
    "#00a7b7",
    "#5f55d6",
    "#28a745",
    "#a9860f",
    "#c24f24",
    "#0e66a3",
    "#78a51c",
    "#8e4bd1",
    "#00856f",
    "#4d79ff",
  ],
  female: [
    "#fff4f7",
    "#d64a75",
    "#c15bc7",
    "#f06a3d",
    "#7f62d9",
    "#d6a21f",
    "#e052a3",
    "#b4562b",
    "#56a6d6",
    "#bf3f61",
    "#75a832",
    "#cc5bb1",
  ],
};

export const fallbackPlayerColors = [
  ...genderColorPalettes.male,
  ...genderColorPalettes.female,
];

export function assignPlayerColors(players) {
  const usedColors = new Set();
  const genderCounts = { male: 0, female: 0 };

  return players.map((player, index) => {
    const palette = genderColorPalettes[player.gender] || fallbackPlayerColors;
    const existingColorIsUsable = palette.includes(player.color)
      && !usedColors.has(player.color);
    const color = existingColorIsUsable
      ? player.color
      : getColorForPlayerSlot(player, genderCounts, usedColors, index);

    usedColors.add(color);
    genderCounts[player.gender] = (genderCounts[player.gender] || 0) + 1;

    return {
      ...player,
      color,
    };
  });
}

export function getPlayerColor(player) {
  return player.color || fallbackPlayerColors[0];
}

export function getPlayerTextColor(player) {
  const color = getPlayerColor(player);
  return isLightColor(color) ? "#20120d" : "#fff8ef";
}

function getColorForPlayerSlot(player, genderCounts, usedColors, fallbackIndex) {
  const palette = genderColorPalettes[player.gender] || fallbackPlayerColors;
  const genderIndex = genderCounts[player.gender] || 0;
  const preferredColor = palette[genderIndex % palette.length];

  if (preferredColor && !usedColors.has(preferredColor)) return preferredColor;

  return palette.find((color) => !usedColors.has(color))
    || fallbackPlayerColors.find((color) => !usedColors.has(color))
    || fallbackPlayerColors[fallbackIndex % fallbackPlayerColors.length];
}

function isLightColor(color) {
  const hex = color.replace("#", "");
  if (hex.length !== 6) return false;

  const red = Number.parseInt(hex.slice(0, 2), 16);
  const green = Number.parseInt(hex.slice(2, 4), 16);
  const blue = Number.parseInt(hex.slice(4, 6), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

  return brightness > 176;
}
