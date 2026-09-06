import Image from "next/image";

export function CharactersBanner() {
  return (
    <header className="relative min-h-40 overflow-hidden bg-surface-raised sm:min-h-44">
      <Image
        fill
        priority
        alt=""
        aria-hidden="true"
        className="object-cover opacity-60 dark:opacity-45"
        sizes="(min-width: 1600px) 1536px, 100vw"
        src="/banner/city.png"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-background via-background/80 to-background/25"
      />
      <div className="relative flex min-h-40 flex-col justify-end p-5 sm:min-h-44 sm:p-7">
        <p className="text-caption font-semibold text-brand-text">
          BONGNUDO 2
        </p>
        <p className="mt-2 text-heading-sm font-semibold text-primary">
          각자의 이야기로 완성되는, 봉누도2
        </p>
        <p className="mt-1 text-body-sm text-secondary">
          사람이 모여, 또 하나의 세상이 됩니다.
        </p>
      </div>
    </header>
  );
}
