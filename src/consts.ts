import type { SvgComponent } from "astro/types"
import Email from "@/assets/icons/email.svg"
import GitHub from "@/assets/icons/github.svg"
import RSS from "@/assets/icons/rss.svg"
import YouTube from "@/assets/icons/youtube.svg"

export const SITE = {
  title: "akml.dev",
  description: "An opinionated, unstyled blogging template built with Astro.",
  locale: "en-US",
  dir: "ltr",
  defaultPageImage: "/static/opengraph-image.png",
  defaultPostImage: "/static/1200x630.png",
} as const

export const NAVIGATION = [
  { href: "/blog", label: "Blog" },
  { href: "/projects", label: "Projects" },
  { href: "/authors", label: "Authors" },
]

export const SOCIALS: { href: string; label: string; icon: SvgComponent }[] = [
  { href: "https://github.com/akmalf", label: "GitHub", icon: GitHub },
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
