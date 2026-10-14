// Auto · Hell · Dunkel — sichtbar in der Kopfzeile (lzm-web, ADR-007 Stand
// 2026-10-13). Dieselbe Wahl wie in den Einstellungen; beide lesen
// `useThema`, damit keine Stelle einen alten Stand zeigt.
import type { ReactNode } from 'react'
import { setzeThema, useThema, type Thema } from '../lib/thema'
import { useT } from '../i18n'

const strich = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

const ZEICHEN: Record<Thema, ReactNode> = {
  system: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...strich}>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  hell: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...strich}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </svg>
  ),
  dunkel: (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...strich}>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </svg>
  ),
}

export function ThemaUmschalter() {
  const { t } = useT()
  const thema = useThema()
  const wahl: { id: Thema; label: string }[] = [
    { id: 'system', label: t('settings.theme.system', 'Follow the system') },
    { id: 'hell', label: t('settings.theme.light', 'Light') },
    { id: 'dunkel', label: t('settings.theme.dark', 'Dark') },
  ]
  return (
    <div className="themen" role="group" aria-label={t('settings.theme', 'Theme')}>
      {wahl.map((w) => (
        <button
          key={w.id}
          type="button"
          aria-pressed={thema === w.id}
          aria-label={w.label}
          title={w.label}
          onClick={() => setzeThema(w.id)}
        >
          {ZEICHEN[w.id]}
        </button>
      ))}
    </div>
  )
}
