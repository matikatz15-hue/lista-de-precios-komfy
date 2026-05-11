import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { logoutAction } from "@/app/login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="flex">
        <aside className="w-60 min-h-screen bg-white border-r border-zinc-200 p-4 flex flex-col gap-1">
          <div className="px-3 py-4 mb-2 border-b border-zinc-200">
            <div className="text-xs font-bold tracking-widest text-orange-500 uppercase">Komfy Admin</div>
            <div className="text-xs text-zinc-500 mt-1 truncate">{user?.email}</div>
          </div>
          <NavLink href="/admin">Dashboard</NavLink>
          <NavLink href="/admin/lines">Líneas</NavLink>
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
        <main className="flex-1 p-8 max-w-6xl">{children}</main>
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
