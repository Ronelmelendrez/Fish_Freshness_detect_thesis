export const isNonEmpty = (value: string): boolean => value.trim().length > 0;

export const isValidEmail = (value: string): boolean => {
  const email = value.trim();
  if (email.length === 0) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};