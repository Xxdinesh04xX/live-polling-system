import mongoose from "mongoose";

export const connectToDatabase = async (mongoUri: string) => {
  mongoose.set("strictQuery", true);
  mongoose.set("bufferCommands", false);
  mongoose.connection.on("error", (error) => {
    console.error("MongoDB connection error:", error);
  });

  await mongoose.connect(mongoUri);
  console.info("MongoDB connected");
};
