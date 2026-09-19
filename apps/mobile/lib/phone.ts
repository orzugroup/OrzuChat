export function normalizePhoneDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function toE164Hint(phone: string): string {
  const trimmed = phone.trim();
  const digits = normalizePhoneDigits(trimmed);
  if (!digits) return '';
  if (trimmed.startsWith('+')) return `+${digits}`;
  if (digits.startsWith('00')) return `+${digits.slice(2)}`;
  return `+${digits}`;
}

export function phonesLikelyMatch(a: string, b: string): boolean {
  const left = normalizePhoneDigits(a);
  const right = normalizePhoneDigits(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const len = Math.min(left.length, right.length, 12);
  if (len < 9) return false;
  return left.slice(-9) === right.slice(-9);
}
