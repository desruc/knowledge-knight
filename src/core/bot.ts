import { Client, IntentsBitField } from "discord.js";
import { ready } from "~/events/ready";
import { DiscordEvent } from "~/types";

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
  initializeEvents();

  await client.login(process.env.DISCORD_TOKEN);
}