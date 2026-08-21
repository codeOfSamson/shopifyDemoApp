import { render, screen } from "@testing-library/react";
import { Button } from "./Button";

describe("Button", () => {
  it("applies primary variant classes by default", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toHaveClass("bg-brand-600");
  });

  it("applies danger variant classes when variant='danger'", () => {
    render(<Button variant="danger">Delete</Button>);
    expect(screen.getByRole("button", { name: "Delete" })).toHaveClass("bg-red-600");
  });
});
