import type { LineWithGroups, Settings, Condition, ProductGroup, Product } from "@/lib/types";
import { KomfyLogo } from "@/components/KomfyLogo";
import { ColorSwatch } from "@/components/ColorSwatch";
import { formatPrice, formatDate } from "@/lib/format";
import { getPublicImageUrl } from "@/lib/storage";
import s from "./desktop.module.css";

type Props = {
  lines: LineWithGroups[];
  settings: Settings;
};

export function DesktopView({ lines, settings }: Props) {
  return (
    <div className={s.root}>
      <Cover settings={settings} />
      <Intro settings={settings} lines={lines} />
      {lines.map((line) => (
        <LinePage key={line.id} line={line} />
      ))}
      <Conditions settings={settings} />
    </div>
  );
}

function Cover({ settings }: { settings: Settings }) {
  return (
    <section className={`${s.page} ${s.cover}`}>
      <div className={s.coverBand}>
        <span className={s.coverEyebrow}>{settings.period_label ?? "Lista de Precios"}</span>
        <div className={s.coverLogo}>
          <KomfyLogo />
        </div>
      </div>
      <div className={s.coverHero}>
        <h1 className={s.coverTitle}>
          Lista de
          <br />
          precios
          <span className={s.dot}>.</span>
        </h1>
        <p className={s.coverSub}>{settings.cover_subtitle ?? "Catálogo mayorista de muebles Komfy. Precios netos, sin IVA."}</p>
      </div>
      <div className={s.coverFoot}>
        <div>
          <div className={s.k}>Vigencia</div>
          <div className={s.v}>{formatDate(settings.effective_date)}</div>
        </div>
        {settings.contact_phone && (
          <div>
            <div className={s.k}>Teléfono</div>
            <div className={s.v}>{settings.contact_phone}</div>
          </div>
        )}
        {settings.contact_email && (
          <div>
            <div className={s.k}>Contacto</div>
            <div className={s.v}>{settings.contact_email}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function Intro({ settings, lines }: { settings: Settings; lines: LineWithGroups[] }) {
  const totalSkus = lines.reduce(
    (acc, line) => acc + line.groups.reduce((a, g) => a + g.products.length, 0),
    0
  );

  return (
    <section className={s.page}>
      <div className={s.intro}>
        <IntroTitle title={settings.intro_title} />
        <div className={s.introBody} dangerouslySetInnerHTML={{ __html: settings.intro_body ?? "" }} />
        <div className={s.introStats}>
          <Stat num={String(settings.stat_lines ?? lines.length)} suffix="." label="Líneas activas" />
          <Stat num={String(settings.stat_skus ?? totalSkus)} label="SKUs disponibles" />
          <Stat num={String(settings.stat_finishes ?? 8)} label="Terminaciones" />
          <Stat num="+IVA" label="Precios mayoristas" />
        </div>
      </div>
    </section>
  );
}

function IntroTitle({ title }: { title: string | null }) {
  if (!title) {
    return (
      <h2 className={s.introQuote}>
        Diseño <em>cómodo</em>
        <br />y accesible que
        <br />
        transforma
        <br />
        espacios.
      </h2>
    );
  }
  return <h2 className={s.introQuote} dangerouslySetInnerHTML={{ __html: title }} />;
}

function Stat({ num, suffix, label }: { num: string; suffix?: string; label: string }) {
  return (
    <div className={s.stat}>
      <div className={s.num}>
        {num}
        {suffix && <small>{suffix}</small>}
      </div>
      <div className={s.lbl}>{label}</div>
    </div>
  );
}

function LinePage({ line }: { line: LineWithGroups }) {
  const eyebrow = line.eyebrow ?? `Línea ${String(line.number).padStart(2, "0")}`;
  const name = renderLineName(line.name, line.highlight_letter);

  return (
    <section className={s.page}>
      <div className={`${s.lineBanner} ${line.banner_style === "cream" ? s.cream : ""}`}>
        <div>
          <div className={s.lEyebrow}>{eyebrow}</div>
          <h2>{name}</h2>
        </div>
        {line.description && <div className={s.lDesc}>{line.description}</div>}
      </div>
      {line.groups.map((group) => (
        <ProductBlock key={group.id} group={group} />
      ))}
    </section>
  );
}

function renderLineName(name: string, highlight: string | null) {
  if (!highlight) return name;
  const idx = name.toLowerCase().indexOf(highlight.toLowerCase());
  if (idx === -1) return name;
  return (
    <>
      {name.slice(0, idx)}
      <span className={s.lo}>{name.slice(idx, idx + 1)}</span>
      {name.slice(idx + 1)}
    </>
  );
}

function ProductBlock({ group }: { group: ProductGroup & { products: Product[] } }) {
  const thumbUrl = group.thumbnail_path ? getPublicImageUrl(group.thumbnail_path) : null;
  const metaLabel =
    group.meta_label ??
    [`${group.products.length} ${group.products.length === 1 ? "producto" : "productos"}`, group.base_dimensions]
      .filter(Boolean)
      .join(" · ");

  return (
    <div className={s.block}>
      <div className={s.blockHead}>
        <div className={s.thumb}>
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbUrl} alt={group.name} />
          ) : (
            <div className={s.thumbFallback}>{group.name.slice(0, 3)}</div>
          )}
        </div>
        <h3>{group.name}</h3>
        <div className={s.count}>{metaLabel}</div>
      </div>
      <table className={s.priceTable}>
        <thead>
          <tr>
            <th>N°</th>
            <th>Producto</th>
            <th>Código</th>
            <th>Color</th>
            <th>Medidas (An × La × Al)</th>
            <th className={s.num}>Bultos</th>
            <th className={s.num}>Precio + IVA</th>
          </tr>
        </thead>
        <tbody>
          {group.products.map((p, i) => (
            <tr key={p.id}>
              <td className={s.idx}>{String(i + 1).padStart(2, "0")}</td>
              <td className={s.prod}>{p.name}</td>
              <td className={s.code}>{p.sku}</td>
              <td className={s.colorCell}>
                <span className={s.swatch}>
                  <ColorSwatch hex={p.color_hex} hexSecondary={p.color_hex_secondary} className={s.dot} size={11} />
                  <span>{p.color_name}</span>
                </span>
              </td>
              <td className={s.med}>{p.dimensions}</td>
              <td className={s.bul}>
                <span className={s.pill}>{p.packages}</span>
              </td>
              <td className={s.price}>
                <span className={s.cur}>$</span>
                {formatPrice(p.price)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Conditions({ settings }: { settings: Settings }) {
  const conditions = settings.conditions ?? [];
  return (
    <section className={s.page}>
      <div className={s.condPage}>
        <div>
          <div className={s.condEyebrow}>Información Comercial</div>
          <h2 className={s.condTitle}>
            Condiciones
            <br />
            de pago
            <br />y envío.
          </h2>
          <div className={s.condList}>
            {conditions.map((c, i) => (
              <CondRow key={i} c={c} />
            ))}
          </div>
        </div>
        <aside className={s.condSide}>
          <div className={s.bgK}>k</div>
          <div className={s.condEyebrow}>Sobre Komfy</div>
          <h4>Muebles cómodos, fáciles de armar y pensados para vivirse.</h4>
          <p>
            Komfy es una marca dedicada al diseño y fabricación de muebles que combinan estética, funcionalidad y
            confort. Diseñamos y fabricamos pensando en distintos espacios y formas de habitar.
          </p>
          <p className={s.bold}>Envíos a todo el país.</p>
          {settings.website_url && (
            <a className={s.cta} href={settings.website_url} target="_blank" rel="noopener">
              {settings.website_url.replace(/^https?:\/\//, "")}
            </a>
          )}
        </aside>
      </div>
      <div className={s.footer}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className={s.footerLogo}>
            <KomfyLogo fill="#FAF0E6" underlineFill="#FFA400" />
          </div>
          <div className={s.footerMark}>{settings.period_label ?? "Lista Mayorista"}</div>
        </div>
        <div className={s.footerContact}>
          <span className={s.lbl}>Comercial</span>
          {settings.contact_email && <a href={`mailto:${settings.contact_email}`}>✉ {settings.contact_email}</a>}
          {settings.contact_phone && <a href={`tel:${settings.contact_phone.replace(/\s/g, "")}`}>☎ {settings.contact_phone}</a>}
          {settings.website_url && (
            <a href={settings.website_url} target="_blank" rel="noopener">
              🌐 {settings.website_url.replace(/^https?:\/\//, "")}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

function CondRow({ c }: { c: Condition }) {
  return (
    <div className={`${s.condRow} ${c.hot ? s.hot : ""}`}>
      <div className={s.ico}>{c.icon}</div>
      <div className={s.lbl}>
        {c.label}
        {c.sublabel && <small>{c.sublabel}</small>}
      </div>
      <div className={s.val}>{c.value}</div>
    </div>
  );
}
