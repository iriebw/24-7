import { Client, VoiceState, ChannelType, CategoryChannel, VoiceChannel, Message, PermissionsBitField } from "discord.js";

const setupData = new Map<string, string>(); // GuildID -> Master Voice Channel ID
const tempChannels = new Map<string, string>(); // Temp Channel ID -> Owner ID

export async function handleSetupVoiceCommand(message: Message, commandName: string) {
  if (commandName !== "setup") return false;

  const args = message.content.trim().split(/ +/);
  if (args[1]?.toLowerCase() !== "voice") return false;

  if (!message.member?.permissions.has(PermissionsBitField.Flags.ManageChannels) && message.author.id !== "1478172978259824793") {
    message.reply("Bạn không có quyền quản lý kênh!");
    return true;
  }

  const guild = message.guild;
  if (!guild) return true;

  try {
    const category = await guild.channels.create({
      name: "Treo Voice",
      type: ChannelType.GuildCategory,
    });

    const masterChannel = await guild.channels.create({
      name: "➕ Tạo phòng",
      type: ChannelType.GuildVoice,
      parent: category.id,
    });

    setupData.set(guild.id, masterChannel.id);
    message.reply(`✅ Đã setup thành công! Hãy vào kênh **${masterChannel.name}** để tự động tạo phòng.`);
  } catch (err) {
    console.error(err);
    message.reply("❌ Không thể tạo kênh. Vui lòng kiểm tra quyền của bot (Manage Channels)!");
  }

  return true;
}

export function setupVoiceEvents(client: Client) {
  client.on("voiceStateUpdate", async (oldState: VoiceState, newState: VoiceState) => {
    const member = newState.member;
    if (!member) return;

    const guild = newState.guild;
    const masterChannelId = setupData.get(guild.id);

    // Join Master Channel to create new channel
    if (masterChannelId && newState.channelId === masterChannelId) {
      try {
        const masterChannel = await guild.channels.fetch(masterChannelId) as VoiceChannel;
        const newChannel = await guild.channels.create({
          name: `Phòng của ${member.user.username}`,
          type: ChannelType.GuildVoice,
          parent: masterChannel.parentId,
          permissionOverwrites: [
            {
              id: guild.roles.everyone.id,
              allow: [],
            },
            {
              id: member.id,
              allow: [PermissionsBitField.Flags.ManageChannels, PermissionsBitField.Flags.MoveMembers],
            },
          ],
        });

        tempChannels.set(newChannel.id, member.id);
        await member.voice.setChannel(newChannel);
      } catch (err) {
        console.error("Error creating temp channel:", err);
      }
    }

    // Leave a Temp Channel -> delete if empty
    if (oldState.channelId && tempChannels.has(oldState.channelId)) {
      const channelId = oldState.channelId;
      try {
        const channel = await guild.channels.fetch(channelId) as VoiceChannel | null;
        if (channel && channel.members.size === 0) {
          await channel.delete();
          tempChannels.delete(channelId);
        }
      } catch (err) {
        console.error("Error deleting temp channel:", err);
      }
    }
  });
}
