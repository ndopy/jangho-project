import { BedDouble, Compass, Home, Menu, Waves, type LucideIcon } from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
};

export const DESKTOP_NAV_ITEMS: NavItem[] = [
  { label: "마을소개", href: "/about" },
  { label: "오시는길", href: "/about/directions" },
  { label: "주변관광지", href: "/about/nearby" },
  { label: "체험", href: "/experiences" },
  { label: "숙박", href: "/lodging" },
  { label: "물때정보", href: "/tides" },
  { label: "공지사항", href: "/notices" },
];

export type TabItem = NavItem & { icon: LucideIcon };

export const MOBILE_TAB_ITEMS: TabItem[] = [
  { label: "홈", href: "/", icon: Home },
  { label: "체험", href: "/experiences", icon: Compass },
  { label: "숙박", href: "/lodging", icon: BedDouble },
  { label: "물때", href: "/tides", icon: Waves },
  { label: "더보기", href: "/more", icon: Menu },
];

export const MORE_LINKS: NavItem[] = [
  { label: "마을소개", href: "/about" },
  { label: "오시는길", href: "/about/directions" },
  { label: "주변관광지", href: "/about/nearby" },
  { label: "공지사항", href: "/notices" },
];
