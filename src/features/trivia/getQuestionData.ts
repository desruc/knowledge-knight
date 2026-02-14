import { z } from "zod";
import { shuffleArray } from "~/utils/helpers";

const questionSchema = z.object({
  category: z.string(),
  type: z.string(),
  difficulty: z.string(),
  question: z.string(),
  correct_answer: z.string(),
  incorrect_answers: z.string().array()
});

const responseSchema = z.object({
  response_code: z.number(),
  results: z.array(questionSchema)
});

const triviaApiEndpoint = "https://opentdb.com/api.php?amount=1&encode=url3986";

export const getQuestionData = async () => {
  const questionData = await fetch(triviaApiEndpoint)
    .then((res) => res.json())
    .then((response) => responseSchema.parse(response).results[0]);

  const { question, correct_answer, incorrect_answers } = questionData;

  const incorrectAnswers = incorrect_answers.map((i) => decodeURIComponent(i));

  const answer = decodeURIComponent(correct_answer).trim();

  const allAnswers = shuffleArray<string>([...incorrectAnswers, answer]);

  return {
    question,
    answer,
    allAnswers,
    incorrectAnswers
  };
};
