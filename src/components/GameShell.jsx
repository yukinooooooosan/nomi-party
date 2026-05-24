export function GameShell({
  children,
  game,
  headingClassName = "",
  headingLabel,
  headingTitle,
  lead,
  onBack,
  screenClassName = "",
  showHeading = true,
}) {
  const label = headingLabel === undefined ? `${game.number} / ${game.mood}` : headingLabel;
  const title = headingTitle ?? game.title;

  return (
    <section className={`game-screen ${screenClassName}`} aria-labelledby="active-game-title">
      <button className="ghost-button" type="button" onClick={onBack}>
        Menu
      </button>

      {showHeading && (
        <div className={`game-screen-head ${headingClassName}`}>
          {label && <p className="label">{label}</p>}
          <h1 id="active-game-title">{title}</h1>
          {lead && <p>{lead}</p>}
        </div>
      )}

      {children}
    </section>
  );
}
