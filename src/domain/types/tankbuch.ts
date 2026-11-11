import type { Geldbetrag } from './inventory'

/**
 * Eine Tankung (oder Ladung an der Säule) eines Fahrzeugs.
 *
 * Verbrauch lässt sich nur zwischen zwei VOLLEN Tankungen ehrlich rechnen:
 * eine Teilbefüllung sagt nichts darüber, wie viel seit der letzten verbraucht
 * wurde. Deshalb `voll` als eigene Angabe statt einer Annahme.
 */
export interface Tankung {
  id: string
  vehicleId: string
  /** ISO-Datum. */
  datum: string
  /** Kilometerstand beim Tanken. */
  kmStand: number
  /** Getankte Menge in Litern (bei Strom: kWh). */
  menge: number
  /** Was die Tankung gekostet hat. Fehlt, wenn niemand den Beleg hat. */
  betrag?: Geldbetrag
  voll: boolean
  notiz?: string
  createdAt: string
}

export type TankungInput = Omit<Tankung, 'id' | 'createdAt'>
