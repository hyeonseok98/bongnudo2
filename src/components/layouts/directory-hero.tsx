import { ThemeImage } from "@/components/ui/theme-image";
import { inkLiquid } from "@/styles/fonts/fonts";

import styles from "./directory-hero.module.css";

interface DirectoryHeroProps {
  darkSrc: string;
  emphasisText?: string;
  leadText?: string;
  lightSrc: string;
}

export function DirectoryHero({
  darkSrc,
  emphasisText = "봉누도2",
  leadText = "각자의 이야기로 완성되는,",
  lightSrc,
}: DirectoryHeroProps) {
  return (
    <header
      className={`${styles.hero} relative min-h-36 overflow-hidden bg-surface-raised sm:min-h-64 lg:min-h-72`}
    >
      <ThemeImage
        priority
        className="object-cover opacity-80 dark:opacity-70"
        darkSrc={darkSrc}
        lightSrc={lightSrc}
        sizes="(min-width: 1600px) 1536px, 100vw"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-b from-transparent via-background/25 to-background/85"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-linear-to-r from-background/70 via-background/35 to-transparent"
      />
      <div className="relative mx-auto flex min-h-36 w-full max-w-400 flex-col justify-center px-4 sm:min-h-64 md:px-6 lg:min-h-72 lg:px-8">
        <div>
          <p className="text-body-sm font-semibold text-brand-text">
            BONGNUDO2
          </p>
          <p
            className={`${inkLiquid.className} flex flex-wrap items-baseline gap-x-3 text-primary`}
          >
            <span className="text-title">{leadText}</span>
            <span className="whitespace-nowrap text-hero--line-height">
              {emphasisText}
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
