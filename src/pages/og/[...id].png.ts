import { SITE } from '@/consts'
import { getAllPostsAndSubposts } from '@/lib/data-utils'
import { generateOGImage } from '@/lib/og-image'
import { formatDate } from '@/lib/utils'
import type { APIContext } from 'astro'

export async function getStaticPaths() {
  const posts = await getAllPostsAndSubposts()
  return posts.map((post) => ({
    params: { id: post.id },
    props: post,
  }))
}

export async function GET(context: APIContext) {
  const posts = await getAllPostsAndSubposts()
  const post = posts.find(
    (post) => post.id === context.params.id && !post.data.image,
  )
  if (!post) return context.rewrite('/404')

  const ogImage = await generateOGImage(
    post.data.title,
    formatDate(post.data.date),
    SITE.author,
  )

  return new Response(ogImage, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
    },
  })
}
