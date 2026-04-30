import { IsNull } from "typeorm";
import { db } from "~/db";
import {
  SubmittedQuestion,
  SubmittedQuestionType
} from "~/db/entities/submittedQuestion";

export type CreateSubmissionInput = {
  submitterId: string;
  submitterUsername: string;
  type: SubmittedQuestionType;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
};

export const submittedQuestionRepository = db.getRepository(SubmittedQuestion);

export const createSubmission = (input: CreateSubmissionInput) =>
  submittedQuestionRepository.save(input);

// Atomically claims the oldest unused submission and marks it used in a single
// transaction. Returns null if the pool is empty. The pessimistic lock prevents
// two concurrent daily-post calls (one per guild) from picking the same row.
export const pickAndMarkUsed = async () =>
  db.transaction(async (em) => {
    const candidate = await em.findOne(SubmittedQuestion, {
      where: { usedAt: IsNull() },
      order: { createdAt: "ASC" },
      lock: { mode: "pessimistic_write" }
    });

    if (!candidate) return null;

    candidate.usedAt = new Date();
    return em.save(candidate);
  });
