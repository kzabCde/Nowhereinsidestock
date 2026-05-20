import Link from "next/link";
import NowhereInsideStockLogo from "@/components/brand/NowhereInsideStockLogo";

const legalLinks = [
  { href: "/privacy", label: "🔒 Privacy" },
  { href: "/terms", label: "📜 Terms" },
  { href: "/disclaimer", label: "⚠️ Disclaimer" },
  { href: "https://nowheredev.vercel.app/", label: "🔗 NOWHEREDEV" }
];

export default function Footer() { return (<footer className="mt-12 border-t border-white/10 bg-black/35 px-4 py-5 text-sm text-slate-400 backdrop-blur-md sm:px-6"><div className="mx-auto mb-4 w-full max-w-7xl"><NowhereInsideStockLogo compact className="mx-auto sm:mx-0" /></div><div className="mx-auto flex w-full max-w-7xl flex-col gap-3 pt-1 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left"><p className="text-slate-400">© 2026 NOWHEREINSIDESTOCK</p><nav className="flex flex-wrap justify-center gap-3 text-xs text-slate-500 sm:justify-start sm:text-sm">{legalLinks.map((link) => link.href.startsWith("http") ? <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-slate-200">{link.label}</a> : <Link key={link.label} href={link.href} className="transition-colors hover:text-slate-200">{link.label}</Link>)}</nav></div></footer>); }
