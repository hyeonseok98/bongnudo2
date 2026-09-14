import Image from "next/image";

import heroStyles from "@/components/layouts/directory-hero.module.css";
import { inkLiquid } from "@/styles/fonts/fonts";

export function HomeHero() {
  return (
    <header
      className={`${heroStyles.hero} relative flex h-72 items-center overflow-hidden bg-surface-raised sm:h-96 lg:h-112`}
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
        className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-black/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-t from-black/55 via-transparent to-black/20"
      />

      <div className="relative mx-auto w-full max-w-400 px-4 md:px-6 lg:px-8">
        <p className="text-body-sm font-semibold tracking-wide text-brand-text">
          BONGNUDO2
        </p>
        <h1
          className={`${inkLiquid.className} mt-2 max-w-3xl text-title text-white sm:text-hero`}
        >
          각자의 이야기로 완성되는, 봉누도2
        </h1>
      </div>
    </header>
  );
}
