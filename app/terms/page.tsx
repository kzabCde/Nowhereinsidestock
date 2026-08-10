import { getServerI18n } from "@/lib/i18n/server";

export default async function TermsPage() {
  const { t } = await getServerI18n();
  return (
    <main className="grid-overlay min-h-screen px-6 py-10">
      <section className="printstream-shell pearl-border mx-auto max-w-4xl rounded-3xl p-8 md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-100">{t("legal.termsTitle")}</h1>
        <p className="mt-6 text-sm leading-6 text-slate-300 md:text-base">{t("legal.termsBody")}</p>
      </section>
    </main>
  );
}
