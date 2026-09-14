interface LegalDocumentProps {
  title: string;
  announcedAt: string;
  effectiveAt: string;
  content: string;
}

export function LegalDocument({
  title,
  announcedAt,
  effectiveAt,
  content,
}: LegalDocumentProps) {
  const lines = content.replace(/^# .+\r?\n/, "").split("\n");

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
          {lines.map((line, index) => {
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

            if (line.startsWith("|")) {
              return (
                <p className="overflow-x-auto whitespace-pre font-mono text-caption" key={index}>
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
