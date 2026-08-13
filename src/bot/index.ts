import {
  Client,
  GatewayIntentBits,
  Message,
  Partials,
  Events,
  ActivityType,
} from "discord.js";
import { setupAntiNuke } from "./antinuke.js";
import { handleMusicCommand } from "./music.js";
import { handleUtilsCommand } from "./utils.js";
import { handleAfkCommand, checkAfkStatus } from "./afk.js";
import { handleSocialLinks } from "./social.js";
import { handleSetupVoiceCommand, setupVoiceEvents } from "./voice.js";
import { setupAntiSpam } from "./antispam.js";
import { setupSnipe } from "./snipe.js";
import { setupChatCommand } from "./chat.js";

const PREFIX = ",";

export const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildModeration, // For anti-nuke
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.on(Events.ClientReady, () => {
  console.log(`Bot logged in as ${client.user?.tag}`);
  client.user?.setActivity(",help | Quản lý SV & Nhạc", {
    type: ActivityType.Playing,
  });
});

// Setup Anti-Nuke Event Listeners
setupAntiNuke(client);

// Setup Voice Channel Events
setupVoiceEvents(client);

// Setup Anti-Spam
setupAntiSpam(client);

// Setup Snipe Command
setupSnipe(client);

// Setup Chat Command
setupChatCommand(client);

client.on(Events.MessageCreate, async (message: Message) => {
  // Ignore bots
  if (message.author.bot) return;

  // Check AFK status (removes AFK if user speaks, replies if mentioned users are AFK)
  await checkAfkStatus(message);

  // Auto detect TikTok and YouTube links
  await handleSocialLinks(message);

  // Ignore messages without prefix
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  if (!commandName) return;

  try {
    // Handle music commands (play, skip, queue, join, stop)
    const isMusic = await handleMusicCommand(message, commandName, args);
    if (isMusic) return;

    // Handle utility commands (ping, avt)
    const isUtils = await handleUtilsCommand(message, commandName, args);
    if (isUtils) return;

    // Handle voice setup command
    const isSetupVoice = await handleSetupVoiceCommand(message, commandName);
    if (isSetupVoice) return;

    // Handle AFK command
    const isAfk = await handleAfkCommand(message, commandName, args);
    if (isAfk) return;

    if (commandName === "help") {
      message.reply(
        "**Danh sách lệnh:**\n" +
          "🛡️ **Quản trị:** `,to @user [phút] [lý do]` (Timeout), `,ban @user [lý do]`, `,clear [số lượng]`, `,setup voice`, `,nuke` (Xóa/tạo lại kênh), `,taokenh [tên]`\n" +
          "🛡️ **Anti-Nuke:** Hệ thống tự động theo dõi và khóa những kẻ spam xóa kênh/role.\n" +
          "🎵 **Nhạc:** `,play <tên bài/link>`, `,join`, `,leave`, `,skip`, `,queue`, `,stop`\n" +
          "🛠️ **Tiện ích:** `,ping`, `,avt [@user]`, `,w [@user]` (Whois), `,afk [lý do]`, `,gif [từ khóa]`, `/snipe`, `,ghepdoi [@user]`, `,punch [@user]`, `,gay [@user]`, `,toptop`, `,ltc [ví]`"
      );
    }
  } catch (error) {
    console.error(error);
    message.reply("Đã có lỗi xảy ra khi thực hiện lệnh!");
  }
});

let isBotRunning = false;

export async function startBot() {
  if (isBotRunning) return true;
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error("DISCORD_TOKEN is not set in environment variables!");
    return false;
  }

  try {
    await client.login(token);
    isBotRunning = true;
    return true;
  } catch (e) {
    console.error("Failed to start bot:", e);
    return false;
  }
}

export async function stopBot() {
  if (!isBotRunning) return true;
  try {
    await client.destroy();
    isBotRunning = false;
    return true;
  } catch (e) {
    console.error("Failed to stop bot:", e);
    return false;
  }
}

export function getBotStatus() {
  return isBotRunning;
}
