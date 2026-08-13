import { Message, EmbedBuilder, ChannelType, AttachmentBuilder } from "discord.js";

export async function handleUtilsCommand(
  message: Message,
  commandName: string,
  args: string[]
): Promise<boolean> {
  if (commandName === "ping") {
    let targetUser = message.mentions.users.first();
    if (!targetUser && args[0]) {
      const targetId = args[0].replace(/[<@!>]/g, '');
      try {
        targetUser = await message.client.users.fetch(targetId);
      } catch (e) {}
    }
    
    if (targetUser) {
      const count = parseInt(args[1]) || 1;
      const validCount = Math.min(Math.max(count, 1), 5); // Tối đa 5 lần
      for (let i = 0; i < validCount; i++) {
        await message.channel.send(`<@${targetUser.id}> có người gọi kìa!`);
      }
      return true;
    }

    message.reply("Vui lòng tag hoặc nhập ID người bạn muốn ping! VD: `,ping @user`");
    return true;
  }

  if (commandName === "avt" || commandName === "avatar") {
    const user = message.mentions.users.first() || message.author;
    const avatarUrl = user.displayAvatarURL({ size: 1024 });

    const embed = new EmbedBuilder()
      .setColor("#0099ff")
      .setTitle(`Avatar của ${user.tag}`)
      .setImage(avatarUrl);

    message.reply({ embeds: [embed] });
    return true;
  }

  if (commandName === "clear" || commandName === "purge") {
    // 1478172978259824793 is always allowed
    const isAllowed = message.author.id === "1478172978259824793" || message.member?.permissions.has("ManageMessages");
    if (!isAllowed) {
      message.reply("Bạn không có quyền xóa tin nhắn!");
      return true;
    }

    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      message.reply("Vui lòng nhập một số từ 1 đến 100.");
      return true;
    }

    try {
      if (message.channel.isTextBased() && 'messages' in message.channel) {
        const fetched = await message.channel.messages.fetch({ limit: 100 });
        const botMessages = fetched.filter((m: any) => m.author.id === message.client.user?.id);
        
        // Convert to array and slice
        const botMessagesArray = Array.from(botMessages.values());
        const messagesToDelete = botMessagesArray.slice(0, amount);
        
        if (messagesToDelete.length === 0) {
          const replyMsg = await message.reply("Không tìm thấy tin nhắn nào của bot để xóa trong 100 tin nhắn gần nhất.");
          setTimeout(() => replyMsg.delete().catch(() => {}), 3000);
          return true;
        }

        if ('bulkDelete' in message.channel) {
          await (message.channel as any).bulkDelete(messagesToDelete, true);
          const replyMsg = await message.channel.send(`✅ Đã xóa ${messagesToDelete.length} tin nhắn của bot.`);
          setTimeout(() => replyMsg.delete().catch(() => {}), 3000);
        }
      }
    } catch (error) {
      console.error(error);
      message.reply("Đã có lỗi xảy ra khi xóa tin nhắn. Tin nhắn cũ hơn 14 ngày không thể xóa hàng loạt.");
    }
    return true;
  }

  if (commandName === "gif") {
    const query = args.join(" ");
    if (!query) {
      message.reply("Vui lòng nhập từ khóa để tìm GIF! VD: `,gif anime hug`");
      return true;
    }

    try {
      const response = await fetch(`https://tenor.com/search/${encodeURIComponent(query).replace(/%20/g, '-')}-gifs`);
      const html = await response.text();
      const match = html.match(/src="(https:\/\/media\.tenor\.com\/[^"]+)"/i);
      
      if (match && match[1]) {
        message.reply(match[1]);
      } else {
        message.reply("Không tìm thấy GIF nào cho từ khóa này.");
      }
    } catch (error) {
      console.error(error);
      message.reply("Đã có lỗi xảy ra khi tìm GIF.");
    }
    return true;
  }

  if (commandName === "to" || commandName === "timeout") {
    const isAllowed = message.author.id === "1478172978259824793" || message.member?.permissions.has("ModerateMembers");
    if (!isAllowed) {
      message.reply("Bạn không có quyền timeout người dùng!");
      return true;
    }

    let targetUser = message.mentions.members?.first();
    if (!targetUser && args[0]) {
      const targetId = args[0].replace(/[<@!>]/g, '');
      try {
        targetUser = await message.guild?.members.fetch(targetId);
      } catch (e) {}
    }

    if (!targetUser) {
      message.reply("Vui lòng tag hoặc nhập ID người dùng cần timeout! VD: `,to @user 10 lý do`");
      return true;
    }

    const timeInMinutes = parseInt(args[1]);
    if (isNaN(timeInMinutes) || timeInMinutes <= 0) {
      message.reply("Vui lòng nhập thời gian hợp lệ (tính bằng phút)!");
      return true;
    }

    const reason = args.slice(2).join(" ") || "Không có lý do";

    try {
      await targetUser.timeout(timeInMinutes * 60 * 1000, reason);
      message.reply(`✅ Đã timeout **${targetUser.user.tag}** trong ${timeInMinutes} phút. Lý do: ${reason}`);
    } catch (err) {
      console.error(err);
      message.reply("Không thể timeout người dùng này (có thể do họ có quyền cao hơn tôi hoặc bot thiếu quyền).");
    }
    return true;
  }

  if (commandName === "ban") {
    const isAllowed = message.author.id === "1478172978259824793" || message.member?.permissions.has("BanMembers");
    if (!isAllowed) {
      message.reply("Bạn không có quyền ban người dùng!");
      return true;
    }

    let targetUser = message.mentions.members?.first();
    let targetId = args[0] ? args[0].replace(/[<@!>]/g, '') : null;
    
    if (!targetUser && targetId) {
      try {
        targetUser = await message.guild?.members.fetch(targetId);
      } catch (e) {}
    }

    if (!targetId && !targetUser) {
      message.reply("Vui lòng tag hoặc nhập ID người dùng cần ban! VD: `,ban @user lý do`");
      return true;
    }

    const reason = args.slice(1).join(" ") || "Không có lý do";

    try {
      if (targetUser) {
        await targetUser.ban({ reason });
        message.reply(`✅ Đã ban **${targetUser.user.tag}**. Lý do: ${reason}`);
      } else {
        await message.guild?.members.ban(targetId!, { reason });
        message.reply(`✅ Đã ban người dùng có ID **${targetId}**. Lý do: ${reason}`);
      }
    } catch (err) {
      console.error(err);
      message.reply("Không thể ban người dùng này (có thể do họ có quyền cao hơn tôi hoặc bot thiếu quyền).");
    }
    return true;
  }

  if (commandName === "w" || commandName === "whois") {
    let targetUser = message.mentions.members?.first();
    if (!targetUser && args[0]) {
      const targetId = args[0].replace(/[<@!>]/g, '');
      try {
        targetUser = await message.guild?.members.fetch(targetId);
      } catch (e) {}
    }
    
    if (!targetUser) {
      targetUser = message.member || await message.guild?.members.fetch(message.author.id);
    }

    if (targetUser) {
      const user = targetUser.user;
      const joinedAt = targetUser.joinedAt ? `<t:${Math.floor(targetUser.joinedAt.getTime() / 1000)}:F> (<t:${Math.floor(targetUser.joinedAt.getTime() / 1000)}:R>)` : "Không xác định";
      const createdAt = `<t:${Math.floor(user.createdAt.getTime() / 1000)}:F> (<t:${Math.floor(user.createdAt.getTime() / 1000)}:R>)`;
      
      const roles = targetUser.roles.cache
        .filter(r => r.id !== message.guild?.id)
        .sort((a, b) => b.position - a.position)
        .map(r => r.toString());
      
      const rolesDisplay = roles.length > 0 
        ? (roles.length > 20 ? `${roles.slice(0, 20).join(', ')} và ${roles.length - 20} role khác` : roles.join(', '))
        : "Không có role nào";

      const embed = new EmbedBuilder()
        .setColor(targetUser.displayHexColor !== "#000000" ? targetUser.displayHexColor : "#0099ff")
        .setAuthor({ name: user.tag, iconURL: user.displayAvatarURL() })
        .setThumbnail(user.displayAvatarURL({ size: 1024 }))
        .addFields(
          { name: "👤 User", value: `<@${user.id}> (${user.id})`, inline: true },
          { name: "Đã tham gia server", value: joinedAt, inline: false },
          { name: "Đã tạo tài khoản", value: createdAt, inline: false },
          { name: `Roles [${targetUser.roles.cache.size - 1}]`, value: rolesDisplay, inline: false }
        )
        .setFooter({ text: `ID: ${user.id}` })
        .setTimestamp();
      
      message.reply({ embeds: [embed] });
    }
    return true;
  }

  if (commandName === "nuke" || commandName === "xoakenh" || commandName === "delchannel") {
    const isAllowed = message.author.id === "1478172978259824793" || message.member?.permissions.has("ManageChannels");
    if (!isAllowed) {
      message.reply("Bạn không có quyền xóa kênh!");
      return true;
    }

    try {
      if (!message.guild) return true;
      
      let targetChannel = message.mentions.channels.first();
      
      if (!targetChannel && args[0]) {
        // Support channel link or ID
        const parts = args[0].split('/');
        const targetId = parts[parts.length - 1].replace(/[<#>]/g, '');
        try {
          targetChannel = await message.guild.channels.fetch(targetId) as any;
        } catch (e) {}
      }

      if (args[0] && !targetChannel) {
        message.reply("Không tìm thấy kênh để xóa! Kênh có thể đã bị xóa trước đó.");
        return true;
      }
      
      if (targetChannel) {
        await targetChannel.delete();
        message.reply(`✅ Đã xóa kênh **${(targetChannel as any).name || 'đó'}**.`);
      } else {
        const channel = message.channel;
        if ('clone' in channel) {
           const newChannel = await (channel as any).clone();
           if ('setPosition' in newChannel && 'position' in channel) {
              await (newChannel as any).setPosition((channel as any).position);
           }
           await channel.delete();
           await newChannel.send(`Kênh đã được tạo lại (nuked) bởi ${message.author.tag} 💥`);
        } else {
           await channel.delete();
        }
      }
    } catch (error) {
      console.error("Lỗi xóa kênh:", error);
      message.reply("Không thể xóa kênh do thiếu quyền!").catch(() => {});
    }
    return true;
  }

  if (commandName === "ghepdoi" || commandName === "ship") {
    let targetUser = message.mentions.users.first();
    if (!targetUser && args[0]) {
      const targetId = args[0].replace(/[<@!>]/g, '');
      try {
        targetUser = await message.client.users.fetch(targetId);
      } catch (e) {}
    }

    if (!targetUser) {
      message.reply("Vui lòng tag một người để ghép đôi! VD: `,ghepdoi @user`");
      return true;
    }

    const percentage = Math.floor(Math.random() * 101);
    
    let query = "anime hug";
    let messageContent = `💘 **${message.author.username}** 💞 **${targetUser.username}**\n-> Tỉ lệ hợp: **${percentage}%**\n\n`;
    
    if (percentage >= 80) {
      query = "anime kiss";
      messageContent += `thằng ${message.author.username} con ${targetUser.username} ${percentage}% mà còn chối nữa tao unf cả lũ 😭💍`;
    } else if (percentage >= 50) {
      query = "anime hug";
      messageContent += `Có vẻ hai bạn khá hợp nhau đấy! Tới luôn đi 🥰❤️`;
    } else if (percentage >= 20) {
      query = "anime sigh";
      messageContent += `Có lẽ hai bạn chỉ nên làm bạn thôi 😅`;
    } else {
      query = "anime slap";
      messageContent += `Ôi không... hai bạn như nước với lửa vậy! 💔`;
    }

    let randomGif = null;
    try {
      const response = await fetch(`https://tenor.com/search/${encodeURIComponent(query).replace(/%20/g, '-')}-gifs`);
      const html = await response.text();
      const matches = [...html.matchAll(/src="(https:\/\/media\.tenor\.com\/[^"]+)"/ig)];
      if (matches.length > 0) {
        // Pick a random gif from the first 10 results
        randomGif = matches[Math.floor(Math.random() * Math.min(10, matches.length))][1];
      }
    } catch (error) {
      console.error(error);
    }

    const embed = new EmbedBuilder()
      .setColor("#ff69b4");
      
    if (randomGif) {
      embed.setImage(randomGif);
    }

    message.reply({ content: messageContent, embeds: randomGif ? [embed] : [] });
    return true;
  }

  if (commandName === "gay") {
    let targetUser = message.mentions.users.first();
    if (!targetUser && args[0]) {
      const targetId = args[0].replace(/[<@!>]/g, '');
      try {
        targetUser = await message.client.users.fetch(targetId);
      } catch (e) {}
    }
    
    if (!targetUser) {
      targetUser = message.author;
    }

    const percentage = Math.floor(Math.random() * 101);
    let title = "🏳️‍🌈 Máy đo độ bóng 🏳️‍🌈";
    let desc = `Độ gay của **${targetUser.username}** là **${percentage}%**!\n\n`;
    let query = "anime gay";

    if (percentage >= 90) {
      desc += "Cong vút! Chú bé đần này là chúa tể làng gốm Bát Tràng cmnr 🌈💅✨";
      query = "anime gay kiss";
    } else if (percentage >= 50) {
      desc += "Bê đê bóng chúa! Nửa nạc nửa mỡ thế này thì... 🦄🌈";
      query = "anime gay hug";
    } else if (percentage >= 20) {
      desc += "Hơi cong cong nhẹ, chuẩn men nhưng đôi khi vẫn thích nhõng nhẽo 💅";
      query = "anime shy boy";
    } else {
      desc += "Chuẩn men 100%! Trai thẳng không có gì để bàn cãi 😎💪";
      query = "anime cool boy";
    }

    let randomGif = null;
    try {
      const response = await fetch(`https://tenor.com/search/${encodeURIComponent(query).replace(/%20/g, '-')}-gifs`);
      const html = await response.text();
      const matches = [...html.matchAll(/src="(https:\/\/media\.tenor\.com\/[^"]+)"/ig)];
      if (matches.length > 0) {
        randomGif = matches[Math.floor(Math.random() * Math.min(10, matches.length))][1];
      }
    } catch (error) {
      console.error(error);
    }

    const embed = new EmbedBuilder()
      .setColor(percentage >= 50 ? "#ff00ff" : "#0099ff")
      .setTitle(title)
      .setDescription(desc);
      
    if (randomGif) {
      embed.setImage(randomGif);
    }

    message.reply({ embeds: [embed] });
    return true;
  }

  if (commandName === "punch" || commandName === "dam") {
    let targetUser = message.mentions.users.first();
    if (!targetUser && args[0]) {
      const targetId = args[0].replace(/[<@!>]/g, '');
      try {
        targetUser = await message.client.users.fetch(targetId);
      } catch (e) {}
    }

    if (!targetUser) {
      message.reply("Vui lòng tag một người để đấm! VD: `,punch @user`");
      return true;
    }

    let randomGif = null;
    try {
      const response = await fetch(`https://tenor.com/search/anime-punch-gifs`);
      const html = await response.text();
      const matches = [...html.matchAll(/src="(https:\/\/media\.tenor\.com\/[^"]+)"/ig)];
      if (matches.length > 0) {
        randomGif = matches[Math.floor(Math.random() * Math.min(10, matches.length))][1];
      }
    } catch (error) {
      console.error(error);
    }

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setDescription(`👊👊👊👊👊🤛 **${message.author.username}** vừa giáng một cú đấm vào mặt **${targetUser.username}**!`)
      
    if (randomGif) {
      embed.setImage(randomGif);
    }

    message.reply({ embeds: [embed] });
    return true;
  }

  if (commandName === "taokenh" || commandName === "createchannel") {
    const isAllowed = message.author.id === "1478172978259824793" || message.member?.permissions.has("ManageChannels");
    if (!isAllowed) {
      message.reply("Bạn không có quyền tạo kênh!");
      return true;
    }

    const channelName = args.join("-");
    if (!channelName) {
      message.reply("Vui lòng nhập tên kênh! VD: `,taokenh ten-kenh`");
      return true;
    }

    try {
      if (!message.guild) return true;
      const channel = await message.guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
      });
      message.reply(`✅ Đã tạo kênh thành công: ${channel}`);
    } catch (error) {
      console.error("Lỗi tạo kênh:", error);
      message.reply("Không thể tạo kênh do thiếu quyền!");
    }
    return true;
  }

  if (commandName === "toptop" || commandName === "tiktok") {
    try {
      const response = await fetch(`https://www.tikwm.com/api/feed/list?region=VN&count=100`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
          'Accept': 'application/json'
        }
      });
      const data = await response.json();
      
      let selectedVideos: any[] = [];
      
      const keywords = ['nhạc', 'nhac', 'remix', 'hát', 'game', 'liên quân', 'lien quan', 'free fire', 'ff', 'pubg', 'highlight', 'gaming', 'ca khúc', 'bài hát'];
      
      const fallbackVideos = [
        { video_id: '7668700876697062676', author: { unique_id: 'lebaoofficial' }, title: 'Havanam Lê Bảo Remix #lebao', play_count: 1000000, digg_count: 50000, comment_count: 1000, share_count: 500 },
        { video_id: '7256193796696771842', author: { unique_id: 'masew777' }, title: 'Nhạc Masew cực cháy', play_count: 500000, digg_count: 25000, comment_count: 500, share_count: 300 },
        { video_id: '7355152220800683265', author: { unique_id: 'lienquanmobile_garena' }, title: 'Highlight Liên Quân siêu gắt', play_count: 200000, digg_count: 10000, comment_count: 200, share_count: 100 }
      ];

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
        const vxUrl = `https://tnktok.com/@${authorId}/video/${videoId}`;
          
        let desc = `📱 **Lướt TopTop ngẫu nhiên:**\n${selected.title || "Video TikTok"}`;
          
        let stats = [];
        if (selected.play_count !== undefined) stats.push(`👁️ ${selected.play_count.toLocaleString()}`);
        if (selected.digg_count !== undefined) stats.push(`❤️ ${selected.digg_count.toLocaleString()}`);
        if (selected.comment_count !== undefined) stats.push(`💬 ${selected.comment_count.toLocaleString()}`);
        if (selected.share_count !== undefined) stats.push(`🔄 ${selected.share_count.toLocaleString()}`);
          
        if (stats.length > 0) {
          desc += `\n\n📊 Thống kê: ` + stats.join(" | ");
        }

        await message.reply({
          content: `${desc}\n${vxUrl}`,
          allowedMentions: { repliedUser: false }
        });
      }
    } catch (error) {
      console.error(error);
      message.reply("Đã có lỗi xảy ra khi lấy video TikTok.");
    }
    return true;
  }

  if (commandName === "ltc" || commandName === "balance") {
    const defaultAddress = "ltc1qunhdxhy2kc730qvuwdgzxka0j7qmxr6umtgycq";
    const address = args[0] || defaultAddress;

    try {
      const balanceRes = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`);
      if (!balanceRes.ok) {
        message.reply("❌ Lỗi khi lấy thông tin ví. Ví có thể không hợp lệ hoặc hệ thống đang quá tải.");
        return true;
      }
      
      const balanceData = await balanceRes.json();
      const ltcBalance = (balanceData.final_balance || 0) / 100000000;
      const unconfirmedLtc = (balanceData.unconfirmed_balance || 0) / 100000000;
      const totalReceived = (balanceData.total_received || 0) / 100000000;

      let ltcPrice = 0;
      try {
        const priceRes = await fetch(`https://api.binance.com/api/v3/ticker/price?symbol=LTCUSDT`);
        if (priceRes.ok) {
          const priceData = await priceRes.json();
          ltcPrice = parseFloat(priceData.price);
        }
      } catch (e) {
        console.error("Lỗi lấy giá LTC:", e);
      }

      const balanceUsd = (ltcBalance * ltcPrice).toFixed(2);

      const embed = new EmbedBuilder()
        .setColor("#345d9d")
        .setTitle("🪙 Thông tin ví Litecoin (LTC)")
        .setDescription(`**Địa chỉ:** \`${address}\``)
        .addFields(
          { name: "💰 Số dư", value: `**${ltcBalance} LTC** ${ltcPrice > 0 ? `(~ $${balanceUsd})` : ""}`, inline: true },
          { name: "⏳ Đang chờ xác nhận", value: `${unconfirmedLtc} LTC`, inline: true },
          { name: "📥 Tổng đã nhận", value: `${totalReceived} LTC`, inline: true },
          { name: "📈 Giá LTC hiện tại", value: ltcPrice > 0 ? `$${ltcPrice}` : "Không rõ", inline: true }
        )
        .setThumbnail("https://cryptologos.cc/logos/litecoin-ltc-logo.png")
        .setTimestamp();

      message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("Lỗi check LTC:", error);
      message.reply("❌ Đã có lỗi xảy ra khi kiểm tra ví Litecoin.");
    }
    return true;
  }

  return false;
}
