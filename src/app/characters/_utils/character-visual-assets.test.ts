import { describe, expect, it } from "vitest";

import {
  getAffiliationVisualAssets,
  getCharactersHeroBanner,
  type CharacterVisualTheme,
} from "./character-visual-assets";

const THEMES = ["dark", "light"] satisfies CharacterVisualTheme[];

describe("character visual assets", () => {
  it.each(THEMES)("%s 목록 Hero asset을 반환함", (theme) => {
    expect(getCharactersHeroBanner(theme)).toBe(
      `/banner/city_${theme}.webp`,
    );
  });

  it.each([
    "city-hall",
    "ems",
    "media",
    "police",
    "transport-maintenance",
  ])("organizations의 %s asset을 반환함", (slug) => {
    for (const theme of THEMES) {
      expect(
        getAffiliationVisualAssets({
          category: "public-service",
          slug,
          theme,
        }),
      ).toEqual({
        heroSrc: `/images/affiliations/organizations/${slug}_${theme}.webp`,
        cardBackgroundSrc: `/images/affiliations/organizations/detail-background/${slug}_bg_${theme}.webp`,
      });
    }
  });

  it.each(["business", "citizen", "crew", "gang"])(
    "categories의 %s asset을 반환함",
    (category) => {
      for (const theme of THEMES) {
        expect(
          getAffiliationVisualAssets({
            category,
            slug: "organization-slug",
            theme,
          }),
        ).toEqual({
          heroSrc: `/images/affiliations/categories/${category}_${theme}.webp`,
          cardBackgroundSrc: `/images/affiliations/categories/detail-background/${category}_bg_${theme}.webp`,
        });
      }
    },
  );

  it("illegal-business의 실제 파일명을 사용함", () => {
    expect(
      getAffiliationVisualAssets({
        category: "illegal-business",
        slug: "organization-slug",
        theme: "dark",
      }),
    ).toEqual({
      heroSrc: "/images/affiliations/categories/illegal-business_dark.webp",
      cardBackgroundSrc:
        "/images/affiliations/categories/detail-background/illegal-business_dark.webp",
    });
    expect(
      getAffiliationVisualAssets({
        category: "illegal-business",
        slug: "organization-slug",
        theme: "light",
      }),
    ).toEqual({
      heroSrc: "/images/affiliations/categories/illegal-business_light.webp",
      cardBackgroundSrc:
        "/images/affiliations/categories/detail-background/illegal-business_bg_light.webp",
    });
  });

  it("매칭되지 않는 값은 city-hall asset으로 fallback함", () => {
    expect(
      getAffiliationVisualAssets({
        category: "unknown",
        slug: "unknown",
        theme: "dark",
      }),
    ).toEqual({
      heroSrc: "/images/affiliations/organizations/city-hall_dark.webp",
      cardBackgroundSrc:
        "/images/affiliations/organizations/detail-background/city-hall_bg_dark.webp",
    });
  });
});
