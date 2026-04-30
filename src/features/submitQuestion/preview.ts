import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder
} from "discord.js";
import { shuffleArray } from "~/utils/helpers";
import { createTriviaEmbed } from "~/features/trivia/questionEmbed";
import { Draft } from "./drafts";

export const buildPreviewEmbed = (draft: Draft): EmbedBuilder =>
  createTriviaEmbed(draft.question).setFooter({
    text: "⚠️ Once you submit, you can't edit or delete this question. Double-check it!"
  });

const PREVIEW_BUTTON_PREFIX = "submit:preview:";

export const buildPreviewAnswerRow = (draft: Draft) => {
  const ordered =
    draft.type === "tf"
      ? ["True", "False"]
      : shuffleArray<string>([draft.correctAnswer, ...draft.incorrectAnswers]);

  const buttons = ordered.map((a, idx) =>
    new ButtonBuilder()
      .setCustomId(`${PREVIEW_BUTTON_PREFIX}${idx}`)
      .setLabel(a)
      .setDisabled(true)
      .setStyle(ButtonStyle.Primary)
  );

  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons);
};

export const buildConfirmRow = (draftId: string) =>
  new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`submit:confirm:${draftId}`)
      .setLabel("Submit")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`submit:cancel:${draftId}`)
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary)
  );
