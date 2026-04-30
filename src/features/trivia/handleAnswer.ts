import { MessageFlags } from "discord.js";
import type { ButtonInteraction, Guild } from "discord.js";
import { markHasAnswered, updateWinner } from "~/db/repositories/userRepository";

const getUserId = (interaction: ButtonInteraction) => interaction.user.id;

export const onCorrectAnswer = async (
  guild: Guild,
  interaction: ButtonInteraction,
  pointsToGive: number
) => {
  const winningUserId = getUserId(interaction);

  // Update current streak and highest streak
  const winner = await updateWinner(guild.id, winningUserId, pointsToGive);

  interaction.reply(
    `${interaction.user}! You earned ${pointsToGive} points, giving you a total of ${winner.currentPoints}! You're also on a ${winner.currentStreak} streak 😎`
  );
};

export const onWrongAnswer = async (
  guildId: string,
  interaction: ButtonInteraction
) => {
  await markHasAnswered(guildId, getUserId(interaction));
  interaction.reply(`Sorry, ${interaction.user}! That is incorrect.`);
};

export const onAlreadyAnswered = async (interaction: ButtonInteraction) =>
  interaction.reply({
    content: "Sorry! You can only submit one answer per day.",
    flags: MessageFlags.Ephemeral
  });
