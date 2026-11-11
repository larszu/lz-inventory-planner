import { describe, expect, it } from 'vitest'
import { tankbuch } from '../lib/tankbuch'
import type { Tankung } from '../types/tankbuch'

const t = (id: string, datum: string, kmStand: number, menge: number, voll: boolean, cent?: number): Tankung => ({
  id,
  vehicleId: 'v1',
  datum,
  kmStand,
  menge,
  voll,
  betrag: cent === undefined ? undefined : { cent, waehrung: 'EUR' },
  createdAt: datum,
})

describe('tankbuch', () => {
  it('rechnet Verbrauch nur zwischen vollen Tankungen und zählt Teilbefüllungen mit', () => {
    const a = tankbuch(
      [
        t('1', '2026-01-01', 10_000, 60, true, 9000),
        t('2', '2026-01-10', 10_400, 20, false, 3000),
        t('3', '2026-01-20', 11_000, 40, true, 6000),
      ],
      'v1',
    )
    expect(a.strecken).toHaveLength(1)
    expect(a.strecken[0]!.menge).toBe(60)
    expect(a.schnittJe100km).toBeCloseTo(6)
    expect(a.kostenCent.EUR).toBe(18_000)
    // Die erste Füllung zählt nicht in die Kosten der gemessenen Strecke.
    expect(a.centJeKm.EUR).toBeCloseTo(9000 / 1000)
  })

  it('nennt keinen Schnitt ohne zwei volle Tankungen', () => {
    const a = tankbuch([t('1', '2026-01-01', 10_000, 60, false)], 'v1')
    expect(a.schnittJe100km).toBeUndefined()
    expect(a.centJeKm).toEqual({})
  })

  it('meldet einen Kilometerstand, der rückwärts läuft', () => {
    const a = tankbuch([t('1', '2026-01-01', 10_000, 60, true), t('2', '2026-01-05', 9_000, 30, true)], 'v1')
    expect(a.rueckwaerts).toEqual(['2'])
    expect(a.strecken).toHaveLength(0)
  })

  it('hält Währungen getrennt und filtert nach Fahrzeug', () => {
    const fremd = { ...t('x', '2026-01-02', 5, 5, true, 100), vehicleId: 'v2' }
    const usd = { ...t('2', '2026-01-05', 10_500, 30, true), betrag: { cent: 4000, waehrung: 'USD' } }
    const a = tankbuch([t('1', '2026-01-01', 10_000, 60, true, 9000), usd, fremd], 'v1')
    expect(a.tankungen).toHaveLength(2)
    expect(a.kostenCent).toEqual({ EUR: 9000, USD: 4000 })
    expect(a.letzterKmStand).toBe(10_500)
  })
})
