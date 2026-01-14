// @test/utils exports

export const parseCSV = (data: string) => {};
export const parseJSON = (data: string) => {};
export const formatDate = (date: Date) => {};
export const formatCurrency = (amount: number) => {};
export const deepClone = (obj: any) => {};

// Logger utility used by repos
export const logger = {
  info: (msg: string) => {},
  warn: (msg: string) => {},
  error: (msg: string) => {},
};

// Validator utilities (for subpath imports)
export const validateEmail = (email: string) => true;
export const validatePhone = (phone: string) => true;

export type DateFormat = 'short' | 'long' | 'iso';

// This export should be unused
export const legacyParser = () => {};
