export function priorityTone(priority) {
  const key = String(priority || '').toLowerCase().replace(/\s+/g, '-');
  if (!key) return undefined;
  return `priority-${key}`;
}

export function riskTone(riskLevel) {
  const key = String(riskLevel || '').toLowerCase().replace(/\s+/g, '-');
  if (!key) return undefined;
  return `risk-${key}`;
}

export function truncate(text, max = 220) {
  const value = String(text || '');
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}…`;
}
