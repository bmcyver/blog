import sharp from 'sharp'
import satori, { type Font } from 'satori'
import { readFileSync } from 'fs'

const fonts: Font[] = [
  {
    name: 'Noto Sans',
    data: readFileSync('public/fonts/NotoSansKR-Regular.ttf'),
    style: 'normal',
    weight: 400,
  },
  {
    name: 'Noto Sans',
    data: readFileSync('public/fonts/NotoSansKR-Bold.ttf'),
    weight: 700,
    style: 'normal',
  },
]

export async function generateOGImage(
  title: string,
  date: string,
  author: string,
) {
  const svg = await satori(
    <div
      style={{
        width: '1200px',
        height: '630px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#050a14',
        position: 'relative',
        fontFamily: 'Noto Sans',
      }}
    >
      {/* 그리드 패턴 */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          opacity: 0.2,
          backgroundImage:
            'linear-gradient(#06b6d4 1px, transparent 1px), linear-gradient(90deg, #06b6d4 1px, transparent 1px)',
          backgroundSize: '50px 50px',
        }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '40px',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <span
            style={{
              fontSize: '24px',
              color: '#06b6d4',
              fontWeight: '600',
              textShadow: '0 0 20px rgba(6, 182, 212, 0.5)',
            }}
          >
            {date}
          </span>
          <h1
            style={{
              fontSize: '68px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              lineHeight: 1.2,
              textShadow: '0 0 40px rgba(6, 182, 212, 0.3)',
            }}
          >
            {title}
          </h1>
        </div>
        <span style={{ fontSize: '32px', color: '#94a3b8' }}>
          Written by {author}
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: fonts,
    },
  )

  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer())
}
