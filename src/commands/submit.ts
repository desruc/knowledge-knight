import {
  ApplicationIntegrationType,
  InteractionContextType,
  SlashCommandBuilder
} from "discord.js";
import type { ChatInputCommandInteraction, Client, Interaction } from "discord.js";
import { handleSubmitCommand } from "~/features/submitQuestion";

const command = new SlashCommandBuilder()
  .setName("submit")
  .setDescription("Submit a trivia question to the daily pool")
  .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
  .setIntegrationTypes(ApplicationIntegrationType.GuildInstall);

const executeSlashCommand = async (_: Client, interaction: Interaction) => {
  if (!interaction.isChatInputCommand()) return;
  await handleSubmitCommand(interaction as ChatInputCommandInteraction);
};

export const submitCommand = {
  definition: command,
  execute: executeSlashCommand
};
