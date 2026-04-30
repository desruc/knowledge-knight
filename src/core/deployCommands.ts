import { REST } from "@discordjs/rest";
import { Routes } from "discord.js";
import type { Client } from "discord.js";

import { meCommand } from "~/commands/me";
import { leaderboardCommand } from "~/commands/leaderboard";
import { submitCommand } from "~/commands/submit";
import { logger } from "~/core/logger";

const { CLIENT_ID, DISCORD_TOKEN } = process.env;

const commands = [
  meCommand.definition.toJSON(),
  leaderboardCommand.definition.toJSON(),
  submitCommand.definition.toJSON()
];

export const deployCommands = async (client: Client) => {
  try {
    if (!DISCORD_TOKEN) throw new Error("DISCORD_TOKEN must be supplied");
    if (!CLIENT_ID) throw new Error("CLIENT_ID must be supplied");

    const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

    // Drop any per-guild commands left behind from the previous registration
    // model so users don't see duplicates next to the global ones.
    for (const guild of client.guilds.cache.values()) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guild.id), {
        body: []
      });
    }

    logger.info("Refreshing global application (/) commands.");

    await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

    logger.info("Successfully reloaded global application (/) commands.");
  } catch (error) {
    logger.error("Error refreshing application (/) commands.", { error });
  }
};
