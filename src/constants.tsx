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

export const DEFAULT_PACKAGE_API_URL = "https://api.dumpus.app";

export const DEFAULT_REMOTION_API_URL = "https://remotion-api.sys.dumpus.app";

export const DEFAULT_WIDGET_API_URL = "https://widget.dumpus.app";

export const SQL_DEFAULT_LIMIT = 40;

export const BASE_URL = "https://dumpus.app";

export const SITE_NAME = "Dumpus";
