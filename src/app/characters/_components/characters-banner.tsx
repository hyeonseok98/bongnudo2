"use client";

import { inkLiquid } from "@/styles/fonts/fonts";

import { getCharactersHeroBanner } from "../_utils/character-visual-assets";
import { CharacterVisualImage } from "./character-visual-image";
import styles from "./characters-banner.module.css";

export function CharactersBanner() {
  return (
    <header
      className={`${styles.hero} relative min-h-36 overflow-hidden bg-surface-raised sm:min-h-64 lg:min-h-72`}
    >
      <CharacterVisualImage
        priority
        className="object-cover opacity-80 dark:opacity-70"
        darkSrc={getCharactersHeroBanner("dark")}
        lightSrc={getCharactersHeroBanner("light")}
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
            <span className="text-title">각자의 이야기로 완성되는,</span>
            <span className="whitespace-nowrap text-hero--line-height font-semibold">
              봉누도2
            </span>
          </p>
        </div>
      </div>
    </header>
  );
}
