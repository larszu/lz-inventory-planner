import signetOffwhite from '../assets/brand/lzm_signet_offwhite_tally.svg'
import signetNavy from '../assets/brand/lzm_signet_navy_tally.svg'
import hauptlogoOffwhite from '../assets/brand/lzm_hauptlogo_offwhite.svg'
import hauptlogoNavy from '../assets/brand/lzm_hauptlogo_navy.svg'

/* Das Signet in Kit-Farben: Navy auf Hell, Off-White auf Dunkel, der Punkt
 * immer Tally-Rot (seit 2026-10-13 — die rote Kopflinie, die vorher das eine
 * Rot im Sichtfeld war, gibt es nicht mehr). Nie an `--akzent` gekoppelt. */

/** Beide Farbfassungen stehen im Markup; das Stilblatt zeigt die zum Thema passende. */
function Zweifach({ dunkel, hell, className }: { dunkel: string; hell: string; className: string }) {
  return (
    <>
      <img src={dunkel} alt="Lars Zumpe Medienproduktion" className={`${className} auf-dunkel`} />
      <img src={hell} alt="Lars Zumpe Medienproduktion" className={`${className} auf-hell`} />
    </>
  )
}

export const Signet = () => <Zweifach dunkel={signetOffwhite} hell={signetNavy} className="signet" />

export const Hauptlogo = () => <Zweifach dunkel={hauptlogoOffwhite} hell={hauptlogoNavy} className="hauptlogo" />
