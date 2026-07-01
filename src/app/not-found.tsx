import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center geo-grid">
      <div className="text-center space-y-6 px-4">
        <h1
          className="text-gradient-purple font-extrabold tracking-tighter"
          style={{ fontSize: "var(--text-heading-xl)", fontFamily: "var(--font-space-grotesk)" }}
        >
          404
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          This page doesn&apos;t exist. Maybe it ran away to join another Discord server.
        </p>
        <Link
          href="/"
          className="inline-block neo-border neo-shadow-primary neo-press rounded-xl px-8 py-3 font-semibold text-primary-foreground"
          style={{ backgroundColor: "var(--primary)" }}
        >
          Go Home
        </Link>
      </div>
    </main>
  );
}
