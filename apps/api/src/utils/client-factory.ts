import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export class ClientFactory {
  private static openaiInstance: OpenAI | null = null;
  private static supabaseInstance: ReturnType<typeof createClient> | null =
    null;

  static getOpenAI(): OpenAI {
    if (!this.openaiInstance) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY environment variable is required");
      }
      this.openaiInstance = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openaiInstance;
  }

  static getSupabase(): ReturnType<typeof createClient> {
    if (!this.supabaseInstance) {
      if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error(
          "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required"
        );
      }
      this.supabaseInstance = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
    }
    return this.supabaseInstance;
  }
}
