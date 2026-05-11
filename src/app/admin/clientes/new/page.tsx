import Link from "next/link";
import { createClientAction } from "../actions";

type Props = { searchParams: Promise<{ error?: string }> };

export default async function NewClientPage({ searchParams }: Props) {
  const { error } = await searchParams;

  return (
    <div className="max-w-xl">
      <nav className="text-sm text-zinc-500 mb-2">
        <Link href="/admin/clientes" className="hover:text-zinc-700">
          Clientes
        </Link>{" "}
        / <span className="text-zinc-900 font-semibold">Nuevo</span>
      </nav>
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Nuevo cliente</h1>
      <p className="text-sm text-zinc-600 mb-6">
        Pasale al cliente el email + contraseña para que entre a <code>/login</code>.
      </p>

      <form action={createClientAction} className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
        <Field label="Nombre" name="full_name" placeholder="ej. Pedrito" required />
        <Field label="Email" name="email" type="email" placeholder="pedrito@gmail.com" required />
        <Field label="Contraseña inicial" name="password" placeholder="mínimo 6 caracteres" required />
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
            {error}
          </div>
        )}
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
          >
            Crear cliente
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
        {label}
      </label>
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
      />
    </div>
  );
}
