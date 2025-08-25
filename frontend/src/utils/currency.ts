// Currency formatting utilities

export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: 'Rs.' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
];

export const formatCurrency = (amount: number | string, currencyCode: string = 'PKR'): string => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  const currency = CURRENCY_OPTIONS.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode;
  
  // Format number with commas
  const formattedAmount = numAmount.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  
  return `${symbol} ${formattedAmount}`;
};

export const getCurrencySymbol = (currencyCode: string = 'PKR'): string => {
  const currency = CURRENCY_OPTIONS.find(c => c.code === currencyCode);
  return currency?.symbol || currencyCode;
};