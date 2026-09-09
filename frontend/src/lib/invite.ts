const PENDING_INVITE_KEY = "kivo_pending_invite";

export const getPendingInvite = (): string | null => {
  try {
    return sessionStorage.getItem(PENDING_INVITE_KEY);
  } catch {
    return null;
  }
};

export const setPendingInvite = (code: string) => {
  try {
    sessionStorage.setItem(PENDING_INVITE_KEY, code);
  } catch {
    // private mode may block storage — the link itself still works
  }
};

export const clearPendingInvite = () => {
  try {
    sessionStorage.removeItem(PENDING_INVITE_KEY);
  } catch {
    // ignore
  }
};
