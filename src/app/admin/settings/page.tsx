import { createClient } from "@/lib/supabase/server";
import { updateSettingsAction } from "./actions";
import { SubmitButton } from "@/components/SubmitButton";
import type { Settings } from "@/lib/types";

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function SettingsPage({ searchParams }: Props) {
  const { saved } = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").eq("id", 1).single();
  const settings = (data ?? {}) as Partial<Settings>;
  const conditionsJson = JSON.stringify(settings.conditions ?? [], null, 2);

  return (
    <div>
      <h1 className="text-3xl font-bold text-zinc-900 mb-2">Settings</h1>
      <p className="text-sm text-zinc-600 mb-8">Datos generales que aparecen en tapa, intro, footer y condiciones.</p>

      {saved && (
        <div className="mb-6 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md px-3 py-2">
          <span>✓</span><span>{saved}</span>
        </div>
      )}

      <form action={updateSettingsAction} className="space-y-6">
        <Section title="Tapa">
          <Field label="Etiqueta de período (ej: Mayorista)" name="period_label" defaultValue={settings.period_label ?? ""} className="col-span-2" />
          <Field label="Subtítulo de tapa" name="cover_subtitle" defaultValue={settings.cover_subtitle ?? ""} className="col-span-2" />
          <p className="col-span-2 text-xs text-zinc-500">
            La fecha de vigencia se toma del snapshot que estés viendo (cuando es una versión histórica). En la vista actual no aparece fecha.
          </p>
        </Section>

        <Section title="Contacto">
          <Field label="Email" name="contact_email" type="email" defaultValue={settings.contact_email ?? ""} />
          <Field label="Teléfono" name="contact_phone" defaultValue={settings.contact_phone ?? ""} />
          <Field label="WhatsApp (con código)" name="whatsapp" defaultValue={settings.whatsapp ?? ""} />
          <Field label="Sitio web" name="website_url" type="url" defaultValue={settings.website_url ?? ""} placeholder="https://komfy.com.ar" />
        </Section>

        <Section title="Intro">
          <Field
            label='Título (HTML básico OK: <em>cómodo</em>)'
            name="intro_title"
            textarea
            defaultValue={settings.intro_title ?? ""}
            className="col-span-2"
          />
          <Field
            label="Texto de intro (HTML básico OK)"
            name="intro_body"
            textarea
            rows={5}
            defaultValue={settings.intro_body ?? ""}
            className="col-span-2"
          />
        </Section>

        <Section title="Estadísticas (números visibles en intro)">
          <Field label="Líneas activas" name="stat_lines" type="number" defaultValue={settings.stat_lines != null ? String(settings.stat_lines) : ""} />
          <Field label="SKUs" name="stat_skus" type="number" defaultValue={settings.stat_skus != null ? String(settings.stat_skus) : ""} />
          <Field label="Terminaciones" name="stat_finishes" type="number" defaultValue={settings.stat_finishes != null ? String(settings.stat_finishes) : ""} />
          <p className="col-span-2 text-xs text-zinc-500">
            Si dejás vacío, se calculan automáticamente.
          </p>
        </Section>

        <Section title="Condiciones de pago y envío (JSON)">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">
              JSON de condiciones
            </label>
            <textarea
              name="conditions"
              defaultValue={conditionsJson}
              rows={14}
              className="w-full px-3 py-2 border border-zinc-300 rounded-md text-xs font-mono"
            />
            <p className="text-xs text-zinc-500 mt-2">
              Formato: {`[{ "icon": "TR", "label": "Transferencias", "sublabel": "...", "value": "−10 %", "hot": true }]`}
            </p>
          </div>
        </Section>

        <div className="flex justify-end">
          <SubmitButton
            pendingText="Guardando…"
            className="px-5 py-2.5 bg-[#0047BB] hover:bg-[#003691] text-white font-semibold text-sm rounded-md"
          >
            Guardar settings
          </SubmitButton>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-zinc-200 p-6">
      <h2 className="font-semibold text-zinc-900 mb-4">{title}</h2>
      <div className="grid grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  className = "",
  textarea,
  rows = 3,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
  textarea?: boolean;
  rows?: number;
}) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-zinc-700 mb-1.5 uppercase tracking-wider">{label}</label>
      {textarea ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={rows}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-zinc-300 rounded-md text-sm"
        />
      )}
    </div>
  );
}
