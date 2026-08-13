import { Message, EmbedBuilder } from "discord.js";

export async function handleCryptoAddresses(message: Message) {
  if (message.author.bot) return;

  const ltcRegex = /\b(L[a-km-zA-HJ-NP-Z1-9]{26,33}|M[a-km-zA-HJ-NP-Z1-9]{26,33}|3[a-km-zA-HJ-NP-Z1-9]{26,33}|ltc1[a-z0-9]{39,59})\b/g;
  const matches = message.content.match(ltcRegex);

  if (!matches) return;

  for (const address of matches) {
    try {
      const balanceRes = await fetch(`https://api.blockcypher.com/v1/ltc/main/addrs/${address}/balance`);
      if (!balanceRes.ok) continue;
      
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
        .setTitle("🪙 Auto-Detect: Ví Litecoin (LTC)")
        .setDescription(`**Địa chỉ:** \`${address}\``)
        .addFields(
          { name: "💰 Số dư", value: `**${ltcBalance} LTC** ${ltcPrice > 0 ? `(~ $${balanceUsd})` : ""}`, inline: true },
          { name: "⏳ Đang chờ xác nhận", value: `${unconfirmedLtc} LTC`, inline: true },
          { name: "📥 Tổng đã nhận", value: `${totalReceived} LTC`, inline: true },
          { name: "📈 Giá LTC hiện tại", value: ltcPrice > 0 ? `$${ltcPrice}` : "Không rõ", inline: true }
        )
        .setThumbnail("https://cryptologos.cc/logos/litecoin-ltc-logo.png")
        .setTimestamp();

      await message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    } catch (error) {
      console.error("Lỗi check LTC auto:", error);
    }
  }
}
