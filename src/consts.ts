import type { SvgComponent } from "astro/types"
import Email from "@/assets/icons/email.svg"
import GitHub from "@/assets/icons/github.svg"
import LinkedIn from "@/assets/icons/linkedin.svg"
import RSS from "@/assets/icons/rss.svg"
import YouTube from "@/assets/icons/youtube.svg"

export const SITE = {
  title: "akml.dev",
  description:
    "Data scientist in retail banking, writing about data, machine learning, economics, and whatever else comes up.",
  locale: "en-US",
  dir: "ltr",
  defaultPageImage: "/static/opengraph-image.png",
} as const

export const NAVIGATION = [
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/authors", label: "Authors" },
]

export const SOCIALS: { href: string; label: string; icon: SvgComponent }[] = [
  { href: "https://github.com/akmalf", label: "GitHub", icon: GitHub },
  {
    href: "https://www.linkedin.com/in/akmalf",
    label: "LinkedIn",
    icon: LinkedIn,
  },
  {
    href: "mailto:akmal.fadhlurrahman@gmail.com",
    label: "Email",
    icon: Email,
  },
  { href: "/rss.xml", label: "RSS", icon: RSS },
  {
    href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    label: "YouTube",
    icon: YouTube,
  },
]
