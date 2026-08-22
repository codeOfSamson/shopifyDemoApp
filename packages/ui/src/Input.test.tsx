import { render, screen } from "@testing-library/react";
import { Input } from "./Input";

describe("Input", () => {
  it("renders with the given placeholder and forwards value/onChange props", () => {
    render(<Input placeholder="Search inventory" value="shoe" onChange={() => {}} />);
    expect(screen.getByPlaceholderText("Search inventory")).toHaveValue("shoe");
  });
});
