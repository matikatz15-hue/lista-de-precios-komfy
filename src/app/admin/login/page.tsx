import { loginAction } from "./actions";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function LoginPage({ searchParams }: Props) {
  const { error } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-zinc-200 p-8">
        <div className="text-xs font-bold tracking-widest text-orange-500 uppercase mb-1">Komfy</div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-6">Iniciar sesión</h1>
        <form action={loginAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              required
              autoComplete="email"
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full px-3 py-2.5 border border-zinc-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">{error}</div>
          )}
          <button
            type="submit"
            className="w-full bg-[#0047BB] hover:bg-[#003691] text-white font-semibold py-2.5 rounded-md text-sm tracking-wide transition-colors"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
