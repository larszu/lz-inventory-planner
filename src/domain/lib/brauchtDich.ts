// „Braucht dich" — was im Lager gerade jemanden braucht, als Kacheln auf der
// Startseite. Nur Dinge, die eine Handlung auslösen; eine Kachel ohne Treffer
// fällt weg, statt mit einer Null Platz zu nehmen.
import type { InventoryItem, InventoryUnit } from '../types/inventory'
import type { CheckoutRecord } from '../types/checkout'
import { fristenLage } from './fristen'
import { deckung } from './mindestmenge'
import { committedByItem } from './inventoryCommitment'
import { openFaultsOf } from './faultHistory'
import { isForeign } from './ownership'

export type BrauchtDichId = 'ueberfaellig' | 'rueckgabe' | 'subhire' | 'fristen' | 'knapp' | 'defekt' | 'draussen'
export type BrauchtDichLage = 'gefahr' | 'warn' | 'info'

export interface BrauchtDichKachel {
  id: BrauchtDichId
  anzahl: number
  lage: BrauchtDichLage
  /** Der dringendste Fall, damit die Kachel ohne Klick etwas sagt. */
  beispiel: { name: string; wer?: string; tage?: number; fehlt?: number }
}

const tag = (iso: string): number => {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? Math.round(Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!) / 86_400_000) : Number.NaN
}

/** Tage von `heute` bis `iso`; negativ = vorbei. */
const tageBis = (iso: string, heute: string): number => tag(iso) - tag(heute)

export function brauchtDich(
  items: readonly InventoryItem[],
  units: readonly InventoryUnit[],
  records: readonly CheckoutRecord[],
  heute: string,
  vorwarnTage = 3,
): BrauchtDichKachel[] {
  const kacheln: BrauchtDichKachel[] = []
  const offen = records.filter((r) => !r.in)

  const mitFrist = offen
    .filter((r) => r.out.dueBack && !Number.isNaN(tag(r.out.dueBack)))
    .map((r) => ({ r, tage: tageBis(r.out.dueBack!, heute) }))
    .sort((a, b) => a.tage - b.tage)
  const ueber = mitFrist.filter((x) => x.tage < 0)
  const bald = mitFrist.filter((x) => x.tage >= 0 && x.tage <= vorwarnTage)
  if (ueber[0]) {
    kacheln.push({
      id: 'ueberfaellig',
      anzahl: ueber.length,
      lage: 'gefahr',
      beispiel: { name: ueber[0].r.nodeLabel, wer: ueber[0].r.out.to, tage: ueber[0].tage },
    })
  }
  if (bald[0]) {
    kacheln.push({
      id: 'rueckgabe',
      anzahl: bald.length,
      lage: 'warn',
      beispiel: { name: bald[0].r.nodeLabel, wer: bald[0].r.out.to, tage: bald[0].tage },
    })
  }

  const fremd = items
    .filter((i) => isForeign(i) && i.returnDue && !Number.isNaN(tag(i.returnDue)))
    .map((i) => ({ i, tage: tageBis(i.returnDue!, heute) }))
    .filter((x) => x.tage <= 7)
    .sort((a, b) => a.tage - b.tage)
  if (fremd[0]) {
    kacheln.push({
      id: 'subhire',
      anzahl: fremd.length,
      lage: fremd[0].tage < 0 ? 'gefahr' : 'warn',
      beispiel: { name: fremd[0].i.model, wer: fremd[0].i.supplier, tage: fremd[0].tage },
    })
  }

  const fristen = fristenLage(units, items, heute, 30).zeilen
    .filter((z) => z.lage !== 'ok')
    .sort((a, b) => a.tage - b.tage)
  if (fristen[0]) {
    kacheln.push({
      id: 'fristen',
      anzahl: fristen.length,
      lage: fristen[0].lage === 'ueberfaellig' ? 'gefahr' : 'warn',
      beispiel: { name: `${fristen[0].model} ${fristen[0].einheit}`.trim(), tage: fristen[0].tage },
    })
  }

  const knapp = deckung(items, committedByItem([...records], [...units]))
    .zeilen.filter((z) => z.lage === 'unter')
    .sort((a, b) => b.fehlt - a.fehlt)
  if (knapp[0]) {
    kacheln.push({
      id: 'knapp',
      anzahl: knapp.length,
      lage: 'warn',
      beispiel: { name: knapp[0].model, fehlt: knapp[0].fehlt },
    })
  }

  const modell = new Map(items.map((i) => [i.id, i.model]))
  const defekt = units.filter(
    (u) => u.condition === 'defect' || u.condition === 'inRepair' || openFaultsOf(u).length > 0,
  )
  if (defekt[0]) {
    const u = defekt[0]
    kacheln.push({
      id: 'defekt',
      anzahl: defekt.length,
      lage: 'gefahr',
      beispiel: { name: `${modell.get(u.itemId) ?? ''} ${u.houseRef ?? u.serial ?? ''}`.trim() },
    })
  }

  if (offen[0]) {
    kacheln.push({
      id: 'draussen',
      anzahl: offen.length,
      lage: 'info',
      beispiel: { name: offen[0].nodeLabel, wer: offen[0].out.to },
    })
  }
  return kacheln
}
