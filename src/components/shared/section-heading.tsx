import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  accentColor?: "purple" | "pink" | "cyan";
  className?: string;
}

/**
 * Consistent section heading with neo-brutalist accent bar.
 */
export function SectionHeading({
  title,
  subtitle,
  align = "center",
  accentColor = "purple",
  className,
}: SectionHeadingProps) {
  const accentMap = {
    purple: "bg-primary",
    pink: "bg-secondary",
    cyan: "bg-accent",
  };

  return (
    <div
      className={cn(
        "space-y-4",
        align === "center" && "text-center",
        className
      )}
      style={{ marginBottom: "var(--space-block)" }}
    >
      {/* Accent bar */}
      <div
        className={cn(
          "h-1.5 w-16 rounded-full",
          accentMap[accentColor],
          align === "center" && "mx-auto"
        )}
      />
      <h2
        className="font-extrabold tracking-tight text-foreground"
        style={{
          fontSize: "var(--text-heading-lg)",
          fontFamily: "var(--font-space-grotesk)",
          lineHeight: 1.1,
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="text-muted-foreground text-lg max-w-2xl leading-relaxed" style={align === "center" ? { marginInline: "auto" } : undefined}>
          {subtitle}
        </p>
      )}
    </div>
  );
}
