import Link from "next/link";
import { cookies } from "next/headers";
import { logoutAction } from "@/app/login/actions";
import { createClient } from "@/lib/supabase/server";
import { rolDelPanel } from "@/lib/roles";
import { ReadOnlyProvider } from "@/components/ReadOnly";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The proxy already validated the role + auth; we just read the email from a
  // lightweight cookie set elsewhere or fall back gracefully.
  const cookieStore = await cookies();
  const emailCookie = cookieStore.get("kf_email")?.value ?? "";
  const supabase = await createClient();
  const [{ count: nuevos }, rol] = await Promise.all([
    supabase.from("web_pendientes").select("tn_variant_id", { count: "exact", head: true }).eq("estado", "pendiente"),
    rolDelPanel(),
  ]);
  // Equipo Komfy con rol "viewer": ve todo el admin pero no puede tocar nada.
  // El fieldset deshabilita cada control; las escrituras igual las frenan requireEditor() + RLS.
  const soloMira = rol !== "admin";

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex">
        <aside className="w-60 min-h-screen bg-white border-r border-zinc-200 p-4 flex flex-col gap-1">
          <div className="px-3 py-4 mb-2 border-b border-zinc-200">
            <div className="text-xs font-bold tracking-widest text-orange-500 uppercase">
              {soloMira ? "Komfy · Equipo" : "Komfy Admin"}
            </div>
            <div className="text-xs text-zinc-500 mt-1 truncate">{emailCookie || "admin"}</div>
          </div>
          <NavLink href="/admin">Dashboard</NavLink>
          <NavLink href="/admin/nuevos">
            <span className="flex items-center justify-between">
              Nuevos de la web
              {nuevos ? (
                <span className="ml-2 rounded-full bg-orange-500 px-2 py-0.5 text-[11px] font-bold text-white">{nuevos}</span>
              ) : null}
            </span>
          </NavLink>
          <NavLink href="/admin/lines">Líneas</NavLink>
          <NavLink href="/admin/precios">Precios</NavLink>
          <NavLink href="/admin/snapshots">Historial</NavLink>
          <NavLink href="/admin/clientes">Clientes</NavLink>
          <NavLink href="/admin/settings">Settings</NavLink>
          <Link
            href="/"
            target="_blank"
            className="px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-100"
          >
            Ver lista pública ↗
          </Link>
          <form action={logoutAction} className="mt-auto">
            <button
              type="submit"
              className="w-full text-left px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:bg-zinc-100"
            >
              Cerrar sesión
            </button>
          </form>
        </aside>
        <main className="flex-1 p-8 max-w-6xl">
          {soloMira ? (
            <>
              <div
                role="status"
                className="mb-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-800"
              >
                👁 Solo mirás — los cambios se piden a Mati (komfy-users)
              </div>
              <ReadOnlyProvider value>
                <fieldset disabled style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
                  {children}
                </fieldset>
              </ReadOnlyProvider>
            </>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-3 py-2 rounded-md text-sm font-medium text-zinc-700 hover:bg-zinc-100"
    >
      {children}
    </Link>
  );
}
