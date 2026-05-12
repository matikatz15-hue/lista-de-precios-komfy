import Link from "next/link";

type Props = {
  href: string;
  label: string;
};

export function BackLink({ href, label }: Props) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 mb-3 transition-colors"
    >
      <span aria-hidden>←</span>
      <span>{label}</span>
    </Link>
  );
}
