import { useEffect, useMemo, useRef, useState } from "react";
import { GameShell } from "../../components/GameShell.jsx";
import { getPlayerColor, getPlayerTextColor } from "../../lib/playerColors.js";
import {
  buildMatchingResult,
  buildPairRankings,
  getScoreComment,
  selectQuestions,
} from "./logic.js";
import {
  defaultGroupMix,
  groupMixOptions,
  questionGroups,
} from "./questions.js";
import "./style.css";

const questionCountOptions = [5, 10, 20];
const pairRules = [
  { id: "allow-same", label: "同性コミ", summary: "同性ペアも異性ペアも候補にする" },
  { id: "opposite-only", label: "異性のみ", summary: "♂ × ♀ だけを候補にする" },
];
const matchingModes = [
  { id: "greedy-high", label: "高相性優先", summary: "高いペアから順に確定する" },
  { id: "optimal-high", label: "全体高相性", summary: "合計スコアが最大になるように組む" },
  { id: "greedy-low", label: "低相性優先", summary: "低いペアから順に確定する" },
  { id: "optimal-low", label: "全体低相性", summary: "合計スコアが最低になるように組む" },
];

export const kinkMatchGame = {
  id: "kink-match",
  number: "03",
  title: "性癖マッチング",
  playStyle: "pass-phone",
  summary: "2択の回答から、噛み合うペアを一覧で発表する診断ゲーム。",
  players: "2人-",
  minutes: "8分",
  heat: 2,
  mood: "診断",
  component: KinkMatchGame,
};

function KinkMatchGame({ game, backToMenu, players }) {
  const [phase, setPhase] = useState("settings");
  const [questionCount, setQuestionCount] = useState(10);
  const [pairRule, setPairRule] = useState("allow-same");
  const [matchingMode, setMatchingMode] = useState("greedy-high");
  const [groupMix, setGroupMix] = useState(defaultGroupMix);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [answers, setAnswers] = useState({});

  const currentPlayer = players[playerIndex];
  const showHeading = !["answer"].includes(phase);
  const canStart = Object.values(groupMix).some((mixId) => (
    groupMixOptions.find((option) => option.id === mixId)?.weight > 0
  ));
  const allAnswered = Object.keys(answers).length === players.length;
  const rankings = useMemo(() => (
    allAnswered
      ? buildPairRankings(players, answers, selectedQuestions, pairRule)
      : []
  ), [allAnswered, answers, pairRule, players, selectedQuestions]);
  const matchResult = useMemo(() => (
    allAnswered
      ? buildMatchingResult(rankings, players, matchingMode)
      : { matches: [], leftovers: [] }
  ), [allAnswered, matchingMode, players, rankings]);
  const matchingModeLabel = getMatchingMode(matchingMode).label;
  const nextAfterCurrent = players[playerIndex + 1] || null;

  function updateGroupMix(groupId, mixId) {
    setGroupMix((current) => ({ ...current, [groupId]: mixId }));
  }

  function startGame() {
    const questions = selectQuestions(questionGroups, groupMix, questionCount);
    setSelectedQuestions(questions);
    setPlayerIndex(0);
    setCurrentAnswers({});
    setAnswers({});
    setPhase("handoff");
  }

  function answerQuestion(questionId, value) {
    setCurrentAnswers((current) => ({ ...current, [questionId]: value }));
  }

  function submitAnswers() {
    if (!currentPlayer || Object.keys(currentAnswers).length < selectedQuestions.length) {
      return;
    }

    setAnswers((current) => ({
      ...current,
      [currentPlayer.id]: currentAnswers,
    }));
    setCurrentAnswers({});
    setPhase("answer-done");
  }

  function advanceAfterAnswer() {
    if (playerIndex + 1 < players.length) {
      setPlayerIndex((current) => current + 1);
      setPhase("handoff");
      return;
    }

    setPhase("results-ready");
  }

  function showResults() {
    setPhase("result");
  }

  function restartGame() {
    setPhase("settings");
    setPlayerIndex(0);
    setCurrentAnswers({});
    setAnswers({});
    setSelectedQuestions([]);
  }

  return (
    <GameShell
      game={game}
      headingClassName="kink-game-head"
      lead={showHeading ? "似てるだけじゃない。噛み合う相性を計算します。" : null}
      onBack={backToMenu}
      screenClassName="kink-game-screen"
      showHeading={showHeading}
    >
      {phase === "settings" && (
        <SettingsScreen
          canStart={canStart}
          groupMix={groupMix}
          onChangeGroupMix={updateGroupMix}
          onChangePairRule={setPairRule}
          onChangeQuestionCount={setQuestionCount}
          onStart={startGame}
          pairRule={pairRule}
          questionCount={questionCount}
        />
      )}

      {phase === "handoff" && currentPlayer && (
        <HandoffScreen
          actionLabel="回答する"
          eyebrow="次の回答者"
          onAction={() => setPhase("answer")}
          primary={getPlayerCallName(currentPlayer)}
          secondary="スマホを本人に渡してください。周りの人は画面を見ないでください。"
          player={currentPlayer}
        />
      )}

      {phase === "answer" && currentPlayer && (
        <AnswerScreen
          answers={currentAnswers}
          onAnswer={answerQuestion}
          onSubmit={submitAnswers}
          player={currentPlayer}
          questions={selectedQuestions}
        />
      )}

      {phase === "answer-done" && currentPlayer && (
        <HandoffScreen
          actionLabel="次へ"
          eyebrow="回答完了"
          onAction={advanceAfterAnswer}
          primary="保存しました"
          player={nextAfterCurrent}
          secondary={nextAfterCurrent
            ? `回答内容は隠しました。画面を伏せて${getPlayerCallName(nextAfterCurrent)}に渡してください。`
            : "回答内容は隠しました。ここからは全員で見てOKです。"}
        />
      )}

      {phase === "results-ready" && (
        <NoticeCard
          actionLabel="結果を見る"
          eyebrow="全員回答完了"
          onAction={showResults}
          title="ここからは全員で見てOK"
        >
          回答をもとに、{matchingModeLabel}でペアを確定して一覧で発表します。
        </NoticeCard>
      )}

      {phase === "result" && (
        <ResultListScreen
          currentMatchingMode={matchingMode}
          leftovers={matchResult.leftovers}
          matchingModeLabel={matchingModeLabel}
          matchingModes={matchingModes}
          matches={matchResult.matches}
          onChangeMatchingMode={setMatchingMode}
          onMenu={backToMenu}
          onRestart={restartGame}
        />
      )}
    </GameShell>
  );
}

function SettingsScreen({
  canStart,
  groupMix,
  onChangeGroupMix,
  onChangePairRule,
  onChangeQuestionCount,
  onStart,
  pairRule,
  questionCount,
}) {
  return (
    <section className="kink-panel">
      <p className="label">Settings</p>
      <h2>今夜の混ぜ具合</h2>

      <div className="kink-setting-group">
        <span>質問数</span>
        <div className="kink-segment">
          {questionCountOptions.map((count) => (
            <button
              className={questionCount === count ? "is-active" : ""}
              key={count}
              type="button"
              onClick={() => onChangeQuestionCount(count)}
            >
              {count}問
            </button>
          ))}
        </div>
      </div>

      <div className="kink-setting-group">
        <span>ペアルール</span>
        <div className="kink-rule-grid">
          {pairRules.map((rule) => (
            <button
              className={pairRule === rule.id ? "is-active" : ""}
              key={rule.id}
              type="button"
              onClick={() => onChangePairRule(rule.id)}
            >
              <strong>{rule.label}</strong>
              <small>{rule.summary}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="kink-group-list">
        {questionGroups.map((group) => (
          <div className="kink-group-row" key={group.id}>
            <div>
              <strong>{group.label}</strong>
              <small>{group.summary}</small>
            </div>
            <div className="kink-mix-buttons">
              {groupMixOptions.map((option) => (
                <button
                  className={groupMix[group.id] === option.id ? "is-active" : ""}
                  key={option.id}
                  type="button"
                  onClick={() => onChangeGroupMix(group.id, option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="primary-button full-button"
        disabled={!canStart}
        type="button"
        onClick={onStart}
      >
        回答を始める
      </button>
    </section>
  );
}

function AnswerScreen({ answers, onAnswer, onSubmit, player, questions }) {
  const answeredCount = Object.keys(answers).length;
  const canSubmit = answeredCount === questions.length;
  const questionRefs = useRef([]);
  const submitButtonRef = useRef(null);

  function answerAndAdvance(questionId, value, index) {
    onAnswer(questionId, value);

    window.setTimeout(() => {
      const nextElement = questionRefs.current[index + 1] || submitButtonRef.current;
      nextElement?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  }

  return (
    <section
      className="kink-answer-screen"
      style={{
        "--private-color": getPlayerColor(player),
        "--private-text-color": getPlayerTextColor(player),
      }}
    >
      <div className="private-turn-card">
        <p className="label">Private Answer</p>
        <h2>{getPlayerCallName(player)}の回答</h2>
        <p>{answeredCount} / {questions.length} 問回答済み。4つの中から必ず選んでください。</p>
      </div>

      <div className="kink-question-list">
        {questions.map((question, index) => (
          <div
            className="kink-question-card"
            key={question.id}
            ref={(element) => {
              questionRefs.current[index] = element;
            }}
          >
            <p className="label">Q{index + 1} / {questions.length}</p>
            <h3>{question.prompt}</h3>
            <div className="kink-choice-row">
              {question.choices.map((choice) => (
                <ChoiceButton
                  active={answers[question.id] === choice.value}
                  key={choice.id}
                  label={choice.label}
                  onClick={() => answerAndAdvance(question.id, choice.value, index)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="primary-button full-button player-action-button"
        disabled={!canSubmit}
        ref={submitButtonRef}
        type="button"
        onClick={onSubmit}
      >
        確定して隠す
      </button>
    </section>
  );
}

function ChoiceButton({ active, label, onClick }) {
  return (
    <button
      className={active ? "kink-choice is-active" : "kink-choice"}
      type="button"
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function ResultListScreen({
  currentMatchingMode,
  leftovers,
  matches,
  matchingModeLabel,
  matchingModes,
  onChangeMatchingMode,
  onMenu,
  onRestart,
}) {
  const [isIntro, setIsIntro] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const scrollRef = useRef(null);
  const introTimeoutRef = useRef(null);

  useEffect(() => {
    replayIntro();
    return () => window.clearTimeout(introTimeoutRef.current);
  }, [currentMatchingMode]);

  function replayIntro() {
    window.clearTimeout(introTimeoutRef.current);
    scrollRef.current?.scrollTo({ top: 0 });
    setIsIntro(true);
    setAnimationKey((current) => current + 1);
    introTimeoutRef.current = window.setTimeout(() => setIsIntro(false), 2000);
  }

  function selectMatchingMode(modeId) {
    if (modeId === currentMatchingMode) {
      replayIntro();
      return;
    }

    onChangeMatchingMode(modeId);
  }

  return (
    <section className="kink-panel kink-result-panel">
      <p className="label">Result</p>
      <h2>結果一覧</h2>
      <p>{matchingModeLabel}で{matches.length}組のペアを発表します。</p>

      <div className="kink-result-mode-switch" aria-label="マッチングルールを選択">
        {matchingModes.map((mode) => (
          <button
            className={currentMatchingMode === mode.id ? "is-active" : ""}
            key={mode.id}
            type="button"
            onClick={() => selectMatchingMode(mode.id)}
          >
            <strong>{mode.label}</strong>
            <small>{mode.summary}</small>
          </button>
        ))}
      </div>

      <div className="kink-result-scroll" ref={scrollRef} tabIndex="0">
        <div
          className={`kink-result-list ${isIntro ? "is-intro" : ""}`}
          key={animationKey}
        >
          {matches.length === 0 && (
            <div className="kink-result-row">
              <p className="label">No Match</p>
              <h3>今回はペアが成立しませんでした</h3>
            </div>
          )}

          {matches.map((match, index) => (
            <ResultRow index={index} key={match.id} match={match} />
          ))}

          {leftovers.length > 0 && (
            <div className="kink-leftovers">
              <span>今回は残念ですが...</span>
              {leftovers.map((player) => (
                <strong key={player.id}>{getPlayerCallName(player)}</strong>
              ))}
            </div>
          )}
        </div>
      </div>

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

function ResultRow({ index, match }) {
  const [playerA, playerB] = match.players;

  return (
    <article className="kink-result-row">
      <p className="label">Match {index + 1}</p>
      <h3>{playerA.name} × {playerB.name}</h3>
      <div className="kink-score compact-score">
        <strong>{formatPercent(match.percent)}</strong>
        <span>{getScoreComment(match.percent)}</span>
      </div>
    </article>
  );
}

function HandoffScreen({ actionLabel, eyebrow, onAction, player, primary, secondary }) {
  return (
    <section
      className={`handoff-card kink-card ${player ? "player-handoff-card" : ""}`}
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
    <section className="kink-panel">
      <p className="label">{eyebrow}</p>
      <h2>{title}</h2>
      <p>{children}</p>
      <button className="primary-button full-button" type="button" onClick={onAction}>
        {actionLabel}
      </button>
    </section>
  );
}

function getPlayerCallName(player) {
  const suffix = player.gender === "female" ? "ちゃん" : "くん";
  return `${player.name}${suffix}`;
}

function getMatchingMode(modeId) {
  return matchingModes.find((mode) => mode.id === modeId) || matchingModes[0];
}

function formatPercent(percent) {
  return `${percent > 0 ? "+" : ""}${percent}%`;
}
