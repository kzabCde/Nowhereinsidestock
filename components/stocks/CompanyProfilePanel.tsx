type Props = {
  description?: string;
  sector?: string;
  industry?: string;
  website?: string;
  fullTimeEmployees?: number;
};

export function CompanyProfilePanel({ description, sector, industry, website, fullTimeEmployees }: Props) {
  return (
    <section className="printstream-shell pearl-border rounded-3xl p-4 sm:p-6">
      <h2 className="text-xl font-semibold">Company Profile</h2>
      <div className="mt-4 space-y-3 text-sm sm:text-base">
        <div>
          <p className="text-slate-300">Description</p>
          <p className="mt-1 text-slate-100">
            {description ?? "No company description available from Yahoo Finance."}
          </p>
        </div>
        {sector && (
          <div>
            <p className="text-slate-300">Sector</p>
            <p>{sector}</p>
          </div>
        )}
        {industry && (
          <div>
            <p className="text-slate-300">Industry</p>
            <p>{industry}</p>
          </div>
        )}
        {website && (
          <div>
            <p className="text-slate-300">Website</p>
            <a className="text-cyan-300 hover:underline" href={website} target="_blank" rel="noreferrer">
              {website}
            </a>
          </div>
        )}
        {typeof fullTimeEmployees === "number" && (
          <div>
            <p className="text-slate-300">Employees</p>
            <p>{fullTimeEmployees.toLocaleString()}</p>
          </div>
        )}
      </div>
    </section>
  );
}
