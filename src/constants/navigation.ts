import {
  BookOpen,
  Building2,
  CirclePlay,
  Clock,
  Heart,
  House,
  Radio,
  Scissors,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface SidebarNavigationItem {
  label: string;
  href?: string;
  isExternal?: boolean;
  icon: LucideIcon;
}

export interface SidebarNavigationGroup {
  label?: string;
  items: SidebarNavigationItem[];
}

export const SIDEBAR_NAV: SidebarNavigationGroup[] = [
  { items: [{ label: "홈", href: "/", icon: House }] },
  {
    label: "실시간",
    items: [
      { label: "LIVE", href: "/live", icon: Radio },
      { label: "타임라인", icon: Clock, href: "/timeline" },
    ],
  },
  {
    label: "탐색",
    items: [
      { label: "인물 도감", href: "/characters", icon: Users },
      { label: "조직 도감", href: "/organizations", icon: Building2 },
    ],
  },
  {
    label: "영상",
    items: [
      { label: "다시보기", icon: CirclePlay },
      { label: "클립", icon: Scissors },
    ],
  },
  {
    label: "봉누도2 공식",
    items: [
      {
        label: "공식 위키",
        href: "https://bongnudo.super.site/",
        icon: BookOpen,
        isExternal: true,
      },
      {
        label: "봉누도2 따라가기",
        href: "https://bnd2-fanwiki.app/",
        icon: Heart,
        isExternal: true,
      },
    ],
  },
];
