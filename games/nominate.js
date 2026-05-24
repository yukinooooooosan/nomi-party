import { renderPromptGame } from "./shared.js";

const prompts = [
  "この中で一番、秘密を持っていそうな人は？",
  "一番、好きな人の前で態度が変わりそうな人は？",
  "一番、終電を逃す言い訳がうまそうな人は？",
  "一番、恋の相談をしたら核心を突いてきそうな人は？",
  "一番、今夜のことを明日も覚えていそうな人は？",
];

export function renderGame(root, context) {
  renderPromptGame(root, {
    ...context,
    prompts,
    intro: "お題に一番近い人を、せーので指名するゲーム。",
  });
}
