import { createClient } from "@supabase/supabase-js";

// Cookie okumayan public client — public sayfalar için.
// cookies() çağrısı olmadığı için Next.js sayfaları ISR cache'lenebilir.
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
