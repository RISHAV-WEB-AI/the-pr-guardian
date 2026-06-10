import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function getApiKeyForUser(githubUsername: string): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('gemini_api_key')
      .ilike('github_username', githubUsername)
      .single();
      
    if (error || !data) return null;
    return data.gemini_api_key;
  } catch (e) {
    console.error("Database lookup failed:", e);
    return null;
  }
}
