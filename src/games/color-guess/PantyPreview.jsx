import pantyImage from "../../assets/pan2.png";
import pantyMask from "../../assets/pan2-mask.png";
import pantySkinImage from "../../assets/pan2skin.png";

export function PantyPreview({ background, color, hearts, onToggleVariant, variant }) {
  const image = variant === "skin" ? pantySkinImage : pantyImage;

  return (
    <button
      className="color-preview panty-preview"
      aria-label="選んだ色"
      onClick={onToggleVariant}
      type="button"
      style={{
        "--panty-bg-base": background.base,
        "--panty-bg-deep": background.deep,
        "--panty-bg-glow": background.glow,
        "--panty-color": color,
      }}
    >
      <div className="panty-image-frame">
        <div
          className="panty-color-fill"
          aria-hidden="true"
          style={{ "--panty-mask": `url(${pantyMask})` }}
        />
        <img className="panty-image" src={image} alt="" aria-hidden="true" />
        <div className="floating-hearts" aria-hidden="true">
          {hearts.map((heart) => (
            <span
              className="floating-heart"
              key={heart.id}
              style={{
                "--heart-drift": heart.drift,
                "--heart-left": heart.left,
                "--heart-rotate": heart.rotate,
                "--heart-scale": heart.scale,
              }}
            >
              🩷
            </span>
          ))}
        </div>
      </div>
    </button>
  );
}
