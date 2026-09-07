import dotenv from "dotenv";
dotenv.config();

const required = ["JWT_SECRET", "SUPABASE_URL", "SUPABASE_SECRET_KEY"];
for (const key of required) {
  if (!process.env[key]) {
    console.warn(`Warning: ${key} is not configured.`);
  }
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  apiPrefix: process.env.API_PREFIX || "/api/v1",
  supabase: {
    url: process.env.SUPABASE_URL ,
    publishableKey: process.env.SUPABASE_PUBLISHABLE_KEY ,
    secretKey: process.env.SUPABASE_SECRET_KEY,
    jwksUrl: process.env.SUPABASE_JWKS_URL 
  },
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET || "campuspulse_super_secret_jwt_key_2026_secured",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  adminClientUrl: process.env.ADMIN_CLIENT_URL || "http://localhost:5174"
};
