import { renderPromptGame } from "./shared.js";

const prompts = [
  "最近、ちょっとだけ隠していることがある人",
  "初対面では見せない顔がありそうな人",
  "恋愛で一番かけ引きがうまそうな人",
  "酔うと急にかわいくなりそうな人",
  "今夜、一番秘密を増やして帰りそうな人",
];

export function renderGame(root, context) {
  renderPromptGame(root, {
    ...context,
    prompts,
    intro: "お題を読んで、会話の中で少数派っぽい人を探すゲーム。",
  });
}
