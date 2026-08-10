import { Client, EmbedBuilder, Message, Events, REST, Routes } from "discord.js";

// Store up to 10 deleted messages by channel ID
const snipes = new Map<string, Message[]>();

export function setupSnipe(client: Client) {
  // Listen for deleted messages
  client.on(Events.MessageDelete, (message) => {
    if (message.partial) return; // Ignore partial messages (not cached)
    if (message.author?.bot) return; // Ignore bots
    
    const channelSnipes = snipes.get(message.channelId) || [];
    channelSnipes.unshift(message as Message);
    
    // Keep only the last 10 deleted messages
    if (channelSnipes.length > 10) {
      channelSnipes.pop();
    }
    
    snipes.set(message.channelId, channelSnipes);
  });

  // Register the slash command when bot is ready
  client.once(Events.ClientReady, async () => {
    if (!client.user) return;
    try {
      const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_TOKEN!);
      
      const commands = [
        {
          name: "snipe",
          description: "Xem tin nhắn đã xóa (snipe)",
          options: [
            {
              name: "nguoi_dung",
              description: "Xem tin nhắn đã xóa của một người cụ thể",
              type: 6, // USER
              required: false,
            }
          ]
        },
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
        channelSnipes = channelSnipes.filter(m => m.author.id === targetUser.id);
      }

      if (channelSnipes.length === 0) {
        await interaction.reply({
          content: targetUser ? `Không có tin nhắn nào bị xóa của ${targetUser.tag} gần đây!` : "Không có tin nhắn nào bị xóa gần đây!",
          ephemeral: true,
        });
        return;
      }

      // Chỉ lấy tin nhắn bị xóa gần nhất
      const snipe = channelSnipes[0];

      const embed = new EmbedBuilder()
        .setAuthor({
          name: snipe.author.tag,
          iconURL: snipe.author.displayAvatarURL() || undefined,
        })
        .setDescription(snipe.content || "*Không có nội dung chữ*")
        .setColor(0xff0000)
        .setFooter({ text: `Snipe 📸` })
        .setTimestamp(snipe.createdTimestamp);

      // Add image if there is one
      if (snipe.attachments.size > 0) {
        const image = snipe.attachments.find((a) => a.contentType?.startsWith("image/"));
        if (image) {
          embed.setImage(image.url);
        }
      }
      
      await interaction.reply({ 
        content: targetUser ? `Tin nhắn đã xóa gần nhất của ${targetUser.tag}:` : "Tin nhắn đã xóa gần nhất:",
        embeds: [embed] 
      });
    }
  });
}

