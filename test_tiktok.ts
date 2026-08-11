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
        
        const channel = await client.channels.fetch('1333796580976529431');
        if (channel && channel.isTextBased()) {
             const embed = new EmbedBuilder()
                .setColor("#00FFFF")
                .setDescription(`**${v.title}**\n\n👁️ Lượt xem: ${v.play_count.toLocaleString()}\n❤️ Tim: ${v.digg_count.toLocaleString()}\n💬 Bình luận: ${v.comment_count.toLocaleString()}\n🔄 Chia sẻ: ${v.share_count.toLocaleString()}`)
                .setThumbnail(v.cover);
             
             // Option 1: Attach using AttachmentBuilder and the play URL
             const attachment = new AttachmentBuilder(v.play, { name: 'tiktok.mp4' });
             await channel.send({ embeds: [embed], files: [attachment] });
             console.log("Sent successfully");
        }
    } catch (e) {
        console.error(e);
    }
    client.destroy();
});

client.login(process.env.DISCORD_TOKEN);
