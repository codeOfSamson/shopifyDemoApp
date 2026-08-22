export type LatencyOptions = {
  minMs?: number;
  maxMs?: number;
};

// Wraps a promise-returning function with a randomized artificial delay.
// Real Shopify API calls are usually too fast to show loading UI — this
// makes Suspense fallbacks and useTransition pending states visible in
// the demo without lying about the underlying data.
export function withLatency<Args extends unknown[], Result>(
  fn: (...args: Args) => Promise<Result>,
  options: LatencyOptions = {},
): (...args: Args) => Promise<Result> {
  const { minMs = 300, maxMs = 900 } = options;

  return async (...args: Args) => {
    const delay = minMs + Math.random() * (maxMs - minMs);
    const [result] = await Promise.all([
      fn(...args),
      new Promise((resolve) => setTimeout(resolve, delay)),
    ]);
    return result;
  };
}
