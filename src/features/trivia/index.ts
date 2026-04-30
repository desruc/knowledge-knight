import { ComponentType, EmbedBuilder, Guild, MessageFlags } from "discord.js";
import { Job as ScheduledJob } from "node-schedule";
import { logger } from "~/core/logger";
import { randomNumber, getTextChannel } from "~/utils/helpers";
import { hasUserAnswered, resetAnswered } from "~/db/repositories/userRepository";
import { getNextQuestion } from "./getNextQuestion";
import { onAlreadyAnswered, onCorrectAnswer, onWrongAnswer } from "./handleAnswer";
import {
  createTriviaEmbed,
  getCompletedAnswerRow,
  getInitialComponentRow
} from "./questionEmbed";

const allowablePoints = 3;
let pointsToGive = allowablePoints;

const resetPointsToGive = () => {
  logger.info("Resetting daily points");
  pointsToGive = allowablePoints;
};

// Get a random time between 10am and 11PM AEST
export const getRandomTriviaTime = () => {
  return `${randomNumber(0, 57)} ${randomNumber(10, 22)} * * *`;
};

export const rescheduleTrivia = (job: ScheduledJob) => {
  const nextTime = getRandomTriviaTime();

  job.reschedule(nextTime);

  logger.info("Trivia job has been rescheduled", {
    nextInvocation: job.nextInvocation()
  });

  // Allow all users to answer the next question
  resetAnswered();
};

export async function sendTriviaQuestion(guild: Guild) {
  try {
    const channel = await getTextChannel(guild);

    if (!channel) {
      throw new Error("Could not find a suitable text channel");
    }

    const { question, answer, allAnswers, submitterId, submitterUsername } =
      await getNextQuestion();

    const message = await channel.send({
      embeds: [createTriviaEmbed(question)],
      components: [getInitialComponentRow(allAnswers)]
    });

    const collector = message.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 1800000
    });

    const winnerStopReason = "winner";

    const buildEndEmbed = () => {
      const base = EmbedBuilder.from(message.embeds[0]);
      if (submitterUsername) {
        base.setFooter({ text: `Submitted by ${submitterUsername}` });
      }
      return base;
    };

    collector.on("collect", async (interaction) => {
      if (submitterId && interaction.user.id === submitterId) {
        await interaction.reply({
          content: "You submitted this one — sit it out!",
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      const hasAnswered = await hasUserAnswered(guild.id, interaction.user.id);

      if (hasAnswered) {
        onAlreadyAnswered(interaction);
      } else if (interaction.customId === answer) {
        // If two people have already got the correct answer, let the last person through then close the question
        if (pointsToGive === 1) {
          collector.stop(winnerStopReason);

          message.edit({
            embeds: [buildEndEmbed()],
            components: [getCompletedAnswerRow(allAnswers, answer)]
          });

          await onCorrectAnswer(guild, interaction, pointsToGive);

          resetPointsToGive();
        } else {
          await onCorrectAnswer(guild, interaction, pointsToGive);

          // First place gets 3 points, 2nd place 2 points and 3rd place 1 point
          pointsToGive -= 1;

          logger.info(
            "Question answered correctly. Deducting one point for the day",
            { nextPersonGets: pointsToGive }
          );
        }
      } else {
        await onWrongAnswer(guild.id, interaction);
      }
    });

    collector.on("end", (_, reason) => {
      if (reason !== winnerStopReason) {
        // Somebody has answered correctly, but not all winners selected in time
        if (pointsToGive !== allowablePoints) {
          logger.info("Some answers submitted correctly, but not exhausted", {
            guild: guild.id
          });

          message.edit({
            content: "**Times up!** Congratulations to the winners!",
            embeds: [buildEndEmbed()],
            components: [getCompletedAnswerRow(allAnswers, answer)]
          });
        } else {
          // Nobody answered correctly
          logger.info("The correct answer was not submitted in time.", {
            guild: guild.id
          });

          message.edit({
            content: "**Times up!** No one answered correctly.",
            embeds: [buildEndEmbed()],
            components: [getCompletedAnswerRow(allAnswers, answer)]
          });
        }

        resetPointsToGive();
      }
    });
  } catch (error) {
    logger.error("There was an error sending trivia question", {
      error,
      guild: guild.id
    });
  }
}
