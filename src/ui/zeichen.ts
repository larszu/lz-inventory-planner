// Ein Zeichen je Ansicht und Bereich (Lucide, wie im Cable Planner). Hier
// gebündelt, damit Seitenleiste, Unterleiste und Suche dasselbe Bild zeigen.
import {
  ArrowRightLeft, Briefcase, ChartColumn, ClipboardCheck, Container, FileText, Handshake, House,
  Layers, Library, Package, PackageOpen, PackagePlus, ShieldCheck, Truck, Warehouse, type LucideIcon,
} from 'lucide-react'
import type { Ansicht, BereichId } from './navigation'

export const ANSICHT_ZEICHEN: Record<Ansicht, LucideIcon> = {
  start: House,
  bestand: Package,
  lager: Warehouse,
  eingang: PackagePlus,
  inventur: ClipboardCheck,
  bibliothek: Library,
  cases: Briefcase,
  fahrzeuge: Truck,
  ladung: Container,
  stapeln: Layers,
  ausgabe: ArrowRightLeft,
  subhire: Handshake,
  bericht: FileText,
  werte: ShieldCheck,
}

export const BEREICH_ZEICHEN: Record<BereichId, LucideIcon> = {
  start: House,
  lager: Warehouse,
  packen: PackageOpen,
  verleih: ArrowRightLeft,
  auswertung: ChartColumn,
}
