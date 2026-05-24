import { renderPromptGame } from "./shared.js";

const prompts = [
  "追いかける恋 / 追いかけられる恋",
  "秘密を知りたい / 秘密にされたい",
  "朝まで話す / 何も言わずに帰る",
  "一度だけの大胆 / ずっと残る余韻",
  "本音を聞く / 本音を隠す",
];

export function renderGame(root, context) {
  renderPromptGame(root, {
    ...context,
    prompts,
    intro: "二択を選んで、理由を一言だけ添えるゲーム。",
  });
}
