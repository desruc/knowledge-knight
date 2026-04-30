import {
  LabelBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} from "discord.js";
import { SubmittedQuestionType } from "~/db/entities/submittedQuestion";

export const MODAL_FIELD_IDS = {
  question: "question",
  correctAnswer: "correctAnswer",
  incorrect1: "incorrect1",
  incorrect2: "incorrect2",
  incorrect3: "incorrect3"
} as const;

export const MODAL_CUSTOM_IDS = {
  tf: "submit:modal-tf",
  mcq: "submit:modal-mcq"
} as const;

const labeledInput = (
  label: string,
  customId: string,
  style: TextInputStyle,
  maxLength: number,
  placeholder: string
) =>
  new LabelBuilder()
    .setLabel(label)
    .setTextInputComponent(
      new TextInputBuilder()
        .setCustomId(customId)
        .setStyle(style)
        .setMaxLength(maxLength)
        .setRequired(true)
        .setPlaceholder(placeholder)
    );

const questionField = () =>
  labeledInput(
    "Question",
    MODAL_FIELD_IDS.question,
    TextInputStyle.Paragraph,
    256,
    "What's the question?"
  );

const answerField = (label: string, customId: string, placeholder: string) =>
  labeledInput(label, customId, TextInputStyle.Short, 80, placeholder);

export const buildModal = (type: SubmittedQuestionType): ModalBuilder => {
  if (type === "tf") {
    return new ModalBuilder()
      .setCustomId(MODAL_CUSTOM_IDS.tf)
      .setTitle("Submit a true/false question")
      .addLabelComponents(
        questionField(),
        answerField(
          "Correct answer",
          MODAL_FIELD_IDS.correctAnswer,
          'Type "True" or "False"'
        )
      );
  }

  return new ModalBuilder()
    .setCustomId(MODAL_CUSTOM_IDS.mcq)
    .setTitle("Submit a multiple-choice question")
    .addLabelComponents(
      questionField(),
      answerField(
        "Correct answer",
        MODAL_FIELD_IDS.correctAnswer,
        "The right answer"
      ),
      answerField(
        "Wrong answer #1",
        MODAL_FIELD_IDS.incorrect1,
        "A plausible decoy"
      ),
      answerField("Wrong answer #2", MODAL_FIELD_IDS.incorrect2, "Another decoy"),
      answerField("Wrong answer #3", MODAL_FIELD_IDS.incorrect3, "One more decoy")
    );
};
