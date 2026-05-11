# Komfy Catálogo — Guía de Setup

## Requisitos previos

- Node.js 20+
- Cuenta en [Vercel](https://vercel.com) (para deploy)
- Base de datos PostgreSQL — recomendado: [Neon](https://neon.tech) (tiene tier gratuito)

---

## Primer setup local

### 1. Instalar dependencias

```bash
npm install
```

### 2. Crear el archivo `.env.local`

Copiá el ejemplo y completá los valores:

```bash
cp .env.example .env.local
```

Editá `.env.local`:

```env
DATABASE_URL="postgresql://user:password@host:5432/komfy"
NEXTAUTH_SECRET="generá-uno-con-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
BLOB_READ_WRITE_TOKEN=""   # dejalo vacío por ahora para desarrollo local
```

**Para obtener `DATABASE_URL`:**
1. Creá una cuenta en [neon.tech](https://neon.tech)
2. Creá un nuevo proyecto
3. Copiá el connection string (formato `postgresql://...`)

**Para generar `NEXTAUTH_SECRET`:**
```bash
openssl rand -base64 32
```

### 3. Crear las tablas en la base de datos

```bash
npm run db:push
```

### 4. Cargar datos iniciales (líneas, productos y condiciones de Komfy)

```bash
npm run db:seed
```

Esto crea:
- Usuario admin: `admin@komfy.com.ar` / contraseña: `komfy2026`
- Las 3 líneas (MUK, BEL, AIRE) con todos sus productos y precios
- Las condiciones comerciales

**Cambiá la contraseña después del primer login desde Ajustes o la base de datos.**

### 5. Levantar el servidor de desarrollo

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000)

---

## Deploy en Vercel

### 1. Subir el código a GitHub

```bash
git init
git add .
git commit -m "init"
git remote add origin https://github.com/tu-usuario/komfy-catalogo.git
git push -u origin main
```

### 2. Importar en Vercel

1. Entrá a [vercel.com/new](https://vercel.com/new)
2. Importá tu repositorio de GitHub
3. En **Environment Variables**, agregá:
   - `DATABASE_URL` — tu connection string de Neon
   - `NEXTAUTH_SECRET` — el secreto generado
   - `NEXTAUTH_URL` — tu URL de Vercel (ej: `https://komfy-catalogo.vercel.app`)
   - `BLOB_READ_WRITE_TOKEN` — ver paso siguiente

### 3. Activar Vercel Blob (para subir fotos)

1. En tu proyecto de Vercel → pestaña **Storage**
2. Creá un nuevo **Blob store**
3. Vercel agrega automáticamente `BLOB_READ_WRITE_TOKEN` a tus env vars

### 4. Deploy

Hacé click en **Deploy**. ¡Listo!

---

## URLs del sistema

| URL | Descripción |
|-----|-------------|
| `/` | Catálogo A4 (compartir con clientes, imprimir) |
| `/mobile` | Catálogo mobile (compartir por WhatsApp) |
| `/admin` | Panel de administración |
| `/login` | Login del admin |

---

## Cómo actualizar precios

1. Entrá a `/admin` con tu email y contraseña
2. Sección **Productos** → buscá el producto → **Editar**
3. Cambiá el precio → **Guardar cambios**
4. Los catálogos se actualizan instantáneamente (SSR)

## Cómo agregar una nueva línea de productos

1. Admin → **Líneas** → **+ Nueva línea**
2. Completá nombre, eyebrow y descripción → **Crear**
3. Admin → **Grupos** → **+ Nuevo grupo** (asignale la línea nueva)
4. Admin → **Productos** → **+ Nuevo producto** (asignale el grupo)

## Cómo cambiar vigencia / período

Admin → **Ajustes** → modificá "Período" y "Vigencia" → **Guardar**
