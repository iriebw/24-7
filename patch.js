const fs = require('fs');
let code = fs.readFileSync('src/bot/utils.ts', 'utf-8');

const oldCode = `      if (data && data.data && data.data.length > 0) {
        let vnVideos = data.data.filter((v: any) => v.region === 'VN' && v.title && keywords.some(k => v.title.toLowerCase().includes(k)));
        
        // If no music/game found, fallback to general VN videos
        if (vnVideos.length === 0) {
           vnVideos = data.data.filter((v: any) => v.region === 'VN');
        }
        
        const videosToUse = vnVideos.length > 0 ? vnVideos : fallbackVideos;
        const shuffled = videosToUse.sort(() => 0.5 - Math.random());
        selected = shuffled[0];
      } else {
        const shuffled = fallbackVideos.sort(() => 0.5 - Math.random());
        selected = shuffled[0];
      }
      
      const videoId = selected.video_id || selected.id;
      const authorId = selected.author?.unique_id || 'tiktok';
      const vxUrl = \`https://tnktok.com/@\${authorId}/video/\${videoId}\`;
        
      let desc = \`📱 **Lướt TopTop ngẫu nhiên:**\\n\${selected.title || "Video TikTok"}\`;
        
      let stats = [];
      if (selected.play_count !== undefined) stats.push(\`👁️ \${selected.play_count.toLocaleString()}\`);
      if (selected.digg_count !== undefined) stats.push(\`❤️ \${selected.digg_count.toLocaleString()}\`);
      if (selected.comment_count !== undefined) stats.push(\`💬 \${selected.comment_count.toLocaleString()}\`);
      if (selected.share_count !== undefined) stats.push(\`🔄 \${selected.share_count.toLocaleString()}\`);
        
      if (stats.length > 0) {
        desc += \`\\n\\n📊 Thống kê: \` + stats.join(" | ");
      }

      await message.reply({
        content: \`\${desc}\\n\${vxUrl}\`,
        allowedMentions: { repliedUser: false }
      });`;

const newCode = `      let selectedVideos: any[] = [];
      
      if (data && data.data && data.data.length > 0) {
        let vnVideos = data.data.filter((v: any) => v.region === 'VN' && v.title && keywords.some(k => v.title.toLowerCase().includes(k)));
        
        // If no music/game found, fallback to general VN videos
        if (vnVideos.length === 0) {
           vnVideos = data.data.filter((v: any) => v.region === 'VN');
        }
        
        const videosToUse = vnVideos.length > 0 ? vnVideos : fallbackVideos;
        const shuffled = videosToUse.sort(() => 0.5 - Math.random());
        selectedVideos = shuffled.slice(0, 3);
      } else {
        const shuffled = fallbackVideos.sort(() => 0.5 - Math.random());
        selectedVideos = shuffled.slice(0, 3);
      }
      
      for (const selected of selectedVideos) {
        const videoId = selected.video_id || selected.id;
        const authorId = selected.author?.unique_id || 'tiktok';
        const vxUrl = \`https://tnktok.com/@\${authorId}/video/\${videoId}\`;
          
        let desc = \`📱 **Lướt TopTop ngẫu nhiên:**\\n\${selected.title || "Video TikTok"}\`;
          
        let stats = [];
        if (selected.play_count !== undefined) stats.push(\`👁️ \${selected.play_count.toLocaleString()}\`);
        if (selected.digg_count !== undefined) stats.push(\`❤️ \${selected.digg_count.toLocaleString()}\`);
        if (selected.comment_count !== undefined) stats.push(\`💬 \${selected.comment_count.toLocaleString()}\`);
        if (selected.share_count !== undefined) stats.push(\`🔄 \${selected.share_count.toLocaleString()}\`);
          
        if (stats.length > 0) {
          desc += \`\\n\\n📊 Thống kê: \` + stats.join(" | ");
        }

        await message.reply({
          content: \`\${desc}\\n\${vxUrl}\`,
          allowedMentions: { repliedUser: false }
        });
      }`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/bot/utils.ts', code);
  console.log("Replaced successfully!");
} else {
  console.log("Could not find the target codeblock.");
}
