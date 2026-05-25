import { useMemo, useState } from "react";
import { GameShell } from "../../components/GameShell.jsx";
import { getPlayerColor, getPlayerTextColor } from "../../lib/playerColors.js";

export const desireMatchGame = {
  id: "desire-match",
  number: "02",
  title: "欲望ガチャ",
  summary: "匿名の欲望に、応じてもいい人だけが乗る二重抽選ゲーム。",
  players: "2人-",
  minutes: "8分",
  heat: 3,
  mood: "匿名",
  component: DesireMatchGame,
};

function DesireMatchGame({ game, backToMenu, players }) {
  const males = useMemo(() => players.filter((player) => player.gender === "male"), [players]);
  const females = useMemo(() => players.filter((player) => player.gender === "female"), [players]);
  const [phase, setPhase] = useState("start");
  const [maleIndex, setMaleIndex] = useState(0);
  const [femaleIndex, setFemaleIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [requests, setRequests] = useState([]);
  const [displayRequestIds, setDisplayRequestIds] = useState([]);
  const [votes, setVotes] = useState({});
  const [selectedRequestIds, setSelectedRequestIds] = useState([]);
  const [matchedFemaleIds, setMatchedFemaleIds] = useState([]);
  const [activeRequest, setActiveRequest] = useState(null);
  const [activeMatch, setActiveMatch] = useState(null);

  const currentMale = males[maleIndex];
  const currentFemale = females[femaleIndex];
  const displayRequests = getDisplayRequests(requests, displayRequestIds);
  const undrawnRequests = displayRequests.filter((request) => !request.drawn);
  const hasEnoughPlayers = males.length > 0 && females.length > 0;
  const showHeading = !["male-input", "female-vote"].includes(phase);
  const toneClass = getDesireToneClass(phase, maleIndex, males);
  const nextAfterMale = maleIndex + 1 < males.length
    ? males[maleIndex + 1]
    : females[0];
  const nextAfterFemale = femaleIndex + 1 < females.length
    ? females[femaleIndex + 1]
    : null;

  function submitRequest() {
    const text = draft.trim();
    if (!text || !currentMale) return;

    setRequests((current) => [
      ...current,
      {
        id: `request-${Date.now()}-${currentMale.id}`,
        authorPlayerId: currentMale.id,
        drawn: false,
        text,
      },
    ]);
    setDraft("");
    setPhase("male-done");
  }

  function advanceAfterMale() {
    if (maleIndex + 1 < males.length) {
      setMaleIndex((current) => current + 1);
      setPhase("male-handoff");
      return;
    }

    setDisplayRequestIds(shuffleItems(requests.map((request) => request.id)));
    setPhase("female-handoff");
  }

  function toggleVote(requestId) {
    setSelectedRequestIds((current) => (
      current.includes(requestId)
        ? current.filter((id) => id !== requestId)
        : [...current, requestId]
    ));
  }

  function submitVotes() {
    if (!currentFemale) return;

    setVotes((current) => {
      const nextVotes = { ...current };
      selectedRequestIds.forEach((requestId) => {
        nextVotes[requestId] = [
          ...(nextVotes[requestId] || []),
          currentFemale.id,
        ];
      });
      return nextVotes;
    });
    setSelectedRequestIds([]);
    setPhase("female-done");
  }

  function advanceAfterFemale() {
    if (femaleIndex + 1 < females.length) {
      setFemaleIndex((current) => current + 1);
      setPhase("female-handoff");
      return;
    }

    setPhase("draw-ready");
  }

  function drawRequest() {
    if (undrawnRequests.length === 0) return;

    const request = pickRandom(undrawnRequests);
    setActiveRequest(request);
    setActiveMatch(null);
    setRequests((current) => current.map((item) => (
      item.id === request.id ? { ...item, drawn: true } : item
    )));
    setPhase("request-reveal");
  }

  function drawWoman() {
    if (!activeRequest) return;

    const candidateIds = (votes[activeRequest.id] || []).filter((femaleId) => (
      !matchedFemaleIds.includes(femaleId)
    ));
    const femaleId = candidateIds.length > 0 ? pickRandom(candidateIds) : null;
    const match = {
      femalePlayerId: femaleId,
      malePlayerId: activeRequest.authorPlayerId,
      requestId: activeRequest.id,
      status: femaleId ? "matched" : "unmatched",
    };

    setActiveMatch(match);
    if (femaleId) {
      setMatchedFemaleIds((current) => [...current, femaleId]);
    }
    setPhase("result");
  }

  function advanceAfterResult() {
    setActiveRequest(null);
    setActiveMatch(null);
    if (requests.some((request) => !request.drawn)) {
      setPhase("draw-request");
      return;
    }

    setPhase("finished");
  }

  function restartGame() {
    setPhase("start");
    setMaleIndex(0);
    setFemaleIndex(0);
    setDraft("");
    setRequests([]);
    setDisplayRequestIds([]);
    setVotes({});
    setSelectedRequestIds([]);
    setMatchedFemaleIds([]);
    setActiveRequest(null);
    setActiveMatch(null);
  }

  return (
    <GameShell
      game={game}
      headingClassName="desire-game-head"
      lead={showHeading ? "内容の同意が先、人間のマッチングが後。" : null}
      onBack={backToMenu}
      screenClassName={`desire-game-screen ${toneClass}`}
      showHeading={showHeading}
    >
      {!hasEnoughPlayers && (
        <NoticeCard
          actionLabel="メンバー設定に戻る"
          eyebrow="人数不足"
          onAction={backToMenu}
          title="♂と♀がそれぞれ1人以上必要です"
        >
          プレイヤー設定で、男性側と女性側の参加者を作ってから始めてください。
        </NoticeCard>
      )}

      {hasEnoughPlayers && phase === "start" && (
        <NoticeCard
          actionLabel="男性入力を始める"
          eyebrow="Rule"
          onAction={() => setPhase("male-handoff")}
          title="欲望は匿名。OKだけが抽選対象。"
        >
          男性は1人1つ欲望を書き、女性は応じてもいい欲望だけを選びます。
          結果後でもパスOKです。
        </NoticeCard>
      )}

      {hasEnoughPlayers && phase === "male-handoff" && currentMale && (
        <HandoffScreen
          actionLabel="欲望を入力する"
          eyebrow="次の入力者"
          onAction={() => setPhase("male-input")}
          primary={getPlayerCallName(currentMale)}
          player={currentMale}
          secondary="スマホを本人に渡してください。周りの人は画面を見ないでください。"
        />
      )}

      {hasEnoughPlayers && phase === "male-input" && currentMale && (
        <PrivateInputScreen
          draft={draft}
          onChange={setDraft}
          onSubmit={submitRequest}
          player={currentMale}
        />
      )}

      {hasEnoughPlayers && phase === "male-done" && (
        <HandoffScreen
          actionLabel="次へ"
          eyebrow="入力完了"
          onAction={advanceAfterMale}
          primary="保存しました"
          player={nextAfterMale}
          secondary={nextAfterMale
            ? `入力内容は隠しました。画面を伏せて${getPlayerCallName(nextAfterMale)}に渡してください。`
            : "入力内容は隠しました。"}
        />
      )}

      {hasEnoughPlayers && phase === "female-handoff" && currentFemale && (
        <HandoffScreen
          actionLabel="投票する"
          eyebrow="次の投票者"
          onAction={() => setPhase("female-vote")}
          primary={getPlayerCallName(currentFemale)}
          player={currentFemale}
          secondary="スマホを本人に渡してください。投票内容は本人だけが見てください。"
        />
      )}

      {hasEnoughPlayers && phase === "female-vote" && currentFemale && (
        <VoteScreen
          player={currentFemale}
          requests={displayRequests}
          selectedRequestIds={selectedRequestIds}
          onSubmit={submitVotes}
          onToggle={toggleVote}
        />
      )}

      {hasEnoughPlayers && phase === "female-done" && (
        <HandoffScreen
          actionLabel="次へ"
          eyebrow="投票完了"
          onAction={advanceAfterFemale}
          primary="チェック内容を保存しました"
          player={nextAfterFemale}
          secondary={nextAfterFemale
            ? `チェックは画面から消えました。画面を伏せて${getPlayerCallName(nextAfterFemale)}に渡してください。`
            : "チェックは画面から消えました。ここからは全員で見てOKです。"}
        />
      )}

      {hasEnoughPlayers && phase === "draw-ready" && (
        <NoticeCard
          actionLabel="抽選へ進む"
          eyebrow="全員完了"
          onAction={() => setPhase("draw-request")}
          title="ここからは全員で見てOK"
        >
          まず実施する欲望を抽選し、次に応じてくれる女性を一発発表します。
        </NoticeCard>
      )}

      {hasEnoughPlayers && phase === "draw-request" && (
        <DrawRequestScreen
          requests={undrawnRequests}
          onDraw={drawRequest}
        />
      )}

      {hasEnoughPlayers && phase === "request-reveal" && activeRequest && (
        <RequestRevealScreen
          request={activeRequest}
          onDraw={drawWoman}
        />
      )}

      {hasEnoughPlayers && phase === "result" && activeRequest && activeMatch && (
        <MatchResultScreen
          female={females.find((player) => player.id === activeMatch.femalePlayerId)}
          male={males.find((player) => player.id === activeMatch.malePlayerId)}
          onNext={advanceAfterResult}
          request={activeRequest}
        />
      )}

      {hasEnoughPlayers && phase === "finished" && (
        <FinishScreen
          matchedCount={matchedFemaleIds.length}
          onMenu={backToMenu}
          onRestart={restartGame}
          totalCount={requests.length}
        />
      )}
    </GameShell>
  );
}

function HandoffScreen({ actionLabel, eyebrow, onAction, player, primary, secondary }) {
  return (
    <section
      className={`handoff-card desire-card ${player ? "player-handoff-card" : ""}`}
      style={player ? {
        "--handoff-color": getPlayerColor(player),
        "--handoff-text-color": getPlayerTextColor(player),
      } : undefined}
    >
      <p className="label">{eyebrow}</p>
      <p className="handoff-name">{primary}</p>
      <p className="handoff-copy">{secondary}</p>
      <button className="primary-button full-button" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </section>
  );
}

function NoticeCard({ actionLabel, children, eyebrow, onAction, title }) {
  return (
    <section className="desire-panel">
      <p className="label">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{children}</p>
      <button className="primary-button full-button" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </section>
  );
}

function PrivateInputScreen({ draft, onChange, onSubmit, player }) {
  const canSubmit = draft.trim().length > 0;
  const playerStyle = {
    "--private-color": getPlayerColor(player),
    "--private-text-color": getPlayerTextColor(player),
  };

  return (
    <section className="desire-private-screen" style={playerStyle}>
      <div className="private-turn-card">
        <p className="label">Private Turn</p>
        <h2>{getPlayerCallName(player)}の欲望</h2>
        <p>相手が断れる内容だけを書いてください。入力後はすぐ隠れます。</p>
      </div>

      <label className="desire-input-block">
        <span>欲望をひとつ</span>
        <textarea
          autoFocus
          maxLength={80}
          onChange={(event) => onChange(event.target.value)}
          placeholder="例: 10秒だけ褒めてほしい"
          value={draft}
        />
      </label>

      <div className="game-controls single-control">
        <button
          className="primary-button player-action-button"
          disabled={!canSubmit}
          type="button"
          onClick={onSubmit}
        >
          確定して隠す
        </button>
      </div>
    </section>
  );
}

function VoteScreen({ onSubmit, onToggle, player, requests, selectedRequestIds }) {
  const playerStyle = {
    "--private-color": getPlayerColor(player),
    "--private-text-color": getPlayerTextColor(player),
  };

  return (
    <section className="desire-private-screen" style={playerStyle}>
      <div className="private-turn-card">
        <p className="label">Private Vote</p>
        <h2>{getPlayerCallName(player)}の投票</h2>
        <p>少しでも迷うものは選ばなくてOK。誰が何に投票したかは表示されません。</p>
      </div>

      <div className="desire-vote-list">
        {requests.map((request, index) => {
          const checked = selectedRequestIds.includes(request.id);

          return (
            <label className="desire-vote-row" key={request.id}>
              <input
                checked={checked}
                onChange={() => onToggle(request.id)}
                type="checkbox"
              />
              <span className="desire-request-number">{index + 1}</span>
              <span>{request.text}</span>
            </label>
          );
        })}
      </div>

      <div className="game-controls single-control">
        <button className="primary-button player-action-button" type="button" onClick={onSubmit}>
          確定して隠す
        </button>
      </div>
    </section>
  );
}

function DrawRequestScreen({ onDraw, requests }) {
  return (
    <section className="desire-panel">
      <p className="label">欲望抽選</p>
      <h2>実施する欲望を抽選します</h2>
      <div className="desire-request-list" aria-label="未抽選の欲望">
        {requests.map((request, index) => (
          <div className="desire-request-card" key={request.id}>
            <span className="desire-request-number">{index + 1}</span>
            <p>{request.text}</p>
          </div>
        ))}
      </div>
      <button className="primary-button full-button" type="button" onClick={onDraw}>
        実施する欲望を抽選
      </button>
    </section>
  );
}

function RequestRevealScreen({ onDraw, request }) {
  return (
    <section className="desire-panel desire-reveal-panel">
      <div className="desire-reveal-main">
        <p className="label">欲望発表</p>
        <blockquote>{request.text}</blockquote>
      </div>
      <div className="desire-reveal-actions">
        <p>この欲望に応じてくれる女性を、候補リストを見せずに一発発表します。</p>
        <button className="primary-button full-button" type="button" onClick={onDraw}>
          応じてくれる女性を抽選
        </button>
      </div>
    </section>
  );
}

function MatchResultScreen({ female, male, onNext, request }) {
  const [revealedFemale, setRevealedFemale] = useState(false);
  const [revealedOwner, setRevealedOwner] = useState(false);

  return (
    <section className="desire-panel desire-result-panel">
      <p className="label">Result</p>
      <div className="desire-result-step">
        <span>欲望発表</span>
        <blockquote>{request.text}</blockquote>
      </div>
      <div
        className={`desire-result-step desire-player-step desire-female-step ${revealedFemale ? "" : "desire-result-step-hidden"}`}
        style={revealedFemale && female ? {
          "--desire-result-color": getPlayerColor(female),
          "--desire-result-text-color": getPlayerTextColor(female),
        } : undefined}
      >
        <span>これに応じてくれる女性</span>
        <strong>{revealedFemale ? (female ? getPlayerCallName(female) : "今回はいません") : "???"}</strong>
      </div>
      <div
        className={`desire-result-step desire-player-step desire-owner-step ${revealedOwner ? "" : "desire-result-step-hidden"}`}
        style={revealedOwner && male ? {
          "--desire-result-color": getPlayerColor(male),
          "--desire-result-text-color": getPlayerTextColor(male),
        } : undefined}
      >
        <span>欲望主</span>
        <strong>{revealedOwner ? (male ? getPlayerCallName(male) : "不明") : "???"}</strong>
      </div>
      <p className="desire-pass-copy">成立後でもパスOK。無理強いはなしです。</p>
      {!revealedFemale ? (
        <button
          className="primary-button full-button"
          type="button"
          onClick={() => setRevealedFemale(true)}
        >
          応じてくれる女性を発表
        </button>
      ) : revealedOwner ? (
        <button className="primary-button full-button" type="button" onClick={onNext}>
          次の抽選へ
        </button>
      ) : (
        <button
          className="primary-button full-button"
          type="button"
          onClick={() => setRevealedOwner(true)}
        >
          欲望主を発表
        </button>
      )}
    </section>
  );
}

function FinishScreen({ matchedCount, onMenu, onRestart, totalCount }) {
  return (
    <section className="desire-panel">
      <p className="label">Finish</p>
      <h2>全ての欲望を抽選しました</h2>
      <p>
        {totalCount}件中、{matchedCount}件が成立しました。
        もう一度遊ぶ場合は、入力と投票からやり直します。
      </p>
      <div className="game-controls">
        <button className="primary-button" type="button" onClick={onRestart}>
          もう一回
        </button>
        <button className="secondary-button" type="button" onClick={onMenu}>
          Menu
        </button>
      </div>
    </section>
  );
}

function getPlayerCallName(player) {
  const suffix = player.gender === "female" ? "ちゃん" : "くん";
  return `${player.name}${suffix}`;
}

function getDisplayRequests(requests, displayRequestIds) {
  if (displayRequestIds.length === 0) return requests;

  const requestById = new Map(requests.map((request) => [request.id, request]));
  return displayRequestIds
    .map((id) => requestById.get(id))
    .filter(Boolean);
}

function getDesireToneClass(phase, maleIndex, males) {
  if (phase === "male-done" && maleIndex + 1 >= males.length) {
    return "desire-tone-bridge";
  }

  if (phase.startsWith("male")) {
    return "desire-tone-male";
  }

  if (phase.startsWith("female")) {
    return "desire-tone-female";
  }

  return "";
}

function pickRandom(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffleItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}
