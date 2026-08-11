import { Client, Events, AuditLogEvent, Guild, EmbedBuilder } from "discord.js";

const TIME_WINDOW = 10000; // 10 seconds

// Giới hạn hành động trong TIME_WINDOW (giống Vantrix Strict Mode)
const LIMITS = {
  channelDelete: 2,
  channelCreate: 4,
  roleDelete: 2,
  roleCreate: 4,
  banAdd: 3,
  kick: 3,
  webhookCreate: 2,
};

// Map lưu trữ thông tin hành động của người dùng
const userStrikes = new Map<string, { [action: string]: number[] }>();

function checkAndAddStrike(userId: string, action: keyof typeof LIMITS): boolean {
  const now = Date.now();
  if (!userStrikes.has(userId)) {
    userStrikes.set(userId, {});
  }
  const userRecord = userStrikes.get(userId)!;
  if (!userRecord[action]) {
    userRecord[action] = [];
  }
  
  const strikes = userRecord[action];
  strikes.push(now);

  // Xóa các mốc thời gian cũ hơn TIME_WINDOW
  while (strikes.length > 0 && now - strikes[0] > TIME_WINDOW) {
    strikes.shift();
  }

  if (strikes.length >= LIMITS[action]) {
    userRecord[action] = []; // reset
    return true; // Đã vượt quá giới hạn
  }
  return false;
}

// Whitelist hệ thống: Bot và Owner của Server
async function isWhitelisted(guild: Guild, userId: string): Promise<boolean> {
  if (userId === "1478172978259824793") return true; // Global Owner
  if (userId === guild.client.user?.id) return true;
  const owner = await guild.fetchOwner().catch(() => null);
  if (owner && owner.id === userId) return true;
  return false;
}

async function punish(guild: Guild, userId: string, reason: string) {
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (member && member.bannable) {
      await member.ban({ reason });
      console.log(`[ANTI-NUKE] Đã ban ${userId} vì: ${reason}`);
      
      const owner = await guild.fetchOwner().catch(() => null);
      if (owner) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setTitle("🚨 CẢNH BÁO ANTI-NUKE 🚨")
          .setDescription(`Hệ thống Anti-Nuke đã tự động **BAN** <@${userId}> khỏi server **${guild.name}**.\n**Lý do:** ${reason}`)
          .setTimestamp();
        owner.send({ embeds: [embed] }).catch(() => {});
      }
    }
  } catch (error) {
    console.error("Lỗi khi trừng phạt:", error);
  }
}

export function setupAntiNuke(client: Client) {
  // 1. Anti-Bot: Chặn bot lạ tham gia và trừng phạt người thêm
  client.on(Events.GuildMemberAdd, async (member) => {
    if (member.user.bot && member.user.id !== client.user?.id) {
      try {
        const guild = member.guild;
        
        // Ban ngay con bot lạ
        if (member.bannable) {
          await member.ban({ reason: "Anti-Nuke: Chặn bot lạ vào server" }).catch(() => {});
        }
        
        // Tìm người đã thêm bot thông qua Audit Logs
        const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.BotAdd }).catch(() => null);
        if (fetchedLogs) {
          const log = fetchedLogs.entries.first();
          if (log && log.targetId === member.user.id && log.executor) {
            const executorId = log.executor.id;
            if (!(await isWhitelisted(guild, executorId))) {
              // Ban luôn người thêm bot lạ
              await punish(guild, executorId, "Anti-Nuke: Cố ý thêm bot lạ vào server");
            }
          }
        }
      } catch (error) {
        console.error("Anti-nuke BotAdd error:", error);
      }
    }
  });

  // 2. Anti Channel Delete
  client.on(Events.ChannelDelete, async (channel) => {
    if (channel.isDMBased()) return;
    const guild = channel.guild;
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete }).catch(() => null);
      if (!fetchedLogs) return;
      const log = fetchedLogs.entries.first();
      if (!log || !log.executor || Date.now() - log.createdTimestamp > 5000) return;
      
      const executorId = log.executor.id;
      if (await isWhitelisted(guild, executorId)) return;
      
      if (checkAndAddStrike(executorId, "channelDelete")) {
        await punish(guild, executorId, "Anti-Nuke: Spam xóa kênh (Channel Delete)");
      }
    } catch (error) {}
  });

  // 3. Anti Channel Create
  client.on(Events.ChannelCreate, async (channel) => {
    if (channel.isDMBased()) return;
    const guild = channel.guild;
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate }).catch(() => null);
      if (!fetchedLogs) return;
      const log = fetchedLogs.entries.first();
      if (!log || !log.executor || Date.now() - log.createdTimestamp > 5000) return;
      
      const executorId = log.executor.id;
      if (await isWhitelisted(guild, executorId)) return;
      
      if (checkAndAddStrike(executorId, "channelCreate")) {
        await punish(guild, executorId, "Anti-Nuke: Spam tạo kênh (Channel Create)");
      }
    } catch (error) {}
  });

  // 4. Anti Role Delete
  client.on(Events.GuildRoleDelete, async (role) => {
    const guild = role.guild;
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete }).catch(() => null);
      if (!fetchedLogs) return;
      const log = fetchedLogs.entries.first();
      if (!log || !log.executor || Date.now() - log.createdTimestamp > 5000) return;
      
      const executorId = log.executor.id;
      if (await isWhitelisted(guild, executorId)) return;
      
      if (checkAndAddStrike(executorId, "roleDelete")) {
        await punish(guild, executorId, "Anti-Nuke: Spam xóa Role (Role Delete)");
      }
    } catch (error) {}
  });

  // 5. Anti Role Create
  client.on(Events.GuildRoleCreate, async (role) => {
    const guild = role.guild;
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate }).catch(() => null);
      if (!fetchedLogs) return;
      const log = fetchedLogs.entries.first();
      if (!log || !log.executor || Date.now() - log.createdTimestamp > 5000) return;
      
      const executorId = log.executor.id;
      if (await isWhitelisted(guild, executorId)) return;
      
      if (checkAndAddStrike(executorId, "roleCreate")) {
        await punish(guild, executorId, "Anti-Nuke: Spam tạo Role (Role Create)");
      }
    } catch (error) {}
  });

  // 6. Anti Ban
  client.on(Events.GuildBanAdd, async (ban) => {
    const guild = ban.guild;
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
      if (!fetchedLogs) return;
      const log = fetchedLogs.entries.first();
      if (!log || !log.executor || Date.now() - log.createdTimestamp > 5000) return;
      
      const executorId = log.executor.id;
      if (await isWhitelisted(guild, executorId)) return;
      
      if (checkAndAddStrike(executorId, "banAdd")) {
        await punish(guild, executorId, "Anti-Nuke: Spam Ban thành viên");
      }
    } catch (error) {}
  });

  // 7. Anti Kick (Member Remove)
  client.on(Events.GuildMemberRemove, async (member) => {
    const guild = member.guild;
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick }).catch(() => null);
      if (!fetchedLogs) return;
      const log = fetchedLogs.entries.first();
      if (!log || !log.executor || log.targetId !== member.user.id || Date.now() - log.createdTimestamp > 5000) return;
      
      const executorId = log.executor.id;
      if (await isWhitelisted(guild, executorId)) return;
      
      if (checkAndAddStrike(executorId, "kick")) {
        await punish(guild, executorId, "Anti-Nuke: Spam Kick thành viên");
      }
    } catch (error) {}
  });

  // 8. Anti Webhook Create
  client.on(Events.WebhooksUpdate, async (channel) => {
    if (channel.isDMBased()) return;
    const guild = channel.guild;
    try {
      const fetchedLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.WebhookCreate }).catch(() => null);
      if (!fetchedLogs) return;
      const log = fetchedLogs.entries.first();
      if (!log || !log.executor || Date.now() - log.createdTimestamp > 5000) return;
      
      const executorId = log.executor.id;
      if (await isWhitelisted(guild, executorId)) return;
      
      if (checkAndAddStrike(executorId, "webhookCreate")) {
        await punish(guild, executorId, "Anti-Nuke: Spam tạo Webhook");
        if (log.target) {
            const webhook = await guild.fetchWebhooks().then(ws => ws.get(log.targetId!)).catch(() => null);
            if (webhook) await webhook.delete("Anti-Nuke").catch(() => {});
        }
      }
    } catch (error) {}
  });
}
