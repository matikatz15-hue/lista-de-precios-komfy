import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { KomfyLogo } from "@/components/public/KomfyLogo";
import { SwatchDot } from "@/components/public/SwatchDot";
import type { Line, ProductGroup, Product } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Komfy · Lista de Precios Mayorista",
};

type FullLine = Line & {
  groups: (ProductGroup & { products: Product[] })[];
};

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function PriceTable({ group, startIdx }: { group: ProductGroup & { products: Product[] }; startIdx: number }) {
  return (
    <div className="block">
      <div className="block-head">
        <h3>{group.name}</h3>
        <span className="count">
          {group.products.length} terminacion{group.products.length !== 1 ? "es" : ""} · {group.dimensions}
        </span>
      </div>
      <table className="price">
        <thead>
          <tr>
            <th>N°</th>
            <th>Producto</th>
            <th>Código</th>
            <th>Color</th>
            <th>Medidas (An × La × Al)</th>
            <th className="num">Bultos</th>
            <th className="num">Precio + IVA</th>
          </tr>
        </thead>
        <tbody>
          {group.products.map((p, i) => (
            <tr key={p.id}>
              <td className="idx">{String(startIdx + i).padStart(2, "0")}</td>
              <td className="prod">{p.name}</td>
              <td className="code">{p.sku}</td>
              <td className="color">
                <span className="swatch-row">
                  <SwatchDot colorHex={p.colorHex} colorHex2={p.colorHex2} />
                  <span>{p.color}</span>
                </span>
              </td>
              <td className="med">{p.dimensions}</td>
              <td className="bul"><span className="pill">{p.bulkQty}</span></td>
              <td className="price-col"><span className="cur">$</span>{fmt(p.price)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LinePage({ line }: { line: FullLine }) {
  // Split groups across A4 pages (~14 table rows per page)
  const pages: (ProductGroup & { products: Product[] })[][] = [];
  let current: (ProductGroup & { products: Product[] })[] = [];
  let rowCount = 0;

  for (const group of line.groups) {
    const groupRows = group.products.length + 2;
    if (rowCount > 0 && rowCount + groupRows > 14) {
      pages.push(current);
      current = [];
      rowCount = 0;
    }
    current.push(group);
    rowCount += groupRows;
  }
  if (current.length > 0) pages.push(current);

  return (
    <>
      {pages.map((pageGroups, pi) => {
        let idx = 1;
        for (let gi = 0; gi < pi; gi++) {
          for (const g of pages[gi]) idx += g.products.length;
        }
        return (
          <section className="page" key={`${line.id}-${pi}`}>
            {pi === 0 && (
              <div className="line-banner">
                <div>
                  <div className="l-eyebrow">{line.eyebrow}</div>
                  <h2>{line.name}</h2>
                </div>
                <div className="l-desc">{line.description}</div>
              </div>
            )}
            {pageGroups.map((group) => {
              const startIdx = idx;
              idx += group.products.length;
              return <PriceTable key={group.id} group={group} startIdx={startIdx} />;
            })}
          </section>
        );
      })}
    </>
  );
}

export default async function DesktopCatalog() {
  const [lines, conditions, s] = await Promise.all([
    db.line.findMany({
      orderBy: { order: "asc" },
      include: {
        groups: {
          orderBy: { order: "asc" },
          include: { products: { orderBy: { order: "asc" } } },
        },
      },
    }),
    db.condition.findMany({ orderBy: { order: "asc" } }),
    getSettings(),
  ]);

  const totalSkus = lines.reduce((acc, l) => acc + l.groups.reduce((a, g) => a + g.products.length, 0), 0);

  return (
    <div className="komfy-bg">
      {/* COVER */}
      <section className="page cover">
        <div className="cover-grid">
          <div className="cover-band">
            <span className="cover-eyebrow">Mayorista · {s.periodo}</span>
            <div className="cover-logo" aria-label="Komfy">
              <KomfyLogo fill="white" accentFill="white" />
            </div>
          </div>
          <div className="cover-hero">
            <h1 className="cover-title">Lista de<br />precios<span className="dot">.</span></h1>
            <p className="cover-sub">Catálogo mayorista de muebles Komfy. Precios netos, sin IVA.</p>
          </div>
          <div className="cover-foot">
            <div>
              <div className="k">Vigencia</div>
              <div className="v">{s.vigencia}</div>
            </div>
            <div />
            <div>
              <div className="k">Contacto</div>
              <div className="v">{s.contacto}</div>
            </div>
          </div>
        </div>
      </section>

      {/* INTRO */}
      <section className="page">
        <div className="intro">
          <h2
            className="intro-quote"
            dangerouslySetInnerHTML={{
              __html: (s["intro-quote"] || "Diseño cómodo y accesible que transforma espacios.").replace(
                "cómodo",
                "<em>cómodo</em>"
              ),
            }}
          />
          <div className="intro-body">
            <p dangerouslySetInnerHTML={{ __html: s["intro-p1"] || "" }} />
            <p dangerouslySetInnerHTML={{ __html: s["intro-p2"] || "" }} />
          </div>
          <div className="intro-stats">
            <div className="stat">
              <div className="num">{lines.length}<small>.</small></div>
              <div className="lbl">Líneas activas</div>
            </div>
            <div className="stat">
              <div className="num">{totalSkus}</div>
              <div className="lbl">SKUs disponibles</div>
            </div>
            <div className="stat">
              <div className="num">8</div>
              <div className="lbl">Terminaciones</div>
            </div>
            <div className="stat">
              <div className="num">+IVA</div>
              <div className="lbl">Precios mayoristas</div>
            </div>
          </div>
        </div>
      </section>

      {/* LINES */}
      {lines.map((line) => (
        <LinePage key={line.id} line={line} />
      ))}

      {/* CONDITIONS */}
      <section className="page">
        <div className="cond-page">
          <div>
            <div className="cond-eyebrow">Información Comercial</div>
            <h2 className="cond-title">Condiciones<br />de pago<br />y envío.</h2>
            <div className="cond-list">
              {conditions.map((c) => (
                <div key={c.id} className={`cond-row${c.hot ? " hot" : ""}`}>
                  <div className="ico">{c.code}</div>
                  <div className="lbl">{c.label}<small>{c.detail}</small></div>
                  <div className="val">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
          <aside className="cond-side">
            <div className="bg-k">k</div>
            <div className="cond-eyebrow" style={{ color: "var(--naranja)", position: "relative" }}>Sobre Komfy</div>
            <h4 style={{ position: "relative" }}>Muebles cómodos, fáciles de armar y pensados para vivirse.</h4>
            <p style={{ position: "relative" }}>Komfy es una marca dedicada al diseño y fabricación de muebles que combinan estética, funcionalidad y confort.</p>
            <p style={{ position: "relative", fontWeight: 700, color: "white" }}>Envíos a todo el país.</p>
            <a className="cta" href={`https://${s.web}`} target="_blank" rel="noopener">{s.web}</a>
          </aside>
        </div>
        <div className="footer">
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="footer-logo">
              <KomfyLogo fill="#FAF0E6" accentFill="#FFA400" />
            </div>
            <div className="footer-mark">Lista Mayorista · {s.periodo} · {s.version}</div>
          </div>
          <div className="footer-contact">
            <span className="lbl">Comercial</span>
            <a href={`mailto:${s.contacto}`}>✉  {s.contacto}</a>
            <a href={`tel:${s.telefono}`}>☎  {s.telefono}</a>
            <a href={`https://${s.web}`} target="_blank" rel="noopener">🌐  {s.web}</a>
          </div>
        </div>
      </section>
    </div>
  );
}
