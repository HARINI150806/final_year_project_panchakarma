const STORAGE_KEY = 'panchakarma-auth';

export function getStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeAuth(authData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
}

export function updateStoredAuth(updates) {
  const current = getStoredAuth() || {};
  const updated = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultRoute(role, isProfileCompleted) {
  if (role === 'PATIENT' && !isProfileCompleted) {
    return '/complete-profile';
  }
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'THERAPIST':
      return '/dashboard/therapist';
    default:
      return '/dashboard/patient';
  }
}