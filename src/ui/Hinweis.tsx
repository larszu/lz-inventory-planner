// Eine kurze Meldung unten mit „Rückgängig" (lzm-web: Löschen sofort
// ausführen, 8 s zum Zurücknehmen statt einer Rückfrage vorher).
import { useEffect } from 'react'
import { create } from 'zustand'
import { Undo2, X } from 'lucide-react'
import { useT } from '../i18n'

interface HinweisStand {
  text?: string
  rueckgaengig?: () => void
  zeige: (text: string, rueckgaengig?: () => void) => void
  weg: () => void
}

export const useHinweis = create<HinweisStand>((set) => ({
  zeige: (text, rueckgaengig) => set({ text, rueckgaengig }),
  weg: () => set({ text: undefined, rueckgaengig: undefined }),
}))

export function Hinweis() {
  const { t } = useT()
  const { text, rueckgaengig, weg } = useHinweis()
  useEffect(() => {
    if (!text) return
    const uhr = window.setTimeout(weg, 8000)
    return () => window.clearTimeout(uhr)
  }, [text, weg])
  if (!text) return null
  return (
    <div className="hinweis-toast" role="status">
      <span>{text}</span>
      {rueckgaengig && (
        <button
          type="button"
          className="still"
          onClick={() => {
            rueckgaengig()
            weg()
          }}
        >
          <Undo2 size={16} aria-hidden="true" />
          {t('toast.undo', 'Undo')}
        </button>
      )}
      <button type="button" className="still nur-zeichen" onClick={weg} aria-label={t('toast.close', 'Close')}>
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  )
}
