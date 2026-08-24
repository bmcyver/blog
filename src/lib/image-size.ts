import { h } from "hastscript"
import { defineHastPlugin } from "satteri"

// Matches Obsidian-style image dimension syntax in alt text:
// - ![alt|100x200](url) -> alt="alt", caption="alt", width=100px, height=200px
// - ![alt|300](url)     -> alt="alt", caption="alt", width=300px, height=auto
// - ![alt|x300](url)    -> alt="alt", caption="alt", width=auto,  height=300px
// - ![|x300](url)       -> alt="",    caption="",    width=auto,  height=300px
// - ![|300x200](url)    -> alt="",    caption="",    width=300px, height=200px
// - ![|300](url)        -> alt="",    caption="",    width=300px, height=auto
// - ![300x200](url)     -> alt="",    caption="",    width=300px, height=200px
// - ![300](url)         -> alt="",    caption="",    width=300px, height=auto
// - ![x300](url)        -> alt="",    caption="",    width=auto,  height=300px
const SIZE_REGEX = /^(?:(.*)\|)?(?:(?:(\d+)?x(\d+))|(\d+))$/

export const imageSize = defineHastPlugin({
  name: "image-size",
  element: {
    filter: ["img"],
    visit(node, ctx) {
      const rawAlt = node.properties.alt
      let cleanAlt = ""

      if (typeof rawAlt === "string") {
        const match = rawAlt.match(SIZE_REGEX)
        if (match) {
          cleanAlt = match[1]?.trim() ?? ""
          const width = match[2] ?? match[4]
          const height = match[3]

          ctx.setProperty(node, "alt", cleanAlt)

          const existingStyle =
            typeof node.properties.style === "string"
              ? node.properties.style
              : ""

          let sizeStyle = ""
          if (width && height) {
            sizeStyle = `width: ${width}px; height: ${height}px; max-width: 100%; object-fit: contain;`
          } else if (width) {
            sizeStyle = `width: ${width}px; height: auto; max-width: 100%;`
          } else if (height) {
            sizeStyle = `width: auto; height: ${height}px; max-width: 100%;`
          }

          if (sizeStyle) {
            ctx.setProperty(
              node,
              "style",
              existingStyle ? `${sizeStyle} ${existingStyle}` : sizeStyle,
            )
          }
        } else {
          cleanAlt = rawAlt.trim()
          ctx.setProperty(node, "alt", cleanAlt)
        }
      }

      // Check for caption from title or alt text
      const title =
        typeof node.properties.title === "string"
          ? node.properties.title.trim()
          : ""
      const caption = title || cleanAlt

      // If caption text exists, wrap with semantic <figure> and <figcaption>
      if (caption) {
        ctx.wrapNode(node, h("figure", [h("figcaption", caption)]))
      }
    },
  },
})
