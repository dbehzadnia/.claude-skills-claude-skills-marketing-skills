import * as React from "react";
import { cn } from "@/lib/utils";

/** Native <select>: works everywhere, including mobile pickers. */
const NativeSelect = React.forwardRef<HTMLSelectElement, React.ComponentProps<"select">>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-9 w-full rounded-md border border-input bg-card px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  ),
);
NativeSelect.displayName = "NativeSelect";

export { NativeSelect };
