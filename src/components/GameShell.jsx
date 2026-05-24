export function GameShell({
  children,
  game,
  headingClassName = "",
  lead,
  onBack,
  screenClassName = "",
  showHeading = true,
}) {
  return (
    <section className={`game-screen ${screenClassName}`} aria-labelledby="active-game-title">
      <button className="ghost-button" type="button" onClick={onBack}>
        Menu
      </button>

      {showHeading && (
        <div className={`game-screen-head ${headingClassName}`}>
          <p className="label">{game.number} / {game.mood}</p>
          <h1 id="active-game-title">{game.title}</h1>
          {lead && <p>{lead}</p>}
        </div>
      )}

      {children}
    </section>
  );
}
