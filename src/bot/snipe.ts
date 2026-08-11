import { Client, EmbedBuilder, Message, Events, REST, Routes } from "discord.js";

interface StoredMessage {
  id: string;
  authorId: string;
  authorTag: string;
  content: string;
  createdTimestamp: number;
  attachments: string[];
  isDeleted: boolean;
}

// Store up to 500 messages by channel ID
const snipes = new Map<string, StoredMessage[]>();

export function setupSnipe(client: Client) {
  // Listen for new messages
  client.on(Events.MessageCreate, (message) => {
    if (message.author?.bot) return;

    const channelSnipes = snipes.get(message.channelId) || [];
    
    channelSnipes.unshift({
      id: message.id,
      authorId: message.author.id,
      authorTag: message.author.tag,
      content: message.content || "",
      createdTimestamp: message.createdTimestamp,
      attachments: message.attachments.map(a => a.url),
      isDeleted: false
    });

    if (channelSnipes.length > 500) {
      channelSnipes.pop();
    }
    
    snipes.set(message.channelId, channelSnipes);
  });

  // Listen for deleted messages
  client.on(Events.MessageDelete, (message) => {
    if (message.partial) return; // Ignore partial messages (not cached)
    if (message.author?.bot) return; // Ignore bots
    
    const channelSnipes = snipes.get(message.channelId) || [];
    
    const storedMsg = channelSnipes.find(m => m.id === message.id);
    if (storedMsg) {
      storedMsg.isDeleted = true;
    } else {
      channelSnipes.unshift({
        id: message.id,
        authorId: message.author.id,
        authorTag: message.author.tag,
        content: message.content || "",
        createdTimestamp: message.createdTimestamp,
        attachments: message.attachments.map(a => a.url),
        isDeleted: true
      });
      
      if (channelSnipes.length > 500) {
        channelSnipes.pop();
      }
      snipes.set(message.channelId, channelSnipes);
    }
  });

  // Register the slash command when bot is ready
  client.once(Events.ClientReady, async () => {
    if (!client.user) return;
    try {
      const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
      
      const commands = [
        {
          name: "snipe",
          description: "Xem tin nhắn đã gửi và đã xóa (chỉ mình bạn thấy)",
          options: [
            {
              name: "nguoi_dung",
              description: "Xem tin nhắn của một người cụ thể",
              type: 6, // USER
              required: false,
            }
          ]
        },
        {
          name: "chat",
          description: "Gửi tin nhắn ẩn danh / trực tiếp cho người khác qua bot",
          options: [
            {
              name: "nguoi_dung",
              description: "Người bạn muốn gửi tin nhắn",
              type: 6, // USER
              required: true,
            },
            {
              name: "noi_dung",
              description: "Nội dung tin nhắn muốn gửi",
              type: 3, // STRING
              required: true,
            }
          ]
        }
      ];

      console.log("Started refreshing application (/) commands.");
      await rest.put(Routes.applicationCommands(client.user.id), { body: commands });
      console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
      console.error("Error registering slash commands:", error);
    }
  });

  // Handle the slash command interaction
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "snipe") {
      let channelSnipes = snipes.get(interaction.channelId) || [];
      
      const targetUser = interaction.options.getUser("nguoi_dung");
      if (targetUser) {
        channelSnipes = channelSnipes.filter(m => m.authorId === targetUser.id);
      }

      if (channelSnipes.length === 0) {
        await interaction.reply({
          content: targetUser ? `Không có tin nhắn nào của ${targetUser.tag} được lưu gần đây!` : "Không có tin nhắn nào được lưu gần đây!",
          ephemeral: true,
        });
        return;
      }

      let description = "";
      // Lấy tối đa 30 tin nhắn gần nhất để hiển thị
      const toDisplay = channelSnipes.slice(0, 30);
      const reversed = [...toDisplay].reverse();

      for (const msg of reversed) {
        const time = `<t:${Math.floor(msg.createdTimestamp / 1000)}:f>`;
        let content = msg.content || "";
        
        if (msg.attachments.length > 0) {
          const attachmentUrls = msg.attachments.map(a => `[Đính kèm](${a})`).join(" ");
          content += ` ${attachmentUrls}`;
        }
        if (!content.trim()) content = "*Không có nội dung*";
        
        const status = msg.isDeleted ? " 🗑️ (Đã xóa)" : "";
        const entry = `**${msg.authorTag}** (${time})${status}: ${content}\n\n`;
        
        if (description.length + entry.length > 4000) {
          // Bỏ qua các tin nhắn quá dài không thể hiển thị trong embed
          continue;
        }
        description += entry;
      }

      const embed = new EmbedBuilder()
        .setTitle(targetUser ? `Tin nhắn của ${targetUser.tag}` : "Tin nhắn trong kênh (Bao gồm đã xóa)")
        .setDescription(description || "*Không thể hiển thị tin nhắn*")
        .setColor(0x0099ff)
        .setFooter({ text: `Snipe 📸 - Đã hiển thị ${toDisplay.length}/${channelSnipes.length} tin nhắn` });
      
      await interaction.reply({ 
        embeds: [embed],
        ephemeral: true
      });
    }
  });
}

