import { colorGuessGame } from "./color-guess/index.jsx";
import { desireMatchGame } from "./desire-match/index.jsx";
import { kinkMatchGame } from "./kink-match/index.jsx";
import { maskRevealGame } from "./mask-reveal/index.jsx";
import { simpleRouletteGame } from "./simple-roulette/index.jsx";

export const playStyles = {
  passPhone: "pass-phone",
  personalPhone: "personal-phone",
};

export const games = [
  colorGuessGame,
  desireMatchGame,
  kinkMatchGame,
  simpleRouletteGame,
  maskRevealGame,
];

export const passPhoneGames = games.filter((game) => game.playStyle === playStyles.passPhone);
export const personalPhoneGames = games.filter((game) => game.playStyle === playStyles.personalPhone);
