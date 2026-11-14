// ───────────────────────────────────────────────────────────────────────────
// Die Kacheln der Fristen-Ampel als Filter (#69: „Kachel = Filter").
//
// Vier Kacheln, vier Filter. Die vierte ist auch hier KEINE Lage: „ohne
// Datum" hat keine Zeilen im Bericht, sondern nennt die Einheiten, über die
// die Ampel nichts sagt. REIN wie `fristen.ts`: kein Store, keine Uhr.
// ───────────────────────────────────────────────────────────────────────────
import type { InventoryUnit } from '../types/inventory'
import { anzugehen, terminVon, type FristenBericht, type FristLage, type FristZeile } from './fristen'

/** Was eine Kachel wählt. `null` heisst: kein Filter, die Arbeitsliste wie bisher. */
export type FristFilter = FristLage | 'ohne'

/**
 * Die Zeilen zu einem Kachel-Filter. Ohne Filter bleibt es die Arbeitsliste
 * (`anzugehen`). Der Filter `ohne` hat keine Zeilen — die Einheiten liefert
 * `ohneFristEinheiten`.
 */
export const gefilterteFristen = (b: FristenBericht, filter: FristFilter | null): FristZeile[] =>
  filter === null ? anzugehen(b) : filter === 'ohne' ? [] : b.zeilen.filter((z) => z.lage === filter)

/** Die Einheiten ohne einen lesbaren Termin — dieselbe Regel wie `ohneFrist`. */
export const ohneFristEinheiten = <U extends Pick<InventoryUnit, 'fristen'>>(units: readonly U[]): U[] =>
  units.filter((u) => !(u.fristen ?? []).some((f) => terminVon(f)))
