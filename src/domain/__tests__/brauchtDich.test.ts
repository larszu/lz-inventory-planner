import { describe, expect, it } from 'vitest'
import { brauchtDich } from '../lib/brauchtDich'
import type { InventoryItem, InventoryUnit } from '../types/inventory'
import type { CheckoutRecord } from '../types/checkout'

const jetzt = '2026-11-01T00:00:00.000Z'
const item = (id: string, extra: Partial<InventoryItem> = {}): InventoryItem => ({
  id, model: `M-${id}`, quantity: 5, createdAt: jetzt, updatedAt: jetzt, ...extra,
})
const schein = (id: string, dueBack?: string, zurueck = false): CheckoutRecord => ({
  id, nodeId: 'n', nodeLabel: `Case ${id}`, out: { at: jetzt, to: 'Crew', dueBack }, contents: [],
  ...(zurueck ? { in: { at: jetzt } } : {}),
} as CheckoutRecord)

describe('brauchtDich', () => {
  it('ist leer, wenn nichts ansteht', () => {
    expect(brauchtDich([item('a')], [], [], '2026-11-10')).toEqual([])
  })

  it('trennt überfällige von bald fälligen Rückgaben und zählt alles Offene', () => {
    const k = brauchtDich([], [], [schein('1', '2026-11-08'), schein('2', '2026-11-12'), schein('3'), schein('4', '2026-11-01', true)], '2026-11-10')
    const nach = Object.fromEntries(k.map((x) => [x.id, x]))
    expect(nach.ueberfaellig).toMatchObject({ anzahl: 1, lage: 'gefahr', beispiel: { tage: -2, wer: 'Crew' } })
    expect(nach.rueckgabe).toMatchObject({ anzahl: 1, beispiel: { tage: 2 } })
    expect(nach.draussen?.anzahl).toBe(3)
  })

  it('meldet Sub-Hire-Rückgaben, Unterdeckung und defekte Einheiten', () => {
    const items = [
      item('s', { ownership: 'subhire', returnDue: '2026-11-09', supplier: 'Verleih' }),
      item('k', { quantity: 2, mindestmenge: 5 }),
      item('ohne', { ownership: 'subhire' }),
    ]
    const units: InventoryUnit[] = [
      { id: 'u', itemId: 'k', serial: '7', condition: 'ok', createdAt: jetzt, updatedAt: jetzt,
        history: [{ at: jetzt, kind: 'fault', detail: 'flackert' }] },
    ]
    const nach = Object.fromEntries(brauchtDich(items, units, [], '2026-11-10').map((x) => [x.id, x]))
    expect(nach.subhire).toMatchObject({ anzahl: 1, lage: 'gefahr', beispiel: { wer: 'Verleih', tage: -1 } })
    expect(nach.knapp).toMatchObject({ anzahl: 1, beispiel: { fehlt: 3 } })
    expect(nach.defekt).toMatchObject({ anzahl: 1, beispiel: { name: 'M-k 7' } })
  })
})
