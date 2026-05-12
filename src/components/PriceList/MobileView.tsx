import Image from "next/image";
import type { PricedLine, Settings, Condition, PricedGroup, PricedProduct } from "@/lib/types";
import { KomfyLogo } from "@/components/KomfyLogo";
import { ColorSwatch } from "@/components/ColorSwatch";
import { formatPrice, formatDate } from "@/lib/format";
import { getPublicImageUrl } from "@/lib/storage";
import s from "./mobile.module.css";

type Props = {
  lines: PricedLine[];
  settings: Settings;
};

// Server component. Tabs use plain anchor links + CSS smooth scroll
// (no IntersectionObserver to avoid client-side JS hydration).
export function MobileView({ lines, settings }: Props) {
  return (
    <div className={s.root}>
      <div className={s.phone}>
        <MobileCover settings={settings} />
        <MobileIntro settings={settings} lines={lines} />

        <nav className={s.tabs}>
          {lines.map((line, i) => (
            <a key={line.id} href={`#${line.slug}`} className={i === 0 ? s.active : ""}>
              {line.name}
            </a>
          ))}
          <a href="#cond">Cond.</a>
        </nav>

        {lines.map((line) => (
          <section key={line.id} id={line.slug} className={s.line}>
            <MobileLineBanner line={line} />
            <div className={s.blocks}>
              {line.groups.map((group) => (
                <MobileBlock key={group.id} group={group} />
              ))}
            </div>
          </section>
        ))}

        <MobileConditions settings={settings} />
        <MobileFooter settings={settings} />
      </div>
    </div>
  );
}

function MobileCover({ settings }: { settings: Settings }) {
  return (
    <section className={s.cover}>
      <div className={s.coverBand}>
        <span className={s.eyebrow}>{settings.period_label ?? "Lista de Precios"}</span>
        <div className={s.logo}>
          <KomfyLogo />
        </div>
      </div>
      <h1 className={s.heroTitle}>
        Lista de
        <br />
        precios
        <span className={s.dot}>.</span>
      </h1>
      <p className={s.heroSub}>{settings.cover_subtitle ?? "Catálogo mayorista de muebles Komfy. Precios netos, sin IVA."}</p>
      <div className={s.coverMeta}>
        {settings.effective_date && (
          <div>
            <div className={s.k}>Vigencia</div>
            <div className={s.v}>{formatDate(settings.effective_date)}</div>
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

function MobileIntro({ settings, lines }: { settings: Settings; lines: PricedLine[] }) {
  const totalSkus = lines.reduce(
    (acc, line) => acc + line.groups.reduce((a, g) => a + g.products.length, 0),
    0
  );

  return (
    <section className={s.intro}>
      <div className={s.introEyebrow}>Bienvenida</div>
      {settings.intro_title ? (
        <h2 className={s.introQuote} dangerouslySetInnerHTML={{ __html: settings.intro_title }} />
      ) : (
        <h2 className={s.introQuote}>
          Diseño <em>cómodo</em> y accesible que transforma espacios.
        </h2>
      )}
      <div
        className={s.introBody}
        dangerouslySetInnerHTML={{
          __html:
            settings.intro_body ??
            "<p><strong>¡Hola!</strong> Esta lista de precios es una guía clara y cuidada por Komfy para que accedas a nuestras líneas con precios mayoristas transparentes.</p>",
        }}
      />
      <div className={s.introStats}>
        <Stat num={String(settings.stat_lines ?? lines.length)} suffix="." label="Líneas activas" />
        <Stat num={String(settings.stat_skus ?? totalSkus)} label="SKUs disponibles" />
        <Stat num={String(settings.stat_finishes ?? 8)} label="Terminaciones" />
        <Stat num="+IVA" label="Precios mayoristas" />
      </div>
    </section>
  );
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

function MobileLineBanner({ line }: { line: PricedLine }) {
  const eyebrow = line.eyebrow ?? `Línea ${String(line.number).padStart(2, "0")}`;
  const idx = line.highlight_letter ? line.name.toLowerCase().indexOf(line.highlight_letter.toLowerCase()) : -1;

  return (
    <div className={s.lineBanner}>
      <div className={s.lEyebrow}>{eyebrow}</div>
      <h2>
        {idx === -1 ? (
          line.name
        ) : (
          <>
            {line.name.slice(0, idx)}
            <span className={s.lo}>{line.name.slice(idx, idx + 1)}</span>
            {line.name.slice(idx + 1)}
          </>
        )}
      </h2>
      {line.description && <div className={s.lDesc}>{line.description}</div>}
    </div>
  );
}

function MobileBlock({ group }: { group: PricedGroup }) {
  const thumbUrl = group.thumbnail_path ? getPublicImageUrl(group.thumbnail_path) : null;

  return (
    <div className={s.block}>
      <div className={s.blockHead}>
        <div className={s.thumb}>
          {thumbUrl ? (
            <Image src={thumbUrl} alt={group.name} width={108} height={108} sizes="54px" />
          ) : (
            <div className={s.thumbFallback}>{group.name.slice(0, 3)}</div>
          )}
        </div>
        <div className={s.headTxt}>
          <h3>{group.name}</h3>
          <div className={s.meta}>
            <span>
              {group.products.length} {group.products.length === 1 ? "producto" : "productos"}
            </span>
            {group.base_dimensions && (
              <>
                <span className={s.dotSep}>·</span>
                <span>{group.base_dimensions}</span>
              </>
            )}
          </div>
        </div>
      </div>
      {group.products.map((p) => (
        <MobileVariant key={p.id} product={p} groupName={group.name} />
      ))}
    </div>
  );
}

function MobileVariant({ product: p, groupName }: { product: PricedProduct; groupName: string }) {
  const hasDiscount = p.discountPercent !== null && p.discountPercent !== 0;
  const showProductName = p.name.trim() !== groupName.trim();
  return (
    <div className={s.var}>
      <div className={s.varLeft}>
        <ColorSwatch hex={p.color_hex} hexSecondary={p.color_hex_secondary} className={s.swatch} size={18} />
        <div className={s.varInfo}>
          {showProductName ? (
            <>
              <div className={s.varName}>{p.name}</div>
              <div className={s.varSubline}>
                <span>{p.color_name}</span>
                <span className={s.varSep}>·</span>
                <span className={s.varCodeInline}>{p.sku}</span>
              </div>
            </>
          ) : (
            <>
              <div className={s.varColor}>{p.color_name}</div>
              <div className={s.varCode}>{p.sku}</div>
            </>
          )}
        </div>
      </div>
      <div className={s.varRight}>
        {hasDiscount && (
          <div className={s.publicPrice}>${formatPrice(p.price)}</div>
        )}
        <div className={s.varPrice}>
          <span className={s.cur}>$</span>
          {formatPrice(hasDiscount ? p.finalPrice : p.price)}
        </div>
        <div className={s.varBul}>
          Bul. <span>{p.packages}</span>
        </div>
      </div>
    </div>
  );
}

function MobileConditions({ settings }: { settings: Settings }) {
  const conditions = settings.conditions ?? [];
  return (
    <section id="cond" className={s.cond}>
      <div className={s.condEyebrow}>Información comercial</div>
      <h2>
        Condiciones
        <br />
        de pago y envío.
      </h2>

      <div className={s.condList}>
        {conditions.map((c, i) => (
          <CondRow key={i} c={c} />
        ))}
      </div>

      <div className={s.condCard}>
        <div className={s.bgK}>k</div>
        <h4>Muebles cómodos, fáciles de armar y pensados para vivirse.</h4>
        <p>
          Komfy es una marca dedicada al diseño y fabricación de muebles que combinan estética, funcionalidad y confort.
        </p>
        <p className={s.bold}>Envíos a todo el país.</p>
        {settings.website_url && (
          <a className={s.cta} href={settings.website_url} target="_blank" rel="noopener">
            {settings.website_url.replace(/^https?:\/\//, "")}
          </a>
        )}
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

function MobileFooter({ settings }: { settings: Settings }) {
  return (
    <div className={s.footer}>
      <div className={s.footerLogo}>
        <KomfyLogo fill="#FAF0E6" underlineFill="#FFA400" />
      </div>
      <div className={s.footerMark}>{settings.period_label ?? "Lista Mayorista"}</div>
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
  );
}
