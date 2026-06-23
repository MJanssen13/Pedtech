import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Cliente Supabase para Server Components / Route Handlers. */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // chamado de Server Component — ignorável quando há middleware de refresh
          }
        },
      },
    },
  );
}

/** Cliente com service role (apenas server-side: cron de expurgo, tarefas admin). */
export function createServiceClient() {
  const { createClient: createSb } = require('@supabase/supabase-js');
  return createSb(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  );
}
