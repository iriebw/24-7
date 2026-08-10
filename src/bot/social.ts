import { Message, EmbedBuilder, AttachmentBuilder } from "discord.js";

export async function handleSocialLinks(message: Message) {
  if (message.author.bot) return;

  const urlRegex = /(https?:\/\/(?:[\w-]+\.)*(?:tiktok\.com|youtube\.com|youtu\.be)[^\s]+)/g;
  const matches = message.content.match(urlRegex);

  if (!matches) return;

  for (const url of matches) {
    try {
      const isTikTok = url.includes("tiktok.com");
      
      if (isTikTok) {
        // Fetch from tikwm.com for TikToks
        const res = await fetch(`https://tikwm.com/api/?url=${url}`);
        const json = await res.json();
        
        if (json.code === 0 && json.data) {
          const entry = json.data;
          
          const embed = new EmbedBuilder()
            .setColor(0x00f2fe)
            .setTitle(entry.title || "Video TikTok")
            .setURL(url)
            .setThumbnail(entry.cover || null);

          let desc = "";
          if (entry.play_count !== undefined) desc += `👁️ **Lượt xem:** ${entry.play_count.toLocaleString()}\n`;
          if (entry.digg_count !== undefined) desc += `❤️ **Tim:** ${entry.digg_count.toLocaleString()}\n`;
          if (entry.comment_count !== undefined) desc += `💬 **Bình luận:** ${entry.comment_count.toLocaleString()}\n`;
          if (entry.share_count !== undefined) desc += `🔄 **Chia sẻ:** ${entry.share_count.toLocaleString()}\n`;
          
          embed.setDescription(desc || "Không có dữ liệu thống kê.");

          // Create attachment if video exists
          const files = [];
          if (entry.play) {
            try {
              const videoRes = await fetch(entry.play);
              const buffer = Buffer.from(await videoRes.arrayBuffer());
              files.push(new AttachmentBuilder(buffer, { name: "tiktok_video.mp4" }));
            } catch (err) {
              console.error("Lỗi khi tải video:", err);
            }
          }

          await message.reply({ embeds: [embed], files });
        }
      } else {
        // We can just ignore YouTube links now since play-dl is used for music, or send a basic embed
        // But previously we used youtube-dl-exec. Now we removed it to fix Render build.
        // So we just ignore youtube links for social stats.
      }
    } catch (err) {
      console.error("Error fetching social link data:", err);
    }
  }
}
