import { Message, EmbedBuilder } from "discord.js";
import youtubedl from "youtube-dl-exec";

export async function handleSocialLinks(message: Message) {
  if (message.author.bot) return;

  const urlRegex = /(https?:\/\/(?:[\w-]+\.)*(?:tiktok\.com|youtube\.com|youtu\.be)[^\s]+)/g;
  const matches = message.content.match(urlRegex);

  if (!matches) return;

  for (const url of matches) {
    try {
      const isTikTok = url.includes("tiktok.com");
      
      const output = await youtubedl(url, {
        dumpJson: true,
        noWarnings: true,
        noCheckCertificates: true
      });

      const entry: any = (output as any).entries ? (output as any).entries[0] : output;
      
      if (entry) {
        const embed = new EmbedBuilder()
          .setColor(isTikTok ? 0x00f2fe : 0xff0000)
          .setTitle(entry.title || "Video")
          .setURL(url)
          .setThumbnail(entry.thumbnail || null);

        let desc = "";
        if (entry.view_count !== undefined) desc += `👁️ **Lượt xem:** ${entry.view_count.toLocaleString()}\n`;
        if (entry.like_count !== undefined) desc += `❤️ **Tim/Like:** ${entry.like_count.toLocaleString()}\n`;
        if (entry.comment_count !== undefined) desc += `💬 **Bình luận:** ${entry.comment_count.toLocaleString()}\n`;
        if (entry.repost_count !== undefined) desc += `🔄 **Chia sẻ:** ${entry.repost_count.toLocaleString()}\n`;

        embed.setDescription(desc || "Không có dữ liệu thống kê.");

        await message.reply({ embeds: [embed] });
      }
    } catch (err) {
      console.error("Error fetching social link data:", err);
    }
  }
}
