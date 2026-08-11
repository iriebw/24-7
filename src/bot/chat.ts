import { Client, Events, EmbedBuilder } from "discord.js";

export function setupChatCommand(client: Client) {
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.commandName === "chat") {
      const targetUser = interaction.options.getUser("nguoi_dung");
      const messageContent = interaction.options.getString("noi_dung");

      if (!targetUser || !messageContent) {
        await interaction.reply({ content: "Thiếu thông tin!", ephemeral: true });
        return;
      }

      try {
        await targetUser.send(messageContent);
        await interaction.reply({
          content: `Đã gửi tin nhắn đến **${targetUser.tag}** thành công!`,
          ephemeral: true,
        });
      } catch (error) {
        console.error("Lỗi khi gửi DM:", error);
        await interaction.reply({
          content: `Không thể gửi tin nhắn cho **${targetUser.tag}**. Người này có thể đã chặn tin nhắn từ người lạ hoặc bot.`,
          ephemeral: true,
        });
      }
    }
  });
}
