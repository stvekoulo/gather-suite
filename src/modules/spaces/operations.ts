let pending = 0;
export function beginSpaceOperation() {
  pending++;
  let finished = false;
  return () => { if (!finished) { finished = true; pending--; } };
}
export function assertNoSpaceOperations() {
  if (pending) throw new Error("Un import, une sauvegarde ou une conversion est en cours. Attendez sa fin avant de changer d’espace.");
}
