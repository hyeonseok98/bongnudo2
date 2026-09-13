import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  CirclePlay,
  Clock,
  House,
  Map,
  Radio,
  Scissors,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface SidebarNavigationItem {
  label: string;
  href?: `/${string}`;
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
      { label: "타임라인", icon: Clock },
    ],
  },
  {
    label: "탐색",
    items: [
      { label: "인물 도감", href: "/characters", icon: Users },
      { label: "조직 도감", href: "/organizations", icon: Building2 },
      { label: "지도", icon: Map },
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
    label: "봉누도2",
    items: [
      { label: "서버 가이드", icon: BookOpen },
      { label: "일정", icon: CalendarDays },
      { label: "공지사항", icon: Bell },
    ],
  },
];
