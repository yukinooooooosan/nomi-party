import { useMemo, useState } from "react";
import { GameShell } from "../../components/GameShell.jsx";
import { getPlayerColor, getPlayerTextColor } from "../../lib/playerColors.js";
import {
  answerValues,
  buildGreedyMatches,
  buildPairRankings,
  getScoreComment,
  selectQuestions,
} from "./logic.js";
import {
  defaultGroupMix,
  groupMixOptions,
  questionGroups,
} from "./questions.js";

const questionCountOptions = [10, 20];
const pairRules = [
  { id: "allow-same", label: "同性コミ", summary: "同性ペアも異性ペアも候補にする" },
  { id: "opposite-only", label: "異性のみ", summary: "♂ × ♀ だけを候補にする" },
];

export const kinkMatchGame = {
  id: "kink-match",
  number: "03",
  title: "性癖マッチ",
  summary: "2択の回答から、噛み合うペアを1組ずつ発表する診断ゲーム。",
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
  const [groupMix, setGroupMix] = useState(defaultGroupMix);
  const [selectedQuestions, setSelectedQuestions] = useState([]);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [answers, setAnswers] = useState({});
  const [resultIndex, setResultIndex] = useState(0);

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
    allAnswered ? buildGreedyMatches(rankings, players) : { matches: [], leftovers: [] }
  ), [allAnswered, players, rankings]);
  const currentMatch = matchResult.matches[resultIndex];
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
    setResultIndex(0);
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
    setResultIndex(0);
    setPhase(matchResult.matches.length > 0 ? "result" : "leftovers");
  }

  function advanceResult() {
    if (resultIndex + 1 < matchResult.matches.length) {
      setResultIndex((current) => current + 1);
      return;
    }

    setPhase("leftovers");
  }

  function restartGame() {
    setPhase("settings");
    setPlayerIndex(0);
    setCurrentAnswers({});
    setAnswers({});
    setSelectedQuestions([]);
    setResultIndex(0);
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
          回答をもとに、上位からペアを確定して1組ずつ発表します。
        </NoticeCard>
      )}

      {phase === "result" && currentMatch && (
        <ResultScreen
          index={resultIndex}
          match={currentMatch}
          onNext={advanceResult}
          total={matchResult.matches.length}
        />
      )}

      {phase === "leftovers" && (
        <LeftoverScreen
          leftovers={matchResult.leftovers}
          matchedCount={matchResult.matches.length}
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
        <p>{answeredCount} / {questions.length} 問回答済み。どちらかを必ず選んでください。</p>
      </div>

      <div className="kink-question-list">
        {questions.map((question, index) => (
          <div className="kink-question-card" key={question.id}>
            <p className="label">Q{index + 1} / {questions.length}</p>
            <h3>{question.prompt}</h3>
            <div className="kink-choice-row">
              <ChoiceButton
                active={answers[question.id] === answerValues.left}
                label={question.left}
                onClick={() => onAnswer(question.id, answerValues.left)}
              />
              <ChoiceButton
                active={answers[question.id] === answerValues.right}
                label={question.right}
                onClick={() => onAnswer(question.id, answerValues.right)}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        className="primary-button full-button"
        disabled={!canSubmit}
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

function ResultScreen({ index, match, onNext, total }) {
  const [playerA, playerB] = match.players;
  const isLast = index + 1 >= total;

  return (
    <section className="kink-panel kink-result-panel">
      <p className="label">Match {index + 1} / {total}</p>
      <h2>{playerA.name} × {playerB.name}</h2>
      <div className="kink-score">
        <strong>{formatPercent(match.percent)}</strong>
        <span>{getScoreComment(match.percent)}</span>
      </div>
      <p>
        上位からペアを確定し、使われた人を抜いています。
        この2人は今回の回答ではこのスコアでした。
      </p>
      <button className="primary-button full-button" type="button" onClick={onNext}>
        {isLast ? "余りを見る" : "次のペアを見る"}
      </button>
    </section>
  );
}

function LeftoverScreen({ leftovers, matchedCount, onMenu, onRestart }) {
  return (
    <section className="kink-panel">
      <p className="label">Finish</p>
      <h2>結果発表おしまい</h2>
      <p>{matchedCount}組のペアを発表しました。</p>

      {leftovers.length > 0 && (
        <div className="kink-leftovers">
          <span>今回は残念ですが...</span>
          {leftovers.map((player) => (
            <strong key={player.id}>{getPlayerCallName(player)}</strong>
          ))}
        </div>
      )}

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

function HandoffScreen({ actionLabel, eyebrow, onAction, player, primary, secondary }) {
  return (
    <section
      className="handoff-card kink-card"
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

function formatPercent(percent) {
  return `${percent > 0 ? "+" : ""}${percent}%`;
}
