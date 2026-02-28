import http from "http";
import { Server } from "socket.io";
import dotenv from "dotenv";
import { createApp } from "./app";
import { connectToDatabase } from "./config/db";
import { pollService } from "./services/PollService";
import { registerSocketHandlers } from "./sockets";

dotenv.config();

const port = Number(process.env.PORT ?? 4000);
const clientOrigin = process.env.CLIENT_ORIGIN ?? "*";
const mongoUri = process.env.MONGO_URI ?? "";

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: clientOrigin,
    credentials: true,
  },
});

const connectWithRetry = async () => {
  if (!mongoUri) {
    console.warn("MONGO_URI is missing. API will run without DB access.");
    return;
  }
  try {
    await connectToDatabase(mongoUri);
    await pollService.bootstrapActivePoll();
  } catch (error) {
    console.error("MongoDB connection failed. Retrying...", error);
    setTimeout(connectWithRetry, 5000);
  }
};

void connectWithRetry();
registerSocketHandlers(io);

server.listen(port, () => {
  console.info(`Server running on http://localhost:${port}`);
});
