import { useCallback, useEffect, useState } from 'react'
import { readJson, writeJson } from '../utils/storage'

interface StoredProgress {
  /** Ids of install steps the reader marked as done. */
  steps: string[]
  /** Ids of final checklist items the reader ticked. */
  checks: string[]
}

const EMPTY: StoredProgress = { steps: [], checks: [] }

function load(key: string): StoredProgress {
  const stored = readJson<Partial<StoredProgress>>(key, EMPTY)
  return {
    steps: Array.isArray(stored.steps) ? stored.steps : [],
    checks: Array.isArray(stored.checks) ? stored.checks : [],
  }
}

function toggle(list: string[], id: string, on: boolean): string[] {
  const has = list.includes(id)
  if (on === has) return list
  return on ? [...list, id] : list.filter((item) => item !== id)
}

/**
 * Remembers which install steps and checklist items are done for one module.
 * Saved in this browser only, so a reader can leave and pick up where they stopped.
 */
export function useInstallProgress(moduleSlug: string) {
  const storageKey = `script-modules:progress:${moduleSlug}`
  const [progress, setProgress] = useState<StoredProgress>(() => load(storageKey))

  useEffect(() => {
    writeJson(storageKey, progress)
  }, [storageKey, progress])

  const setStepDone = useCallback((id: string, done: boolean) => {
    setProgress((current) => ({ ...current, steps: toggle(current.steps, id, done) }))
  }, [])

  const setCheck = useCallback((id: string, checked: boolean) => {
    setProgress((current) => ({ ...current, checks: toggle(current.checks, id, checked) }))
  }, [])

  const reset = useCallback(() => setProgress(EMPTY), [])

  return {
    isStepDone: (id: string) => progress.steps.includes(id),
    isChecked: (id: string) => progress.checks.includes(id),
    setStepDone,
    setCheck,
    reset,
  }
}
