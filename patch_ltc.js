const fs = require('fs');
let code = fs.readFileSync('src/bot/utils.ts', 'utf-8');

const oldCode = `    return true;
  }

  return false;
}`;

const newCode = `    return true;
  }

  if (commandName === "ltc" || commandName === "balance") {
    const defaultAddress = "ltc1qunhdxhy2kc730qvuwdgzxka0j7qmxr6umtgycq";
    const address = args[0] || defaultAddress;

    try {
      const balanceRes = await fetch(\`https://api.blockcypher.com/v1/ltc/main/addrs/\${address}/balance\`);
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
        const priceRes = await fetch(\`https://api.binance.com/api/v3/ticker/price?symbol=LTCUSDT\`);
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
        .setDescription(\`**Địa chỉ:** \\\`\${address}\\\`\`)
        .addFields(
          { name: "💰 Số dư", value: \`**\${ltcBalance} LTC** \${ltcPrice > 0 ? \`(~ $\\${balanceUsd})\` : ""}\`, inline: true },
          { name: "⏳ Đang chờ xác nhận", value: \`\${unconfirmedLtc} LTC\`, inline: true },
          { name: "📥 Tổng đã nhận", value: \`\${totalReceived} LTC\`, inline: true },
          { name: "📈 Giá LTC hiện tại", value: ltcPrice > 0 ? \`$\${ltcPrice}\` : "Không rõ", inline: true }
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
}`;

if (code.includes(oldCode)) {
  code = code.replace(oldCode, newCode);
  fs.writeFileSync('src/bot/utils.ts', code);
  console.log("Replaced successfully!");
} else {
  console.log("Code snippet not found.");
}
