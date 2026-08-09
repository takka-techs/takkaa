export function getActiveCashier() {
  try {
    const raw = localStorage.getItem('active_cashier');
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse active_cashier from localStorage", e);
    return null;
  }
}

export function getActiveCashierName(defaultName = 'كاشير'): string {
  if (localStorage.getItem('admin_active') === 'true') {
    return 'المدير';
  }
  const cashier = getActiveCashier();
  if (cashier && (cashier.name || cashier.username)) {
    return cashier.name || cashier.username;
  }
  return defaultName;
}
