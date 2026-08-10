import { Message } from "discord.js";

// Store AFK status: map of userId to { reason, originalNickname, timestamp }
const afkUsers = new Map<string, { reason: string; originalNickname: string | null; timestamp: number }>();

export async function handleAfkCommand(
  message: Message,
  commandName: string,
  args: string[]
): Promise<boolean> {
  if (commandName === "afk") {
    const reason = args.join(" ") || "AFK";
    const userId = message.author.id;
    const member = message.member;

    if (!member) return true;

    const originalNickname = member.nickname;
    afkUsers.set(userId, {
      reason,
      originalNickname,
      timestamp: Date.now()
    });

    try {
      // Change nickname
      await member.setNickname(`[AFK] ${member.displayName}`.substring(0, 32));
    } catch (err) {
      console.log("Could not change nickname (missing permissions).");
    }

    const reply = await message.reply(`✅ Đã thiết lập trạng thái AFK: **${reason}**`);
    setTimeout(() => reply.delete().catch(() => {}), 5000);
    return true;
  }
  return false;
}

export async function checkAfkStatus(message: Message) {
  if (message.author.bot) return;

  const userId = message.author.id;

  // If user is AFK and sends a message (and it's not the ,afk command itself), remove AFK status
  if (afkUsers.has(userId) && !message.content.startsWith(",afk")) {
    const afkData = afkUsers.get(userId)!;
    afkUsers.delete(userId);

    const member = message.member;
    if (member) {
      try {
        await member.setNickname(afkData.originalNickname);
      } catch (err) {
        console.log("Could not reset nickname (missing permissions).");
      }
    }

    const reply = await message.reply(`👋 Chào mừng trở lại! Đã gỡ trạng thái AFK của bạn.`);
    setTimeout(() => reply.delete().catch(() => {}), 5000);
  }

  // Check if mentioned users are AFK
  const mentions = message.mentions.users;
  mentions.forEach(async (user) => {
    if (afkUsers.has(user.id)) {
      const afkData = afkUsers.get(user.id)!;
      const timeAgo = Math.floor((Date.now() - afkData.timestamp) / 1000 / 60);
      let timeString = `${timeAgo} phút trước`;
      if (timeAgo === 0) timeString = `Vừa mới đây`;
      
      const reply = await message.reply(`💤 **${user.displayName || user.username}** đang AFK: ${afkData.reason} (${timeString})`);
      setTimeout(() => reply.delete().catch(() => {}), 5000);
    }
  });
}
