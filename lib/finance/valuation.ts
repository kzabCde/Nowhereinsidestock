const finite = (value: number) => Number.isFinite(value) ? value : null;

export function peFairValue(eps: number, targetPE: number): number | null {
  if (!Number.isFinite(eps) || !Number.isFinite(targetPE) || eps <= 0 || targetPE <= 0) return null;
  return finite(eps * targetPE);
}

export function grahamNumber(eps: number, bookValuePerShare: number): number | null {
  if (!Number.isFinite(eps) || !Number.isFinite(bookValuePerShare) || eps <= 0 || bookValuePerShare <= 0) return null;
  return finite(Math.sqrt(22.5 * eps * bookValuePerShare));
}

// dividendPerShare is the expected next annual dividend, D1.
export function dividendDiscountValue(dividendPerShare: number, requiredReturnPercent: number, growthRatePercent: number): number | null {
  if (
    !Number.isFinite(dividendPerShare) ||
    !Number.isFinite(requiredReturnPercent) ||
    !Number.isFinite(growthRatePercent) ||
    dividendPerShare < 0 ||
    requiredReturnPercent <= growthRatePercent
  ) {
    return null;
  }

  return finite(dividendPerShare / ((requiredReturnPercent - growthRatePercent) / 100));
}
