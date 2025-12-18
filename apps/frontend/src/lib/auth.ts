export type AuthSession = {
  token: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
};

const AUTH_STORAGE_KEY = "gazette.auth.session";

const canUseStorage = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

export function setAuthSession(session: AuthSession) {
  if (!canUseStorage()) return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function getAuthSession(): AuthSession | null {
  if (!canUseStorage()) return null;
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as Partial<AuthSession> | null;
    if (!data || typeof data !== "object") return null;
    if (!data.token || !data.projectId || !data.projectName || !data.projectSlug) return null;
    return {
      token: data.token,
      projectId: data.projectId,
      projectName: data.projectName,
      projectSlug: data.projectSlug,
    };
  } catch {
    return null;
  }
}

export function getAuthToken(): string | null {
  return getAuthSession()?.token ?? null;
}

export function clearAuthSession() {
  if (!canUseStorage()) return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
