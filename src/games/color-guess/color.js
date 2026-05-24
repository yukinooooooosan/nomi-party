export function toHex(value) {
  return Number(value).toString(16).padStart(2, "0").toUpperCase();
}

export function getHexColor(color) {
  return `#${toHex(color.red)}${toHex(color.green)}${toHex(color.blue)}`;
}

export function getComplementColor(color) {
  return {
    red: 255 - color.red,
    green: 255 - color.green,
    blue: 255 - color.blue,
  };
}

export function getRgbColor(color) {
  return `rgb(${color.red} ${color.green} ${color.blue})`;
}

export function getColorDistance(a, b) {
  return Math.sqrt(
    (a.red - b.red) ** 2
    + (a.green - b.green) ** 2
    + (a.blue - b.blue) ** 2,
  );
}

export function getColorScore(distance) {
  const maxDistance = Math.sqrt((255 ** 2) * 3);

  return Math.max(0, Math.round((1 - distance / maxDistance) * 100));
}

export function mixRgbColor(color, target, amount) {
  const mix = (channel, targetChannel) => Math.round(
    channel * (1 - amount) + targetChannel * amount,
  );

  return {
    red: mix(color.red, target.red),
    green: mix(color.green, target.green),
    blue: mix(color.blue, target.blue),
  };
}
