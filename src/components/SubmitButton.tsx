"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  style?: React.CSSProperties;
  formAction?: (formData: FormData) => void | Promise<void>;
};

export function SubmitButton({
  children,
  pendingText = "Guardando…",
  className,
  style,
  formAction,
}: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      style={style ? { ...style, opacity: pending ? 0.7 : 1, cursor: pending ? "wait" : style.cursor ?? "pointer" } : undefined}
      className={`${className ?? ""} ${pending ? "opacity-60 cursor-wait" : ""}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
