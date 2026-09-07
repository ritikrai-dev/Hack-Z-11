import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

const activeKey = env.supabase.key || env.supabase.publishableKey || env.supabase.secretKey;

if (!env.supabase.url || !activeKey) {
  console.warn("⚠️ Supabase URL or API Key not provided.");
}

export const supabase = createClient(env.supabase.url, activeKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function testSupabase() {
  try {
    // Ping Supabase table endpoint to verify connection & schema access
    const { data, error } = await supabase.from("users").select("id").limit(1);

    if (!error) {
      console.log(`⚡ Supabase connected successfully: ${env.supabase.url}`);
      return true;
    }

    // Direct REST API verification fallback
    const res = await fetch(`${env.supabase.url}/rest/v1/users?limit=1`, {
      headers: {
        apikey: activeKey,
        Authorization: `Bearer ${activeKey}`
      }
    });

    if (res.ok) {
      console.log(`⚡ Supabase connected successfully: ${env.supabase.url}`);
      return true;
    } else {
      console.warn(`⚠️ Supabase returned status ${res.status}`);
      return false;
    }
  } catch (err) {
    console.warn(`⚠️ Supabase connection warning:`, err.message);
    return false;
  }
}
