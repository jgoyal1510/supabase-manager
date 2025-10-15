import Link from "next/link";
import {
  createSupabaseServerAdminClient,
  createSupabaseServerClient,
} from "../lib/supabase";

export default function Home() {
  const statusMessages: string[] = [];

  let supabaseStatus = {
    title: "Supabase client ready",
    description: "Update the page to query your tables or run auth checks.",
    variant: "ready" as "ready" | "error",
  };

  try {
    createSupabaseServerClient();
  } catch (error) {
    if (error instanceof Error) {
      statusMessages.push(error.message);
    }
  }

  if (statusMessages.length > 0) {
    try {
      createSupabaseServerAdminClient();
      supabaseStatus = {
        title: "Supabase admin client ready",
        description:
          "User-scoped client is missing configuration, but the service role client is available.",
        variant: "ready" as "ready" | "error",
      };
    } catch (serviceError) {
      if (serviceError instanceof Error) {
        statusMessages.push(serviceError.message);
      }

      supabaseStatus = {
        title: "Supabase not configured",
        description:
          statusMessages.length > 0
            ? statusMessages.join(" ")
            : "Set the Supabase environment variables to finish configuration.",
        variant: "error" as const,
      };
    }
  }

  return (
    <main className="font-sans min-h-screen bg-[radial-gradient(circle_at_top,_rgba(33,33,66,.08),_transparent_65%)] text-slate-900 dark:text-slate-100">
      <section className="mx-auto flex max-w-3xl flex-col gap-8 px-6 py-24">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold sm:text-4xl">Supabase Manager</h1>
          <p className="text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            The project now ships with Supabase helpers for server and client components so you can
            start building immediately.
          </p>
        </div>

        <div
          className={`rounded-xl border p-6 transition ${
            supabaseStatus.variant === "ready"
              ? "border-emerald-300/60 bg-emerald-100/30 text-emerald-950"
              : "border-amber-300/60 bg-amber-100/40 text-amber-950"
          }`}
        >
          <h2 className="text-xl font-medium">{supabaseStatus.title}</h2>
          <p className="mt-2 text-sm leading-6">{supabaseStatus.description}</p>
        </div>

        <ol className="grid gap-4 text-sm sm:grid-cols-2">
          <li className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <p className="font-semibold">1. Configure your project</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Copy <code className="rounded bg-slate-900/10 px-1 py-0.5">.env.example</code> to
              {" "}
              <code className="rounded bg-slate-900/10 px-1 py-0.5">.env.local</code> and paste the Supabase URL,
              anon key, and (optionally) the service role key from Project Settings → API.
            </p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <p className="font-semibold">2. Use the helpers</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              In server contexts import <code className="rounded bg-slate-900/10 px-1 py-0.5">createSupabaseServerClient()</code>
              for user-scoped requests. Need elevated access? Call
              {" "}
              <code className="rounded bg-slate-900/10 px-1 py-0.5">createSupabaseServerAdminClient()</code>.
              Client components can call {" "}
              <code className="rounded bg-slate-900/10 px-1 py-0.5">createSupabaseBrowserClient()</code>.
            </p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <p className="font-semibold">3. Build features</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Replace this page with dashboards, auth flows, or data management tooling connected to
              your Supabase project.
            </p>
          </li>
          <li className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
            <p className="font-semibold">4. Explore the docs</p>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              The Supabase and Next.js guides pair nicely for building full-stack experiences.
              <Link className="ml-1 underline" href="https://supabase.com/docs" rel="noreferrer" target="_blank">
                Read the docs →
              </Link>
            </p>
          </li>
        </ol>
      </section>
    </main>
  );
}
