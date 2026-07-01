import { cn } from "@/lib/utils";
import { Container } from "./container";

interface SectionProps {
  children: React.ReactNode;
  id?: string;
  className?: string;
  containerSize?: "default" | "narrow" | "wide" | "full";
  /** Add the subtle dot-grid background */
  withPattern?: boolean;
}

/**
 * Reusable section wrapper with consistent vertical spacing.
 */
export function Section({
  children,
  id,
  className,
  containerSize = "default",
  withPattern = false,
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        "relative",
        withPattern && "geo-dots",
        className
      )}
      style={{ paddingBlock: "var(--space-section)" }}
    >
      <Container size={containerSize}>{children}</Container>
    </section>
  );
}
