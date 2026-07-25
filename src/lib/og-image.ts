import { readFileSync } from "node:fs"
import { join } from "node:path"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"

const fontsDir = join(process.cwd(), "src/assets/fonts/og")
const regular = readFileSync(join(fontsDir, "GoldmanSans-Regular.ttf"))
const bold = readFileSync(join(fontsDir, "GoldmanSans-Bold.ttf"))

const logoSvg = readFileSync(
  join(process.cwd(), "src/assets/logo.svg"),
  "utf-8",
)
const logoViewBox = Number(logoSvg.match(/viewBox="0 0 (\d+)/)?.[1])
const logoRects = [
  ...logoSvg.matchAll(
    /<rect x="(\d+)" y="(\d+)" width="(\d+)" height="(\d+)"/g,
  ),
].map(
  ([, x, y, w, h]) =>
    [x, y, w, h].map(Number) as [number, number, number, number],
)

const BACKGROUND = "#fcfcfc"
const FOREGROUND = "#202020"
const MUTED = "#646464"

function logoMark(size: number) {
  const pct = (n: number) => `${(n / logoViewBox) * 100}%`
  return {
    type: "div",
    props: {
      style: {
        display: "flex",
        position: "relative",
        width: size,
        height: size,
      },
      children: logoRects.map(([x, y, w, h]) => ({
        type: "div",
        props: {
          style: {
            position: "absolute",
            left: pct(x),
            top: pct(y),
            width: pct(w),
            height: pct(h),
            backgroundColor: FOREGROUND,
          },
        },
      })),
    },
  }
}

export async function renderOgImage(title: string): Promise<Buffer> {
  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "1200px",
          height: "630px",
          padding: "80px",
          backgroundColor: BACKGROUND,
          fontFamily: "Goldman Sans",
        },
        children: [
          logoMark(72),
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                maxWidth: "1000px",
                fontSize: 64,
                fontWeight: 700,
                lineHeight: 1.2,
                color: FOREGROUND,
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                justifyContent: "flex-end",
                fontSize: 30,
                fontWeight: 400,
                color: MUTED,
              },
              children: "akml.dev",
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: "Goldman Sans", data: regular, weight: 400, style: "normal" },
        { name: "Goldman Sans", data: bold, weight: 700, style: "normal" },
      ],
    },
  )

  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } })
  return Buffer.from(resvg.render().asPng())
}
