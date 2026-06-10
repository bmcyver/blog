import { getPosts } from "@/lib/content"
import { generateOGImage } from "@/lib/og-image"
import { formatDate } from "@/lib/utils"
import type { APIContext } from "astro"

export async function getStaticPaths() {
  const posts = await getPosts()
  return posts.map((post) => ({
    params: { id: post.id },
    props: post,
  }))
}

export async function GET(context: APIContext) {
  const posts = await getPosts()
  const post = posts.find(
    (post) => post.id === context.params.id && !post.data.image,
  )
  if (!post) return context.rewrite("/404")

  const ogImage = await generateOGImage(
    post.data.title,
    formatDate(post.data.date),
    post.data.authors.join(", "),
  )

  return new Response(ogImage, {
    status: 200,
    headers: {
      "Content-Type": "image/png",
    },
  })
}
