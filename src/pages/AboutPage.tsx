import type { ReactNode } from 'react'
import { RichText } from '../components/ui/RichText'
import { sources } from '../data/janitor'
import { modules } from '../data/modules'
import { actionVariety } from '../data/modules/actionVariety'
import { historicalEquipment } from '../data/modules/historicalEquipment'
import { sceneAftermath } from '../data/modules/sceneAftermath'
import { ripper } from '../data/ripper'
import { site } from '../data/site'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { Link } from '../router/Link'
import { paths } from '../router/paths'
import { cx } from '../utils/cx'
import styles from './AboutPage.module.css'

const PIPELINE = [
  { term: 'Detect', detail: 'Read your latest message and a short window of recent ones.' },
  { term: 'Score', detail: 'Rate every entry. A direct mention in your latest message counts the most.' },
  { term: 'Rank', detail: 'Keep the strongest few and avoid several entries of the same kind.' },
  { term: 'Budget', detail: 'Shorten or drop entries so the note stays small.' },
  { term: 'Append', detail: "Add the note to the end of the character's scenario. Nothing is replaced." },
]

const REPOSITORY_FILES = [
  { path: 'README.md', note: `Overview of ${historicalEquipment.name}.` },
  { path: 'docs/DESIGN.md', note: 'How scoring, detail levels and the token budget work.' },
  { path: 'docs/ACTION_VARIETY.md', note: `Design notes and safeguards for ${actionVariety.name}.` },
  { path: 'docs/SCENE_AFTERMATH.md', note: `What ${sceneAftermath.name} carries forward and how recovery is judged.` },
  { path: 'docs/RIPPER.md', note: `Input formats, output shape and errors of ${ripper.name}.` },
  { path: 'tests/test-scenarios.md', note: `Behaviour checks for ${historicalEquipment.name}.` },
  { path: 'tests/combined-modules.md', note: 'Checks for running both modules together.' },
]

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <h2 id={id} className={styles.heading}>
        {title}
      </h2>
      <div className={styles.content}>{children}</div>
    </section>
  )
}

function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a className="text-link" href={href} target="_blank" rel="noreferrer">
      {children}
      <span className="visually-hidden"> (opens in a new tab)</span>
    </a>
  )
}

export function AboutPage() {
  useDocumentTitle('About and documentation')

  return (
    <div className={cx('container', styles.page)}>
      <header className={styles.hero}>
        <h1 className={styles.title}>About and documentation</h1>
        <p className={styles.lead}>
          What these scripts are, how they decide what to add, and how to tune them once they are installed.
        </p>
      </header>

      <Section id="about-what" title="What this is">
        <p>
          Scripts for the {site.platform} Scripts feature, and a guide for installing them. They are not browser
          extensions or apps, and nothing on this website runs in your chats. You copy a script into your own{' '}
          {site.platform} account, attach it to a character, and {site.platform} runs it there.
        </p>
        <p>
          This is an unofficial community project. It is not affiliated with or endorsed by {site.platform}.
        </p>
        <ul role="list" className={styles.moduleLinks}>
          {modules.map((module) => (
            <li key={module.slug} data-theme={module.theme}>
              <Link to={paths.module(module.slug)} className={styles.moduleLink}>
                <span className={styles.swatch} aria-hidden="true" />
                <span>
                  <span className={styles.moduleName}>{module.name}</span>
                  <span className={styles.moduleNote}>{module.tagline}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="about-how" title="How a script decides">
        <p>
          A script runs each time your character is about to reply. It starts fresh every time and rebuilds what
          it needs from the recent chat. The same scene always produces the same note. There is no random
          cycling.
        </p>
        <ol role="list" className={styles.pipeline}>
          {PIPELINE.map((stage) => (
            <li key={stage.term}>
              <span className={styles.stage}>{stage.term}</span>
              <span>{stage.detail}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="about-both" title="Using both modules">
        <p>
          The modules are separate scripts and neither depends on the other. {site.platform} does not guarantee
          the order scripts run in, so each one is built to work alone.
        </p>
        <p>
          If both activate for the same reply, both notes are added and the token cost adds up. Calm scenes
          cost nothing, because neither module adds a note.
        </p>
        <p>
          <RichText text="If the scenario contains a marker such as `[CONTEXT BUDGET: per_script=120]`, both modules keep to that smaller budget. The lowest value they accept is 80." />
        </p>
      </Section>

      <Section id="about-settings" title="Settings you can change">
        <p>
          <RichText text="Settings sit in the `CONFIG` block near the top of each script. Change a value in the JanitorAI editor and save. If you later paste a newer version of the script, your changes are replaced." />
        </p>
        {modules.map((module) => (
          <div key={module.slug} className={styles.settings} data-theme={module.theme}>
            <h3 className={styles.settingsTitle}>
              <span className={styles.swatch} aria-hidden="true" />
              {module.name}
            </h3>
            <dl className={styles.settingsList}>
              {module.settings.map((setting) => (
                <div key={setting.key} className={styles.setting}>
                  <dt>
                    <code>{setting.key}</code>
                    <span className={styles.settingValue}>{setting.value}</span>
                  </dt>
                  <dd>{setting.meaning}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </Section>

      <Section id="about-scope" title="Scope">
        <p>
          Both scripts supply narrative background for fiction. Equipment entries cover identification,
          provenance and appearance. Action beats stay at story level. Neither script gives real-world
          instructions for harming a person.
        </p>
      </Section>

      <Section id="about-sources" title="Where the install steps come from">
        <p>
          Every button and menu name in the install steps was checked against {site.platform}'s own
          documentation:
        </p>
        <ul role="list" className={styles.sources}>
          {sources.map((source) => (
            <li key={source.url}>
              <ExternalLink href={source.url}>{source.title}</ExternalLink>
              <span>{source.covers}</span>
            </li>
          ))}
        </ul>
        <p>
          Three details could not be confirmed: the exact label of the Advanced script type, the layout of the
          Advanced code editor, and whether a script can be attached to a character you did not create.
        </p>
        <p>
          {site.platform} can change its interface at any time. If a step no longer matches what you see,{' '}
          <ExternalLink href={`${site.repoUrl}/issues`}>open an issue on GitHub</ExternalLink>.
        </p>
      </Section>

      <Section id="about-repo" title="Repository">
        <ul role="list" className={styles.files}>
          {REPOSITORY_FILES.map((file) => (
            <li key={file.path}>
              <ExternalLink href={site.fileUrl(file.path)}>
                <code>{file.path}</code>
              </ExternalLink>
              <span>{file.note}</span>
            </li>
          ))}
        </ul>
        <p>
          <RichText
            text={`The repository also holds \`violence_engine.js\` (v0.1.0), a separate script with the same purpose as ${actionVariety.name}. Install one or the other, not both, or a confrontation will receive two sets of suggestions.`}
          />
        </p>
      </Section>
    </div>
  )
}
