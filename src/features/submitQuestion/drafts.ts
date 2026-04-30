import { randomUUID } from "node:crypto";
import { SubmittedQuestionType } from "~/db/entities/submittedQuestion";

export type Draft = {
  id: string;
  submitterId: string;
  submitterUsername: string;
  type: SubmittedQuestionType;
  question: string;
  correctAnswer: string;
  incorrectAnswers: string[];
  expiresAt: number;
};

const TTL_MS = 10 * 60 * 1000;
const drafts = new Map<string, Draft>();

const sweep = () => {
  const now = Date.now();
  for (const [id, draft] of drafts) {
    if (draft.expiresAt <= now) drafts.delete(id);
  }
};

export const createDraft = (input: Omit<Draft, "id" | "expiresAt">): Draft => {
  sweep();
  const draft: Draft = {
    ...input,
    id: randomUUID(),
    expiresAt: Date.now() + TTL_MS
  };
  drafts.set(draft.id, draft);
  return draft;
};

export const consumeDraft = (id: string): Draft | undefined => {
  sweep();
  const draft = drafts.get(id);
  if (draft) drafts.delete(id);
  return draft;
};

export const peekDraft = (id: string): Draft | undefined => {
  sweep();
  return drafts.get(id);
};
