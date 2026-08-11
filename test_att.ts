import { Client, Events, GatewayIntentBits, AttachmentBuilder } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async () => {
    try {
        const channel = await client.channels.fetch('1333796580976529431');
        if (channel && channel.isTextBased()) {
             // Let's pass the URL to AttachmentBuilder
             const attachment = new AttachmentBuilder('https://tikwm.com/video/media/play/7668700876697062676.mp4', { name: 'tiktok.mp4' });
             await channel.send({ files: [attachment] });
             console.log("Sent URL attachment");
        }
    } catch (e) {
        console.error(e);
    }
    client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
