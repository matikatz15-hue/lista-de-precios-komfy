"use client";

import { useFormStatus } from "react-dom";

type Props = {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
};

export function SubmitButton({ children, pendingText = "Guardando…", className, formAction }: Props) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      formAction={formAction}
      disabled={pending}
      className={`${className ?? ""} ${pending ? "opacity-60 cursor-wait" : ""}`}
    >
      {pending ? pendingText : children}
    </button>
  );
}
