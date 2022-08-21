import { Client, IntentsBitField } from "discord.js";
import { ready } from "~/events/ready";
import { DiscordEvent } from "~/types";
import { db } from "~/db";
import { logger } from "~/core/logger";

const client = new Client({
  partials: [],
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.GuildMembers
  ]
});

const events: DiscordEvent[] = [ready];

function initializeEvents() {
  events.forEach((e) => {
    client.on(e.name, async (...args) => {
      e.exec(client, ...args);
    });
  });
}

export async function initializeBot() {
  try {
    await db.initialize();
    logger.info("Successfully connected to database.");
  } catch (error) {
    logger.error("Error connecting to database.", { error });
  }

  initializeEvents();

  await client.login(process.env.DISCORD_TOKEN);
}
