// Module-level auth state hydrated by AuthProvider's onAuthStateChange listener.
// Router beforeLoad reads this synchronously via context.auth.get().

export type AuthSnapshot = {
  status: "loading" | "signedIn" | "signedOut";
  userId: string | null;
  email: string | null;
  fullName: string | null;
};

let snapshot: AuthSnapshot = {
  status: "loading",
  userId: null,
  email: null,
  fullName: null,
};

const listeners = new Set<() => void>();

export const authState = {
  get(): AuthSnapshot {
    return snapshot;
  },
  set(next: AuthSnapshot) {
    snapshot = next;
    listeners.forEach((l) => l());
  },
  subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
