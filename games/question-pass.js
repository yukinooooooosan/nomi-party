import { renderPromptGame } from "./shared.js";

const prompts = [
  "最近、少しだけドキッとした瞬間は？",
  "言われたら弱い褒め言葉は？",
  "今までで一番忘れにくい夜は？",
  "好きになる前に、つい見てしまうところは？",
  "今ここにいる誰かに、ひとつだけ質問するなら？",
];

export function renderGame(root, context) {
  renderPromptGame(root, {
    ...context,
    prompts,
    intro: "答えるか、パスして次の人に渡すだけ。無理なく距離を縮めるゲーム。",
  });
}
