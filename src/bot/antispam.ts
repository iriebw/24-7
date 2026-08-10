import { Client, Message, PermissionsBitField, EmbedBuilder } from "discord.js";

const messageCount = new Map<string, { count: number; timer: NodeJS.Timeout }>();

export function setupAntiSpam(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    // 1. Chặn bot/webhook lạ (ngoại trừ bot của mình)
    // Các ứng dụng hoặc webhook rác gửi tin nhắn sẽ bị xóa ngay
    if (message.author.bot && message.author.id !== client.user?.id && message.author.id !== "974297735559806986") {
      try {
        await message.delete();
      } catch (e) {
        // Ignore if missing permissions
      }
      return;
    }

    // 2. Bỏ qua tin nhắn từ bot của mình
    if (message.author.bot) return;

    // 3. Anti-spam cho người dùng bình thường
    if (message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) return; // Bỏ qua admin

    const userId = message.author.id;
    const guildId = message.guild?.id;

    if (!guildId) return;

    const key = `${guildId}-${userId}`;
    const userData = messageCount.get(key);

    if (userData) {
      userData.count += 1;
      clearTimeout(userData.timer);

      // Nếu gửi quá 10 tin nhắn trong thời gian ngắn (ví dụ 5s)
      if (userData.count >= 10) {
        try {
          if (message.member && message.member.moderatable) {
            // Mute 30s
            await message.member.timeout(30 * 1000, "Spam quá 10 tin nhắn");
            
            const embed = new EmbedBuilder()
              .setColor(0xff0000)
              .setDescription(`🚫 <@${userId}> đã bị mute 30 giây do spam.`);
            
            await message.channel.send({ embeds: [embed] });

            // Tùy chọn: xóa tin nhắn cuối cùng để cảnh báo
            await message.delete().catch(() => {});
          }
        } catch (err) {
          console.error("Không thể mute user:", err);
        }

        // Reset bộ đếm sau khi mute
        messageCount.delete(key);
        return;
      }

      userData.timer = setTimeout(() => {
        messageCount.delete(key);
      }, 5000); // Reset timer sau 5s không có tin nhắn mới
    } else {
      const timer = setTimeout(() => {
        messageCount.delete(key);
      }, 5000);

      messageCount.set(key, { count: 1, timer });
    }
  });
}
