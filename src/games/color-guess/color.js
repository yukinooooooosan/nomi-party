import { differenceCiede2000, differenceEuclidean } from "culori";

const getOklabDistance = differenceEuclidean("oklab");
const getRgbDistance = differenceEuclidean("rgb");
const getDeltaEDistance = differenceCiede2000();

export const colorDistanceMethods = [
  {
    id: "oklab",
    label: "OKLab距離",
    getDistance: getOklabDistance,
    maxDistance: 1,
  },
  {
    id: "rgb",
    label: "RGB距離",
    getDistance: getRgbDistance,
    maxDistance: Math.sqrt(3),
  },
  {
    id: "delta-e",
    label: "Delta E",
    getDistance: getDeltaEDistance,
    maxDistance: 111.42,
  },
];

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

export function getColorDistance(a, b, methodId = "oklab") {
  const method = getColorDistanceMethod(methodId);

  return method.getDistance(toCuloriRgb(a), toCuloriRgb(b));
}

export function getColorScore(distance, methodId = "oklab") {
  const method = getColorDistanceMethod(methodId);

  return Math.max(0, Math.round((1 - distance / method.maxDistance) * 100));
}

export function getColorDistanceMethod(methodId) {
  return colorDistanceMethods.find((method) => method.id === methodId)
    || colorDistanceMethods[0];
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
