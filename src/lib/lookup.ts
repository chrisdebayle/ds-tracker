export function nameById<T extends { id: string; name: string }>(list: T[]) {
  const byId = new Map(list.map((item) => [item.id, item.name]));
  return (id: string | null) => (id ? (byId.get(id) ?? "—") : "—");
}
