export type APlayer = { destroy: () => void }
export const APlayer = (globalThis as unknown as { APlayer: new (options: object) => APlayer }).APlayer
