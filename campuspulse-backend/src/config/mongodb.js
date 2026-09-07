import mongoose from "mongoose";
import { env } from "./env.js";

export async function connectMongoDB() {
  if (!env.mongoUri) throw new Error("MONGODB_URI is missing");

  // Prevent Mongoose errors from terminating process
  mongoose.connection.on("error", (err) => {
    console.warn("⚠️ MongoDB connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected. In-memory store will serve requests.");
  });

  await mongoose.connect(env.mongoUri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000
  });
  console.log("MongoDB connected");
}
