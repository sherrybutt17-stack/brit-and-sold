import type { IconName } from './icons';

/** Icon shown on listing cards for each industry. Unknown industries fall back to a building. */
const INDUSTRY_ICONS: Record<string, IconName> = {
  Automotive: 'car',
  'Business Services': 'briefcase',
  'Construction & Trades': 'hard-hat',
  'Consumer Services': 'store',
  'E-commerce': 'shopping-bag',
  'Education & Childcare': 'graduation-cap',
  'Food & Beverage': 'croissant',
  'Health & Wellness': 'heart-pulse',
  'Home Services': 'house',
  Manufacturing: 'factory',
  Retail: 'store',
  Technology: 'cpu',
  'Transportation & Logistics': 'truck',
  'Wholesale & Distribution': 'truck',
};

export const industryIcon = (industry: string): IconName => INDUSTRY_ICONS[industry] ?? 'building-2';
