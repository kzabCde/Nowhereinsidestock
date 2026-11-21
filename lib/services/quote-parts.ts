export async function loadQuoteParts<Q, H, P>(quote: Promise<Q>, history: Promise<H>, profile: Promise<P>) {
  const [priceResult, historyResult, profileResult] = await Promise.allSettled([quote, history, profile]);
  if (priceResult.status === "rejected" && historyResult.status === "rejected") throw priceResult.reason;
  return {
    quote: priceResult.status === "fulfilled" ? priceResult.value : undefined,
    history: historyResult.status === "fulfilled" ? historyResult.value : undefined,
    profile: profileResult.status === "fulfilled" ? profileResult.value : undefined
  };
}
