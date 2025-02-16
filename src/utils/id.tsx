// utils/id.ts
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + "_" + Date.now();
}
