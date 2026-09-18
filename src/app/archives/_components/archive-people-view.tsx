export function ArchivePeopleView() {
  return (
    <section aria-labelledby="archive-people-heading" className="space-y-5">
      <div>
        <h2 className="text-heading font-semibold text-primary" id="archive-people-heading">인물별 탐색</h2>
        <p className="mt-1 text-body-sm text-secondary">인물별 아카이브 탐색을 준비하고 있습니다.</p>
      </div>
      <ArchivePeopleMessage>인물별 탐색은 다음 단계에서 제공됩니다.</ArchivePeopleMessage>
    </section>
  );
}

function ArchivePeopleMessage({ children }: { children: string }) {
  return (
    <p className="rounded-xl border border-dashed border-default px-4 py-12 text-center text-body-sm text-secondary">
      {children}
    </p>
  );
}
