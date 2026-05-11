-- ============================================================
-- KOMFY · Seed inicial (Marzo 2026)
-- Run AFTER schema.sql
-- ============================================================

-- Limpia datos previos (si querés reset; comentá si no)
-- delete from products;
-- delete from product_groups;
-- delete from lines;

-- ============================================================
-- LINES
-- ============================================================
insert into public.lines (id, slug, name, number, eyebrow, description, highlight_letter, banner_style, sort_order, active) values
  ('a0000000-0000-0000-0000-000000000001', 'muk',  'MuK',  1, 'Línea 01 · 6 colores',          'Microtexturados y gris topo. Racks, estanterías, bancos zapateros y mesas bar para sumar carácter al ambiente.', 'u', 'blue', 1, true),
  ('a0000000-0000-0000-0000-000000000002', 'bel',  'BeL',  2, 'Línea 02 · Negro Mate + Roble', 'La línea más completa: living, comedor y accesorios. Combinación negro mate y roble bardolino, con telas en Lino, Arena y Gris.', 'e', 'blue', 2, true),
  ('a0000000-0000-0000-0000-000000000003', 'aire', 'AiRE', 3, 'Línea 03 · Outdoor & Living',   'Piezas grandes con presencia. Isla parrillera y mesa ratona, en tres terminaciones premium.', 'i', 'blue', 3, true)
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, number = excluded.number,
  eyebrow = excluded.eyebrow, description = excluded.description,
  highlight_letter = excluded.highlight_letter, banner_style = excluded.banner_style,
  sort_order = excluded.sort_order, active = excluded.active;

-- ============================================================
-- PRODUCT GROUPS
-- ============================================================
insert into public.product_groups (id, line_id, name, base_dimensions, meta_label, sort_order) values
  -- MUK
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Rack TV / Recibidor',  '38 × 143,7 × 95,6 cm', '6 terminaciones',                 1),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Estantería',           '38 × 63,8 × 164,6 cm', '6 terminaciones',                 2),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Banco Zapatero 75 cm', '27,4 × 75 × 48 cm',    '6 terminaciones',                 3),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Mesa Bar',             '32,4 × 60,8 × 80 cm',  '6 terminaciones',                 4),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Mesa Bar Mini',        '28,2 × 45,3 × 61,5 cm','6 terminaciones',                 5),
  -- BEL
  ('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000002', 'Living',               null,                   '7 productos · Negro Mate / Roble',1),
  ('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000002', 'Comedor',              null,                   '5 productos · Mesas + Sillas',    2),
  ('b0000000-0000-0000-0000-000000000012', 'a0000000-0000-0000-0000-000000000002', 'Accesorios',           null,                   '6 productos · Negro Mate',        3),
  -- AIRE
  ('b0000000-0000-0000-0000-000000000020', 'a0000000-0000-0000-0000-000000000003', 'Isla Parrillera',      '40 × 125 × 86,1 cm',   '3 terminaciones',                 1),
  ('b0000000-0000-0000-0000-000000000021', 'a0000000-0000-0000-0000-000000000003', 'Mesa Ratona',          '60 × 80 × 43 cm',      '3 terminaciones',                 2)
on conflict (id) do update set
  line_id = excluded.line_id, name = excluded.name,
  base_dimensions = excluded.base_dimensions, meta_label = excluded.meta_label,
  sort_order = excluded.sort_order;

-- ============================================================
-- PRODUCTS (variants)
-- ============================================================
insert into public.products (product_group_id, name, sku, color_name, color_hex, color_hex_secondary, dimensions, packages, price, sort_order) values
  -- MUK · Rack TV
  ('b0000000-0000-0000-0000-000000000001', 'Rack TV / Recibidor', '002-R15-NST', 'Negro microtexturado',           '#1C1C1C', null, '38 × 143,7 × 95,6 cm', 2, 143228.99, 1),
  ('b0000000-0000-0000-0000-000000000001', 'Rack TV / Recibidor', '002-R15-BLA', 'Blanco microtexturado',          '#F2EBE0', null, '38 × 143,7 × 95,6 cm', 2, 143228.99, 2),
  ('b0000000-0000-0000-0000-000000000001', 'Rack TV / Recibidor', '002-R15-GTL', 'Gris topo liso',                 '#7A7268', null, '38 × 143,7 × 95,6 cm', 2, 143228.99, 3),
  ('b0000000-0000-0000-0000-000000000001', 'Rack TV / Recibidor', '002-R15-MAM', 'Manteca microtexturado',         '#E6CD9C', null, '38 × 143,7 × 95,6 cm', 2, 143228.99, 4),
  ('b0000000-0000-0000-0000-000000000001', 'Rack TV / Recibidor', '002-R15-TEM', 'Terracota microtexturado',       '#B05A3C', null, '38 × 143,7 × 95,6 cm', 2, 143228.99, 5),
  ('b0000000-0000-0000-0000-000000000001', 'Rack TV / Recibidor', '002-R15-VMM', 'Verde militar microtexturado',   '#4A5240', null, '38 × 143,7 × 95,6 cm', 2, 143228.99, 6),

  -- MUK · Estantería
  ('b0000000-0000-0000-0000-000000000002', 'Estantería', '002-EST-NST', 'Negro microtexturado',         '#1C1C1C', null, '38 × 63,8 × 164,6 cm', 2, 130278.82, 1),
  ('b0000000-0000-0000-0000-000000000002', 'Estantería', '002-EST-BLA', 'Blanco microtexturado',        '#F2EBE0', null, '38 × 63,8 × 164,6 cm', 2, 130278.82, 2),
  ('b0000000-0000-0000-0000-000000000002', 'Estantería', '002-EST-GTL', 'Gris topo liso',               '#7A7268', null, '38 × 63,8 × 164,6 cm', 2, 130278.82, 3),
  ('b0000000-0000-0000-0000-000000000002', 'Estantería', '002-EST-MAM', 'Manteca microtexturado',       '#E6CD9C', null, '38 × 63,8 × 164,6 cm', 2, 130278.82, 4),
  ('b0000000-0000-0000-0000-000000000002', 'Estantería', '002-EST-TEM', 'Terracota microtexturado',     '#B05A3C', null, '38 × 63,8 × 164,6 cm', 2, 130278.82, 5),
  ('b0000000-0000-0000-0000-000000000002', 'Estantería', '002-EST-VMM', 'Verde militar microtexturado', '#4A5240', null, '38 × 63,8 × 164,6 cm', 2, 130278.82, 6),

  -- MUK · Banco Zapatero 75
  ('b0000000-0000-0000-0000-000000000003', 'Banco Zapatero 75 cm', '002-Z75-NST', 'Negro microtexturado',         '#1C1C1C', null, '27,4 × 75 × 48 cm', 1, 80781.15, 1),
  ('b0000000-0000-0000-0000-000000000003', 'Banco Zapatero 75 cm', '002-Z75-BLA', 'Blanco microtexturado',        '#F2EBE0', null, '27,4 × 75 × 48 cm', 1, 80781.15, 2),
  ('b0000000-0000-0000-0000-000000000003', 'Banco Zapatero 75 cm', '002-Z75-GTL', 'Gris topo',                    '#7A7268', null, '27,4 × 75 × 48 cm', 1, 80781.15, 3),
  ('b0000000-0000-0000-0000-000000000003', 'Banco Zapatero 75 cm', '002-Z75-MAM', 'Manteca microtexturado',       '#E6CD9C', null, '27,4 × 75 × 48 cm', 1, 80781.15, 4),
  ('b0000000-0000-0000-0000-000000000003', 'Banco Zapatero 75 cm', '002-Z75-TEM', 'Terracota microtexturado',     '#B05A3C', null, '27,4 × 75 × 48 cm', 1, 80781.15, 5),
  ('b0000000-0000-0000-0000-000000000003', 'Banco Zapatero 75 cm', '002-Z75-VMM', 'Verde militar microtexturado', '#4A5240', null, '27,4 × 75 × 48 cm', 1, 80781.15, 6),

  -- MUK · Mesa Bar
  ('b0000000-0000-0000-0000-000000000004', 'Mesa Bar', '002-BRG-NST', 'Negro microtexturado',         '#1C1C1C', null, '32,4 × 60,8 × 80 cm', 1, 79446.00, 1),
  ('b0000000-0000-0000-0000-000000000004', 'Mesa Bar', '002-BRG-BLA', 'Blanco microtexturado',        '#F2EBE0', null, '32,4 × 60,8 × 80 cm', 1, 79446.00, 2),
  ('b0000000-0000-0000-0000-000000000004', 'Mesa Bar', '002-BRG-GTL', 'Gris topo liso',               '#7A7268', null, '32,4 × 60,8 × 80 cm', 1, 79446.00, 3),
  ('b0000000-0000-0000-0000-000000000004', 'Mesa Bar', '002-BRG-MAM', 'Manteca microtexturado',       '#E6CD9C', null, '32,4 × 60,8 × 80 cm', 1, 79446.00, 4),
  ('b0000000-0000-0000-0000-000000000004', 'Mesa Bar', '002-BRG-TEM', 'Terracota microtexturado',     '#B05A3C', null, '32,4 × 60,8 × 80 cm', 1, 79446.00, 5),
  ('b0000000-0000-0000-0000-000000000004', 'Mesa Bar', '002-BRG-VMM', 'Verde militar microtexturado', '#4A5240', null, '32,4 × 60,8 × 80 cm', 1, 79446.00, 6),

  -- MUK · Mesa Bar Mini
  ('b0000000-0000-0000-0000-000000000005', 'Mesa Bar Mini', '002-BAR-NST', 'Negro microtexturado',         '#1C1C1C', null, '28,2 × 45,3 × 61,5 cm', 1, 70294.47, 1),
  ('b0000000-0000-0000-0000-000000000005', 'Mesa Bar Mini', '002-BAR-BLA', 'Blanco microtexturado',        '#F2EBE0', null, '28,2 × 45,3 × 61,5 cm', 1, 70294.47, 2),
  ('b0000000-0000-0000-0000-000000000005', 'Mesa Bar Mini', '002-BAR-GTL', 'Gris topo liso',               '#7A7268', null, '28,2 × 45,3 × 61,5 cm', 1, 70294.47, 3),
  ('b0000000-0000-0000-0000-000000000005', 'Mesa Bar Mini', '002-BAR-MAM', 'Manteca microtexturado',       '#E6CD9C', null, '28,2 × 45,3 × 61,5 cm', 1, 70294.47, 4),
  ('b0000000-0000-0000-0000-000000000005', 'Mesa Bar Mini', '002-BAR-TEM', 'Terracota microtexturado',     '#B05A3C', null, '28,2 × 45,3 × 61,5 cm', 1, 70294.47, 5),
  ('b0000000-0000-0000-0000-000000000005', 'Mesa Bar Mini', '002-BAR-VMM', 'Verde militar microtexturado', '#4A5240', null, '28,2 × 45,3 × 61,5 cm', 1, 70294.47, 6),

  -- BEL · Living
  ('b0000000-0000-0000-0000-000000000010', 'Estantería Mensula Bel',   '001-MEN-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '22 × 120 × 22,8 cm',  1, 25664.98,  1),
  ('b0000000-0000-0000-0000-000000000010', 'Mesa Ratona Bel',          '001-M09-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '85 × 55 × 60 cm',     2, 99441.33,  2),
  ('b0000000-0000-0000-0000-000000000010', 'Biblioteca 1 Cuerpo Bel',  '001-M1C-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '60 × 39 × 124 cm',    2, 183789.36, 3),
  ('b0000000-0000-0000-0000-000000000010', 'Biblioteca 2 Cuerpos Bel', '001-M2C-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '80 × 39 × 124 cm',    2, 198787.13, 4),
  ('b0000000-0000-0000-0000-000000000010', 'Biblioteca 3 Cuerpos Bel', '001-M3C-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '120 × 39 × 124 cm',   2, 228782.64, 5),
  ('b0000000-0000-0000-0000-000000000010', 'Rack TV Bel',              '001-R13-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '128 × 34 × 56 cm',    2, 144563.77, 6),
  ('b0000000-0000-0000-0000-000000000010', 'Mesa de Arrime Bel',       '001-MAR-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '40 × 30 × 70 cm',     2, 43915.67,  7),

  -- BEL · Comedor
  ('b0000000-0000-0000-0000-000000000011', 'Mesa 120 × 80 cm Bel', '001-M12-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '120 × 80 × 74,9 cm',    2, 135732.61, 1),
  ('b0000000-0000-0000-0000-000000000011', 'Mesa 160 × 80 cm Bel', '001-M16-NST-BAR', 'Negro Mate - Roble Bardolino', '#1C1C1C', '#B58A5E', '160 × 80 × 74,9 cm',    2, 174953.36, 2),
  ('b0000000-0000-0000-0000-000000000011', 'Silla Bel · Lino',     '001-SIL-NST-WLI', 'Negro Mate - Tela Lino',       '#1C1C1C', '#CCC1A8', '47,8 × 47,9 × 81,2 cm', 1, 55022.52,  3),
  ('b0000000-0000-0000-0000-000000000011', 'Silla Bel · Arena',    '001-SIL-NST-WAR', 'Negro Mate - Tela Arena',      '#1C1C1C', '#D4B998', '47,8 × 47,9 × 81,2 cm', 1, 55022.52,  4),
  ('b0000000-0000-0000-0000-000000000011', 'Silla Bel · Gris',     '001-SIL-NST-WGR', 'Negro Mate - Tela Gris',       '#1C1C1C', '#888880', '47,8 × 47,9 × 81,2 cm', 1, 55022.52,  5),

  -- BEL · Accesorios
  ('b0000000-0000-0000-0000-000000000012', 'Perchero Simple Bel',      '001-PES-NST',     'Negro Mate',                    '#1C1C1C', null,       '11 × 3 × 0,16 cm',     1, 2939.81,  1),
  ('b0000000-0000-0000-0000-000000000012', 'Perchero Doble Bel',       '001-PED-NST',     'Negro Mate',                    '#1C1C1C', null,       '21 × 4,7 × 0,16 cm',   1, 4054.36,  2),
  ('b0000000-0000-0000-0000-000000000012', 'Apoya Libros Bel',         '001-APO-NST',     'Negro Mate',                    '#1C1C1C', null,       '12,9 × 13 × 10,7 cm',  1, 4505.67,  3),
  ('b0000000-0000-0000-0000-000000000012', 'Organizador de Cables Bel','001-ODC-NST',     'Negro Mate',                    '#1C1C1C', null,       '29 × 11,2 × 11 cm',    1, 25277.61, 4),
  ('b0000000-0000-0000-0000-000000000012', 'Abridor de Cerveza Bel',   '001-ABR-NST',     'Negro Mate',                    '#1C1C1C', null,       '16,1 × 3,5 × 0,16 cm', 1, 2462.57,  5),
  ('b0000000-0000-0000-0000-000000000012', 'Bandeja de Café Bel',      '001-B04-NST-BAR', 'Negro Mate - Roble Bardolino',  '#1C1C1C', '#B58A5E',  '40 × 30 × 3,8 cm',     2, 13872.75, 6),

  -- AIRE · Isla Parrillera
  ('b0000000-0000-0000-0000-000000000020', 'Isla Parrillera', '004-IPA-NST', 'Negro microtexturado',   '#1C1C1C', null, '40 × 125 × 86,1 cm', 2, 458110.47, 1),
  ('b0000000-0000-0000-0000-000000000020', 'Isla Parrillera', '004-IPA-BLA', 'Blanco microtexturado',  '#F2EBE0', null, '40 × 125 × 86,1 cm', 2, 458110.47, 2),
  ('b0000000-0000-0000-0000-000000000020', 'Isla Parrillera', '004-IPA-GTL', 'Gris topo liso',         '#7A7268', null, '40 × 125 × 86,1 cm', 2, 458110.47, 3),

  -- AIRE · Mesa Ratona
  ('b0000000-0000-0000-0000-000000000021', 'Mesa Ratona', '004-MRA-NST', 'Negro microtexturado',  '#1C1C1C', null, '60 × 80 × 43 cm', 2, 254219.35, 1),
  ('b0000000-0000-0000-0000-000000000021', 'Mesa Ratona', '004-MRA-BLA', 'Blanco microtexturado', '#F2EBE0', null, '60 × 80 × 43 cm', 2, 254219.35, 2),
  ('b0000000-0000-0000-0000-000000000021', 'Mesa Ratona', '004-MRA-GTL', 'Gris topo liso',        '#7A7268', null, '60 × 80 × 43 cm', 2, 254219.35, 3)
on conflict (sku) do update set
  product_group_id = excluded.product_group_id, name = excluded.name,
  color_name = excluded.color_name, color_hex = excluded.color_hex,
  color_hex_secondary = excluded.color_hex_secondary,
  dimensions = excluded.dimensions, packages = excluded.packages,
  price = excluded.price, sort_order = excluded.sort_order;

-- ============================================================
-- SETTINGS
-- ============================================================
update public.settings set
  period_label   = 'Mayorista · Marzo 2026',
  effective_date = '2026-03-11',
  contact_email  = 'comercial@komfy.com.ar',
  contact_phone  = '+54 9 341 331-8965',
  whatsapp       = '5493413318965',
  website_url    = 'https://komfy.com.ar',
  cover_subtitle = 'Catálogo mayorista de muebles Komfy. Precios netos, sin IVA.',
  intro_title    = 'Diseño <em>cómodo</em><br>y accesible que<br>transforma<br>espacios.',
  intro_body     = '<p><strong>¡Hola!</strong> Esta lista de precios fue creada como una guía clara y cuidada por Komfy para que puedas acceder a nuestras líneas de productos con precios mayoristas claros.</p><p>En Komfy creemos que el diseño cómodo y accesible transforma espacios. Diseñamos y fabricamos muebles fáciles de armar y pensados para adaptarse a distintos ambientes.</p>',
  stat_lines     = 3,
  stat_skus      = 53,
  stat_finishes  = 8,
  conditions     = '[
    {"icon":"EC","label":"E-Cheqs","sublabel":"Sobre fecha de factura","value":"A pactar"},
    {"icon":"TR","label":"Transferencias","sublabel":"Pago al contado por banco","value":"−10 %","hot":true},
    {"icon":"RD","label":"Retiro en depósito","sublabel":"Sin costo de logística","value":"−5 %"},
    {"icon":"$+","label":"Compras mayores a $3.000.000","sublabel":"Descuento adicional por volumen","value":"−5 %","hot":true},
    {"icon":"30","label":"30 días","sublabel":"Pago anticipado","value":"−4 %"},
    {"icon":"60","label":"30 / 60 días neto","sublabel":"Sin descuento, sin recargo","value":"Neto"},
    {"icon":"EN","label":"Envíos sin costo","sublabel":"Con mínimo de compra","value":"$800.000","hot":true}
  ]'::jsonb
where id = 1;
