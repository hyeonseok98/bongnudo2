"use client";

import { useTheme } from "next-themes";

export function ThemePreview() {
  const { setTheme } = useTheme();

  return (
    <main className="flex min-h-full flex-1 items-center justify-center bg-background px-6 py-16 text-primary">
      <section className="w-full max-w-2xl space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-medium text-secondary">Theme foundation</p>
          <h1 className="text-3xl font-semibold tracking-tight">다크 모드 시연</h1>
          <p className="text-secondary">
            테마를 선택해 semantic color token 적용 상태를 확인할 수 있습니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            className="cursor-pointer rounded-md border border-default bg-background px-4 py-2 text-sm font-medium text-primary"
            onClick={() => setTheme("light")}
            type="button"
          >
            Light
          </button>
          <button
            className="cursor-pointer rounded-md border border-default bg-background px-4 py-2 text-sm font-medium text-primary"
            onClick={() => setTheme("dark")}
            type="button"
          >
            Dark
          </button>
          <button
            className="cursor-pointer rounded-md border border-default bg-background px-4 py-2 text-sm font-medium text-primary"
            onClick={() => setTheme("system")}
            type="button"
          >
            System
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg border border-default bg-background p-5">
            <p className="text-sm text-secondary">Surface</p>
            <h2 className="mt-2 text-xl font-semibold">기본 텍스트</h2>
            <p className="mt-2 text-tertiary">
              보조 텍스트와 경계선 색상을 함께 확인합니다.
            </p>
          </article>
          <article className="rounded-lg bg-brand p-5 text-brand-foreground">
            <p className="text-sm">Brand</p>
            <h2 className="mt-2 text-xl font-semibold">강조 영역</h2>
            <p className="mt-2 text-sm">brand과 brand-foreground 조합입니다.</p>
          </article>
        </div>
      </section>
    </main>
  );
}