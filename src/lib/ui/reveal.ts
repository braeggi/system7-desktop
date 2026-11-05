export interface RevealStep {
  /** Wartezeit in ms vor diesem Stück */
  delay: number
  /** Anteil des Bildes von oben, der danach sichtbar ist (0–1) */
  shown: number
}

/**
 * Plant, wie ein Bild „über das Modem“ ankommt: in unregelmäßigen Streifen von oben
 * nach unten, mit kleinen Pausen und ab und zu einem Hänger. Insgesamt 2,5–3,5 Sekunden.
 */
export function revealSchedule(random: () => number = Math.random): RevealStep[] {
  const steps: RevealStep[] = []
  let shown = 0
  while (shown < 1) {
    shown = Math.min(1, shown + 0.02 + random() * 0.05)
    const stall = random() < 0.08 ? 4 : 1
    steps.push({ delay: (1 + random() * 2) * stall, shown })
  }
  // Pausen auf die gewünschte Gesamtdauer strecken
  const target = 2500 + random() * 1000
  const sum = steps.reduce((s, step) => s + step.delay, 0)
  return steps.map((step) => ({ ...step, delay: (step.delay / sum) * target }))
}
