import { render, screen } from "@testing-library/react";
import { Table } from "./Table";

type Row = { id: string; name: string };
const columns = [{ key: "name", header: "Name", render: (row: Row) => row.name }];

describe("Table", () => {
  it("renders the empty message when there are no rows", () => {
    render(
      <Table<Row>
        columns={columns}
        rows={[]}
        getRowKey={(row) => row.id}
        emptyMessage="Nothing here yet."
      />,
    );
    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders one row per item using each column's render function", () => {
    render(<Table<Row> columns={columns} rows={[{ id: "1", name: "Widget" }]} getRowKey={(row) => row.id} />);
    expect(screen.getByText("Widget")).toBeInTheDocument();
  });
});
