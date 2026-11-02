/**
 * Durable per-exercise identity: a short, position-independent hash of the
 * name (FNV-1a → base36). Reordering or inserting exercises no longer shifts
 * keys; only renaming an exercise changes its id (acceptable, a renamed or
 * reweighted move is effectively a new prescription).
 */
function hashString(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

export const exerciseId = (ex) => hashString(ex.name)
