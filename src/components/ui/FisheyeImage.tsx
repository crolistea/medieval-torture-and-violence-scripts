import { useEffect, useRef, useState } from 'react'
import { cx } from '../../utils/cx'
import styles from './FisheyeImage.module.css'

/**
 * How hard the picture bulges. 0 is a flat rectangle; higher bows the four
 * edges out further and pulls the corners in. 0.45 is strong.
 */
const BULGE = 0.3

/** The lens is drawn at this size and scaled by CSS, so it costs the same on any screen. */
const WIDTH = 1200
const HEIGHT = 800

/** The hairline drawn along the curved edge, so the shape reads even on a dark picture. */
const RIM = [161, 0, 0]
const RIM_WIDTH = 3

/*
 * Draws the picture as a bulged sheet. The whole rectangle is bent, outline
 * included: the middle of each edge reaches the frame while the corners pull
 * inward, and whatever falls outside the curved outline is left transparent.
 *
 * Each output pixel works out where on the flat picture it came from and
 * blends the four nearest pixels there.
 */
function drawLens(canvas: HTMLCanvasElement, image: HTMLImageElement) {
  const flat = document.createElement('canvas')
  flat.width = WIDTH
  flat.height = HEIGHT
  const flatContext = flat.getContext('2d', { willReadFrequently: true })
  const context = canvas.getContext('2d')
  if (!flatContext || !context) return false

  // Crop to fill, the same as object-fit: cover. The picture is never stretched.
  const scale = Math.max(WIDTH / image.naturalWidth, HEIGHT / image.naturalHeight)
  const drawWidth = image.naturalWidth * scale
  const drawHeight = image.naturalHeight * scale
  flatContext.drawImage(image, (WIDTH - drawWidth) / 2, (HEIGHT - drawHeight) / 2, drawWidth, drawHeight)

  const source = flatContext.getImageData(0, 0, WIDTH, HEIGHT).data
  const output = context.createImageData(WIDTH, HEIGHT)
  const target = output.data

  for (let y = 0; y < HEIGHT; y++) {
    const v = ((y + 0.5) / HEIGHT) * 2 - 1
    for (let x = 0; x < WIDTH; x++) {
      const u = ((x + 0.5) / WIDTH) * 2 - 1

      // Further from the centre, the flat picture is sampled further out still.
      // Scaled so the middle of each edge lands exactly on the frame.
      const reach = (1 + BULGE * (u * u + v * v)) / (1 + BULGE)
      const su = u * reach
      const sv = v * reach

      // Distance inside the picture's edge, in pixels. Negative is outside.
      const inside = Math.min((1 - Math.abs(su)) * (WIDTH / 2), (1 - Math.abs(sv)) * (HEIGHT / 2))
      if (inside <= -0.5) continue

      const sx = Math.min(WIDTH - 1.001, Math.max(0, ((su + 1) / 2) * WIDTH - 0.5))
      const sy = Math.min(HEIGHT - 1.001, Math.max(0, ((sv + 1) / 2) * HEIGHT - 0.5))
      const x0 = sx | 0
      const y0 = sy | 0
      const fx = sx - x0
      const fy = sy - y0

      const a = (y0 * WIDTH + x0) * 4
      const b = a + 4
      const c = a + WIDTH * 4
      const d = c + 4
      const out = (y * WIDTH + x) * 4

      // Lit on the crown of the bulge, shaded toward the corners.
      const edge = (su * su + sv * sv) / 2
      const shade = 1.06 - 0.36 * edge * edge
      const rim = inside < RIM_WIDTH ? 0.85 : 0

      for (let channel = 0; channel < 3; channel++) {
        const top = source[a + channel] + (source[b + channel] - source[a + channel]) * fx
        const bottom = source[c + channel] + (source[d + channel] - source[c + channel]) * fx
        const colour = (top + (bottom - top) * fy) * shade
        target[out + channel] = colour + (RIM[channel] - colour) * rim
      }
      // A soft one-pixel edge instead of a jagged one.
      target[out + 3] = Math.min(1, inside + 0.5) * 255
    }
  }

  context.putImageData(output, 0, 0)
  return true
}

interface FisheyeImageProps {
  src: string
  className?: string
  /** Called once the picture is on screen, or has fallen back to the flat image. */
  onShown?: () => void
}

/**
 * A script image bent like a fisheye, as if it is pressing out of the page.
 * Nothing shows until the lens is drawn; then the whole thing fades in, so the
 * flat picture is never seen first. If the lens cannot be drawn, the flat
 * picture fades in instead.
 */
export function FisheyeImage({ src, className, onShown }: FisheyeImageProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const onShownRef = useRef(onShown)
  onShownRef.current = onShown
  const [state, setState] = useState<'waiting' | 'lens' | 'flat'>('waiting')

  useEffect(() => {
    let live = true
    const show = (next: 'lens' | 'flat') => {
      if (!live) return
      setState(next)
      onShownRef.current?.()
    }

    const image = new Image()
    image.onload = () => {
      try {
        show(canvasRef.current && drawLens(canvasRef.current, image) ? 'lens' : 'flat')
      } catch {
        show('flat')
      }
    }
    image.onerror = () => show('flat')
    image.src = src

    return () => {
      live = false
    }
  }, [src])

  return (
    <div className={cx(styles.frame, state !== 'waiting' && styles.shown, className)}>
      {state === 'flat' && <img className={styles.layer} src={src} alt="" />}
      <canvas ref={canvasRef} className={styles.layer} width={WIDTH} height={HEIGHT} aria-hidden="true" />
    </div>
  )
}
