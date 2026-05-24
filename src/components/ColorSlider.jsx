import {
  Label,
  Slider,
  SliderOutput,
  SliderThumb,
  SliderTrack,
} from "react-aria-components";

export function ColorSlider({ className = "", label, onChange, thumbColor, track, value }) {
  return (
    <Slider
      aria-label={`${label} channel`}
      className={`color-slider rgb-slider ${className}`}
      maxValue={255}
      minValue={0}
      onChange={onChange}
      step={1}
      value={value}
      style={{ "--thumb-color": thumbColor, "--track": track }}
    >
      <Label className="rgb-slider-label">{label}</Label>
      <SliderTrack className="rgb-slider-track">
        <div className="rgb-slider-rail" />
        <SliderThumb className="rgb-slider-thumb">
          <span className="rgb-slider-thumb-dot" />
        </SliderThumb>
      </SliderTrack>
      <SliderOutput className="rgb-slider-value">{value}</SliderOutput>
    </Slider>
  );
}
