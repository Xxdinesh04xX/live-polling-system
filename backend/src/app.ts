import express from "express";
import cors from "cors";
import { pollRoutes } from "./routes/pollRoutes";
import { aiRoutes } from "./routes/aiRoutes";

export const createApp = () => {
  const app = express();
  const clientOrigin = process.env.CLIENT_ORIGIN ?? "*";

  app.use(
    cors({
      origin: clientOrigin,
      credentials: true,
    })
  );
  app.use(express.json());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/api/polls", pollRoutes);
  app.use("/api/ai", aiRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: "NOT_FOUND" });
  });

  return app;
};
