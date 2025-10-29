const SESSION_KEY = "itGrades:superAdminAuth";
export const SUPER_ADMIN_CODE = "2433";

export function storeSuperAdminSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(SESSION_KEY, "1");
}

export function clearSuperAdminSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(SESSION_KEY);
}

export function hasSuperAdminSession() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(SESSION_KEY) === "1";
}
