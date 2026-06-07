import type { SvgComponent } from "astro/types"
import Email from "@/assets/icons/email.svg"
import GitHub from "@/assets/icons/github.svg"
import RSS from "@/assets/icons/rss.svg"
import Twitter from "@/assets/icons/twitter.svg"

export const SITE = {
  title: "bmcyver",
  description: "bmcyver's blog - A place to share my thoughts and ideas",
  author: "bmcyver",
  locale: "ko-KR",
  dir: "ltr",
  defaultPageImage: "/static/opengraph-image.png",
  defaultPostImage: "/static/1200x630.png",
  featuredPostCount: 2,
} as const

export const NAVIGATION = [
  { href: "/blog", label: "Blog" },
  // { href: "/projects", label: "Projects" },
  { href: "/authors", label: "Authors" },
]

export const SOCIALS: { href: string; label: string; icon: SvgComponent }[] = [
  { href: "https://github.com/bmcyver", label: "GitHub", icon: GitHub },
  // { href: "https://twitter.com/enscrbe", label: "Twitter", icon: Twitter },
  { href: "mailto:me@bmcyver.dev", label: "Email", icon: Email },
  { href: "/rss.xml", label: "RSS", icon: RSS },
]

export const Awards: {
  year: number
  place: string
  team: string
  event: string
}[] = [
  { year: 2025, place: "2nd", team: "1010110", event: "ELECCON Junior" },
  {
    year: 2025,
    place: "3rd",
    team: "2h2u",
    event: "CCE Junior",
  },
  {
    year: 2025,
    place: "1st",
    team: "._.",
    event: "YISF",
  },
]

export const CVEs: string[] = ["CVE-2025-61385"]
