import { Client, Message, PermissionsBitField, EmbedBuilder } from "discord.js";

const messageCount = new Map<string, { count: number; timer: NodeJS.Timeout }>();

export function setupAntiSpam(client: Client) {
  client.on("messageCreate", async (message: Message) => {
    // Chặn NGAY LẬP TỨC mọi tin nhắn từ bot khác (không phải bot của mình)
    if (message.author.bot && message.author.id !== client.user?.id) {
      try {
        await message.delete().catch(() => {});
        if (message.member && message.member.bannable) {
          await message.member.ban({ reason: "Anti-Spam: Cấm bot ngoài nhắn tin" });
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(`🚫 Đã ban bot <@${message.author.id}> vì gửi tin nhắn rác.`);
          await (message.channel as any).send({ embeds: [embed] }).catch(() => {});
        }
      } catch (err) {
        console.error("Lỗi khi xử lý bot lạ:", err);
      }
      return;
    }

    // Bỏ qua tin nhắn từ chính bot của mình
    if (message.author.id === client.user?.id) return;

    // Bỏ qua admin hoặc global owner (chỉ áp dụng cho người dùng thật vì bot đã bị xử lý ở trên)
    if (message.author.id === "1478172978259824793" || message.member?.permissions.has(PermissionsBitField.Flags.Administrator)) return; 

    const userId = message.author.id;
    const guildId = message.guild?.id;

    if (!guildId) return;

    const key = `${guildId}-${userId}`;
    const userData = messageCount.get(key);

    if (userData) {
      userData.count += 1;
      clearTimeout(userData.timer);

      // Nếu gửi quá 5 tin nhắn trong 5s
      if (userData.count >= 5) {
        try {
          if (message.author.bot) {
            // Đối với bot lạ spam: Ban hoặc Kick ngay lập tức
            if (message.member && message.member.bannable) {
              await message.member.ban({ reason: "Anti-Spam: Bot lạ spam tin nhắn" });
              const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription(`🚫 Đã ban bot <@${userId}> vì hành vi spam liên tục.`);
              await (message.channel as any).send({ embeds: [embed] }).catch(() => {});
            }
          } else {
            // Đối với người dùng bình thường: Mute 60s
            if (message.member && message.member.moderatable) {
              await message.member.timeout(60 * 1000, "Spam quá 5 tin nhắn");
              
              const embed = new EmbedBuilder()
                .setColor(0xff0000)
                .setDescription(`🚫 <@${userId}> đã bị mute 60 giây do spam.`);
              
              await (message.channel as any).send({ embeds: [embed] }).catch(() => {});
            }
          }
          // Xóa tin nhắn hiện tại
          await message.delete().catch(() => {});
        } catch (err) {
          console.error("Không thể xử lý user/bot spam:", err);
        }

        // Reset bộ đếm sau khi xử lý
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
