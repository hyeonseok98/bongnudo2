interface LegalDocumentProps {
  title: string;
  announcedAt: string;
  effectiveAt: string;
  content: string;
}

interface LegalTextBlock {
  kind: "text";
  line: string;
  index: number;
}

interface LegalTableBlock {
  kind: "table";
  header: string[];
  rows: string[][];
  index: number;
}

type LegalContentBlock = LegalTextBlock | LegalTableBlock;

function parseLegalContent(content: string): LegalContentBlock[] {
  const lines = content.replace(/^# .+\r?\n/, "").split("\n");
  const blocks: LegalContentBlock[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? "";

    if (!isMarkdownTableRow(line)) {
      blocks.push({ kind: "text", line, index });
      continue;
    }

    const tableRows: string[][] = [];
    const tableStartIndex = index;

    while (index < lines.length && isMarkdownTableRow(lines[index] ?? "")) {
      tableRows.push(splitMarkdownTableRow(lines[index] ?? ""));
      index += 1;
    }

    index -= 1;

    const rows = tableRows.filter(
      (cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)),
    );
    const [header, ...bodyRows] = rows;

    if (header) {
      blocks.push({
        kind: "table",
        header,
        rows: bodyRows,
        index: tableStartIndex,
      });
    }
  }

  return blocks;
}

function isMarkdownTableRow(line: string) {
  return line.startsWith("|") && line.endsWith("|");
}

function splitMarkdownTableRow(line: string) {
  return line
    .slice(1, -1)
    .split("|")
    .map((cell) => cell.trim().replace(/`([^`]+)`/g, "$1"));
}

export function LegalDocument({
  title,
  announcedAt,
  effectiveAt,
  content,
}: LegalDocumentProps) {
  const blocks = parseLegalContent(content);

  return (
    <main className="mx-auto w-full max-w-4xl py-8 sm:py-12">
      <article className="rounded-xl border border-default bg-surface-raised p-5 sm:p-8">
        <header className="border-b border-default pb-6">
          <h1 className="text-title font-bold text-primary">{title}</h1>
          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-body-sm text-secondary">
            <div className="flex gap-1">
              <dt>공고일</dt>
              <dd>{announcedAt}</dd>
            </div>
            <div className="flex gap-1">
              <dt>시행일</dt>
              <dd>{effectiveAt}</dd>
            </div>
          </dl>
        </header>

        <div className="mt-8 space-y-1 text-body-sm leading-6 text-secondary">
          {blocks.map((block) => {
            if (block.kind === "table") {
              return (
                <div
                  className="my-5 overflow-x-auto rounded-lg border border-default"
                  key={block.index}
                >
                  <table className="min-w-full border-collapse text-left text-caption">
                    <thead className="bg-surface-muted text-secondary">
                      <tr>
                        {block.header.map((cell, index) => (
                          <th
                            className="whitespace-nowrap border-b border-default px-3 py-2 font-semibold"
                            key={`${cell}-${index}`}
                            scope="col"
                          >
                            {cell}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {block.rows.map((row, rowIndex) => (
                        <tr className="border-b border-default last:border-b-0" key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td className="px-3 py-2 align-top" key={`${cell}-${cellIndex}`}>
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            }

            const { line, index } = block;

            if (line === "---") {
              return <hr className="my-6 border-default" key={index} />;
            }

            if (line.startsWith("## ")) {
              return (
                <h2 className="mt-8 text-heading-sm font-bold text-primary" key={index}>
                  {line.slice(3)}
                </h2>
              );
            }

            if (line.startsWith("### ")) {
              return (
                <h3 className="mt-5 font-semibold text-primary" key={index}>
                  {line.slice(4)}
                </h3>
              );
            }

            if (line.startsWith("* ")) {
              return (
                <p className="pl-4 before:mr-2 before:content-['•']" key={index}>
                  {line.slice(2)}
                </p>
              );
            }

            if (/^\d+\. /.test(line)) {
              return (
                <p className="pl-4" key={index}>
                  {line}
                </p>
              );
            }

            if (line === "") {
              return <div className="h-3" key={index} />;
            }

            return <p key={index}>{line}</p>;
          })}
        </div>
      </article>
    </main>
  );
}
