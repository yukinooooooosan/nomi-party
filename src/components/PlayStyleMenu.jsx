import { playStyles } from "../games/registry.js";
import { navigateTo } from "../lib/routing.js";

const playStyleOptions = [
  {
    id: playStyles.passPhone,
    label: "Pass Phone",
    title: "1台で遊ぶ",
    copy: "メンバーを登録して、スマホを順番に回しながら遊ぶゲーム。",
    action: "メンバー登録へ",
    route: "setup",
  },
  {
    id: playStyles.personalPhone,
    label: "Personal Phone",
    title: "それぞれのスマホで遊ぶ",
    copy: "各自のスマホを小道具にして、その場の結果で進めるゲーム。",
    action: "ゲーム一覧へ",
    route: "personal-phone-menu",
  },
];

export function PlayStyleMenu() {
  return (
    <>
      <header className="party-hero">
        <svg
          className="hero-nightscape"
          viewBox="0 0 260 180"
          aria-hidden="true"
          focusable="false"
        >
          <path
            className="hero-moon-glow"
            d="M220 4a48 48 0 1 0 0 96 23 48 0 1 1 0-96Z"
          />
          <path
            className="hero-moon"
            d="M220 4a48 48 0 1 0 0 96 23 48 0 1 1 0-96Z"
          />
          <g className="hero-buildings">
            <rect x="12" y="96" width="38" height="84" />
            <rect x="58" y="70" width="48" height="110" />
            <rect x="118" y="100" width="42" height="80" />
            <rect x="172" y="82" width="54" height="98" />
          </g>
          <g className="hero-windows">
            <rect x="24" y="111" width="5" height="6" />
            <rect x="72" y="88" width="5" height="6" />
            <rect x="91" y="112" width="5" height="6" />
            <rect x="131" y="119" width="5" height="6" />
            <rect x="188" y="101" width="5" height="6" />
            <rect x="210" y="128" width="5" height="6" />
          </g>
        </svg>
        <p className="label">One Night Phone Party</p>
        <h1 id="party-title">深夜の遊び方</h1>
        <p className="party-lead">
          まずはスマホをどう使うかだけ選んでください。
        </p>
      </header>

      <section className="play-style-board" aria-labelledby="play-style-title">
        <div className="section-heading">
          <p className="label">Play Style</p>
          <h2 id="play-style-title">今夜の入口</h2>
        </div>

        <div className="play-style-menu">
          {playStyleOptions.map((option) => (
            <button
              className="play-style-row"
              key={option.id}
              type="button"
              onClick={() => navigateTo(option.route)}
            >
              <span className="play-style-label">{option.label}</span>
              <span className="play-style-main">
                <span className="play-style-title">{option.title}</span>
                <span className="play-style-copy">{option.copy}</span>
              </span>
              <span className="game-action">{option.action}</span>
            </button>
          ))}
        </div>
      </section>
    </>
  );
}
