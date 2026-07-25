import { renderOgImage } from "@/lib/og-image"
import type { APIRoute, GetStaticPaths } from "astro"
import { getCollection } from "astro:content"

export const getStaticPaths = (async () => {
  const posts = await getCollection(
    "blog",
    ({ data }) => !data.draft && !data.image,
  )
  return posts.map((post) => ({
    params: { id: post.id },
    props: { title: post.data.title },
  }))
}) satisfies GetStaticPaths

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgImage(props.title)
  return new Response(png, { headers: { "Content-Type": "image/png" } })
}
