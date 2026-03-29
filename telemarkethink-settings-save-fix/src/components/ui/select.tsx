import { SelectHTMLAttributes } from "react";
import { cn } from "@/src/lib/cn";

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-brand-400",
        props.className
      )}
    />
  );
}
