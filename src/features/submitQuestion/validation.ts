import { SubmittedQuestionType } from "~/db/entities/submittedQuestion";

// Discord limits we have to respect downstream:
//   - embed title: 256
//   - button label: 80
//   - button customId: 100 (our existing code uses the answer text as customId)
// We validate against the strictest applicable cap.
const QUESTION_MAX = 256;
const ANSWER_MAX = 80;

export type ValidationResult =
  | { ok: true; question: string; correctAnswer: string; incorrectAnswers: string[] }
  | { ok: false; error: string };

const trim = (s: string) => s.trim();

const lengthError = (field: string, max: number) =>
  `${field} must be 1–${max} characters.`;

export const validateSubmission = (
  type: SubmittedQuestionType,
  rawQuestion: string,
  rawCorrect: string,
  rawIncorrects: string[]
): ValidationResult => {
  const question = trim(rawQuestion);
  if (!question || question.length > QUESTION_MAX) {
    return { ok: false, error: lengthError("Question", QUESTION_MAX) };
  }

  const correctAnswer = trim(rawCorrect);
  if (!correctAnswer || correctAnswer.length > ANSWER_MAX) {
    return { ok: false, error: lengthError("Correct answer", ANSWER_MAX) };
  }

  if (type === "tf") {
    const normalized = correctAnswer.toLowerCase();
    if (normalized !== "true" && normalized !== "false") {
      return {
        ok: false,
        error:
          'For true/false questions, the correct answer must be "True" or "False".'
      };
    }
    const canonical = normalized === "true" ? "True" : "False";
    const opposite = canonical === "True" ? "False" : "True";
    return {
      ok: true,
      question,
      correctAnswer: canonical,
      incorrectAnswers: [opposite]
    };
  }

  const incorrectAnswers = rawIncorrects.map(trim);
  if (incorrectAnswers.length !== 3 || incorrectAnswers.some((a) => !a)) {
    return {
      ok: false,
      error: "Multiple-choice questions need three non-empty wrong answers."
    };
  }
  if (incorrectAnswers.some((a) => a.length > ANSWER_MAX)) {
    return { ok: false, error: lengthError("Each wrong answer", ANSWER_MAX) };
  }

  const all = [correctAnswer, ...incorrectAnswers];
  const unique = new Set(all.map((a) => a.toLowerCase()));
  if (unique.size !== all.length) {
    return { ok: false, error: "Answers must all be different from each other." };
  }

  return { ok: true, question, correctAnswer, incorrectAnswers };
};
