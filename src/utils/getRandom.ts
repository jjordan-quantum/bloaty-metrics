export function getRandom(max?: number): number {
  return max
    ? Math.floor(Math.random() * max)
    : Math.floor(Math.random() * 1000000) + Math.floor(Math.random() * 100000);
}
