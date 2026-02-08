import * as React from "react";
import { cn } from "@/lib/utils";

// --- Field ---
const Field = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-2", className)} {...props} />
));
Field.displayName = "Field";

// --- FieldLabel ---
const FieldLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
      className,
    )}
    {...props}
  />
));
FieldLabel.displayName = "FieldLabel";

// --- FieldDescription ---
const FieldDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-[0.8rem] text-muted-foreground", className)}
    {...props}
  />
));
FieldDescription.displayName = "FieldDescription";

// --- FieldError ---
interface FieldErrorProps extends React.HTMLAttributes<HTMLParagraphElement> {
  errors?: ({ message?: string } | undefined)[];
}

const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, errors, ...props }, ref) => {
    const messages = errors
      ?.filter(Boolean)
      .map((e) => e?.message)
      .filter(Boolean);
    if (!messages || messages.length === 0) return null;
    return (
      <p
        ref={ref}
        className={cn("text-[0.8rem] font-medium text-destructive", className)}
        {...props}
      >
        {messages.join(", ")}
      </p>
    );
  },
);
FieldError.displayName = "FieldError";

export { Field, FieldLabel, FieldDescription, FieldError };
