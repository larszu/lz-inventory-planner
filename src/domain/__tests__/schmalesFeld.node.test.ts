import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// #69: `.zeile .schmal { flex: 0 0 7rem }` traf auch `<input class="schmal">`
// in einem Label. Das Label ist eine Flex-SPALTE, die Basis wurde zur Hoehe:
// „Lead time (days)" und „Interval (months)" standen als ~110 px hohe Flaechen
// in der Zeile. Liest Quelltext, misst kein Layout — aber genau die Regel, die
// zurueckrutschen kann.
const css = readFileSync(resolve(__dirname, '../../index.css'), 'utf8')

function regelnMitFlex(): string[] {
  const out: string[] = []
  for (const m of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^}]*)\}/g)) {
    if (/(^|;)\s*flex\s*:/.test(m[2])) out.push(...m[1].split(',').map((s) => s.trim()))
  }
  return out
}

describe('schmales Feld (#69)', () => {
  it('keine Flex-Regel trifft ein .schmal-Feld IN einem Label der .zeile', () => {
    // ein Selektor, der auf `.schmal` ohne Element davor endet, trifft auch `input.schmal`
    const zuWeit = regelnMitFlex().filter((s) => /^\.zeile\s+\.schmal$/.test(s))
    expect(zuWeit).toEqual([])
  })

  it('das schmale Label bleibt 7rem breit', () => {
    expect(regelnMitFlex()).toContain('.zeile label.schmal')
  })
})
