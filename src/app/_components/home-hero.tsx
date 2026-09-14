import Image from "next/image";

import heroStyles from "@/components/layouts/directory-hero.module.css";
import { buttonVariants } from "@/components/ui/button";

export function HomeHero() {
  return (
    <header
      className={`${heroStyles.hero} relative flex h-80 items-center justify-center overflow-hidden bg-surface-raised text-center sm:h-96 lg:h-104`}
    >
      <Image
        fill
        priority
        alt=""
        className="object-cover"
        sizes="(min-width: 1600px) 1536px, 100vw"
        src="/banner/home_banner.webp"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-black/35"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/25 via-transparent to-black/20"
      />

      <div className="relative flex max-w-3xl flex-col items-center px-4">
        <Image
          alt="BONGNUDO2"
          className="h-auto w-72 mix-blend-screen sm:w-96 lg:w-120"
          height={724}
          priority
          src="/logo/bongnudo2.webp"
          width={2172}
        />
        <h1 className="mt-3 text-heading-sm font-semibold text-white sm:text-title">
          각자의 이야기로 완성되는, 봉누도2
        </h1>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <a
            className={buttonVariants()}
            href="https://chzzk.naver.com/video/15146208"
            rel="noopener noreferrer"
            target="_blank"
          >
            인게임 설명회 →
          </a>
          <a
            className={buttonVariants({
              className:
                "border-white/60 bg-black/20 text-white hover:bg-white/10 focus-visible:border-white",
              variant: "outline",
            })}
            href="https://chzzk.naver.com/video/14675572"
            rel="noopener noreferrer"
            target="_blank"
          >
            ppt 설명회
          </a>
        </div>
      </div>
    </header>
  );
}
