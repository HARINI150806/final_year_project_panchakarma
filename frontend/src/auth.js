const STORAGE_KEY = 'panchakarma-auth';

export function getStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function storeAuth(authData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(authData));
}

export function clearAuth() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getDefaultRoute(role) {
  switch (role) {
    case 'ADMIN':
      return '/dashboard/admin';
    case 'DOCTOR':
      return '/dashboard/doctor';
    case 'THERAPIST':
      return '/dashboard/therapist';
    default:
      return '/dashboard/patient';
  }
}
