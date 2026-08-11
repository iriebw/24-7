import { Message, EmbedBuilder } from "discord.js";

export async function handleSocialLinks(message: Message) {
  if (message.author.bot) return;

  const urlRegex = /(https?:\/\/(?:[\w-]+\.)*(?:tiktok\.com|youtube\.com|youtu\.be)[^\s]+)/g;
  const matches = message.content.match(urlRegex);

  if (!matches) {
    if (message.content.includes("tiktok.com")) {
      console.log("Found tiktok.com but no regex match. Content:", message.content);
    }
    return;
  }

  console.log("Matched URLs:", matches);

  for (const url of matches) {
    try {
      const isTikTok = url.includes("tiktok.com");
      console.log("Processing URL:", url, "isTikTok:", isTikTok);
      
      if (isTikTok) {
        // Fetch from tikwm.com for TikToks to get stats
        console.log(`Fetching stats from tikwm for: ${url}`);
        const res = await fetch(`https://tikwm.com/api/?url=${url}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
            'Accept': 'application/json'
          }
        });
        const json = await res.json();
        
        console.log("tikwm response code:", json.code);
        
        if (json.code === 0 && json.data) {
          const entry = json.data;
          
          let desc = `📱 **Video TikTok từ ${entry.author?.nickname || 'Tiktok'}**`;
          if (entry.title) desc += `\n${entry.title}`;
          
          let stats = [];
          if (entry.play_count !== undefined) stats.push(`👁️ ${entry.play_count.toLocaleString()}`);
          if (entry.digg_count !== undefined) stats.push(`❤️ ${entry.digg_count.toLocaleString()}`);
          if (entry.comment_count !== undefined) stats.push(`💬 ${entry.comment_count.toLocaleString()}`);
          if (entry.share_count !== undefined) stats.push(`🔄 ${entry.share_count.toLocaleString()}`);
          
          if (stats.length > 0) {
            desc += `\n\n📊 Thống kê: ` + stats.join(" | ");
          }

          // Convert URL to tnktok.com for native Discord embedding
          let vxUrl = url.replace(/https?:\/\/(?:[\w-]+\.)*tiktok\.com/, "https://tnktok.com");
          
          console.log("Sending reply with URL:", vxUrl);
          // Reply with both the tnktok link (for video embed) and our stats as text
          await message.reply({ 
            content: `${desc}\n${vxUrl}`, 
            allowedMentions: { repliedUser: false }
          });
          console.log("Reply sent successfully");
        } else {
          console.log("Tikwm API returned error or no data:", json);
        }
      }
    } catch (err) {
      console.error("Error fetching social link data:", err);
    }
  }
}
