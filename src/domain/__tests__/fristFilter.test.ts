import { describe, expect, it } from 'vitest'
import { fristenLage, anzugehen } from '../lib/fristen'
import { gefilterteFristen, ohneFristEinheiten } from '../lib/fristFilter'
import type { InventoryItem, InventoryUnit } from '../types/inventory'

// #69: eine Kachel der Fristen-Ampel ist ein Filter.

const HEUTE = '2026-09-09'

const artikel: InventoryItem[] = [{ id: 'i1', model: 'ULXD2', quantity: 3, createdAt: 't', updatedAt: 't' }]

const einheit = (id: string, u: Partial<InventoryUnit>): InventoryUnit => ({
  id,
  itemId: 'i1',
  condition: 'ok',
  history: [],
  createdAt: 't',
  updatedAt: 't',
  ...u,
})

describe('fristFilter — Kachel als Filter (#69)', () => {
  const units = [
    einheit('a', { fristen: [{ art: 'dguv-v3', faellig: '2026-09-01' }] }),
    einheit('b', { fristen: [{ art: 'dguv-v3', faellig: '2026-09-20' }] }),
    einheit('c', { fristen: [{ art: 'dguv-v3', faellig: '2027-09-01' }] }),
    einheit('d', {}),
    einheit('e', { fristen: [{ art: 'wartung' }] }),
  ]
  const b = fristenLage(units, artikel, HEUTE, 30)

  it('1. ohne Filter bleibt es die Arbeitsliste', () => {
    expect(gefilterteFristen(b, null)).toEqual(anzugehen(b))
  })

  it('2. jede Lage filtert auf genau ihre Zeilen — auch „später"', () => {
    expect(gefilterteFristen(b, 'ueberfaellig').map((z) => z.unitId)).toEqual(['a'])
    expect(gefilterteFristen(b, 'faellig').map((z) => z.unitId)).toEqual(['b'])
    expect(gefilterteFristen(b, 'ok').map((z) => z.unitId)).toEqual(['c'])
  })

  it('3. „ohne Datum" nennt genau die Einheiten, die die Ampel nicht zählt', () => {
    expect(gefilterteFristen(b, 'ohne')).toEqual([])
    // Eine Frist ohne Zeitangabe ist kein Termin: `e` gehört dazu.
    expect(ohneFristEinheiten(units).map((u) => u.id)).toEqual(['d', 'e'])
    expect(ohneFristEinheiten(units).length).toBe(b.ohneFrist)
  })
})
