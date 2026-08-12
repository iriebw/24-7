import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { startBot, stopBot, getBotStatus } from "./src/bot/index.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API route to check bot status
  app.get("/api/status", (req, res) => {
    res.json({ isRunning: getBotStatus(), status: getBotStatus() ? "Bot and Server are running!" : "Server is running, but Bot is stopped." });
  });

  app.post("/api/start", async (req, res) => {
    const success = await startBot();
    res.json({ success, isRunning: getBotStatus() });
  });

  app.post("/api/stop", async (req, res) => {
    const success = await stopBot();
    res.json({ success, isRunning: getBotStatus() });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
