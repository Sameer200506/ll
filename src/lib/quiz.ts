export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

/**
 * Resolve the correct option index for a quiz question.
 *
 * Older quiz documents stored `correct` as a string (`"0"`) instead of a
 * number, so always normalise before comparing it with a selected index.
 * A couple of legacy documents also used a different field name; support
 * those as a fallback rather than marking every answer wrong.
 */
export function getCorrectIndex(question: any): number {
  const options: any[] = Array.isArray(question?.options) ? question.options : [];

  const fromValue = (value: any): number => {
    if (typeof value === "number" && Number.isInteger(value)) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (/^\d+$/.test(trimmed)) return Number.parseInt(trimmed, 10);
      const byText = options.findIndex(
        (option) => String(option ?? "").trim() === trimmed
      );
      if (byText >= 0) return byText;
    }
    return -1;
  };

  const direct = fromValue(question?.correct);
  if (direct >= 0) return direct;

  for (const key of ["correctIndex", "correctAnswer", "answer", "correctOption"]) {
    const fallback = fromValue(question?.[key]);
    if (fallback >= 0) return fallback;
  }

  return -1;
}

export function normalizeQuestion(question: any): QuizQuestion {
  return {
    question: typeof question?.question === "string" ? question.question : "",
    options: Array.isArray(question?.options)
      ? question.options.map((option: any) => String(option ?? ""))
      : [],
    correct: getCorrectIndex(question),
  };
}

export function normalizeQuestions(questions: any): QuizQuestion[] {
  return Array.isArray(questions) ? questions.map(normalizeQuestion) : [];
}

/** Returns the index of the first question without a valid correct answer. */
export function findUnansweredQuestion(questions: QuizQuestion[]): number {
  return questions.findIndex(
    (question) =>
      !Number.isInteger(question.correct) ||
      question.correct < 0 ||
      question.correct >= question.options.length
  );
}
