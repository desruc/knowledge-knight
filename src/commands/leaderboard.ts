import { SlashCommandBuilder, EmbedBuilder, Colors } from "discord.js";
import type {
  Client,
  CommandInteraction,
  Interaction,
  User as DiscordUser
} from "discord.js";

import { logger } from "~/core/logger";
import {
  topFiveCorrectAnswers,
  topFiveHighestPoints,
  topFiveStreaks,
  topFiveTotalAnswered
} from "~/db/repositories/userRepository";
import { User } from "~/db/entities/user";
import { asyncForEach } from "~/utils/asyncForEach";

interface MappedUser extends User {
  discordUser: DiscordUser;
}

const commandName = "leaderboard";
const commandDescription = "see the leaderboard for the chosen statistic";

const statChoices = [
  { name: "streak", value: "streak" },
  { name: "correct answers", value: "correctAnswers" },
  { name: "total answers", value: "totalAnswers" },
  { name: "highest points", value: "highestPoints" }
] as const;

type Stat = (typeof statChoices)[number]["value"];

const command = new SlashCommandBuilder()
  .setName(commandName)
  .setDescription(commandDescription)
  .addStringOption((option) =>
    option
      .setName("stat")
      .setDescription("the statistic you want to see")
      .setRequired(true)
      .addChoices(...statChoices)
  );

const fetchUsersFromDatabase = async (guildId: string, stat: Stat) => {
  switch (stat) {
    case "streak":
      return topFiveStreaks(guildId);
    case "correctAnswers":
      return topFiveCorrectAnswers(guildId);
    case "totalAnswers":
      return topFiveTotalAnswered(guildId);
    case "highestPoints":
      return topFiveHighestPoints(guildId);
    default:
      return topFiveStreaks(guildId);
  }
};

const getMappedUsers = async (client: Client, guildId: string, stat: Stat) => {
  const users = await fetchUsersFromDatabase(guildId, stat);

  const mapped: MappedUser[] = [];

  await asyncForEach(users, async (u) => {
    const discordUser = await client.users.fetch(u.id);
    mapped.push({ ...u, discordUser });
  });

  return mapped;
};

const titleLookup: Record<Stat, string> = {
  streak: "Users with the highest streaks",
  correctAnswers: "Users with the most correct answers",
  totalAnswers: "Users who have attempted the most questions",
  highestPoints: "Users with the highest amount of points"
};

const createEmbed = (interaction: CommandInteraction, stat: Stat) => {
  const embed = new EmbedBuilder()
    .setColor(Colors.NotQuiteBlack)
    .setTitle(titleLookup[stat])
    .setTimestamp();

  if (interaction.guild) {
    embed.setFooter({
      text: interaction.guild.name,
      iconURL: interaction.guild.iconURL() ?? undefined
    });
  }

  return embed;
};

const FALLBACK_DESCRIPTION = "No one has answered a question!";

const getTopStreaksDescription = (users: MappedUser[]) => {
  const description = users.reduce((acc, curr, idx) => {
    return `${acc}${idx + 1}. ${curr.discordUser.username} - **${
      curr.highestStreak
    }**${
      curr.currentStreak === curr.highestStreak && curr.highestStreak !== 0
        ? " (current)"
        : ""
    }\n`;
  }, "");

  return description.length ? description : FALLBACK_DESCRIPTION;
};

const getCorrectAnswersDescription = (users: MappedUser[]) => {
  const description = users.reduce((acc, curr, idx) => {
    return `${acc}${idx + 1}. ${curr.discordUser.username} - **${
      curr.totalCorrectAnswers
    }**\n`;
  }, "");

  return description.length ? description : FALLBACK_DESCRIPTION;
};

const getTotalAnswersDescription = (users: MappedUser[]) => {
  const description = users.reduce((acc, curr, idx) => {
    return `${acc}${idx + 1}. ${curr.discordUser.username} - **${
      curr.totalAnswers
    }**\n`;
  }, "");

  return description.length ? description : FALLBACK_DESCRIPTION;
};

const getHighestPointsDescription = (users: MappedUser[]) => {
  const description = users.reduce((acc, curr, idx) => {
    return `${acc}${idx + 1}. ${curr.discordUser.username} - **${
      curr.highestPoints
    }**${
      curr.currentPoints === curr.highestPoints && curr.highestPoints !== 0
        ? " (current)"
        : ""
    }\n`;
  }, "");

  return description.length ? description : FALLBACK_DESCRIPTION;
};

const addDataToEmbed = async (
  users: MappedUser[],
  embed: EmbedBuilder,
  stat: Stat
) => {
  if (stat === "streak") embed.setDescription(getTopStreaksDescription(users));

  if (stat === "correctAnswers")
    embed.setDescription(getCorrectAnswersDescription(users));

  if (stat === "totalAnswers")
    embed.setDescription(getTotalAnswersDescription(users));

  if (stat === "highestPoints")
    embed.setDescription(getHighestPointsDescription(users));
};

const executeSlashCommand = async (client: Client, interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (!interaction.guildId) return null;

  await interaction.deferReply();

  const rawStat = interaction.options.getString("stat");

  if (!rawStat || !statChoices.some((s) => s.value === rawStat))
    throw Error("Invalid stat supplied");

  const stat = rawStat as Stat;

  try {
    const users = await getMappedUsers(client, interaction.guildId, stat);

    const embed = createEmbed(interaction, stat);

    addDataToEmbed(users, embed, stat);

    if (embed) {
      interaction.editReply({ embeds: [embed] });
    } else {
      interaction.editReply("This command is only available within a server.");
    }
  } catch (error) {
    logger.error("There was an error fetching the leaderboard", { error, stat });
  }
};

export const leaderboardCommand = {
  definition: command,
  execute: executeSlashCommand
};
