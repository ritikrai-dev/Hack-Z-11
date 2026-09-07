import dotenv from "dotenv";
dotenv.config();

const required = ["JWT_SECRET", "SUPABASE_URL"];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} is not configured.`);
  }
}
if (!process.env.SUPABASE_SECRET_KEY && !process.env.SUPABASE_PUBLISHABLE_KEY) {
  console.warn("Warning: Neither SUPABASE_SECRET_KEY nor SUPABASE_PUBLISHABLE_KEY is configured.");
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  supabase: {
    url: process.env.SUPABASE_URL || "https://mxdyulpunsogjfsaflao.supabase.co",
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_7vXZ2yLLWpbnmIVwJ7-nXw_OdrjlmUa",
    secretKey: process.env.SUPABASE_SECRET_KEY || "sb_secret_5I106kzUs4w0AeFBqceKRQ_4dr3l8zi",
    key: process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_SECRET_KEY || "sb_publishable_7vXZ2yLLWpbnmIVwJ7-nXw_OdrjlmUa",
    jwksUrl: process.env.SUPABASE_JWKS_URL || "https://mxdyulpunsogjfsaflao.supabase.co/auth/v1/.well-known/jwks.json"
  },
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "campuspulse_super_secret_jwt_key_2026_secured",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  adminClientUrl: process.env.ADMIN_CLIENT_URL || "http://localhost:5174"
};
