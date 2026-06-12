import Link from "next/link";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "https://github.com", label: "GitHub", external: true }
];

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-white/[0.06] bg-bg px-4 py-6 sm:px-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">
          © 2026{" "}
          <a
            href="https://nowheredev.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-400 transition-colors hover:text-white"
          >
            NOWHEREDEV
          </a>
        </p>

        <nav className="flex flex-wrap gap-4 text-xs text-slate-600">
          {legalLinks.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-slate-300"
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-slate-300">
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>
      <p className="mx-auto mt-4 max-w-7xl text-xs text-slate-700">
        Market data for educational purposes only. Not financial advice.
      </p>
    </footer>
  );
}
