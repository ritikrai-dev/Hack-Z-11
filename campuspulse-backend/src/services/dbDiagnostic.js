import mongoose from "mongoose";
import { env } from "../config/env.js";
import { supabase, testSupabase } from "../config/supabase.js";
import Notice from "../models/mongodb/Notice.js";
import Story from "../models/mongodb/Story.js";

export async function runDatabaseDiagnostic() {
  console.log("================================================================");
  console.log("CAMPUSPULSE: FULL END-TO-END DATABASE DIAGNOSTIC");
  console.log("================================================================\n");

  // 1. Check MongoDB Atlas
  console.log("1. Checking MongoDB Atlas (Document Store)...");
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(env.mongoUri);
    }
    const noticeCount = await Notice.countDocuments();
    const storyCount = await Story.countDocuments();
    console.log(`   ✅ MongoDB Atlas Status: CONNECTED`);
    console.log(`   📊 Notice Documents in DB: ${noticeCount}`);
    console.log(`   📊 Urgent Story Documents in DB: ${storyCount}`);
  } catch (mongoErr) {
    console.warn(`   ⚠️ MongoDB Warning: ${mongoErr.message}`);
  }

  // 2. Check Supabase (Relational Store)
  console.log("\n2. Checking Supabase (PostgreSQL Relational Store)...");
  try {
    const isSupaReachable = await testSupabase();
    console.log(`   Project URL: ${env.supabase.url}`);
    console.log(`   Endpoint Reachable: ${isSupaReachable ? "YES ✅" : "NO ❌"}`);

    // Check tables
    const tables = ["users", "events", "clubs", "departments", "event_registrations"];
    console.log("\n   Checking Supabase Table Registry:");
    for (const tbl of tables) {
      const { data, error } = await supabase.from(tbl).select("*").limit(1);
      if (error) {
        console.log(`   - Table '${tbl}': Pending creation in Supabase SQL editor (${error.message})`);
      } else {
        console.log(`   - Table '${tbl}': ACTIVE ✅`);
      }
    }
  } catch (supaErr) {
    console.warn(`   ⚠️ Supabase Check Warning: ${supaErr.message}`);
  }

  console.log("\n================================================================");
  console.log("DIAGNOSTIC COMPLETE");
  console.log("================================================================\n");
}

if (process.argv[1]?.endsWith("dbDiagnostic.js")) {
  runDatabaseDiagnostic().then(() => process.exit(0));
}
