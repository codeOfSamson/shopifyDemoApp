import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("applies the neutral tone classes by default", () => {
    render(<Badge>In stock</Badge>);
    expect(screen.getByText("In stock")).toHaveClass("bg-slate-100", "text-slate-700");
  });

  it("applies the danger tone classes when tone='danger'", () => {
    render(<Badge tone="danger">Low stock</Badge>);
    expect(screen.getByText("Low stock")).toHaveClass("bg-red-50", "text-red-700");
  });
});
