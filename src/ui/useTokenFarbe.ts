// Eine Farbe aus der Token-Schicht, aufgeloest fuer three.js.
//
// WARUM ES DAS GIBT (2026-10-13): Die 3D-Ansichten malen nicht mit CSS — ein
// Material kennt kein `var(--…)` und kein `light-dark()`. Bis dahin standen
// dort Navy-Hexwerte, und die Szene blieb im hellen Modus ein dunkler Block.
// Der Haken loest das Token ueber ein Probe-Element auf und liest die
// berechnete Farbe; er rechnet neu, wenn Wahl oder System wechseln.
import { useEffect, useState } from 'react'
import { useThema } from '../lib/thema'

const loese = (token: string): string => {
  const probe = document.createElement('span')
  probe.style.color = `var(${token})`
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const farbe = getComputedStyle(probe).color
  probe.remove()
  return farbe
}

export function useTokenFarbe(token: string): string {
  const thema = useThema()
  const [farbe, setFarbe] = useState(() => loese(token))
  useEffect(() => {
    const neu = () => setFarbe(loese(token))
    neu()
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    mq.addEventListener('change', neu)
    return () => mq.removeEventListener('change', neu)
  }, [token, thema])
  return farbe
}
