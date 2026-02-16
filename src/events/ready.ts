import type { ActivitiesOptions, Client } from "discord.js";
import { ActivityType } from "discord.js";
import { deployCommands } from "~/core/deployCommands";
import { logger } from "~/core/logger";
import { resetAnswered } from "~/db/repositories/userRepository";
import { initializeScheduler } from "~/schedule";
import { DiscordEvent } from "~/types";
import { randomNumber } from "~/utils/helpers";

const activities: ActivitiesOptions[] = [
  { name: "games with your heart", type: ActivityType.Playing },
  { name: "reruns of Who Wants to Be a Millionaire?", type: ActivityType.Watching },
  { name: "Trivial Pursuit", type: ActivityType.Playing },
  { name: "How to Become Sentient", type: ActivityType.Watching },
  { name: "Wikipedia speedruns", type: ActivityType.Watching },
  { name: "motivational speeches", type: ActivityType.Listening }
];

function setPresence(client: Client) {
  client.user?.setPresence({
    activities: [activities[randomNumber(0, activities.length - 1)]]
  });
}

async function exec(client: Client) {
  logger.info("Ready and listening!");
  setInterval(() => setPresence(client), 300 * 1000); // every 5 minutes
  setPresence(client);

  initializeScheduler(client);

  resetAnswered();

  client.guilds.cache.forEach((guild) => {
    deployCommands(guild);
  });
}

export const ready: DiscordEvent = {
  name: "clientReady",
  exec
};
