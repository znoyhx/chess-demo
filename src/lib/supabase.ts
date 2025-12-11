import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ 致命错误: 找不到 VITE_SUPABASE 环境变量。请检查 .env.local 是否配置正确，并重启开发服务器！");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
