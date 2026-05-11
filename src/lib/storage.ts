const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

export function getPublicImageUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  if (!SUPABASE_URL) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/products/${path}`;
}
