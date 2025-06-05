import { config } from "dotenv";
import { type Config } from "drizzle-kit";
import path from "path";

// Load .env from the monorepo root
config({ path: path.resolve(__dirname, "../../.env") });

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;
