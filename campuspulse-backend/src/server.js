import app from "./app.js";
import { env } from "./config/env.js";
import { testSupabase } from "./config/supabase.js";
import { connectMongoDB } from "./config/mongodb.js";

process.on("unhandledRejection", (reason) => {
  console.warn("⚠️ Unhandled Rejection intercepted:", reason?.message || reason);
});

process.on("uncaughtException", (err) => {
  console.warn("⚠️ Uncaught Exception intercepted:", err?.message || err);
});

async function start() {
  try {
    // 1. Supabase (Relational Database)
    try {
      await testSupabase();
    } catch (supaErr) {
      console.warn("⚠️ Supabase connection warning, using in-memory store:", supaErr.message);
    }

    // 2. MongoDB (Document / Notice Store)
    try {
      await connectMongoDB();
      const { seedMongoDB } = await import("./services/seedDatabase.js");
      await seedMongoDB();
    } catch (mongoErr) {
      console.warn("⚠️ MongoDB not available, using in-memory seed store:", mongoErr.message);
    }

    const server = app.listen(env.port, () => {
      console.log(`🚀 CampusPulse API running at http://localhost:${env.port}${env.apiPrefix}`);
      console.log(`🩺 Health check available at http://localhost:${env.port}/health`);
    });

    server.on("error", (err) => {
      if (err.code === "EADDRINUSE") {
        console.error(`Port ${env.port} is already in use. Please check running processes.`);
      } else {
        console.error("Server error:", err.message);
      }
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

start();
