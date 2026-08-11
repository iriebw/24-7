/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from "react";
import { Server, Activity, Shield, Music, User } from "lucide-react";

export default function App() {
  const [status, setStatus] = useState<string>("Checking...");

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => setStatus(data.status))
      .catch(() => setStatus("Offline"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8">
        <header className="flex items-center gap-4 border-b pb-6">
          <div className="p-3 bg-blue-600 text-white rounded-xl">
            <Server size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Discord Server Manager</h1>
            <p className="text-gray-500">Anti-nuke, Music & Utilities Bot</p>
          </div>
        </header>

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Activity className={status.includes("running") ? "text-green-500" : "text-red-500"} />
            <div>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">System Status</p>
              <p className="text-lg font-semibold">{status}</p>
            </div>
          </div>
          {status.includes("running") && (
            <div className="px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium">
              Online
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-blue-600">
              <Shield />
              <h2 className="text-xl font-semibold text-gray-900">Anti-Nuke System</h2>
            </div>
            <p className="text-gray-600">
              Automatically detects and bans users who spam channel or role deletions. Protects your server 24/7.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
            <div className="flex items-center gap-3 text-purple-600">
              <Music />
              <h2 className="text-xl font-semibold text-gray-900">Music Player</h2>
            </div>
            <p className="text-gray-600">
              Play music directly from YouTube in your voice channels. Supports searching, queuing, and skipping.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-700 font-mono">
              ,play, ,skip, ,queue, ,stop, ,join, ,leave
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 md:col-span-2">
            <div className="flex items-center gap-3 text-emerald-600">
              <User />
              <h2 className="text-xl font-semibold text-gray-900">Utility Commands</h2>
            </div>
            <p className="text-gray-600">
              Quick commands to get information and interact with the server.
            </p>
            <div className="flex gap-4 flex-wrap">
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,ping
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,avt [@user]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,afk [lý do]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,clear [số lượng]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,gif [từ khóa]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,to [@user] [phút]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,ban [@user]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,setup voice
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,taokenh [tên]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,nuke
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,ghepdoi [@user]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,punch [@user]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,gay [@user]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,toptop
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                ,w [@user]
              </span>
              <span className="bg-gray-50 px-3 py-1 rounded-md text-sm text-gray-700 border border-gray-200">
                /snipe
              </span>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4 md:col-span-2">
            <div className="flex items-center gap-3 text-pink-600">
              <span className="text-xl font-bold">▶️</span>
              <h2 className="text-xl font-semibold text-gray-900">Auto Detector</h2>
            </div>
            <p className="text-gray-600">
              Tự động nhận diện link YouTube và TikTok trong tin nhắn, sau đó phản hồi lại thông tin chi tiết (Lượt xem, Thích, Bình luận, Chia sẻ) của video đó.
            </p>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500 pt-8 border-t">
          Configure your <code className="bg-gray-100 px-1 rounded">DISCORD_TOKEN</code> in the settings panel to activate the bot.
        </div>
      </div>
    </div>
  );
}

