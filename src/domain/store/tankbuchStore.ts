import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { STORAGE_KEYS } from '../../lib/storageKeys'
import type { Tankung, TankungInput } from '../types/tankbuch'

const zahl = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)

/** Ein gespeicherter Eintrag, der nicht mehr in die Form passt, fällt weg statt die Liste zu sprengen. */
const heilen = (roh: unknown): Tankung | null => {
  if (!roh || typeof roh !== 'object') return null
  const r = roh as Record<string, unknown>
  const kmStand = zahl(r.kmStand)
  const menge = zahl(r.menge)
  if (typeof r.id !== 'string' || typeof r.vehicleId !== 'string' || typeof r.datum !== 'string') return null
  if (kmStand === undefined || menge === undefined) return null
  const b = r.betrag as Record<string, unknown> | undefined
  const cent = zahl(b?.cent)
  return {
    id: r.id,
    vehicleId: r.vehicleId,
    datum: r.datum,
    kmStand,
    menge,
    voll: r.voll === true,
    betrag: cent !== undefined && typeof b?.waehrung === 'string' ? { cent, waehrung: b.waehrung } : undefined,
    notiz: typeof r.notiz === 'string' ? r.notiz : undefined,
    createdAt: typeof r.createdAt === 'string' ? r.createdAt : r.datum,
  }
}

const laden = (): Tankung[] => {
  try {
    const roh = localStorage.getItem(STORAGE_KEYS.tankbuch)
    const parsed: unknown = roh ? JSON.parse(roh) : []
    return Array.isArray(parsed) ? parsed.map(heilen).filter((t): t is Tankung => t !== null) : []
  } catch {
    return []
  }
}

const sichern = (tankungen: Tankung[]) => {
  try {
    localStorage.setItem(STORAGE_KEYS.tankbuch, JSON.stringify(tankungen))
  } catch {
    // ohne Speicher läuft die Sitzung weiter, nur nicht dauerhaft
  }
}

interface TankbuchState {
  tankungen: Tankung[]
  addTankung: (input: TankungInput) => string
  removeTankung: (id: string) => Tankung | undefined
  restoreTankung: (t: Tankung) => void
}

export const useTankbuchStore = create<TankbuchState>((set, get) => ({
  tankungen: laden(),
  addTankung: (input) => {
    const t: Tankung = { ...input, id: uuidv4(), createdAt: new Date().toISOString() }
    const next = [...get().tankungen, t]
    set({ tankungen: next })
    sichern(next)
    return t.id
  },
  removeTankung: (id) => {
    const weg = get().tankungen.find((t) => t.id === id)
    const next = get().tankungen.filter((t) => t.id !== id)
    set({ tankungen: next })
    sichern(next)
    return weg
  },
  restoreTankung: (t) => {
    if (get().tankungen.some((x) => x.id === t.id)) return
    const next = [...get().tankungen, t]
    set({ tankungen: next })
    sichern(next)
  },
}))
