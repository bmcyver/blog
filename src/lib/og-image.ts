import { createHash } from "node:crypto"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import sharp from "sharp"
import satori, { type Font } from "satori"

const FONT_CACHE_DIR = join(
  process.cwd(),
  "node_modules",
  ".cache",
  "blog-og-fonts",
)
const IMAGE_CACHE_DIR = join(
  process.cwd(),
  "node_modules",
  ".cache",
  "blog-og-images",
)

async function getCachedFont(
  url: string,
  filename: string,
): Promise<ArrayBuffer> {
  const cachedPath = join(FONT_CACHE_DIR, filename)

  if (existsSync(cachedPath)) {
    const buffer = readFileSync(cachedPath)
    return buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    )
  }

  console.log(`[OG] Fetching font from ${url}...`)
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch font from ${url}: ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()

  try {
    if (!existsSync(dirname(cachedPath))) {
      mkdirSync(dirname(cachedPath), { recursive: true })
    }
    writeFileSync(cachedPath, Buffer.from(arrayBuffer))
  } catch (error) {
    console.warn(`[OG] Failed to write font cache:`, error)
  }

  return arrayBuffer
}

const fonts: Font[] = [
  {
    name: "Pretendard",
    data: await getCachedFont(
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Regular.woff",
      "Pretendard-Regular139.woff",
    ),
    style: "normal",
    weight: 400,
  },
  {
    name: "Pretendard",
    data: await getCachedFont(
      "https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff/Pretendard-Bold.woff",
      "Pretendard-Bold139.woff",
    ),
    weight: 700,
    style: "normal",
  },
]

function getOGCacheKey(title: string, date: string, author: string): string {
  return createHash("sha256").update(`${title}:${date}:${author}`).digest("hex")
}

export async function generateOGImage(
  title: string,
  date: string,
  author: string,
) {
  const cacheKey = getOGCacheKey(title, date, author)
  const cachedImagePath = join(IMAGE_CACHE_DIR, `${cacheKey}.png`)

  if (existsSync(cachedImagePath)) {
    return readFileSync(cachedImagePath)
  }

  const svg = await satori(
    {
      type: "div",
      props: {
        style: {
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#050a14",
          position: "relative",
          fontFamily: "Pretendard",
        },
        children: [
          /* 그리드 패턴 */
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                opacity: 0.2,
                backgroundImage:
                  "linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)",
                backgroundSize: "50px 50px",
              },
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                gap: "40px",
                position: "relative",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      width: "48px",
                      height: "2px",
                      background: "#06b6d4",
                    },
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      gap: "20px",
                    },
                    children: [
                      {
                        type: "span",
                        props: {
                          style: {
                            fontSize: "24px",
                            color: "#06b6d4",
                            fontWeight: "600",
                            textShadow: "0 0 20px rgba(6, 182, 212, 0.5)",
                          },
                          children: date,
                        },
                      },
                      {
                        type: "h1",
                        props: {
                          style: {
                            fontSize: "68px",
                            fontWeight: "bold",
                            color: "white",
                            margin: 0,
                            lineHeight: 1.2,
                            textShadow: "0 0 40px rgba(6, 182, 212, 0.3)",
                          },
                          children: title,
                        },
                      },
                    ],
                  },
                },
                {
                  type: "span",
                  props: {
                    style: {
                      fontSize: "32px",
                      color: "#94a3b8",
                    },
                    children: `by ${author}`,
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      width: 1200,
      height: 630,
      fonts: fonts,
    },
  )

  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer()

  try {
    if (!existsSync(dirname(cachedImagePath))) {
      mkdirSync(dirname(cachedImagePath), { recursive: true })
    }
    writeFileSync(cachedImagePath, pngBuffer)
  } catch (error) {
    console.warn(`[OG] Failed to write image cache:`, error)
  }

  return pngBuffer
}
