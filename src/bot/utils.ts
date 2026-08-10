import { Message, EmbedBuilder } from "discord.js";

export async function handleUtilsCommand(
  message: Message,
  commandName: string,
  args: string[]
): Promise<boolean> {
  if (commandName === "ping") {
    const sent = await message.reply("Đang tính toán ping...");
    const roundtrip = sent.createdTimestamp - message.createdTimestamp;
    sent.edit(`🏓 Pong! \nĐộ trễ: ${roundtrip}ms\nWebsocket: ${message.client.ws.ping}ms`);
    return true;
  }

  if (commandName === "avt" || commandName === "avatar") {
    const user = message.mentions.users.first() || message.author;
    const avatarUrl = user.displayAvatarURL({ size: 1024 });

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`Avatar của ${user.tag}`)
      .setImage(avatarUrl);

    message.reply({ embeds: [embed] });
    return true;
  }

  if (commandName === "clear" || commandName === "purge") {
    // 1478172978259824793 is always allowed
    const isAllowed = message.author.id === "1478172978259824793" || message.member?.permissions.has("ManageMessages");
    if (!isAllowed) {
      message.reply("Bạn không có quyền xóa tin nhắn!");
      return true;
    }

    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      message.reply("Vui lòng nhập một số từ 1 đến 100.");
      return true;
    }

    try {
      if (message.channel.isTextBased() && 'messages' in message.channel) {
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        const botMessages = fetched.filter((m: any) => m.author.id === message.client.user?.id);
        
        // Convert to array and slice
        const botMessagesArray = Array.from(botMessages.values());
        const messagesToDelete = botMessagesArray.slice(0, amount);
        
        if (messagesToDelete.length === 0) {
          const replyMsg = await message.reply("Không tìm thấy tin nhắn nào của bot để xóa trong 100 tin nhắn gần nhất.");
          setTimeout(() => replyMsg.delete().catch(() => {}), 3000);
          return true;
        }

        if ('bulkDelete' in message.channel) {
          await (message.channel as any).bulkDelete(messagesToDelete, true);
          const replyMsg = await message.channel.send(`✅ Đã xóa ${messagesToDelete.length} tin nhắn của bot.`);
          setTimeout(() => replyMsg.delete().catch(() => {}), 3000);
        }
      }
    } catch (error) {
      console.error(error);
      message.reply("Đã có lỗi xảy ra khi xóa tin nhắn. Tin nhắn cũ hơn 14 ngày không thể xóa hàng loạt.");
    }
    return true;
  }

  if (commandName === "gif") {
    const query = args.join(" ");
    if (!query) {
      message.reply("Vui lòng nhập từ khóa để tìm GIF! VD: `,gif anime hug`");
      return true;
    }

    try {
      const response = await fetch(`https://tenor.com/search/${encodeURIComponent(query).replace(/%20/g, '-')}-gifs`);
      const html = await response.text();
      const match = html.match(/src="(https:\/\/media\.tenor\.com\/[^"]+)"/i);
      
      if (match && match[1]) {
        message.reply(match[1]);
      } else {
        message.reply("Không tìm thấy GIF nào cho từ khóa này.");
      }
    } catch (error) {
      console.error(error);
      message.reply("Đã có lỗi xảy ra khi tìm GIF.");
    }
    return true;
  }

  if (commandName === "to" || commandName === "timeout") {
    const isAllowed = message.author.id === "1478172978259824793" || message.member?.permissions.has("ModerateMembers");
    if (!isAllowed) {
      message.reply("Bạn không có quyền timeout người dùng!");
      return true;
    }

    let targetUser = message.mentions.members?.first();
    if (!targetUser && args[0]) {
      const targetId = args[0].replace(/[<@!>]/g, '');
      try {
        targetUser = await message.guild?.members.fetch(targetId);
      } catch (e) {}
    }

    if (!targetUser) {
      message.reply("Vui lòng tag hoặc nhập ID người dùng cần timeout! VD: `,to @user 10 lý do`");
      return true;
    }

    const timeInMinutes = parseInt(args[1]);
    if (isNaN(timeInMinutes) || timeInMinutes <= 0) {
      message.reply("Vui lòng nhập thời gian hợp lệ (tính bằng phút)!");
      return true;
    }

    const reason = args.slice(2).join(" ") || "Không có lý do";

    try {
      await targetUser.timeout(timeInMinutes * 60 * 1000, reason);
      message.reply(`✅ Đã timeout **${targetUser.user.tag}** trong ${timeInMinutes} phút. Lý do: ${reason}`);
    } catch (err) {
      console.error(err);
      message.reply("Không thể timeout người dùng này (có thể do họ có quyền cao hơn tôi hoặc bot thiếu quyền).");
    }
    return true;
  }

  if (commandName === "ban") {
    const isAllowed = message.author.id === "1478172978259824793" || message.member?.permissions.has("BanMembers");
    if (!isAllowed) {
      message.reply("Bạn không có quyền ban người dùng!");
      return true;
    }

    let targetUser = message.mentions.members?.first();
    let targetId = args[0] ? args[0].replace(/[<@!>]/g, '') : null;
    
    if (!targetUser && targetId) {
      try {
        targetUser = await message.guild?.members.fetch(targetId);
      } catch (e) {}
    }

    if (!targetId && !targetUser) {
      message.reply("Vui lòng tag hoặc nhập ID người dùng cần ban! VD: `,ban @user lý do`");
      return true;
    }

    const reason = args.slice(1).join(" ") || "Không có lý do";

    try {
      if (targetUser) {
        await targetUser.ban({ reason });
        message.reply(`✅ Đã ban **${targetUser.user.tag}**. Lý do: ${reason}`);
      } else {
        await message.guild?.members.ban(targetId!, { reason });
        message.reply(`✅ Đã ban người dùng có ID **${targetId}**. Lý do: ${reason}`);
      }
    } catch (err) {
      console.error(err);
      message.reply("Không thể ban người dùng này (có thể do họ có quyền cao hơn tôi hoặc bot thiếu quyền).");
    }
    return true;
  }

  return false;
}
