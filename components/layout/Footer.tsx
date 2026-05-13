import Link from "next/link";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "https://github.com", label: "GitHub" }
];

export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-black/35 px-4 py-5 text-sm text-slate-400 backdrop-blur-md sm:px-6">
      <div
        className="mx-auto flex w-full max-w-7xl flex-col gap-3 border-t border-transparent pt-1 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"
        style={{ borderImage: "linear-gradient(90deg, rgba(173,139,255,0.55), rgba(122,228,255,0.45), rgba(255,166,222,0.5)) 1" }}
      >
        <p className="text-slate-400">
          © 2026{" "}
          <a
            href="https://nowheredev.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold tracking-wide text-slate-300 transition-colors hover:text-white"
            aria-label="Visit NOWHEREDEV website"
          >
            NOWHEREDEV
          </a>
        </p>

        <nav className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 sm:justify-start sm:text-sm">
          {legalLinks.map((link) =>
            link.href.startsWith("http") ? (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-slate-200"
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.label} href={link.href} className="transition-colors hover:text-slate-200">
                {link.label}
              </Link>
            )
          )}
        </nav>
      </div>

      <p className="mx-auto mt-3 max-w-7xl text-xs text-slate-500">
        Market data is provided for educational and informational purposes only. Not financial advice.
      </p>
    </footer>
  );
}
