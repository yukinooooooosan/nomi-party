import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../../components/GameShell.jsx";

const tileCount = 20;
const mosaicMaxLevel = 5;
const mosaicScales = {
  5: 0.006,
  4: 0.012,
  3: 0.021,
  2: 0.038,
  1: 0.08,
  0: 1,
};
const rouletteDurationMs = 1200;
const rouletteTickMs = 72;
const breakingDurationMs = 420;
const randomRollDurationMs = 900;
const randomRollTickMs = 48;
const mosaicScanDurationMs = 720;
const mosaicScanSwitchMs = 90;

export const maskRevealGame = {
  id: "mask-reveal",
  number: "01",
  title: "マスクを外した君を見たい",
  playStyle: "personal-phone",
  summary: "自分の画像を端末内だけで隠して、その場の結果で少しずつめくる。",
  players: "各自",
  minutes: "3分-",
  heat: 1,
  mood: "ローカル",
  component: MaskRevealGame,
};

function MaskRevealGame({ game, backToMenu }) {
  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const rouletteIntervalRef = useRef(null);
  const rouletteTimeoutRef = useRef(null);
  const breakingTimeoutRef = useRef(null);
  const randomRollIntervalRef = useRef(null);
  const randomRollTimeoutRef = useRef(null);
  const mosaicScanSwitchRef = useRef(null);
  const mosaicScanEndRef = useRef(null);
  const [phase, setPhase] = useState("setup");
  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState(null);
  const [orientationMode, setOrientationMode] = useState("portrait");
  const [mode, setMode] = useState("tile");
  const [brokenTiles, setBrokenTiles] = useState([]);
  const [mosaicLevel, setMosaicLevel] = useState(mosaicMaxLevel);
  const [randomValue, setRandomValue] = useState(null);
  const [noticeOpen, setNoticeOpen] = useState(false);
  const [rouletteTile, setRouletteTile] = useState(null);
  const [breakingTile, setBreakingTile] = useState(null);
  const [isRouletteRunning, setIsRouletteRunning] = useState(false);
  const [isRandomRolling, setIsRandomRolling] = useState(false);
  const [isMosaicScanning, setIsMosaicScanning] = useState(false);
  const [mosaicScanLabel, setMosaicScanLabel] = useState("RESOLUTION UP");

  const isLandscape = orientationMode === "landscape";
  const columns = isLandscape ? 5 : 4;
  const rows = isLandscape ? 4 : 5;
  const remainingTiles = tileCount - brokenTiles.length;
  const brokenTileSet = useMemo(() => new Set(brokenTiles), [brokenTiles]);

  useEffect(() => () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }, [imageUrl]);

  useEffect(() => () => {
    window.clearInterval(rouletteIntervalRef.current);
    window.clearTimeout(rouletteTimeoutRef.current);
    window.clearTimeout(breakingTimeoutRef.current);
    window.clearInterval(randomRollIntervalRef.current);
    window.clearTimeout(randomRollTimeoutRef.current);
    window.clearTimeout(mosaicScanSwitchRef.current);
    window.clearTimeout(mosaicScanEndRef.current);
  }, []);

  useEffect(() => {
    if (!imageUrl || mode !== "mosaic" || phase !== "play") return undefined;

    let isCancelled = false;
    const image = new Image();
    image.onload = () => {
      if (isCancelled) return;
      drawMosaic(canvasRef.current, image, orientationMode, mosaicLevel);
    };
    image.src = imageUrl;

    return () => {
      isCancelled = true;
    };
  }, [imageUrl, mode, mosaicLevel, orientationMode, phase]);

  function chooseImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const nextUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const nextOrientation = getInitialOrientation(image.naturalWidth, image.naturalHeight);

      if (imageUrl) URL.revokeObjectURL(imageUrl);
      setImageUrl(nextUrl);
      setImageSize({ width: image.naturalWidth, height: image.naturalHeight });
      setOrientationMode(nextOrientation);
      setPhase("setup");
      resetMaskState();
    };
    image.onerror = () => {
      URL.revokeObjectURL(nextUrl);
    };
    image.src = nextUrl;
  }

  function changeMode(nextMode) {
    setMode(nextMode);
    resetMaskState();
  }

  function breakTile(tileIndex) {
    if (brokenTileSet.has(tileIndex) || isRouletteRunning) return;
    revealTile(tileIndex);
  }

  function breakRandomTile() {
    const rest = Array.from({ length: tileCount }, (_, index) => index).filter(
      (index) => !brokenTileSet.has(index),
    );
    if (rest.length === 0 || isRouletteRunning) return;

    setIsRouletteRunning(true);
    setRouletteTile(rest[Math.floor(Math.random() * rest.length)]);
    window.clearInterval(rouletteIntervalRef.current);
    window.clearTimeout(rouletteTimeoutRef.current);

    rouletteIntervalRef.current = window.setInterval(() => {
      setRouletteTile(rest[Math.floor(Math.random() * rest.length)]);
    }, rouletteTickMs);

    rouletteTimeoutRef.current = window.setTimeout(() => {
      window.clearInterval(rouletteIntervalRef.current);
      const selectedTile = rest[Math.floor(Math.random() * rest.length)];
      setRouletteTile(selectedTile);
      setIsRouletteRunning(false);
      revealTile(selectedTile);
    }, rouletteDurationMs);
  }

  function undo() {
    if (mode === "tile") {
      setBrokenTiles((current) => current.slice(0, -1));
      return;
    }

    transitionMosaicLevel(Math.min(mosaicMaxLevel, mosaicLevel + 1), "RESOLUTION DOWN");
  }

  function revealMosaic() {
    transitionMosaicLevel(Math.max(0, mosaicLevel - 1), "RESOLUTION UP");
  }

  function resetMaskState() {
    window.clearInterval(rouletteIntervalRef.current);
    window.clearTimeout(rouletteTimeoutRef.current);
    window.clearTimeout(breakingTimeoutRef.current);
    window.clearInterval(randomRollIntervalRef.current);
    window.clearTimeout(randomRollTimeoutRef.current);
    window.clearTimeout(mosaicScanSwitchRef.current);
    window.clearTimeout(mosaicScanEndRef.current);
    setBrokenTiles([]);
    setBreakingTile(null);
    setRouletteTile(null);
    setIsRouletteRunning(false);
    setIsRandomRolling(false);
    setIsMosaicScanning(false);
    setMosaicLevel(mosaicMaxLevel);
    setRandomValue(null);
  }

  function rollRandom() {
    if (isRandomRolling) return;

    setIsRandomRolling(true);
    setRandomValue(Math.floor(Math.random() * 101));
    window.clearInterval(randomRollIntervalRef.current);
    window.clearTimeout(randomRollTimeoutRef.current);

    randomRollIntervalRef.current = window.setInterval(() => {
      setRandomValue(Math.floor(Math.random() * 101));
    }, randomRollTickMs);

    randomRollTimeoutRef.current = window.setTimeout(() => {
      window.clearInterval(randomRollIntervalRef.current);
      setRandomValue(Math.floor(Math.random() * 101));
      setIsRandomRolling(false);
    }, randomRollDurationMs);
  }

  function startPlay() {
    resetMaskState();
    setPhase("play");
  }

  function backToSetup() {
    resetMaskState();
    setPhase("setup");
  }

  function revealTile(tileIndex) {
    window.clearTimeout(breakingTimeoutRef.current);
    setBreakingTile(tileIndex);
    breakingTimeoutRef.current = window.setTimeout(() => {
      setBrokenTiles((current) => (
        current.includes(tileIndex) ? current : [...current, tileIndex]
      ));
      setBreakingTile(null);
      setRouletteTile(null);
    }, breakingDurationMs);
  }

  function transitionMosaicLevel(nextLevel, label) {
    if (isMosaicScanning || nextLevel === mosaicLevel) return;

    window.clearTimeout(mosaicScanSwitchRef.current);
    window.clearTimeout(mosaicScanEndRef.current);
    setMosaicScanLabel(label);
    setIsMosaicScanning(true);

    mosaicScanSwitchRef.current = window.setTimeout(() => {
      setMosaicLevel(nextLevel);
    }, mosaicScanSwitchMs);

    mosaicScanEndRef.current = window.setTimeout(() => {
      setIsMosaicScanning(false);
    }, mosaicScanDurationMs);
  }

  return (
    <GameShell
      game={game}
      headingClassName="mask-reveal-head"
      headingLabel="Personal Phone / ローカル完結"
      lead="画像はアップロードされず、この端末のブラウザ内だけで表示されます。"
      onBack={backToMenu}
      screenClassName="mask-reveal-screen"
    >
      <div className="mask-reveal-body">
        {!imageUrl && (
          <section className="mask-start-panel" aria-label="画像選択">
            <p className="mask-start-copy">
              秘密の一枚を選んで、マスク越しに少しずつ見せていきます。
            </p>
            <button
              className="primary-button full-button"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              画像を選ぶ
            </button>
            <input
              ref={fileInputRef}
              className="visually-hidden"
              type="file"
              accept="image/*"
              onChange={chooseImage}
            />
            <SafetyNotice isOpen={noticeOpen} onToggle={() => setNoticeOpen((current) => !current)} />
          </section>
        )}

        {imageUrl && phase === "setup" && (
          <>
            <section className="mask-setup-panel" aria-label="表示設定">
              <div>
                <p className="label">Image</p>
                <p>
                  {imageSize?.width} x {imageSize?.height}
                </p>
              </div>
              <button
                className="secondary-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                画像変更
              </button>
              <input
                ref={fileInputRef}
                className="visually-hidden"
                type="file"
                accept="image/*"
                onChange={chooseImage}
              />
            </section>

            <section
              className={`mask-stage mask-preview-stage is-${orientationMode}`}
              aria-label="選択した画像のプレビュー"
            >
              <img className="mask-image" src={imageUrl} alt="" />
            </section>

            <SegmentedControl
              label="マスク"
              options={[
                { id: "tile", label: "タイル破壊" },
                { id: "mosaic", label: "モザイク解除" },
              ]}
              value={mode}
              onChange={changeMode}
            />

            <button className="primary-button full-button" type="button" onClick={startPlay}>
              プレイ開始
            </button>

            <SafetyNotice isOpen={noticeOpen} onToggle={() => setNoticeOpen((current) => !current)} />
          </>
        )}

        {imageUrl && phase === "play" && (
          <>
            <div className="mask-play-header">
              <div>
                <p className="label">Playing</p>
                <p>{mode === "tile" ? "タイル破壊" : "モザイク解除"}</p>
              </div>
              <button className="ghost-button" type="button" onClick={backToSetup}>
                設定
              </button>
            </div>

            <section
              className={`mask-stage is-${orientationMode}`}
              aria-label="画像マスク表示"
              style={{ "--mask-columns": columns, "--mask-rows": rows }}
            >
              {mode === "tile" ? (
                <>
                  <img className="mask-image" src={imageUrl} alt="" />
                  <div className="tile-mask-grid">
                    {Array.from({ length: tileCount }, (_, index) => (
                      <button
                        className={[
                          "mask-tile",
                          brokenTileSet.has(index) ? "is-broken" : "",
                          rouletteTile === index ? "is-roulette-target" : "",
                          breakingTile === index ? "is-breaking" : "",
                        ].filter(Boolean).join(" ")}
                        key={index}
                        type="button"
                        disabled={brokenTileSet.has(index) || isRouletteRunning || breakingTile === index}
                        aria-label={`${index + 1}番のマスクを外す`}
                        onClick={() => breakTile(index)}
                      >
                        <span>SECRET</span>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <canvas className="mosaic-canvas" ref={canvasRef} />
                  {isMosaicScanning && (
                    <div className="mosaic-scan-overlay" aria-hidden="true">
                      <span>{mosaicScanLabel}</span>
                    </div>
                  )}
                </>
              )}
            </section>

            <div className="mask-status">
              <span>
                {mode === "tile"
                  ? `残り ${remainingTiles} / ${tileCount}`
                  : `モザイク Lv${mosaicLevel}`}
              </span>
              {randomValue !== null && (
                <strong className={isRandomRolling ? "is-rolling" : ""}>{randomValue}</strong>
              )}
            </div>

            <div className="mask-control-bar" aria-label="操作">
              {mode === "tile" ? (
                <>
                  <button className="primary-button" type="button" onClick={breakRandomTile}>
                    {isRouletteRunning ? "選択中" : "ランダム"}
                  </button>
                  <button className="secondary-button" type="button" onClick={undo}>
                    戻す
                  </button>
                </>
              ) : (
                <>
                  <button className="primary-button" type="button" onClick={revealMosaic}>
                    {isMosaicScanning ? "解析中" : "解除"}
                  </button>
                  <button className="secondary-button" type="button" onClick={undo}>
                    戻す
                  </button>
                </>
              )}
              <button className="secondary-button" type="button" onClick={resetMaskState}>
                リセット
              </button>
              <button className="secondary-button" type="button" onClick={rollRandom}>
                {isRandomRolling ? "ROLL" : "0-100"}
              </button>
            </div>

            <SafetyNotice isOpen={noticeOpen} onToggle={() => setNoticeOpen((current) => !current)} />
          </>
        )}
      </div>
    </GameShell>
  );
}

function SegmentedControl({ label, onChange, options, value }) {
  return (
    <section className="mask-segment" aria-label={label}>
      <p className="label">{label}</p>
      <div>
        {options.map((option) => (
          <button
            className={option.id === value ? "is-selected" : ""}
            key={option.id}
            type="button"
            aria-pressed={option.id === value}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function SafetyNotice({ isOpen, onToggle }) {
  return (
    <section className="safety-notice">
      <button className="ghost-button" type="button" onClick={onToggle}>
        注意事項
      </button>
      {isOpen && (
        <div className="safety-notice-body">
          <p>このアプリは画像をサーバーに送信しません。画像はあなたの端末内だけで表示されます。</p>
          <p>スクリーンショット、画面録画、周囲からの覗き見を技術的に防ぐことはできません。</p>
          <p>本人の同意がない画像、未成年の画像、他人を傷つける目的での使用は禁止です。</p>
        </div>
      )}
    </section>
  );
}

function getInitialOrientation(width, height) {
  if (width > height) return "landscape";
  return "portrait";
}

function drawMosaic(canvas, image, orientationMode, level) {
  if (!canvas) return;

  const width = orientationMode === "landscape" ? 1000 : 800;
  const height = orientationMode === "landscape" ? 800 : 1000;
  const context = canvas.getContext("2d");
  if (!context) return;

  canvas.width = width;
  canvas.height = height;
  context.clearRect(0, 0, width, height);

  const crop = getCoverCrop(image.naturalWidth, image.naturalHeight, width, height);
  const scale = mosaicScales[level] ?? 1;

  if (scale >= 1) {
    context.imageSmoothingEnabled = true;
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, width, height);
    return;
  }

  const tempCanvas = document.createElement("canvas");
  const tempContext = tempCanvas.getContext("2d");
  if (!tempContext) return;

  tempCanvas.width = Math.max(1, Math.round(width * scale));
  tempCanvas.height = Math.max(1, Math.round(height * scale));
  tempContext.imageSmoothingEnabled = true;
  tempContext.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    tempCanvas.width,
    tempCanvas.height,
  );

  context.imageSmoothingEnabled = false;
  context.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, width, height);
}

function getCoverCrop(sourceWidth, sourceHeight, targetWidth, targetHeight) {
  const sourceRatio = sourceWidth / sourceHeight;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    const width = sourceHeight * targetRatio;
    return {
      x: (sourceWidth - width) / 2,
      y: 0,
      width,
      height: sourceHeight,
    };
  }

  const height = sourceWidth / targetRatio;
  return {
    x: 0,
    y: (sourceHeight - height) / 2,
    width: sourceWidth,
    height,
  };
}
