import { Link } from "./types";
import {
  ArrowTrendingUpIcon,
  ChartBarIcon,
  ChartPieIcon,
} from "@heroicons/react/24/solid";

export const links = [
  {
    name: "Overview",
    href: "/overview",
    active: (str) => str.startsWith("/overview"),
    icon: ChartPieIcon,
  },
  {
    name: "Top",
    href: "/top/dms",
    active: (str) => str.startsWith("/top"),
    icon: ArrowTrendingUpIcon,
  },
  {
    name: "Stats",
    href: "/stats",
    active: (str) => str.startsWith("/stats"),
    icon: ChartBarIcon,
  },
] satisfies Link[];
