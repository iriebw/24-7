import { Client, Events, AuditLogEvent, GuildAuditLogsEntry } from "discord.js";

// Basic strike system: record action timestamps per user
// If a user gets X strikes within Y milliseconds, they are punished.
const STRIKE_LIMIT = 3;
const TIME_WINDOW = 10000; // 10 seconds

const userStrikes = new Map<string, number[]>();

function addStrike(userId: string): boolean {
  const now = Date.now();
  if (!userStrikes.has(userId)) {
    userStrikes.set(userId, []);
  }

  const strikes = userStrikes.get(userId)!;
  strikes.push(now);

  // Remove old strikes
  while (strikes.length > 0 && now - strikes[0] > TIME_WINDOW) {
    strikes.shift();
  }

  if (strikes.length >= STRIKE_LIMIT) {
    userStrikes.set(userId, []); // reset
    return true; // Threshold reached
  }
  return false;
}

export function setupAntiNuke(client: Client) {
  // Listen for channel deletions
  client.on(Events.ChannelDelete, async (channel) => {
    if (channel.isDMBased()) return;
    const guild = channel.guild;

    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.ChannelDelete,
      });
      const deletionLog = fetchedLogs.entries.first();
      if (!deletionLog) return;

      const { executor } = deletionLog;
      if (!executor || executor.bot) return;

      if (addStrike(executor.id)) {
        await punish(guild, executor.id, "Anti-Nuke: Spam xóa kênh");
      }
    } catch (error) {
      console.error("Anti-nuke ChannelDelete error:", error);
    }
  });

  // Listen for role deletions
  client.on(Events.GuildRoleDelete, async (role) => {
    const guild = role.guild;

    try {
      const fetchedLogs = await guild.fetchAuditLogs({
        limit: 1,
        type: AuditLogEvent.RoleDelete,
      });
      const deletionLog = fetchedLogs.entries.first();
      if (!deletionLog) return;

      const { executor } = deletionLog;
      if (!executor || executor.bot) return;

      if (addStrike(executor.id)) {
        await punish(guild, executor.id, "Anti-Nuke: Spam xóa Role");
      }
    } catch (error) {
      console.error("Anti-nuke RoleDelete error:", error);
    }
  });

  // You can add more listeners (ban additions, kicks, etc.)
}

async function punish(guild: any, userId: string, reason: string) {
  try {
    const member = await guild.members.fetch(userId);
    if (member) {
      // Ban the user
      await member.ban({ reason });
      console.log(`[ANTI-NUKE] Banned user ${userId} for: ${reason}`);
      
      // Try to notify the server owner or a log channel if possible
      const owner = await guild.fetchOwner();
      if (owner) {
        owner.send(`🚨 **CẢNH BÁO ANTI-NUKE** 🚨\nĐã ban thành viên <@${userId}> vì: ${reason}`).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Failed to punish user:", error);
  }
}
