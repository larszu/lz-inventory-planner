// Was quer über die Ansichten ausgewählt ist: die Suche öffnet ein Gerät im
// Bestand, die Startseite einen Fall. Nur Oberflächenzustand, nie gespeichert.
import { create } from 'zustand'

interface AuswahlStand {
  itemId?: string
  suchenOffen: boolean
  waehleItem: (id: string | undefined) => void
  setSuchenOffen: (offen: boolean) => void
}

export const useAuswahl = create<AuswahlStand>((set) => ({
  itemId: undefined,
  suchenOffen: false,
  waehleItem: (itemId) => set({ itemId }),
  setSuchenOffen: (suchenOffen) => set({ suchenOffen }),
}))
