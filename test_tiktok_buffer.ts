import { Client, Events, GatewayIntentBits, AttachmentBuilder, EmbedBuilder } from 'discord.js';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once(Events.ClientReady, async () => {
    console.log("Ready");
    try {
        const response = await fetch('https://www.tikwm.com/api/feed/list?region=VN&count=1');
        const data = await response.json();
        const v = data.data[0];
        
        console.log("Video URL:", v.play);
        
        // Fetch the video buffer
        const videoResponse = await fetch(v.play, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36'
            }
        });
        const buffer = Buffer.from(await videoResponse.arrayBuffer());
        console.log("Buffer size:", buffer.length);
        
    } catch (e) {
        console.error(e);
    }
    client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
