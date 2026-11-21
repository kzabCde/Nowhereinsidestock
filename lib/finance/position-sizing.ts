export type TradeDirection = "long" | "short";

export type PositionSizingInput = {
  accountSize: number;
  riskPercent: number;
  entryPrice: number;
  stopPrice: number;
  targetPrice?: number | null;
};

export type PositionSizingResult = {
  direction: TradeDirection;
  hypothetical: boolean;
  riskBudget: number;
  riskPerShare: number;
  riskBasedShares: number;
  capitalBasedShares: number;
  shares: number;
  positionValue: number;
  positionPercent: number;
  maxLoss: number;
  rewardPerShare: number | null;
  rewardRiskRatio: number | null;
  potentialReward: number | null;
  breakevenWinRate: number | null;
  limitedByCapital: boolean;
};

function requirePositiveFinite(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0 || value > 1e15) {
    throw new Error(`${label} must be a positive number`);
  }
}

export function calculatePositionSize(input: PositionSizingInput): PositionSizingResult {
  requirePositiveFinite(input.accountSize, "Account size");
  requirePositiveFinite(input.riskPercent, "Risk percent");
  requirePositiveFinite(input.entryPrice, "Entry price");
  requirePositiveFinite(input.stopPrice, "Stop price");

  if (input.riskPercent > 100) throw new Error("Risk percent cannot exceed 100");
  if (input.stopPrice === input.entryPrice) throw new Error("Stop price must differ from entry price");

  const direction: TradeDirection = input.stopPrice < input.entryPrice ? "long" : "short";
  const riskBudget = input.accountSize * (input.riskPercent / 100);
  const riskPerShare = Math.abs(input.entryPrice - input.stopPrice);
  const riskBasedShares = Math.floor(riskBudget / riskPerShare);

  // A cash cap for longs and an illustrative notional cap for hypothetical shorts.
  const capitalBasedShares = Math.floor(input.accountSize / input.entryPrice);
  const shares = Math.max(0, Math.min(riskBasedShares, capitalBasedShares));
  if (!Number.isSafeInteger(shares)) throw new Error("Share count exceeds supported precision");
  const positionValue = shares * input.entryPrice;
  const positionPercent = (positionValue / input.accountSize) * 100;
  const maxLoss = shares * riskPerShare;

  const target = input.targetPrice;
  const targetIsPositive = typeof target === "number" && Number.isFinite(target) && target > 0;
  const targetIsDirectional = targetIsPositive && (
    direction === "long" ? target > input.entryPrice : target < input.entryPrice
  );
  const rewardPerShare = targetIsDirectional ? Math.abs(target - input.entryPrice) : null;
  const rewardRiskRatio = rewardPerShare == null ? null : rewardPerShare / riskPerShare;
  const potentialReward = rewardPerShare == null ? null : shares * rewardPerShare;
  const breakevenWinRate = rewardRiskRatio == null ? null : 100 / (1 + rewardRiskRatio);

  return {
    direction,
    hypothetical: direction === "short",
    riskBudget,
    riskPerShare,
    riskBasedShares,
    capitalBasedShares,
    shares,
    positionValue,
    positionPercent,
    maxLoss,
    rewardPerShare,
    rewardRiskRatio,
    potentialReward,
    breakevenWinRate,
    limitedByCapital: capitalBasedShares < riskBasedShares
  };
}
