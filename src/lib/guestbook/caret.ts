/**
 * Wohin die Schreibmarke gehört, wenn der Text von außen ersetzt wird.
 * Vor der Änderung bleibt sie stehen, hinter der Änderung wandert sie mit.
 */
export function keepCaret(oldText: string, newText: string, caret: number): number {
  const max = Math.min(oldText.length, newText.length)
  let prefix = 0
  while (prefix < max && oldText[prefix] === newText[prefix]) prefix++
  let suffix = 0
  while (
    suffix < max - prefix &&
    oldText[oldText.length - 1 - suffix] === newText[newText.length - 1 - suffix]
  )
    suffix++

  if (caret <= prefix) return caret
  if (caret >= oldText.length - suffix) return newText.length - (oldText.length - caret)
  return Math.min(Math.max(caret, 0), newText.length)
}
