export function peFairValue(eps: number, targetPE: number): number | null {
  if (!Number.isFinite(eps) || !Number.isFinite(targetPE) || eps <= 0 || targetPE <= 0) return null;
  return eps * targetPE;
}

export function grahamNumber(eps: number, bookValuePerShare: number): number | null {
  if (!Number.isFinite(eps) || !Number.isFinite(bookValuePerShare) || eps <= 0 || bookValuePerShare <= 0) return null;
  return Math.sqrt(22.5 * eps * bookValuePerShare);
}

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

  return dividendPerShare / ((requiredReturnPercent - growthRatePercent) / 100);
}
