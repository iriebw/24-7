import { Client, Events, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async () => {
    try {
        const channel = await client.channels.fetch('1333796580976529431');
        if (channel && channel.isTextBased()) {
             const embed = new EmbedBuilder()
                 .setColor(0xff0000)
                 .setTitle("Thống kê")
                 .setDescription("❤️ Tim: 1000\n💬 Bình luận: 200");
             
             await channel.send({ 
                 content: 'https://vxtiktok.com/@lebaoofficial/video/7668700876697062676',
                 embeds: [embed]
             });
             console.log("Sent mixed message");
        }
    } catch (e) {
        console.error(e);
    }
    client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
