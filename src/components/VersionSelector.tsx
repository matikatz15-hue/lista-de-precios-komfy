"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { PriceSnapshot } from "@/lib/types";

type Props = {
  snapshots: PriceSnapshot[];
  current: string | null; // null = "actual"
};

export function VersionSelector({ snapshots, current }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  function handleChange(versionId: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (versionId) params.set("version", versionId);
    else params.delete("version");
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  }

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "rgba(255,255,255,.95)",
        padding: "4px 6px 4px 10px",
        borderRadius: 999,
        border: "1px solid rgba(0,0,0,.08)",
        fontFamily: "var(--font-noto), sans-serif",
        fontSize: 12,
        opacity: pending ? 0.6 : 1,
      }}
    >
      <span style={{ fontWeight: 700, color: "#6B6359", letterSpacing: ".05em" }}>
        Versión:
      </span>
      <select
        value={current ?? ""}
        onChange={(e) => handleChange(e.target.value)}
        disabled={pending}
        style={{
          background: "transparent",
          border: 0,
          fontWeight: 700,
          color: "#0047BB",
          padding: "2px 4px",
          fontSize: 12,
          fontFamily: "var(--font-noto), sans-serif",
          outline: "none",
          cursor: "pointer",
        }}
      >
        <option value="">Actual</option>
        {snapshots.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
    </div>
  );
}
