import {
  assignPlayerColors,
  createPlayer,
  genderLabels,
  getPlayerTextColor,
  hasSavedRoster,
  loadSavedRoster,
  maximumPlayers,
  minimumPlayers,
  nextGender,
  normalizePlayers,
} from "../lib/players.js";

export function PlayerSetup({ onComplete, pendingGameId, players, setPlayers }) {
  const canAddPlayer = players.length < maximumPlayers;
  const canLoadSavedRoster = hasSavedRoster();

  function updatePlayer(playerId, patch) {
    setPlayers((current) => assignPlayerColors(current.map((player) => (
      player.id === playerId ? { ...player, ...patch } : player
    ))));
  }

  function addPlayer() {
    if (!canAddPlayer) return;
    setPlayers((current) => assignPlayerColors([...current, createPlayer(current.length)]));
  }

  function removePlayer(playerId) {
    setPlayers((current) => (
      current.length <= minimumPlayers
        ? current
        : assignPlayerColors(current.filter((player) => player.id !== playerId))
    ));
  }

  function startGame(event) {
    event.preventDefault();
    onComplete(normalizePlayers(players));
  }

  function loadPreviousRoster() {
    const savedPlayers = loadSavedRoster();
    if (!savedPlayers) return;
    setPlayers(savedPlayers);
  }

  return (
    <section className="setup-screen" aria-labelledby="setup-title">
      <div className="setup-hero">
        <p className="label">Tonight&apos;s Players</p>
        <h1 id="setup-title">今夜の顔ぶれ</h1>
        <p className="party-lead">
          名前はあとからでも大丈夫。一台を回す順番だけ、ここで軽く作ります。
        </p>
      </div>

      <form className="player-form" onSubmit={startGame}>
        <div className="player-list" aria-label="参加メンバー">
          {players.map((player, index) => (
            <div
              className="player-row"
              key={player.id}
              style={{
                "--player-color": player.color,
                "--player-text-color": getPlayerTextColor(player),
              }}
            >
              <span className="player-number">{String(index + 1).padStart(2, "0")}</span>
              <label className="player-name">
                <span>Member</span>
                <input
                  type="text"
                  value={player.name}
                  placeholder="名前を入力"
                  autoComplete="off"
                  onChange={(event) => updatePlayer(player.id, { name: event.target.value })}
                />
              </label>
              <button
                className="gender-button"
                type="button"
                aria-label="性別を切り替え"
                onClick={() => updatePlayer(player.id, { gender: nextGender(player.gender) })}
              >
                {genderLabels[player.gender] || genderLabels.male}
              </button>
              <button
                className="icon-button"
                type="button"
                aria-label="メンバーを削除"
                disabled={players.length <= minimumPlayers}
                onClick={() => removePlayer(player.id)}
              >
                −
              </button>
            </div>
          ))}
        </div>

        <button
          className="add-player-button"
          type="button"
          disabled={!canAddPlayer}
          onClick={addPlayer}
        >
          <span>＋</span>
          {canAddPlayer ? "メンバーを追加" : "12人まで"}
        </button>

        <button className="primary-button full-button" type="submit">
          {pendingGameId ? "このメンバーでゲームへ" : "このメンバーで始める"}
        </button>

        {canLoadSavedRoster && (
          <button
            className="secondary-button full-button"
            type="button"
            onClick={loadPreviousRoster}
          >
            前回のメンバーを読み込む
          </button>
        )}
      </form>
    </section>
  );
}
