import Question from "../../models/Questions.js";

// Shuffle helper
function shuffleArray(array) {
  return array
    .map((item) => ({ item, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ item }) => item);
}

export async function getFormattedQuestions(room, count = 3) {
  const dbQuestions = await Question.find({
    curriculum: room.curriculum,
    subject: room.subject,
    level: room.level,
  });

  if (!dbQuestions || dbQuestions.length === 0) {
    throw new Error("No questions available for this room.");
  }

  const formatted = dbQuestions.map((q) => ({
    prompt: q.question,
    options: shuffleArray(q.options),
    answer: q.answer,
    type: q.type,
    topic: q.topic,
  }));

  return shuffleArray(formatted).slice(0, count);
}
