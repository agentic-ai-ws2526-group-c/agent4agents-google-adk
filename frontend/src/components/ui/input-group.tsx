import * as React from "react";
import { cn } from "@/lib/utils";

// --- InputGroup ---
const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center rounded-md border border-input",
      className,
    )}
    {...props}
  />
));
InputGroup.displayName = "InputGroup";

// --- InputGroupInput ---
const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "flex h-9 w-full bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
InputGroupInput.displayName = "InputGroupInput";

// --- InputGroupAddon ---
const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center px-3 text-sm text-muted-foreground",
      className,
    )}
    {...props}
  />
));
InputGroupAddon.displayName = "InputGroupAddon";

export { InputGroup, InputGroupInput, InputGroupAddon };
