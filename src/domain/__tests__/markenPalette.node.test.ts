import { describe, expect, it } from 'vitest'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// ───────────────────────────────────────────────────────────────────────────
// ADR-007 der av-planner-suite — die Token-Schicht, Hell UND Dunkel.
//
// WARUM ES DAS GIBT. Maschinenlesbar stehen die Werte in `@avplan/ui`, aber
// dieses Repo haengt an keinem Paket der Suite: es laeuft eigenstaendig und
// wird vendoriert. Ohne diesen Lauf waere der Rueckweg in eine rohe Palette
// eine Zeile, die niemandem auffaellt — so hat dieses Repo am 2026-09-09
// angefangen (slate-Toene).
//
// UMGEBAUT AM 2026-10-13 (geaendertes ADR-007, Design-Vertrag Oktober 2026,
// lzm-web). Vorher pruefte er Deep Navy als Grund und verbot Rundung,
// Schatten und Verlauf. Jetzt prueft er die neutralen Flaechen mit Markenblau
// als Akzent in BEIDEN Modi, dass Rundung und Schatten NUR ueber Tokens
// kommen (rohe Werte bleiben verboten), dass Tally-Rot genau einmal definiert
// ist und das Logo an den Kit-Farben haengt. Dieselben Zahlen wie im Cable
// Planner — zwei Werkzeuge der Suite sehen nebeneinander gleich aus.
//
// WAS ER MISST: die Token-Schicht in `src/index.css` und, wo Regeln Rundung
// oder Schatten setzen, deren Wert. Er misst NICHT das gerenderte Fenster;
// Kontrast im Bild sieht er nicht.
// ───────────────────────────────────────────────────────────────────────────

const css = readFileSync(resolve(__dirname, '..', '..', 'index.css'), 'utf8')

/** Der Wert eines Tokens aus dem `:root`-Block — Kommentare abgeschnitten. */
const OHNE_KOMMENTAR = new RegExp('/\\*[\\s\\S]*?\\*/', 'g')
const ohneKommentare = css.replace(OHNE_KOMMENTAR, '')

const token = (name: string): string => {
  const m = new RegExp('\\s' + name + ':\\s*([^;]+);').exec(ohneKommentare)
  return m ? m[1].trim() : ''
}

/** `light-dark(a, b)` → [hell, dunkel]; ein einzelner Wert gilt fuer beide. */
const modi = (name: string): [string, string] => {
  const v = token(name)
  const m = /^light-dark\((.*)\)$/.exec(v)
  if (!m) return [v, v]
  // Am obersten Komma teilen — die Werte selbst tragen Klammern.
  let tiefe = 0
  for (let i = 0; i < m[1].length; i++) {
    const c = m[1][i]
    if (c === '(') tiefe++
    else if (c === ')') tiefe--
    else if (c === ',' && tiefe === 0) return [m[1].slice(0, i).trim(), m[1].slice(i + 1).trim()]
  }
  return [v, v]
}

describe('ADR-007: Flaechen, Text und Akzent — hell und dunkel', () => {
  const ERWARTET: Record<string, [string, string]> = {
    '--bg': ['#FAFAF8', '#1E1F23'],
    '--flaeche': ['#FFFFFF', '#28292E'],
    '--flaeche-2': ['#F1F1EE', '#33343A'],
    '--erhoben': ['#FFFFFF', '#3B3C42'],
    '--versenkt': ['#F4F4F1', '#19191D'],
    '--text-stark': ['#16181D', '#F6F5F0'],
    '--text': ['#2B2E35', '#E6E6E3'],
    '--leise': ['#6A6E77', '#A9ACB4'],
    '--rand': ['rgba(22, 24, 29, 0.08)', 'rgba(246, 245, 240, 0.09)'],
    '--rand-stark': ['rgba(22, 24, 29, 0.18)', 'rgba(246, 245, 240, 0.2)'],
    '--akzent': ['#1D324F', '#B9C7D8'],
    '--akzent-text': ['#F6F5F0', '#132040'],
    '--schein-1': ['rgba(29, 50, 79, 0.1)', 'rgba(185, 199, 216, 0.16)'],
  }
  for (const [name, [hell, dunkel]] of Object.entries(ERWARTET)) {
    it(`${name} ist ${hell} | ${dunkel}`, () => {
      expect(modi(name)).toEqual([hell, dunkel])
    })
  }

  it('der Akzent weich ist 10 % hell, 12 % dunkel — aus denselben Akzentwerten', () => {
    const [hell, dunkel] = modi('--akzent-weich')
    expect(hell).toBe('color-mix(in srgb, #1D324F 10%, transparent)')
    expect(dunkel).toBe('color-mix(in srgb, #B9C7D8 12%, transparent)')
  })

  it('beide Modi sind schaltbar: Auto folgt dem System, die Wahl setzt das Schema', () => {
    expect(ohneKommentare).toMatch(/:root \{\s*color-scheme: light dark;/)
    expect(ohneKommentare).toContain(":root[data-thema='hell'] { color-scheme: light; }")
    expect(ohneKommentare).toContain(":root[data-thema='dunkel'] { color-scheme: dark; }")
  })

  it('Dunkel ist Anthrazit, kein Navy: keine Flaeche traegt Deep Navy oder Zumpe Navy', () => {
    for (const t of ['--bg', '--flaeche', '--flaeche-2', '--erhoben', '--versenkt']) {
      for (const v of modi(t)) {
        expect(['#132040', '#1D324F', '#24405F'], `${t} ist Navy`).not.toContain(v)
      }
    }
  })
})

describe('ADR-007: das Signal ist nicht der Status', () => {
  it('Tally-Rot ist genau EINMAL definiert — als Token', () => {
    expect(token('--signal')).toBe('#D6402E')
    expect((css.toUpperCase().match(/#D6402E/g) ?? []).length).toBe(1)
  })

  it('die Meldefarben sind die des Handbuchs und NICHT Tally-Rot', () => {
    expect(token('--warn')).toBe('#C8892B')
    expect(token('--gefahr')).toBe('#B04A3F')
    expect(token('--ok')).toBe('#2F7D5C')
    for (const t of ['--warn', '--gefahr', '--ok']) {
      expect(token(t), `${t} darf nicht Tally-Rot sein`).not.toBe('#D6402E')
    }
  })

  it('das Logo haengt an den Kit-Farben und nie am Akzent', () => {
    expect(modi('--logo')).toEqual(['#1D324F', '#F6F5F0'])
    expect(token('--logo')).not.toContain('--akzent')
  })
})

describe('ADR-007: Rundung, Schatten und Farbe nur ueber Tokens', () => {
  it('die Radien und Schatten sind die des Vertrags', () => {
    expect([token('--r-s'), token('--r-m'), token('--r-l'), token('--r-xl'), token('--r-full')]).toEqual([
      '6px', '10px', '20px', '24px', '999px',
    ])
    expect(token('--schatten-1')).toBe('0 1px 2px light-dark(rgba(22, 24, 29, 0.06), rgba(0, 0, 0, 0.3))')
    expect(token('--schatten-2')).toBe('0 4px 16px light-dark(rgba(22, 24, 29, 0.08), rgba(0, 0, 0, 0.4))')
    expect(token('--schatten-3')).toBe('0 16px 48px light-dark(rgba(22, 24, 29, 0.14), rgba(0, 0, 0, 0.55))')
  })

  it('border-radius steht nur als Token (oder 0), nie als rohe Zahl', () => {
    // Gemessen ohne Kommentare — sonst besaenftigt die Begruendung den
    // Waechter, der sie pruefen soll.
    const werte = [...ohneKommentare.matchAll(/border-radius:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(werte.length, 'keine Rundung gefunden — misst der Lauf noch?').toBeGreaterThan(5)
    const roh = werte.filter((w) => !w.split(/\s+/).every((t) => t === '0' || /^var\(--r-(s|m|l|xl|full)\)$/.test(t)))
    expect(roh, `rohe Rundung: ${roh.join(' | ')}`).toEqual([])
  })

  it('box-shadow steht nur als Token (oder none), nie als rohe Zahl', () => {
    const rumpf = ohneKommentare.slice(ohneKommentare.indexOf('\n}', ohneKommentare.indexOf(':root {')))
    const werte = [...rumpf.matchAll(/box-shadow:\s*([^;]+);/g)].map((m) => m[1].trim())
    expect(werte.length).toBeGreaterThan(3)
    const roh = werte.filter((w) => w !== 'none' && !/^var\(--schatten-[\w-]+\)$/.test(w))
    expect(roh, `roher Schatten: ${roh.join(' | ')}`).toEqual([])
  })

  it('kein rohes Hex und kein rgba ausserhalb der Token-Schicht — ausser dem Kamera-Schwarz', () => {
    const i = ohneKommentare.indexOf(':root {')
    const j = ohneKommentare.indexOf('\n}', i)
    const rumpf = ohneKommentare.slice(0, i) + ohneKommentare.slice(j)
    const hex = [...rumpf.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)].map((m) => m[0]).filter((h) => h !== '#000')
    expect(hex, `rohe Farbe: ${hex.join(', ')}`).toEqual([])
    expect(rumpf.match(/rgba?\(/g) ?? [], 'rohes rgba').toEqual([])
  })

  it('in den Ansichten setzt kein Inline-Stil eine eigene Rundung oder einen Schatten', () => {
    const ui = readdirSync(resolve(__dirname, '..', '..', 'ui'), { recursive: true })
      .map(String)
      .filter((f) => f.endsWith('.tsx'))
    expect(ui.length).toBeGreaterThan(10)
    for (const f of ui) {
      const q = readFileSync(resolve(__dirname, '..', '..', 'ui', f), 'utf8')
      expect(/borderRadius:|boxShadow:/.test(q), `${f} setzt Rundung/Schatten inline`).toBe(false)
    }
  })

  it('Verlaeufe nur als Hintergrundschein aus den Schein-Tokens', () => {
    const verlaeufe = [...ohneKommentare.matchAll(/(?:linear|radial)-gradient\(([^;]*?), transparent/g)].map((m) => m[1])
    for (const v of verlaeufe) expect(v).toMatch(/var\(--schein-[12]\)$/)
  })

  it('keine rohen slate-Farben mehr', () => {
    for (const alt of ['#0f172a', '#1e293b', '#334155', '#e2e8f0', '#94a3b8', '#f59e0b']) {
      expect(css.toLowerCase().includes(alt), `${alt} steht noch im Stilblatt`).toBe(false)
    }
  })

  it('das eine Schwarz ist die Kamera-Flaeche und kein Geschmack', () => {
    // `.sucher` ist das Videobild des Scanners: jeder andere Grund faerbt
    // das Bild. Die Regel stand bis 2026-09-18 unter `.inventur .sucher` und
    // griff im Beladen nicht — geprueft wird deshalb die Regel selbst.
    const schwarz = css.match(/#000\b/g) ?? []
    expect(schwarz.length, 'genau ein Schwarz, und zwar das der Kamera').toBe(1)
    expect(css).toMatch(/\n\.sucher \{[^}]*background: #000;/)
  })
})

describe('Der Theme-Umschalter ist sichtbar', () => {
  it('steht in der Kopfzeile und fuehrt Auto · Hell · Dunkel', () => {
    const kopf = readFileSync(resolve(__dirname, '..', '..', 'ui', 'Kopfzeile.tsx'), 'utf8')
    expect(kopf).toContain('<ThemaUmschalter />')
    const schalter = readFileSync(resolve(__dirname, '..', '..', 'ui', 'ThemaUmschalter.tsx'), 'utf8')
    for (const id of ["'system'", "'hell'", "'dunkel'"]) expect(schalter).toContain(`id: ${id}`)
    expect(schalter).toContain('aria-pressed')
  })
})

describe('Gegenprobe zum Lauf selbst', () => {
  it('`token` liest wirklich aus dem Stilblatt', () => {
    // Ein Leser, der fuer jeden Namen '' liefert, machte jede Zusicherung
    // oben zu einem Vergleich zweier leerer Zeichenketten.
    expect(token('--gibt-es-nicht')).toBe('')
    expect(token('--bg')).not.toBe('')
    expect(modi('--signal')).toEqual(['#D6402E', '#D6402E'])
  })
})

// ───────────────────────────────────────────────────────────────────────────
// Der Druckbogen (`inventoryPrint.ts`) — dieselbe Palette, helle Gewichtung.
// ───────────────────────────────────────────────────────────────────────────
const druck = readFileSync(resolve(__dirname, '..', 'lib', 'inventoryPrint.ts'), 'utf8')

/**
 * Die `<style>`-Bloecke der Datei — JEDER, nicht der erste.
 *
 * Bis 2026-09-20 las diese Stelle mit `.exec` genau einen Block, weil es
 * genau ein Blatt gab. Mit dem Deckelblatt der Case-Inhaltsliste kam ein
 * zweites dazu, und es waere an der Farbpruefung vollstaendig vorbeigelaufen:
 * ein Waechter, der das erste Blatt misst, sagt ueber das zweite nichts und
 * sieht dabei gruen aus. Das ist die schlimmere Sorte Luecke — sie meldet
 * sich nicht.
 */
const druckStile = (): string[] =>
  [...druck.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) =>
    (m[1] ?? '').replace(OHNE_KOMMENTAR, ''),
  )

/** Alle Stilbloecke zusammen — fuer Pruefungen, die nur „kommt vor" fragen. */
const druckStil = (): string => druckStile().join('\n')

/** Die Marken-Werte, die auf hellem Grund vorkommen duerfen. */
const HELLE_PALETTE = new Set(['#F6F5F0', '#E1ECEF', '#1D324F', '#5C6B85', '#8C9CB3', '#132040'])

describe('Der Druckbogen traegt die Marke', () => {
  it('findet ueberhaupt Blaetter — sonst prueft der Rest nichts', () => {
    // Ohne diese Zeile waere eine umbenannte Datei oder ein zu Vorlagen
    // umgebauter Bogen still gruen: null Bloecke halten jede Regel ein.
    expect(druckStile().length).toBeGreaterThanOrEqual(2)
  })

  it('benutzt in JEDEM Blatt nur Farben aus der Palette', () => {
    for (const stil of druckStile()) {
      const fremd = [...stil.matchAll(/#[0-9A-Fa-f]{3,8}\b/g)]
        .map((m) => m[0])
        .filter((h) => !HELLE_PALETTE.has(h.toUpperCase()))
      expect(fremd, `fremde Farben im Druckbogen: ${fremd.join(', ')}`).toEqual([])
    }
  })

  it('steht in jedem Blatt auf Off-White und schreibt in Navy', () => {
    for (const stil of druckStile()) {
      expect(stil).toMatch(/background:\s*#F6F5F0/)
      expect(stil).toMatch(/color:\s*#1D324F/)
    }
  })

  it('traegt genau EINE Kopflinie JE BLATT', () => {
    // Guide, Gestaltungssystem 1: Kicker, darunter die durchgehende Linie,
    // eine pro Flaeche. Sie ist der Baustein, an dem ein Blatt dieses
    // Hauses erkennbar ist — und der Ersatz fuer Rahmen und Ecken.
    //
    // Gezaehlt wird je Blatt und nicht je Datei: die Regel ist „eine pro
    // FLAECHE", und ein zweites Blatt in derselben Datei ist eine zweite
    // Flaeche. Ein Zaehler auf die Datei zwaenge dazu, das zweite Blatt
    // ohne Kopflinie zu bauen, um den Waechter gruen zu halten — also
    // genau die Regel zu brechen, die er schuetzen soll.
    const blaetter = druck.split('<!doctype html>').slice(1)
    expect(blaetter.length).toBe(druckStile().length)
    for (const blatt of blaetter) {
      expect((blatt.match(/class="kopflinie"/g) ?? []).length).toBe(1)
      expect((blatt.match(/class="kicker"/g) ?? []).length).toBe(1)
    }
    for (const stil of druckStile()) {
      expect(stil).toMatch(/\.kopflinie[^}]*border-top:\s*1px solid #8C9CB3/)
    }
  })

  it('traegt KEIN Tally-Rot', () => {
    // Der Punkt ist das Aufnahmelicht. Eine Packliste nimmt nichts auf.
    expect(druck.toUpperCase()).not.toContain('#D6402E')
  })

  it('setzt die Hausschrift und keine Grautreppe', () => {
    expect(druckStil()).toMatch(/'Public Sans'/)
    // Gemessen am Stilblatt und NICHT an der Datei: der Kopf dieser Datei
    // nennt die alten Werte, um zu erklaeren, was sie abloest. Ein Waechter,
    // der an der Begruendung rot wird, zwingt dazu, die Begruendung zu
    // loeschen — dieselbe Falle wie bei den Kommentaren in `index.css`.
    for (const grau of ['#111', '#555', '#333', '#444', '#b45309']) {
      expect(druckStil().toLowerCase().includes(grau), `${grau} steht noch im Druckbogen`).toBe(false)
    }
  })

  it('hat keine Rundungen, Schatten oder Verlaeufe', () => {
    expect(/border-radius:\s*(?!0)/.test(druckStil()), 'border-radius').toBe(false)
    expect(/box-shadow:\s*(?!none)/.test(druckStil()), 'box-shadow').toBe(false)
    expect(/linear-gradient|radial-gradient/.test(druckStil()), 'Verlauf').toBe(false)
  })
})

describe('Die Hausschrift steht an einer Stelle', () => {
  it('nennt Public Sans zuerst — lokal ausgeliefert, nicht aus dem Netz', () => {
    expect(token('--font')).toBe(
      "'Public Sans Variable', 'Public Sans', system-ui, 'Segoe UI', Roboto, Arial, sans-serif",
    )
    const main = readFileSync(resolve(__dirname, '..', '..', 'main.tsx'), 'utf8')
    expect(main).toContain("import '@fontsource-variable/public-sans'")
  })

  it('zieht die Schrift aus dem Token und tippt sie nicht zweimal', () => {
    const familien = ohneKommentare.match(/font-family:\s*([^;]+);/g) ?? []
    const eigene = familien.filter((f) => !f.includes('var(--font)') && !f.includes('monospace'))
    expect(eigene, `font-family neben dem Token: ${eigene.join(' | ')}`).toEqual([])
  })
})

describe('Das Signal bleibt Signal', () => {
  it('Tally-Rot ist nie eine Flaeche', () => {
    // „Nie Flaeche, nie Text, nie Rahmen." Der Punkt am Primaerknopf entfiel
    // am 2026-10-13 (in Werkzeugen nicht mehr Pflicht) — seitdem gibt es
    // KEINE Flaeche in Tally-Rot mehr; erlaubt bleibt der Fokusring.
    const flaechen = [...ohneKommentare.matchAll(/([^{}]+)\{[^}]*background(?:-color)?:\s*var\(--signal\)/g)].map((m) =>
      m[1].trim(),
    )
    expect(flaechen, `Flaeche in Tally-Rot: ${flaechen.join(', ')}`).toEqual([])
    expect(/color:\s*var\(--signal\)|border[\w-]*:[^;]*var\(--signal\)/.test(ohneKommentare), 'Text/Rahmen in Tally-Rot').toBe(
      false,
    )
  })

  it('der Fokusring ist das Signal', () => {
    expect(ohneKommentare).toMatch(/:focus-visible \{\s*outline: 2px solid var\(--signal\);/)
  })

  it('die Belade-Ansicht hat EINEN Primaerknopf, nicht einen je Kachel', () => {
    // „Eine Hauptaktion pro Ansicht." Der Streifen zeigt dieselbe Handlung am
    // selben Stueck wie die Karte darueber.
    const streifen = readFileSync(resolve(__dirname, '..', '..', 'ui', 'Ladeansicht', 'Ladestreifen.tsx'), 'utf8')
    expect(streifen.includes('knopf-primaer'), 'Primaerknopf im Streifen').toBe(false)

    const beladen = readFileSync(resolve(__dirname, '..', '..', 'ui', 'Beladen.tsx'), 'utf8')
    expect((beladen.match(/knopf-primaer/g) ?? []).length).toBe(1)
  })
})
