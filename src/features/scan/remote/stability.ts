export interface RemoteStability {
  count: number;
  needed: number;
  ready: boolean;
}

export function createRemoteStability(needed = 3) {
  let count = 0;
  return {
    get progress(): RemoteStability {
      return { count, needed, ready: count >= needed };
    },
    accept(ok: boolean): RemoteStability {
      count = ok ? count + 1 : 0;
      return { count, needed, ready: count >= needed };
    },
    reset() {
      count = 0;
    },
  };
}
