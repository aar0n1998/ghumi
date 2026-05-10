export type Category = {
  id: number;
  name: string;
  color: string;
};

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Work',     color: '#4285F4' },
  { id: 2, name: 'Personal', color: '#34A853' },
  { id: 3, name: 'Health',   color: '#EA4335' },
  { id: 4, name: 'Social',   color: '#FBBC04' },
  { id: 5, name: 'Travel',   color: '#FF6D00' },
  { id: 6, name: 'Finance',  color: '#9C27B0' },
  { id: 7, name: 'Other',    color: '#757575' },
];
