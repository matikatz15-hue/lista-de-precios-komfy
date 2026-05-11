"use client";

import { useRef, useState, useEffect } from "react";
import { KomfyLogo } from "@/components/public/KomfyLogo";

interface Product {
  id: string; name: string; sku: string; color: string;
  colorHex: string; colorHex2?: string | null;
  dimensions: string; bulkQty: number; price: number;
}
interface Group { id: string; name: string; dimensions: string; products: Product[] }
interface Line { id: string; name: string; eyebrow: string; description: string; groups: Group[] }
interface Condition { id: string; code: string; label: string; detail: string; value: string; hot: boolean }
interface Settings { [k: string]: string }

function fmt(n: number) {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function Swatch({ hex, hex2 }: { hex: string; hex2?: string | null }) {
  return (
    <span style={{
      width: 18, height: 18, borderRadius: 999, flexShrink: 0, display: "inline-block",
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,.18), 0 1px 2px rgba(0,0,0,.06)",
      background: hex2 ? `linear-gradient(135deg,${hex} 50%,${hex2} 50%)` : hex,
    }} />
  );
}

function Variant({ p, showName = false }: { p: Product; showName?: boolean }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 14, alignItems: "center", padding: "11px 16px", borderBottom: "1px solid #E5DFD5" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
        <Swatch hex={p.colorHex} hex2={p.colorHex2} />
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 12.5, color: "#1A1A1A", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {showName ? p.name : p.color}
          </div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 600, fontSize: 11, letterSpacing: ".04em", color: "#0047BB", marginTop: 2 }}>
            {showName ? p.color : p.sku} · {p.bulkQty} bulto{p.bulkQty !== 1 ? "s" : ""}
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 18, color: "#1A1A1A", whiteSpace: "nowrap" }}>
          <span style={{ color: "#FFA400", marginRight: 2, fontWeight: 700 }}>$</span>{fmt(p.price)}
        </div>
      </div>
    </div>
  );
}

function Block({ group, named }: { group: Group; named: boolean }) {
  return (
    <div style={{ background: "white", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 2px rgba(0,0,0,.04)" }}>
      <div style={{ padding: "14px 16px 12px", borderBottom: "1px solid #E5DFD5" }}>
        <h3 style={{ fontWeight: 800, fontSize: 16, margin: 0, color: "#1A1A1A" }}>{group.name}</h3>
        <div style={{ fontSize: 10, letterSpacing: ".16em", textTransform: "uppercase", fontWeight: 700, color: "#6E6E6E", marginTop: 5 }}>
          {group.products.length} {named ? "productos" : "terminaciones"} · {group.dimensions}
        </div>
      </div>
      {group.products.map(p => <Variant key={p.id} p={p} showName={named} />)}
    </div>
  );
}

export default function MobileClient({ lines, conditions, settings: s }: {
  lines: Line[];
  conditions: Condition[];
  settings: Settings;
}) {
  const [activeId, setActiveId] = useState(lines[0]?.id ?? "cond");
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY + 100;
      let best = activeId;
      for (const id of Object.keys(refs.current)) {
        const el = refs.current[id];
        if (el && el.offsetTop <= y) best = id;
      }
      setActiveId(best);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  function scrollTo(id: string) {
    const el = refs.current[id];
    if (!el) return;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 48, behavior: "smooth" });
  }

  const tabs = [...lines.map(l => ({ id: l.id, label: l.name })), { id: "cond", label: "Cond." }];
  const periodo = s.periodo || "Marzo 2026";

  return (
    <div style={{ background: "#F4EFE6", minHeight: "100vh" }}>
      <div style={{ width: "100%", maxWidth: 430, margin: "0 auto", background: "#FAF0E6", minHeight: "100vh", overflow: "hidden", boxShadow: "0 0 0 1px rgba(0,0,0,.04), 0 30px 80px rgba(0,0,0,.12)" }}>

        {/* Cover */}
        <section style={{ background: "#0047BB", color: "white", padding: "24px 22px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 48 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 9.5, letterSpacing: ".22em", textTransform: "uppercase", color: "rgba(255,255,255,.78)" }}>
              <span style={{ width: 18, height: 2, background: "#FFA400", borderRadius: 2, display: "inline-block" }} />
              Mayorista · {periodo}
            </span>
            <div style={{ height: 22 }}><KomfyLogo fill="white" accentFill="white" /></div>
          </div>
          <h1 style={{ fontWeight: 800, fontSize: 54, lineHeight: .92, letterSpacing: "-.025em", margin: 0, color: "white" }}>
            Lista de<br />precios<span style={{ color: "#FFA400" }}>.</span>
          </h1>
          <p style={{ margin: "14px 0 0", fontWeight: 500, fontSize: 13, lineHeight: 1.5, color: "rgba(255,255,255,.82)", maxWidth: 300 }}>
            Catálogo mayorista de muebles Komfy. Precios netos, sin IVA.
          </p>
          <div style={{ marginTop: 32, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.18)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 700, color: "#FFA400", marginBottom: 4 }}>Vigencia</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white" }}>{s.vigencia}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 700, color: "#FFA400", marginBottom: 4 }}>Contacto</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "white", wordBreak: "break-word" }}>{s.contacto}</div>
            </div>
          </div>
        </section>

        {/* Intro */}
        <section style={{ background: "#FAF0E6", padding: "28px 22px 22px" }}>
          <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 700, color: "#FFA400", marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 18, height: 2, background: "#FFA400", borderRadius: 2 }} />
            Bienvenida
          </div>
          <h2 style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.04, letterSpacing: "-.018em", color: "#0047BB", margin: "0 0 14px" }}>
            Diseño <em style={{ fontStyle: "normal", background: "#FFA400", color: "#1C1C1C", padding: "0 7px", borderRadius: 4 }}>cómodo</em> y accesible que transforma espacios.
          </h2>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "#1A1A1A", margin: "0 0 10px" }} dangerouslySetInnerHTML={{ __html: s["intro-p1"] || "" }} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", marginTop: 18, borderTop: "1px solid #E5DFD5" }}>
            {[
              { n: String(lines.length), sm: ".", lbl: "Líneas activas" },
              { n: String(lines.reduce((a, l) => a + l.groups.reduce((b, g) => b + g.products.length, 0), 0)), lbl: "SKUs disponibles" },
              { n: "8", lbl: "Terminaciones" },
              { n: "+IVA", lbl: "Precios mayoristas" },
            ].map((st, i) => (
              <div key={i} style={{ padding: "14px 0", borderBottom: "1px solid #E5DFD5", ...(i % 2 === 0 ? { borderRight: "1px solid #E5DFD5", paddingRight: 14 } : { paddingLeft: 14 }) }}>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 46, lineHeight: .9, color: "#0047BB" }}>
                  {st.n}{st.sm && <small style={{ color: "#FFA400" }}>{st.sm}</small>}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".14em", textTransform: "uppercase", color: "#6E6E6E", marginTop: 4 }}>{st.lbl}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Sticky tabs */}
        <nav style={{ position: "sticky", top: 0, zIndex: 30, background: "#1A1A1A", display: "flex" }}>
          {tabs.map(t => (
            <button key={t.id} onClick={() => scrollTo(t.id)} style={{
              flex: 1, background: "transparent", border: 0,
              color: activeId === t.id ? "white" : "rgba(255,255,255,.6)",
              fontFamily: "'Noto Sans',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: ".2em",
              textTransform: "uppercase", padding: "14px 6px", cursor: "pointer",
              borderBottom: activeId === t.id ? "2px solid #FFA400" : "2px solid transparent",
            }}>
              {t.label}
            </button>
          ))}
        </nav>

        {/* Line sections */}
        {lines.map(line => (
          <section key={line.id} ref={el => { refs.current[line.id] = el; }} style={{ scrollMarginTop: 54 }}>
            <div style={{ background: "#0047BB", color: "white", padding: "22px 22px 20px" }}>
              <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 700, color: "#FFA400", display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                {line.eyebrow}
                <span style={{ flex: 1, height: 1, background: "#FFA400", opacity: .4, maxWidth: 60 }} />
              </div>
              <h2 style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 78, lineHeight: .85, letterSpacing: "-.02em", margin: "6px 0 12px", textTransform: "uppercase" }}>{line.name}</h2>
              <p style={{ fontSize: 13, lineHeight: 1.45, fontWeight: 500, color: "rgba(255,255,255,.88)", maxWidth: 320, margin: 0 }}>{line.description}</p>
            </div>
            <div style={{ padding: "18px 16px 8px", display: "flex", flexDirection: "column", gap: 14 }}>
              {line.groups.map(g => <Block key={g.id} group={g} named={line.name === "BEL"} />)}
            </div>
          </section>
        ))}

        {/* Conditions */}
        <section ref={el => { refs.current["cond"] = el; }} style={{ padding: "32px 22px 24px", background: "#FAF0E6", scrollMarginTop: 54 }}>
          <div style={{ fontSize: 10, letterSpacing: ".22em", textTransform: "uppercase", fontWeight: 700, color: "#FFA400", display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ width: 18, height: 2, background: "#FFA400", borderRadius: 2 }} />
            Información comercial
          </div>
          <h2 style={{ fontWeight: 900, fontSize: 32, lineHeight: .96, letterSpacing: "-.02em", color: "#0047BB", margin: "0 0 6px" }}>Condiciones<br />de pago y envío.</h2>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 18, borderTop: "1px solid #E5DFD5" }}>
            {conditions.map(c => (
              <div key={c.id} style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #E5DFD5" }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: "#0047BB", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 14 }}>{c.code}</div>
                <div style={{ fontWeight: 700, fontSize: 13.5, lineHeight: 1.2 }}>
                  {c.label}
                  <small style={{ display: "block", fontWeight: 500, fontSize: 11, color: "#6E6E6E", marginTop: 3 }}>{c.detail}</small>
                </div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 17, color: c.hot ? "#1C1C1C" : "#0047BB", background: c.hot ? "#FFA400" : "#F1E7DC", padding: "4px 10px", borderRadius: 6, whiteSpace: "nowrap" }}>{c.value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 22, background: "#0047BB", color: "white", borderRadius: 12, padding: 22, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -30, bottom: -90, fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 900, fontSize: 240, lineHeight: .78, color: "rgba(255,255,255,.07)", letterSpacing: "-.04em", textTransform: "uppercase", pointerEvents: "none" }}>k</div>
            <h4 style={{ fontWeight: 800, fontSize: 19, lineHeight: 1.1, margin: "0 0 8px", position: "relative" }}>Muebles cómodos, fáciles de armar y pensados para vivirse.</h4>
            <p style={{ fontSize: 12.5, lineHeight: 1.5, margin: "0 0 8px", color: "rgba(255,255,255,.88)", position: "relative" }}>Komfy diseña y fabrica muebles que combinan estética, funcionalidad y confort.</p>
            <p style={{ fontWeight: 700, color: "white", position: "relative", margin: "0 0 8px", fontSize: 12.5, lineHeight: 1.5 }}>Envíos a todo el país.</p>
            <a href={`https://${s.web || "komfy.com.ar"}`} target="_blank" rel="noopener" style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 8, background: "#FFA400", color: "#1C1C1C", fontWeight: 800, fontSize: 14, padding: "11px 18px", borderRadius: 999, textDecoration: "none", letterSpacing: ".02em", position: "relative" }}>
              {s.web || "komfy.com.ar"} →
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ background: "#1A1A1A", color: "#FAF0E6", padding: "26px 22px 32px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ height: 24 }}><KomfyLogo fill="#FAF0E6" accentFill="#FFA400" /></div>
          <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: ".18em", textTransform: "uppercase", color: "rgba(250,240,230,.5)" }}>
            Lista mayorista · {periodo} · {s.version}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 13, marginTop: 4 }}>
            <span style={{ fontSize: 10, letterSpacing: ".2em", textTransform: "uppercase", fontWeight: 700, color: "#FFA400" }}>Comercial</span>
            {[
              { href: `mailto:${s.contacto}`, label: `✉  ${s.contacto}` },
              { href: `tel:${s.telefono}`, label: `☎  ${s.telefono}` },
              { href: `https://${s.web}`, label: `🌐  ${s.web}` },
            ].map(link => (
              <a key={link.href} href={link.href} style={{ color: "#FAF0E6", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(255,255,255,.04)", borderRadius: 8, border: "1px solid rgba(255,255,255,.06)" }}>
                {link.label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
