# Komfy · Lista de Precios

Mini sistema para gestionar y publicar la lista de precios mayorista de Komfy.

- **Frontend público** (`/`): muestra la lista actualizada con diseño desktop (A4) y mobile.
- **Panel admin** (`/admin`): login con email + contraseña. Gestionás líneas, grupos de productos, variantes (SKUs) y settings.
- **Datos** en Supabase (Postgres + Storage + Auth).
- **Deploy** en Vercel.

## Setup local

1. **Variables de entorno**

   Copiá `.env.local.example` → `.env.local` y completá:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...
   ```

2. **Schema de la base**

   En Supabase Studio → **SQL Editor**, corré en orden:

   - `supabase/schema.sql` (crea tablas, RLS, bucket de storage)
   - `supabase/seed.sql` (carga MUK / BEL / AIRE con sus productos)

3. **Crear el usuario admin**

   En Supabase Studio → **Authentication → Users → Add user → Create new user**.
   Marcá *Auto Confirm User* y poné un email + password. Vas a usar esos para entrar al panel.

4. **Correr local**

   ```bash
   npm install
   npm run dev
   ```

   Abrir [http://localhost:3000](http://localhost:3000).

## Deploy en Vercel

1. **Importá el repo** desde Vercel.
2. **Settings → Environment Variables**: pegá las 3 vars del paso 1.
3. Deploy.

## Estructura

```
src/
  app/
    page.tsx              # Lista pública (responsive)
    layout.tsx            # Fonts + meta
    admin/
      login/              # Login email + password
      lines/              # CRUD de líneas
      lines/[id]/         # Detalle: grupos dentro de la línea
      groups/[id]/        # Detalle: variantes dentro del grupo
      settings/           # Settings globales
  components/
    PriceList/
      DesktopView.tsx     # Diseño A4
      MobileView.tsx      # Diseño phone con tabs
  lib/
    supabase/             # Clientes (browser + server)
    data.ts               # Fetch de la lista completa
    types.ts              # Tipos TS
supabase/
  schema.sql              # DDL + RLS + bucket
  seed.sql                # Datos iniciales (Marzo 2026)
reference/                # HTMLs originales del diseño (no usados en runtime)
public/brandbook/         # Logos, paleta, fotos
```

## Cómo se actualiza la lista pública

Cuando guardás cualquier cambio en `/admin`, las server actions ejecutan `revalidatePath("/")` y el caché de la página pública se invalida. La próxima visita ve los datos nuevos.

## Fotos de productos

Las fotos de los grupos se suben desde el admin a Supabase Storage (bucket `products`). El path se guarda en `product_groups.thumbnail_path` y la URL pública se arma con `getPublicImageUrl()`.
