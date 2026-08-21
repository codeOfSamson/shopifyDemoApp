import { withLatency } from "./withLatency";

describe("withLatency", () => {
  it("resolves with the wrapped function's result", async () => {
    const fast = async (x: number) => x * 2;
    const slow = withLatency(fast, { minMs: 5, maxMs: 10 });

    await expect(slow(21)).resolves.toBe(42);
  });

  it("waits at least minMs before resolving", async () => {
    const fast = async () => "done";
    const slow = withLatency(fast, { minMs: 50, maxMs: 60 });

    const start = Date.now();
    await slow();
    const elapsed = Date.now() - start;

    expect(elapsed).toBeGreaterThanOrEqual(45); // small tolerance for timer jitter
  });
});
