import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  // Admin user
  const hash = await bcrypt.hash("komfy2026", 12);
  await db.user.upsert({
    where: { email: "admin@komfy.com.ar" },
    update: {},
    create: { email: "admin@komfy.com.ar", password: hash, name: "Admin Komfy" },
  });

  // Conditions
  await db.condition.deleteMany();
  const conditions = [
    { code: "EC", label: "E-Cheqs",                    detail: "Sobre fecha de factura",            value: "A pactar",  hot: false, order: 0 },
    { code: "TR", label: "Transferencias",              detail: "Pago al contado por banco",          value: "−10 %",     hot: true,  order: 1 },
    { code: "RD", label: "Retiro en depósito",          detail: "Sin costo de logística",             value: "−5 %",      hot: false, order: 2 },
    { code: "$+", label: "Compras mayores a $3.000.000",detail: "Descuento adicional por volumen",    value: "−5 %",      hot: true,  order: 3 },
    { code: "30", label: "30 días",                     detail: "Pago anticipado",                    value: "−4 %",      hot: false, order: 4 },
    { code: "60", label: "30 / 60 días neto",           detail: "Sin descuento, sin recargo",         value: "Neto",      hot: false, order: 5 },
    { code: "📦", label: "Envíos sin costo",            detail: "Con mínimo de compra",               value: "$800.000",  hot: true,  order: 6 },
  ];
  await db.condition.createMany({ data: conditions });

  // Lines
  const muk = await db.line.upsert({
    where: { id: "line-muk" },
    update: {},
    create: {
      id: "line-muk",
      name: "MUK",
      eyebrow: "Línea 01 · 6 colores",
      description: "Microtexturados y gris topo. Racks, estanterías, bancos zapateros y mesas bar para sumar carácter al ambiente.",
      order: 0,
    },
  });

  const bel = await db.line.upsert({
    where: { id: "line-bel" },
    update: {},
    create: {
      id: "line-bel",
      name: "BEL",
      eyebrow: "Línea 02 · Negro Mate + Roble",
      description: "La línea más completa: living, comedor y accesorios. Combinación negro mate y roble bardolino, con telas en Lino, Arena y Gris.",
      order: 1,
    },
  });

  const aire = await db.line.upsert({
    where: { id: "line-aire" },
    update: {},
    create: {
      id: "line-aire",
      name: "AIRE",
      eyebrow: "Línea 03 · Outdoor & Living",
      description: "Piezas grandes con presencia. Isla parrillera y mesa ratona, en tres terminaciones premium.",
      order: 2,
    },
  });

  // MUK colors
  const mukColors = [
    { color: "Negro microtexturado",        colorHex: "#1C1C1C",  suffix: "NST" },
    { color: "Blanco microtexturado",       colorHex: "#F2EBE0",  suffix: "BLA" },
    { color: "Gris topo liso",              colorHex: "#7A7268",  suffix: "GTL" },
    { color: "Manteca microtexturado",      colorHex: "#E6CD9C",  suffix: "MAM" },
    { color: "Terracota microtexturado",    colorHex: "#B05A3C",  suffix: "TEM" },
    { color: "Verde militar microtexturado",colorHex: "#4A5240",  suffix: "VMM" },
  ];

  const mukProducts = [
    { groupId: "", name: "Rack TV / Recibidor",  codeBase: "R15", med: "38 × 143,7 × 95,6 cm", bul: 2, price: 143228.99, groupName: "Rack TV / Recibidor",  groupDim: "38 × 143,7 × 95,6 cm" },
    { groupId: "", name: "Estantería",            codeBase: "EST", med: "38 × 63,8 × 164,6 cm",  bul: 2, price: 130278.82, groupName: "Estantería",            groupDim: "38 × 63,8 × 164,6 cm" },
    { groupId: "", name: "Banco Zapatero 75 cm",  codeBase: "Z75", med: "27,4 × 75 × 48 cm",     bul: 1, price: 80781.15,  groupName: "Banco Zapatero 75 cm",  groupDim: "27,4 × 75 × 48 cm" },
    { groupId: "", name: "Mesa Bar",              codeBase: "BRG", med: "32,4 × 60,8 × 80 cm",   bul: 1, price: 79446.00,  groupName: "Mesa Bar",              groupDim: "32,4 × 60,8 × 80 cm" },
    { groupId: "", name: "Mesa Bar Mini",         codeBase: "BAR", med: "28,2 × 45,3 × 61,5 cm", bul: 1, price: 70294.47,  groupName: "Mesa Bar Mini",         groupDim: "28,2 × 45,3 × 61,5 cm" },
  ];

  for (let gi = 0; gi < mukProducts.length; gi++) {
    const gp = mukProducts[gi];
    const group = await db.productGroup.upsert({
      where: { id: `group-muk-${gi}` },
      update: {},
      create: { id: `group-muk-${gi}`, lineId: muk.id, name: gp.groupName, dimensions: gp.groupDim, order: gi },
    });
    for (let pi = 0; pi < mukColors.length; pi++) {
      const c = mukColors[pi];
      const color = gi === 2 && pi === 2 ? "Gris topo" : c.color;
      await db.product.upsert({
        where: { id: `prod-muk-${gi}-${pi}` },
        update: { price: gp.price },
        create: {
          id: `prod-muk-${gi}-${pi}`,
          groupId: group.id,
          name: gp.name,
          sku: `002-${gp.codeBase}-${c.suffix}`,
          color,
          colorHex: c.colorHex,
          dimensions: gp.med,
          bulkQty: gp.bul,
          price: gp.price,
          order: pi,
        },
      });
    }
  }

  // BEL Living
  const belLiv = await db.productGroup.upsert({
    where: { id: "group-bel-liv" },
    update: {},
    create: { id: "group-bel-liv", lineId: bel.id, name: "Living", dimensions: "Negro Mate / Roble Bardolino", order: 0 },
  });
  const belLivItems = [
    { id: "prod-bel-0",  name: "Estantería Mensula Bel",   sku: "001-MEN-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "22 × 120 × 22,8 cm",  bul: 1, price: 25664.98 },
    { id: "prod-bel-1",  name: "Mesa Ratona Bel",           sku: "001-M09-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "85 × 55 × 60 cm",     bul: 2, price: 99441.33 },
    { id: "prod-bel-2",  name: "Biblioteca 1 Cuerpo Bel",   sku: "001-M1C-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "60 × 39 × 124 cm",    bul: 2, price: 183789.36 },
    { id: "prod-bel-3",  name: "Biblioteca 2 Cuerpos Bel",  sku: "001-M2C-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "80 × 39 × 124 cm",    bul: 2, price: 198787.13 },
    { id: "prod-bel-4",  name: "Biblioteca 3 Cuerpos Bel",  sku: "001-M3C-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "120 × 39 × 124 cm",   bul: 2, price: 228782.64 },
    { id: "prod-bel-5",  name: "Rack TV Bel",               sku: "001-R13-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "128 × 34 × 56 cm",    bul: 2, price: 144563.77 },
    { id: "prod-bel-6",  name: "Mesa de Arrime Bel",        sku: "001-MAR-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "40 × 30 × 70 cm",     bul: 2, price: 43915.67 },
  ];
  for (let i = 0; i < belLivItems.length; i++) {
    const p = belLivItems[i];
    await db.product.upsert({
      where: { id: p.id },
      update: { price: p.price },
      create: { id: p.id, groupId: belLiv.id, name: p.name, sku: p.sku, color: p.color, colorHex: p.ch, colorHex2: p.ch2, dimensions: p.med, bulkQty: p.bul, price: p.price, order: i },
    });
  }

  // BEL Comedor
  const belCom = await db.productGroup.upsert({
    where: { id: "group-bel-com" },
    update: {},
    create: { id: "group-bel-com", lineId: bel.id, name: "Comedor", dimensions: "Mesas + Sillas Bel", order: 1 },
  });
  const belComItems = [
    { id: "prod-bel-7",  name: "Mesa 120 × 80 cm Bel", sku: "001-M12-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "120 × 80 × 74,9 cm",    bul: 2, price: 135732.61 },
    { id: "prod-bel-8",  name: "Mesa 160 × 80 cm Bel", sku: "001-M16-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "160 × 80 × 74,9 cm",    bul: 2, price: 174953.36 },
    { id: "prod-bel-9",  name: "Silla Bel · Lino",     sku: "001-SIL-NST-WLI", color: "Negro Mate - Tela Lino",       ch: "#1C1C1C", ch2: "#CCC1A8", med: "47,8 × 47,9 × 81,2 cm", bul: 1, price: 55022.52 },
    { id: "prod-bel-10", name: "Silla Bel · Arena",    sku: "001-SIL-NST-WAR", color: "Negro Mate - Tela Arena",      ch: "#1C1C1C", ch2: "#D4B998", med: "47,8 × 47,9 × 81,2 cm", bul: 1, price: 55022.52 },
    { id: "prod-bel-11", name: "Silla Bel · Gris",     sku: "001-SIL-NST-WGR", color: "Negro Mate - Tela Gris",       ch: "#1C1C1C", ch2: "#888880", med: "47,8 × 47,9 × 81,2 cm", bul: 1, price: 55022.52 },
  ];
  for (let i = 0; i < belComItems.length; i++) {
    const p = belComItems[i];
    await db.product.upsert({
      where: { id: p.id },
      update: { price: p.price },
      create: { id: p.id, groupId: belCom.id, name: p.name, sku: p.sku, color: p.color, colorHex: p.ch, colorHex2: p.ch2, dimensions: p.med, bulkQty: p.bul, price: p.price, order: i },
    });
  }

  // BEL Accesorios
  const belAcc = await db.productGroup.upsert({
    where: { id: "group-bel-acc" },
    update: {},
    create: { id: "group-bel-acc", lineId: bel.id, name: "Accesorios Bel", dimensions: "Negro Mate", order: 2 },
  });
  const belAccItems = [
    { id: "prod-bel-12", name: "Perchero Simple Bel",      sku: "001-PES-NST",     color: "Negro Mate",                   ch: "#1C1C1C", ch2: null, med: "11 × 3 × 0,16 cm",       bul: 1, price: 2939.81 },
    { id: "prod-bel-13", name: "Perchero Doble Bel",       sku: "001-PED-NST",     color: "Negro Mate",                   ch: "#1C1C1C", ch2: null, med: "21 × 4,7 × 0,16 cm",     bul: 1, price: 4054.36 },
    { id: "prod-bel-14", name: "Apoya Libros Bel",         sku: "001-APO-NST",     color: "Negro Mate",                   ch: "#1C1C1C", ch2: null, med: "12,9 × 13 × 10,7 cm",    bul: 1, price: 4505.67 },
    { id: "prod-bel-15", name: "Organizador de Cables Bel",sku: "001-ODC-NST",     color: "Negro Mate",                   ch: "#1C1C1C", ch2: null, med: "29 × 11,2 × 11 cm",      bul: 1, price: 25277.61 },
    { id: "prod-bel-16", name: "Abridor de Cerveza Bel",   sku: "001-ABR-NST",     color: "Negro Mate",                   ch: "#1C1C1C", ch2: null, med: "16,1 × 3,5 × 0,16 cm",   bul: 1, price: 2462.57 },
    { id: "prod-bel-17", name: "Bandeja de Café Bel",      sku: "001-B04-NST-BAR", color: "Negro Mate - Roble Bardolino", ch: "#1C1C1C", ch2: "#B58A5E", med: "40 × 30 × 3,8 cm", bul: 2, price: 13872.75 },
  ];
  for (let i = 0; i < belAccItems.length; i++) {
    const p = belAccItems[i];
    await db.product.upsert({
      where: { id: p.id },
      update: { price: p.price },
      create: { id: p.id, groupId: belAcc.id, name: p.name, sku: p.sku, color: p.color, colorHex: p.ch, colorHex2: p.ch2 ?? undefined, dimensions: p.med, bulkQty: p.bul, price: p.price, order: i },
    });
  }

  // AIRE
  const aireColors = [
    { color: "Negro microtexturado",  colorHex: "#1C1C1C", suffix: "NST" },
    { color: "Blanco microtexturado", colorHex: "#F2EBE0", suffix: "BLA" },
    { color: "Gris topo liso",        colorHex: "#7A7268", suffix: "GTL" },
  ];
  const aireGroups = [
    { id: "group-aire-isla", name: "Isla Parrillera", dim: "40 × 125 × 86,1 cm", codeBase: "IPA", price: 458110.47, bul: 2 },
    { id: "group-aire-mr",   name: "Mesa Ratona",     dim: "60 × 80 × 43 cm",    codeBase: "MRA", price: 254219.35, bul: 2 },
  ];
  for (let gi = 0; gi < aireGroups.length; gi++) {
    const ag = aireGroups[gi];
    const group = await db.productGroup.upsert({
      where: { id: ag.id },
      update: {},
      create: { id: ag.id, lineId: aire.id, name: ag.name, dimensions: ag.dim, order: gi },
    });
    for (let pi = 0; pi < aireColors.length; pi++) {
      const c = aireColors[pi];
      await db.product.upsert({
        where: { id: `prod-aire-${gi}-${pi}` },
        update: { price: ag.price },
        create: {
          id: `prod-aire-${gi}-${pi}`,
          groupId: group.id,
          name: ag.name,
          sku: `004-${ag.codeBase}-${c.suffix}`,
          color: c.color,
          colorHex: c.colorHex,
          dimensions: ag.dim,
          bulkQty: ag.bul,
          price: ag.price,
          order: pi,
        },
      });
    }
  }

  console.log("✅ Seed completo");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => db.$disconnect());
