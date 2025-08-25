import dayjs from 'dayjs';

export const formatDate = (dateString: string | Date, format: string = 'MMM DD, YYYY'): string => {
  if (!dateString) return '';
  return dayjs(dateString).format(format);
};

export const formatDateTime = (dateString: string | Date, format: string = 'MMM DD, YYYY HH:mm'): string => {
  if (!dateString) return '';
  return dayjs(dateString).format(format);
};

export const isOverdue = (dueDate: string | Date): boolean => {
  if (!dueDate) return false;
  return dayjs(dueDate).isBefore(dayjs(), 'day');
};

export const getDaysUntilDue = (dueDate: string | Date): number => {
  if (!dueDate) return 0;
  return dayjs(dueDate).diff(dayjs(), 'day');
};

export const addDays = (date: string | Date, days: number): string => {
  return dayjs(date).add(days, 'day').toISOString();
};

export const addMonths = (date: string | Date, months: number): string => {
  return dayjs(date).add(months, 'month').toISOString();
};