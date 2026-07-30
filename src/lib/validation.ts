// Shared form validation utilities

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function isValidCardNumber(value: string): boolean {
  const digits = value.replace(/\s/g, "");
  return /^\d{16}$/.test(digits);
}

export function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function isValidExpiry(value: string): boolean {
  const match = value.match(/^(\d{2})\/(\d{2})$/);
  if (!match) return false;
  const month = parseInt(match[1], 10);
  const year = parseInt(match[2], 10);
  if (month < 1 || month > 12) return false;
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  if (year < currentYear) return false;
  if (year === currentYear && month < currentMonth) return false;
  return true;
}

export function formatCVV(value: string): string {
  return value.replace(/\D/g, "").slice(0, 4);
}

export function isValidCVV(value: string): boolean {
  return /^\d{3,4}$/.test(value);
}

export function formatRedemptionCode(value: string): string {
  const cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16);
  return cleaned.match(/.{1,4}/g)?.join("-") ?? cleaned;
}

export function isValidRedemptionCode(value: string): boolean {
  const raw = value.replace(/-/g, "");
  return /^[A-Z0-9]{16}$/.test(raw);
}
