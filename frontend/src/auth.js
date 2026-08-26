const STORAGE_KEY = 'panchakarma-auth';

export function getStoredAuth() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    if (data && data.loginTime) {
      const elapsed = Date.now() - data.loginTime;
      const oneDayMs = 24 * 60 * 60 * 1000;
      if (elapsed > oneDayMs) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
    }
    return data;
  } catch (e) {
    return null;
  }
}

export function storeAuth(authData) {
  const dataWithTimestamp = { ...authData, loginTime: Date.now() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(dataWithTimestamp));
}

export function updateStoredAuth(updates) {
  const current = getStoredAuth() || {};
  const updated = { ...current, ...updates };
  if (current.loginTime && !updated.loginTime) {
    updated.loginTime = current.loginTime;
  }
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
    case 'PHARMACIST':
      return '/dashboard/pharmacist';
    default:
      return '/dashboard/patient';
  }
}