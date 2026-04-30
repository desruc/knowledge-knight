import type { Client, Interaction } from "discord.js";
import { MessageFlags } from "discord.js";
import { leaderboardCommand } from "~/commands/leaderboard";
import { meCommand } from "~/commands/me";
import { submitCommand } from "~/commands/submit";
import { logger } from "~/core/logger";
import {
  MODAL_CUSTOM_IDS,
  handleCancel,
  handleConfirm,
  handleModalSubmit,
  handleTypeSelect,
  isSubmitInteraction
} from "~/features/submitQuestion";
import type { DiscordEvent } from "~/types";

const slashCommands = [meCommand, leaderboardCommand, submitCommand];

const SUBMIT_TYPE_SELECT_ID = "submit:type-select";

const routeSlashCommand = async (client: Client, interaction: Interaction) => {
  if (!interaction.isCommand()) return;

  const command = slashCommands.find(
    (c) => c.definition.name === interaction.commandName
  );

  if (!command) return;

  try {
    await command.execute(client, interaction);
  } catch (error) {
    logger.error("There was an error executing the command", { error });

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "There was an error while executing this command!",
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

const routeSubmitInteraction = async (interaction: Interaction) => {
  try {
    if (
      interaction.isStringSelectMenu() &&
      interaction.customId === SUBMIT_TYPE_SELECT_ID
    ) {
      await handleTypeSelect(interaction);
      return;
    }

    if (
      interaction.isModalSubmit() &&
      (interaction.customId === MODAL_CUSTOM_IDS.tf ||
        interaction.customId === MODAL_CUSTOM_IDS.mcq)
    ) {
      await handleModalSubmit(interaction);
      return;
    }

    if (interaction.isButton()) {
      if (interaction.customId.startsWith("submit:confirm:")) {
        await handleConfirm(interaction);
        return;
      }
      if (interaction.customId.startsWith("submit:cancel:")) {
        await handleCancel(interaction);
        return;
      }
    }
  } catch (error) {
    logger.error("There was an error handling submit interaction", {
      error,
      customId: "customId" in interaction ? interaction.customId : undefined
    });

    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: "Something went wrong handling that. Try again.",
        flags: MessageFlags.Ephemeral
      });
    }
  }
};

const isSubmitFlowInteraction = (interaction: Interaction) => {
  if (!("customId" in interaction)) return false;
  const customId = interaction.customId;
  return typeof customId === "string" && isSubmitInteraction(customId);
};

async function exec(client: Client, interaction: Interaction) {
  if (interaction.isCommand()) {
    await routeSlashCommand(client, interaction);
    return;
  }

  if (isSubmitFlowInteraction(interaction)) {
    await routeSubmitInteraction(interaction);
  }
}

export const interactionCreate: DiscordEvent = {
  name: "interactionCreate",
  exec
};
