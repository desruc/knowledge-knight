import { logger } from "~/core/logger";
import { pickAndMarkUsed } from "~/db/repositories/submittedQuestionRepository";
import { shuffleArray } from "~/utils/helpers";
import { getQuestionData } from "./getQuestionData";

export type NextQuestion = {
  question: string;
  answer: string;
  allAnswers: string[];
  source: "submission" | "api";
  submitterId?: string;
  submitterUsername?: string;
};

export const getNextQuestion = async (): Promise<NextQuestion> => {
  const submission = await pickAndMarkUsed();

  if (submission) {
    logger.info("Using submitted question for daily post.", {
      submissionId: submission.id,
      submitterId: submission.submitterId
    });

    const allAnswers =
      submission.type === "tf"
        ? ["True", "False"]
        : shuffleArray<string>([
            submission.correctAnswer,
            ...submission.incorrectAnswers
          ]);

    return {
      question: submission.question,
      answer: submission.correctAnswer,
      allAnswers,
      source: "submission",
      submitterId: submission.submitterId,
      submitterUsername: submission.submitterUsername
    };
  }

  const data = await getQuestionData();
  return {
    question: data.question,
    answer: data.answer,
    allAnswers: data.allAnswers,
    source: "api"
  };
};
