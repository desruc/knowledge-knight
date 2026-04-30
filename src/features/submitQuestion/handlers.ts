import {
  ActionRowBuilder,
  ButtonInteraction,
  ChatInputCommandInteraction,
  MessageFlags,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction
} from "discord.js";
import { logger } from "~/core/logger";
import {
  SubmittedQuestion,
  SubmittedQuestionType
} from "~/db/entities/submittedQuestion";
import { createSubmission } from "~/db/repositories/submittedQuestionRepository";
import { consumeDraft, createDraft } from "./drafts";
import { MODAL_CUSTOM_IDS, MODAL_FIELD_IDS, buildModal } from "./modals";
import {
  buildConfirmRow,
  buildPreviewAnswerRow,
  buildPreviewEmbed
} from "./preview";
import { validateSubmission } from "./validation";

const TYPE_SELECT_CUSTOM_ID = "submit:type-select";

export const isSubmitInteraction = (customId: string) =>
  customId === TYPE_SELECT_CUSTOM_ID ||
  customId === MODAL_CUSTOM_IDS.tf ||
  customId === MODAL_CUSTOM_IDS.mcq ||
  customId.startsWith("submit:confirm:") ||
  customId.startsWith("submit:cancel:");

export const handleSubmitCommand = async (
  interaction: ChatInputCommandInteraction
) => {
  const select = new StringSelectMenuBuilder()
    .setCustomId(TYPE_SELECT_CUSTOM_ID)
    .setPlaceholder("Pick a question type")
    .addOptions(
      {
        label: "True or False",
        description: "Two-option question",
        value: "tf"
      },
      {
        label: "Multiple Choice",
        description: "One correct answer, three wrong",
        value: "mcq"
      }
    );

  await interaction.reply({
    content: "What kind of question would you like to submit?",
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)
    ],
    flags: MessageFlags.Ephemeral
  });
};

export const handleTypeSelect = async (interaction: StringSelectMenuInteraction) => {
  const selected = interaction.values[0];
  if (selected !== "tf" && selected !== "mcq") {
    await interaction.reply({
      content: "Unknown question type.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  await interaction.showModal(buildModal(selected));
};

const modalType = (customId: string): SubmittedQuestionType | null => {
  if (customId === MODAL_CUSTOM_IDS.tf) return "tf";
  if (customId === MODAL_CUSTOM_IDS.mcq) return "mcq";
  return null;
};

export const handleModalSubmit = async (interaction: ModalSubmitInteraction) => {
  const type = modalType(interaction.customId);
  if (!type) return;

  const fields = interaction.fields;
  const rawQuestion = fields.getTextInputValue(MODAL_FIELD_IDS.question);
  const rawCorrect = fields.getTextInputValue(MODAL_FIELD_IDS.correctAnswer);
  const rawIncorrects =
    type === "mcq"
      ? [
          fields.getTextInputValue(MODAL_FIELD_IDS.incorrect1),
          fields.getTextInputValue(MODAL_FIELD_IDS.incorrect2),
          fields.getTextInputValue(MODAL_FIELD_IDS.incorrect3)
        ]
      : [];

  const result = validateSubmission(type, rawQuestion, rawCorrect, rawIncorrects);
  if (!result.ok) {
    await interaction.reply({
      content: `❌ ${result.error}`,
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  const draft = createDraft({
    submitterId: interaction.user.id,
    submitterUsername: interaction.user.username,
    type,
    question: result.question,
    correctAnswer: result.correctAnswer,
    incorrectAnswers: result.incorrectAnswers
  });

  await interaction.reply({
    content: "Here's how your question will look. Submit to send it to the pool.",
    embeds: [buildPreviewEmbed(draft)],
    components: [buildPreviewAnswerRow(draft), buildConfirmRow(draft.id)],
    flags: MessageFlags.Ephemeral
  });
};

const draftIdFromButton = (customId: string) => customId.split(":")[2];

export const handleConfirm = async (interaction: ButtonInteraction) => {
  const draftId = draftIdFromButton(interaction.customId);
  const draft = consumeDraft(draftId);

  if (!draft) {
    await interaction.update({
      content:
        "⏱️ This preview expired or was already submitted. Run `/submit` again.",
      embeds: [],
      components: []
    });
    return;
  }

  if (draft.submitterId !== interaction.user.id) {
    await interaction.reply({
      content: "This isn't your draft.",
      flags: MessageFlags.Ephemeral
    });
    return;
  }

  try {
    const saved = (await createSubmission({
      submitterId: draft.submitterId,
      submitterUsername: draft.submitterUsername,
      type: draft.type,
      question: draft.question,
      correctAnswer: draft.correctAnswer,
      incorrectAnswers: draft.incorrectAnswers
    })) as SubmittedQuestion;

    logger.info("Trivia submission saved.", {
      submissionId: saved.id,
      submitterId: saved.submitterId,
      type: saved.type
    });

    await interaction.update({
      content: "✅ Submitted! Your question has joined the pool.",
      embeds: [],
      components: []
    });
  } catch (error) {
    logger.error("Failed to save trivia submission.", { error });
    await interaction.update({
      content: "❌ Something went wrong saving your question. Try again later.",
      embeds: [],
      components: []
    });
  }
};

export const handleCancel = async (interaction: ButtonInteraction) => {
  const draftId = draftIdFromButton(interaction.customId);
  consumeDraft(draftId);

  await interaction.update({
    content: "Discarded. Nothing was saved.",
    embeds: [],
    components: []
  });
};
