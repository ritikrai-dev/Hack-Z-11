import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

if (!env.supabase.url || !env.supabase.secretKey) {
  console.warn("⚠️ Supabase URL or Secret Key not provided.");
}

export const supabase = createClient(env.supabase.url, env.supabase.secretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export async function testSupabase() {
  try {
    // Quick ping to check Supabase project health
    const res = await fetch(`${env.supabase.url}/rest/v1/`, {
      headers: {
        apikey: env.supabase.secretKey,
        Authorization: `Bearer ${env.supabase.secretKey}`
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
