import { DateTime } from 'effect';

export const calculateAge = (birthDate: DateTime.Utc): { years: number; months: number } => {
  const today = DateTime.unsafeNow();
  const duration = DateTime.distance(birthDate, today);
  const totalMonths = Math.floor(duration / (1000 * 60 * 60 * 24 * 30.44));
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  return { years, months };
};