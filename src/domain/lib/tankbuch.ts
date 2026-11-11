import type { Tankung } from '../types/tankbuch'

/** Verbrauch über eine Strecke zwischen zwei vollen Tankungen. */
export interface VerbrauchsStrecke {
  vonKm: number
  bisKm: number
  km: number
  menge: number
  /** Liter (bzw. kWh) je 100 km. */
  je100km: number
  bisDatum: string
}

export interface TankbuchAuswertung {
  /** Chronologisch, älteste zuerst. */
  tankungen: Tankung[]
  strecken: VerbrauchsStrecke[]
  /** Gewichteter Schnitt über alle Strecken; fehlt ohne zwei volle Tankungen. */
  schnittJe100km?: number
  /** Gefahrene Kilometer zwischen erster und letzter Tankung. */
  km: number
  /** Kosten je Währung, nie zusammengelegt (siehe `Geldbetrag`). */
  kostenCent: Record<string, number>
  /** Kosten je km je Währung — nur über die gemessene Strecke. */
  centJeKm: Record<string, number>
  /** Tankungen, deren Kilometerstand kleiner als der vorige ist. */
  rueckwaerts: string[]
  letzterKmStand?: number
}

const reihenfolge = (a: Tankung, b: Tankung): number =>
  a.datum === b.datum ? a.kmStand - b.kmStand : a.datum < b.datum ? -1 : 1

export function tankbuch(alle: readonly Tankung[], vehicleId: string): TankbuchAuswertung {
  const tankungen = alle.filter((t) => t.vehicleId === vehicleId).sort(reihenfolge)
  const strecken: VerbrauchsStrecke[] = []
  const rueckwaerts: string[] = []
  const kostenCent: Record<string, number> = {}

  let letzteVolle: Tankung | undefined
  // Menge seit der letzten vollen Tankung, inklusive Teilbefüllungen dazwischen:
  // sie wurden auf derselben Strecke verfahren.
  let mengeSeitVoll = 0
  let vorigerKm: number | undefined

  for (const t of tankungen) {
    if (vorigerKm !== undefined && t.kmStand < vorigerKm) rueckwaerts.push(t.id)
    vorigerKm = Math.max(vorigerKm ?? t.kmStand, t.kmStand)
    if (t.betrag) kostenCent[t.betrag.waehrung] = (kostenCent[t.betrag.waehrung] ?? 0) + t.betrag.cent

    if (!letzteVolle) {
      if (t.voll) letzteVolle = t
      continue
    }
    mengeSeitVoll += t.menge
    if (!t.voll) continue
    const km = t.kmStand - letzteVolle.kmStand
    if (km > 0) {
      strecken.push({
        vonKm: letzteVolle.kmStand,
        bisKm: t.kmStand,
        km,
        menge: mengeSeitVoll,
        je100km: (mengeSeitVoll / km) * 100,
        bisDatum: t.datum,
      })
    }
    letzteVolle = t
    mengeSeitVoll = 0
  }

  const streckeKm = strecken.reduce((s, x) => s + x.km, 0)
  const streckeMenge = strecken.reduce((s, x) => s + x.menge, 0)
  const erste = tankungen[0]
  const letzte = tankungen[tankungen.length - 1]
  const km = erste && letzte ? Math.max(0, letzte.kmStand - erste.kmStand) : 0

  // Kosten je km nur aus den Tankungen, die eine gemessene Strecke abschliessen —
  // sonst stünde die erste Füllung (vor jeder Strecke) mit im Zähler.
  const centJeKm: Record<string, number> = {}
  if (streckeKm > 0) {
    const von = tankungen.findIndex((t) => t.voll)
    const bisKm = strecken[strecken.length - 1]!.bisKm
    const bis = tankungen.findIndex((t, i) => i > von && t.voll && t.kmStand === bisKm)
    const fensterKosten: Record<string, number> = {}
    for (const t of tankungen.slice(von + 1, bis + 1)) {
      if (t.betrag) fensterKosten[t.betrag.waehrung] = (fensterKosten[t.betrag.waehrung] ?? 0) + t.betrag.cent
    }
    for (const [w, c] of Object.entries(fensterKosten)) centJeKm[w] = c / streckeKm
  }

  return {
    tankungen,
    strecken,
    schnittJe100km: streckeKm > 0 ? (streckeMenge / streckeKm) * 100 : undefined,
    km,
    kostenCent,
    centJeKm,
    rueckwaerts,
    letzterKmStand: tankungen.length ? Math.max(...tankungen.map((t) => t.kmStand)) : undefined,
  }
}
