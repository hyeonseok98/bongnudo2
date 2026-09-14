"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function isCharacterDetailPath(pathname: string) {
  return /^\/characters\/(?:streamer|rp)\/[^/]+$/.test(pathname);
}

export function Footer() {
  const pathname = usePathname();

  if (isCharacterDetailPath(pathname)) {
    return null;
  }

  return (
    <footer className="flex flex-col gap-1 border-t border-default py-6 text-caption text-tertiary sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold tracking-wide text-secondary">BONGNUDO2</p>
        <p>각자의 이야기로 완성되는, 봉누도2</p>
      </div>
      <nav aria-label="정책 문서" className="flex gap-3">
        <Link className="hover:text-primary" href="/privacy">
          개인정보 처리방침
        </Link>
        <Link className="hover:text-primary" href="/terms">
          이용약관
        </Link>
      </nav>
    </footer>
  );
}
