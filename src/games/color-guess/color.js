import { differenceEuclidean } from "culori";

const getOklabDistance = differenceEuclidean("oklab");
const maxOklabDistance = 1;

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
  return getOklabDistance(toCuloriRgb(a), toCuloriRgb(b));
}

export function getColorScore(distance) {
  return Math.max(0, Math.round((1 - distance / maxOklabDistance) * 100));
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

function toCuloriRgb(color) {
  return {
    mode: "rgb",
    r: color.red / 255,
    g: color.green / 255,
    b: color.blue / 255,
  };
}
