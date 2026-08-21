import { logger } from "./logger";

describe("logger", () => {
  it("emits a structured JSON line with level, message, and timestamp", () => {
    const spy = jest.spyOn(console, "log").mockImplementation(() => {});

    logger.warn("low stock", { sku: "ABC-123", quantity: 2 });

    expect(spy).toHaveBeenCalledTimes(1);
    const line = spy.mock.calls[0][0] as string;
    const parsed = JSON.parse(line);
    expect(parsed).toMatchObject({
      level: "warn",
      message: "low stock",
      context: { sku: "ABC-123", quantity: 2 },
    });
    expect(typeof parsed.timestamp).toBe("string");

    spy.mockRestore();
  });
});
