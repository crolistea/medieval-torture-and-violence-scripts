import { useMemo, useState } from 'react'
import { modules } from '../data/modules'
import { impactProfileBySlug, type ImpactProfile } from '../data/impactProfiles'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { cx } from '../utils/cx'
import styles from './CalculatorPage.module.css'

type Connection = 'jllm' | 'paid' | 'proxy'
type ModelFamily = 'jllm' | 'openai' | 'deepseek' | 'anthropic' | 'google' | 'other'

const activationWeight = { rare: .22, situational: .42, frequent: .62 } as const
const fmt = new Intl.NumberFormat('en-US')

function capShared(values: number[], cap: number) {
  return Math.min(values.reduce((sum, value) => sum + value, 0), cap)
}

function band(value: number, cuts: [number, number, number]) {
  if (value < cuts[0]) return 'LOW'
  if (value < cuts[1]) return 'MODERATE'
  if (value < cuts[2]) return 'HIGH'
  return 'VERY HIGH'
}

export function CalculatorPage() {
  useDocumentTitle('Script impact calculator')
  const [selected, setSelected] = useState<string[]>([])
  const [connection, setConnection] = useState<Connection>('jllm')
  const [model, setModel] = useState<ModelFamily>('jllm')
  const [contextWindow, setContextWindow] = useState(16384)
  const [responseTokens, setResponseTokens] = useState(600)
  const [basePrompt, setBasePrompt] = useState(2200)
  const [temperature, setTemperature] = useState(1)

  const chosen = useMemo(
    () => selected.map((slug) => impactProfileBySlug.get(slug)).filter((x): x is ImpactProfile => Boolean(x)),
    [selected],
  )

  const analysis = useMemo(() => {
    const normal = chosen.filter((x) => !x.sharedBudget)
    const shared = chosen.filter((x) => x.sharedBudget === 'dialogue')
    const max = normal.reduce((sum, x) => sum + x.maxTokens, 0) + capShared(shared.map((x) => x.maxTokens), 360)
    const typical = Math.round(
      normal.reduce((sum, x) => sum + x.typicalTokens * activationWeight[x.activation], 0) +
      capShared(shared.map((x) => x.typicalTokens * activationWeight[x.activation]), 360),
    )
    const activeTypical = normal.reduce((sum, x) => sum + x.typicalTokens, 0) + capShared(shared.map((x) => x.typicalTokens), 360)
    const usable = Math.max(1, contextWindow - responseTokens)
    const typicalPct = (typical / usable) * 100
    const maxPct = (max / usable) * 100
    const memoryAfterTypical = Math.max(0, contextWindow - responseTokens - basePrompt - typical)
    const memoryAfterMax = Math.max(0, contextWindow - responseTokens - basePrompt - max)

    const domainCounts = new Map<string, number>()
    chosen.forEach((x) => x.domains.forEach((domain) => domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1)))
    const overlapPairs = [...domainCounts.values()].reduce((sum, n) => sum + Math.max(0, n - 1), 0)
    const overlap = band(overlapPairs, [1, 3, 6])
    const instructionRaw = chosen.reduce((sum, x) => sum + x.strength * activationWeight[x.activation], 0)
    const instruction = band(instructionRaw, [2.5, 5.5, 9])
    const contextBand = band(maxPct, [2, 6, 12])
    const tempVariance = temperature <= .6 ? 'LOW' : temperature <= 1.05 ? 'MODERATE' : temperature <= 1.35 ? 'HIGH' : 'VERY HIGH'

    return { max, typical, activeTypical, typicalPct, maxPct, memoryAfterTypical, memoryAfterMax, overlap, instruction, contextBand, tempVariance }
  }, [chosen, contextWindow, responseTokens, basePrompt, temperature])

  const toggle = (slug: string) => setSelected((current) =>
    current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug],
  )

  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>SCRIPT STACK / IMPACT ESTIMATOR</p>
        <h1>Context<br />Pressure</h1>
        <p className={styles.lead}>
          Estimate token pressure and instruction density before stacking scripts. Context math is measurable; model behavior is an estimate, not a benchmark.
        </p>
      </header>

      <div className={styles.grid}>
        <section className={styles.controls} aria-labelledby="stack-heading">
          <div className={styles.block}>
            <div className={styles.blockHead}><span>01</span><h2 id="stack-heading">Build your stack</h2></div>
            <div className={styles.scripts}>
              {modules.map((module) => {
                const profile = impactProfileBySlug.get(module.slug)
                if (!profile) return null
                const checked = selected.includes(module.slug)
                return (
                  <label key={module.slug} className={cx(styles.script, checked && styles.checked)}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(module.slug)} />
                    <span className={styles.fakeCheck}>{checked ? '×' : ''}</span>
                    <span><strong>{module.name}</strong><small>up to ~{profile.maxTokens} injected tokens</small></span>
                  </label>
                )
              })}
            </div>
            <div className={styles.quick}>
              <button type="button" onClick={() => setSelected(modules.map((m) => m.slug).filter((s) => impactProfileBySlug.has(s)))}>SELECT ALL</button>
              <button type="button" onClick={() => setSelected([])}>CLEAR</button>
            </div>
          </div>

          <div className={styles.block}>
            <div className={styles.blockHead}><span>02</span><h2>Connection</h2></div>
            <div className={styles.segmented}>
              {([['jllm','JanitorAI / JLLM'],['paid','JanitorAI paid'],['proxy','Proxy / API']] as const).map(([value,label]) => (
                <button key={value} type="button" className={connection === value ? styles.active : ''} onClick={() => setConnection(value)}>{label}</button>
              ))}
            </div>
            <label className={styles.field}>
              <span>Model family</span>
              <select value={model} onChange={(e) => setModel(e.target.value as ModelFamily)}>
                <option value="jllm">JanitorAI / JLLM</option>
                <option value="openai">OpenAI / GPT</option>
                <option value="deepseek">DeepSeek</option>
                <option value="anthropic">Anthropic / Claude</option>
                <option value="google">Google / Gemini</option>
                <option value="other">Other / custom</option>
              </select>
            </label>
            <p className={styles.hint}>Provider names do not assume a context limit. Enter the limit shown by your current model/provider.</p>
          </div>

          <div className={styles.block}>
            <div className={styles.blockHead}><span>03</span><h2>Generation setup</h2></div>
            <div className={styles.numberGrid}>
              <label className={styles.field}><span>Context window</span><input type="number" min="1024" step="1024" value={contextWindow} onChange={(e) => setContextWindow(Math.max(1024, Number(e.target.value) || 1024))} /><small>tokens</small></label>
              <label className={styles.field}><span>Max response</span><input type="number" min="1" value={responseTokens} onChange={(e) => setResponseTokens(Math.max(1, Number(e.target.value) || 1))} /><small>tokens</small></label>
              <label className={styles.field}><span>Base prompt estimate</span><input type="number" min="0" value={basePrompt} onChange={(e) => setBasePrompt(Math.max(0, Number(e.target.value) || 0))} /><small>card + system + other context</small></label>
            </div>
            <label className={styles.range}>
              <span>Temperature <strong>{temperature.toFixed(2)}</strong></span>
              <input type="range" min="0" max="2" step=".05" value={temperature} onChange={(e) => setTemperature(Number(e.target.value))} />
            </label>
            <p className={styles.hint}>Temperature is shown as a variability signal only. It does not change the token calculation.</p>
          </div>
        </section>

        <aside className={styles.results} aria-live="polite">
          <div className={styles.resultHead}><span>LIVE ESTIMATE</span><strong>{selected.length} SCRIPT{selected.length === 1 ? '' : 'S'}</strong></div>
          <div className={styles.primary}>
            <span>CONTEXT IMPACT</span>
            <strong>{analysis.contextBand}</strong>
            <div className={styles.meter}><i style={{ width: `${Math.min(100, analysis.maxPct * 5)}%` }} /></div>
            <p>~{analysis.typicalPct.toFixed(1)}% expected / ~{analysis.maxPct.toFixed(1)}% worst-case of usable input context.</p>
          </div>

          <dl className={styles.stats}>
            <div><dt>Expected per turn</dt><dd>~{fmt.format(analysis.typical)} tok</dd></div>
            <div><dt>If all selected activate</dt><dd>~{fmt.format(analysis.activeTypical)} tok</dd></div>
            <div><dt>Worst-case budget</dt><dd>~{fmt.format(analysis.max)} tok</dd></div>
            <div><dt>Conversation room</dt><dd>~{fmt.format(analysis.memoryAfterTypical)} tok</dd></div>
            <div><dt>Worst-case room</dt><dd>~{fmt.format(analysis.memoryAfterMax)} tok</dd></div>
            <div><dt>Instruction pressure</dt><dd>{analysis.instruction}</dd></div>
            <div><dt>Domain overlap</dt><dd>{analysis.overlap}</dd></div>
            <div><dt>Temp variability</dt><dd>{analysis.tempVariance}</dd></div>
          </dl>

          <div className={styles.explain}>
            <h2>What this means</h2>
            {selected.length === 0 ? <p>Select scripts to build a stack. An inactive conditional script adds no model-facing guidance for that turn.</p> : (
              <>
                <p><strong>Token cost:</strong> calculated from each script's own injection ceiling, with a weighted expected-use estimate for conditional activation.</p>
                <p><strong>Behavior:</strong> instruction pressure and overlap are heuristic. Models differ in how reliably they follow competing or subtle guidance.</p>
                {chosen.filter((x) => x.sharedBudget).length > 1 && <p><strong>Shared budget detected:</strong> the dialogue/intent modules share a 360-token ceiling, so their worst cases are not simply added forever.</p>}
              </>
            )}
          </div>

          <div className={styles.disclaimer}>
            <strong>ESTIMATE, NOT A BENCHMARK.</strong>
            <p>Exact JanitorAI prompt assembly, provider truncation and model behavior can vary. Use the context-window value from your actual model/provider for the best estimate.</p>
          </div>
        </aside>
      </div>

      <section className={styles.method}>
        <span>METHOD / 04</span>
        <h2>What we can actually know.</h2>
        <div>
          <p><strong>High confidence:</strong> script injection ceilings, shared budgets, selected stack size and percentage of the context window.</p>
          <p><strong>Estimated:</strong> how often conditional scripts activate, instruction pressure and conceptual overlap.</p>
          <p><strong>Not faked:</strong> there is no made-up “quality drops 17%” score. Temperature and model family affect behavior, but not in a universal percentage we can honestly promise.</p>
        </div>
      </section>
    </div>
  )
}
