import { Message } from "discord.js";
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnection,
  AudioPlayer,
  getVoiceConnection
} from "@discordjs/voice";
import play from "play-dl";

interface ServerQueue {
  voiceChannel: any;
  textChannel: any;
  connection: VoiceConnection | null;
  player: AudioPlayer;
  songs: Song[];
  playing: boolean;
}

interface Song {
  title: string;
  url: string;
  type: string;
}

const queue = new Map<string, ServerQueue>();

// Initialize SoundCloud client ID
play.getFreeClientID().then((client_id) => {
  play.setToken({ soundcloud: { client_id } });
}).catch(console.error);

export async function handleMusicCommand(
  message: Message,
  commandName: string,
  args: string[]
): Promise<boolean> {
  const serverQueue = queue.get(message.guild!.id);

  if (commandName === "join") {
    if (!message.member?.voice.channel) {
      message.reply("Bạn cần vào một kênh thoại trước!");
      return true;
    }
    joinVoiceChannel({
      channelId: message.member.voice.channel.id,
      guildId: message.guild!.id,
      adapterCreator: message.guild!.voiceAdapterCreator as any,
    });
    message.reply("✅ Đã tham gia kênh thoại!");
    return true;
  }

  if (commandName === "leave") {
    const connection = getVoiceConnection(message.guild!.id);
    if (connection) {
      connection.destroy();
      queue.delete(message.guild!.id);
      message.reply("👋 Đã rời khỏi kênh thoại!");
    } else {
      message.reply("Tôi không có trong kênh thoại nào!");
    }
    return true;
  }

  if (commandName === "play") {
    execute(message, serverQueue, args);
    return true;
  }

  if (commandName === "skip") {
    skip(message, serverQueue);
    return true;
  }

  if (commandName === "stop") {
    stop(message, serverQueue);
    return true;
  }

  if (commandName === "queue") {
    showQueue(message, serverQueue);
    return true;
  }

  return false;
}

async function execute(message: Message, serverQueue: ServerQueue | undefined, args: string[]) {
  const voiceChannel = message.member?.voice.channel;
  if (!voiceChannel) {
    message.reply("Bạn cần vào kênh thoại để phát nhạc!");
    return;
  }

  const query = args.join(" ");
  if (!query) {
    message.reply("Vui lòng cung cấp tên bài hát hoặc link!");
    return;
  }

  let songInfo;
  try {
    const isUrl = query.startsWith("http");
    
    if (isUrl && query.includes("youtube.com")) {
      message.reply("⚠️ Hiện tại bot không thể phát nhạc từ YouTube do YouTube chặn bot. Bot sẽ tự động tìm bản nhạc tương tự trên SoundCloud.");
    }
    
    // Always search on soundcloud to bypass Youtube IP blocks
    const searchString = (isUrl && query.includes("youtube.com")) ? query.split("v=")[1] || "music" : query;
    let searchResult = await play.search(searchString, { limit: 1, source: { soundcloud: "tracks" } });
    
    if (!searchResult || searchResult.length === 0) {
      throw new Error("Not found");
    }

    songInfo = {
      title: searchResult[0].name,
      url: searchResult[0].permalink || searchResult[0].url,
    };
  } catch (error) {
    console.error(error);
    message.reply("❌ Lỗi khi tìm kiếm bài hát.");
    return;
  }

  const song: Song = {
    title: songInfo.title || "Unknown Title",
    url: songInfo.url,
    type: "soundcloud"
  };

  if (!serverQueue) {
    const player = createAudioPlayer();
    const queueContruct: ServerQueue = {
      textChannel: message.channel,
      voiceChannel: voiceChannel,
      connection: null,
      player: player,
      songs: [],
      playing: true,
    };

    queue.set(message.guild!.id, queueContruct);
    queueContruct.songs.push(song);

    try {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: message.guild!.id,
        adapterCreator: message.guild!.voiceAdapterCreator as any,
      });
      queueContruct.connection = connection;
      connection.subscribe(player);

      player.on(AudioPlayerStatus.Idle, () => {
        queueContruct.songs.shift();
        playSong(message.guild!.id, queueContruct.songs[0]);
      });

      player.on("error", (error) => {
        console.error(error);
        queueContruct.textChannel.send("Lỗi khi phát bài hát.");
      });

      playSong(message.guild!.id, queueContruct.songs[0]);
    } catch (err) {
      console.error(err);
      queue.delete(message.guild!.id);
      message.reply("Lỗi kết nối vào kênh thoại.");
    }
  } else {
    serverQueue.songs.push(song);
    message.reply(`✅ **${song.title}** đã được thêm vào hàng đợi!`);
  }
}

async function playSong(guildId: string, song: Song | undefined) {
  const serverQueue = queue.get(guildId);
  if (!serverQueue) return;

  if (!song) {
    serverQueue.connection?.destroy();
    queue.delete(guildId);
    return;
  }

  try {
    const stream = await play.stream(song.url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    
    serverQueue.player.play(resource);
    serverQueue.textChannel.send(`🎶 Đang phát: **${song.title}**`);
  } catch (error) {
    console.error("Error streaming:", error);
    serverQueue.textChannel.send("Lỗi khi tải bài hát, bỏ qua...");
    serverQueue.songs.shift();
    playSong(guildId, serverQueue.songs[0]);
  }
}

function skip(message: Message, serverQueue: ServerQueue | undefined) {
  if (!message.member?.voice.channel) {
    message.reply("Bạn cần ở trong kênh thoại để bỏ qua bài hát!");
    return;
  }
  if (!serverQueue) {
    message.reply("Không có bài hát nào để bỏ qua!");
    return;
  }
  serverQueue.player.stop();
  message.reply("⏭️ Đã bỏ qua bài hát.");
}

function stop(message: Message, serverQueue: ServerQueue | undefined) {
  if (!message.member?.voice.channel) {
    message.reply("Bạn cần ở trong kênh thoại để dừng nhạc!");
    return;
  }
  if (!serverQueue) {
    message.reply("Không có bài hát nào đang phát!");
    return;
  }
  serverQueue.songs = [];
  serverQueue.player.stop();
  message.reply("🛑 Đã dừng nhạc và xóa hàng đợi.");
}

function showQueue(message: Message, serverQueue: ServerQueue | undefined) {
  if (!serverQueue || serverQueue.songs.length === 0) {
    message.reply("Hàng đợi đang trống!");
    return;
  }
  
  const queueString = serverQueue.songs
    .map((song, index) => `${index + 1}. ${song.title}`)
    .join("\n");
    
  message.reply(`**Hàng đợi hiện tại:**\n${queueString}`);
}
