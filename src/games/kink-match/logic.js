import { groupMixOptions } from "./questions.js";

export const answerValues = {
  left: -1,
  right: 1,
};

const groupWeightById = Object.fromEntries(
  groupMixOptions.map((option) => [option.id, option.weight]),
);

export function selectQuestions(questionGroups, groupMix, questionCount) {
  const activeGroups = questionGroups
    .map((group) => ({
      ...group,
      weight: groupWeightById[groupMix[group.id]] ?? 0,
    }))
    .filter((group) => group.weight > 0 && group.questions.length > 0);

  if (activeGroups.length === 0) {
    return [];
  }

  const quotas = allocateQuestionCounts(activeGroups, questionCount);
  const selected = [];

  activeGroups.forEach((group) => {
    const count = Math.min(quotas[group.id] || 0, group.questions.length);
    selected.push(...shuffleItems(group.questions).slice(0, count));
  });

  if (selected.length < questionCount) {
    const selectedIds = new Set(selected.map((question) => question.id));
    const leftovers = activeGroups.flatMap((group) => (
      group.questions.filter((question) => !selectedIds.has(question.id))
    ));
    selected.push(...shuffleItems(leftovers).slice(0, questionCount - selected.length));
  }

  return shuffleItems(selected).slice(0, questionCount);
}

export function allocateQuestionCounts(groups, questionCount) {
  const totalWeight = groups.reduce((sum, group) => sum + group.weight, 0);
  const rows = groups.map((group) => {
    const exact = (questionCount * group.weight) / totalWeight;
    return {
      id: group.id,
      count: Math.floor(exact),
      remainder: exact - Math.floor(exact),
    };
  });

  let assigned = rows.reduce((sum, row) => sum + row.count, 0);
  shuffleItems(rows)
    .sort((a, b) => b.remainder - a.remainder)
    .forEach((row) => {
      if (assigned >= questionCount) return;
      row.count += 1;
      assigned += 1;
    });

  return Object.fromEntries(rows.map((row) => [row.id, row.count]));
}

export function buildPairRankings(players, answers, questions, pairRule) {
  const pairs = [];

  for (let i = 0; i < players.length; i += 1) {
    for (let j = i + 1; j < players.length; j += 1) {
      const playerA = players[i];
      const playerB = players[j];

      if (!isPairAllowed(playerA, playerB, pairRule)) {
        continue;
      }

      const score = calculateCompatibility(
        playerA,
        playerB,
        answers[playerA.id],
        answers[playerB.id],
        questions,
        pairRule,
      );

      pairs.push({
        id: `${playerA.id}-${playerB.id}`,
        players: [playerA, playerB],
        score,
        percent: Math.round(score * 100),
      });
    }
  }

  return shuffleItems(pairs).sort((a, b) => b.score - a.score);
}

export function buildGreedyMatches(pairRankings, players) {
  const usedPlayerIds = new Set();
  const matches = [];

  pairRankings.forEach((pair) => {
    const [playerA, playerB] = pair.players;

    if (usedPlayerIds.has(playerA.id) || usedPlayerIds.has(playerB.id)) {
      return;
    }

    matches.push(pair);
    usedPlayerIds.add(playerA.id);
    usedPlayerIds.add(playerB.id);
  });

  return {
    matches,
    leftovers: players.filter((player) => !usedPlayerIds.has(player.id)),
  };
}

export function calculateCompatibility(playerA, playerB, answerA, answerB, questions, pairRule) {
  const vectorA = buildVector(answerA, questions);
  const vectorB = buildMatchVector(answerB, questions, playerA, playerB, pairRule);

  return cosineSimilarity(vectorA, vectorB);
}

export function buildVector(answer, questions) {
  return questions.map((question) => answer?.[question.id] ?? 0);
}

export function buildMatchVector(answer, questions, playerA, playerB, pairRule) {
  return questions.map((question) => {
    const value = answer?.[question.id] ?? 0;
    return shouldInvertForQuestion(question, playerA, playerB, pairRule) ? -value : value;
  });
}

export function isPairAllowed(playerA, playerB, pairRule) {
  if (pairRule === "opposite-only") {
    return playerA.gender !== playerB.gender;
  }

  return true;
}

export function shouldInvertForQuestion(question, playerA, playerB, pairRule) {
  if (question.type !== "reverse") return false;

  if (pairRule === "opposite-only") {
    return true;
  }

  return playerA.gender !== playerB.gender;
}

export function cosineSimilarity(vectorA, vectorB) {
  const dot = vectorA.reduce((sum, value, index) => sum + value * vectorB[index], 0);
  const normA = Math.sqrt(vectorA.reduce((sum, value) => sum + value ** 2, 0));
  const normB = Math.sqrt(vectorB.reduce((sum, value) => sum + value ** 2, 0));

  if (normA === 0 || normB === 0) return 0;

  return dot / (normA * normB);
}

export function getScoreComment(percent) {
  if (percent >= 80) return "かなり噛み合う";
  if (percent >= 40) return "いい感じに合う";
  if (percent > -40) return "まだ読めない";
  if (percent > -80) return "ちょっとズレてる";
  return "犬猿の仲";
}

export function shuffleItems(items) {
  return [...items].sort(() => Math.random() - 0.5);
}
