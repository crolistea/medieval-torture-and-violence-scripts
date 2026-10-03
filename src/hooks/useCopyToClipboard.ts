import { useCallback, useEffect, useRef, useState } from 'react'

export type CopyState = 'idle' | 'copied' | 'failed'

/** Fallback for browsers or contexts where the Clipboard API is unavailable. */
function copyWithSelection(text: string): boolean {
  const area = document.createElement('textarea')
  area.value = text
  area.setAttribute('readonly', '')
  area.style.position = 'fixed'
  area.style.top = '0'
  area.style.left = '0'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  return ok
}

async function writeToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Permission denied or insecure context: try the older method below.
    }
  }
  return copyWithSelection(text)
}

/**
 * Copies text and reports the result for a short time, so a button can
 * show "Copied" and then return to normal.
 */
export function useCopyToClipboard(resetAfterMs = 2200) {
  const [state, setState] = useState<CopyState>('idle')
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const copy = useCallback(
    async (text: string) => {
      const ok = await writeToClipboard(text)
      setState(ok ? 'copied' : 'failed')
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setState('idle'), resetAfterMs)
      return ok
    },
    [resetAfterMs],
  )

  return { state, copy }
}
