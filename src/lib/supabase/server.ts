import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function assertSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!url) {
    throw new Error("Missing Supabase URL. Set NEXT_PUBLIC_SUPABASE_URL to continue.");
  }

  return url;
}

function createCookieAdapter() {
  const cookieStorePromise = Promise.resolve(cookies());

  return {
    async getAll() {
      const cookieStore = await cookieStorePromise;

      return cookieStore.getAll().map((cookie) => ({
        name: cookie.name,
        value: cookie.value,
      }));
    },
    async setAll(cookiesToSet) {
      const cookieStore = await cookieStorePromise;
      const setCookie = (cookieStore as unknown as {
        set?: (...args: unknown[]) => void;
      }).set;

      if (!setCookie) {
        return;
      }

      const applySet = (...args: unknown[]) => {
        Reflect.apply(
          setCookie as unknown as (this: unknown, ...fnArgs: unknown[]) => void,
          cookieStore,
          args
        );
      };

      cookiesToSet.forEach(({ name, value, options }) => {
        try {
          applySet({ name, value, ...options });
        } catch {
          try {
            applySet(name, value, options);
          } catch {
            // Next.js prevents mutating cookies in some contexts; ignore in that case.
          }
        }
      });
    },
  } satisfies Parameters<typeof createServerClient>[2]["cookies"];
}

// Server-side client that uses the anon key so requests run as the current user.
export function createSupabaseServerClient() {
  const url = assertSupabaseUrl();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!anonKey) {
    throw new Error("Missing Supabase anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY to continue.");
  }

  return createServerClient(url, anonKey, {
    cookies: createCookieAdapter(),
  });
}

// Server-side client that uses the service role key for privileged actions.
export function createSupabaseServerAdminClient() {
  const url = assertSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error("Missing Supabase service role key. Set SUPABASE_SERVICE_ROLE_KEY to continue.");
  }

  // Use createClient instead of createServerClient for admin operations
  const { createClient } = require('@supabase/supabase-js');
  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
